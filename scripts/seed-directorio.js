/**
 * Script para cargar directorio.json a la tabla directorio en BD
 * - Si tabla está vacía: carga todo el JSON
 * - Si tabla tiene datos: agrega registros faltantes
 * - Útil para recuperación de datos después de reset Docker
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/chatbot_metrics.db');
const jsonPath = path.join(__dirname, '../src/config/directorio.json');

let directorio = [];

function seedDirectorio() {
  console.log('📥 Leyendo directorio.json...');
  
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    directorio = JSON.parse(data);
    console.log(`✓ Se cargaron ${directorio.length} registros del JSON`);
  } catch (error) {
    console.error('❌ Error leyendo JSON:', error.message);
    process.exit(1);
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error conectando a BD:', err);
      process.exit(1);
    }

    console.log('✓ Conectado a BD');

    // Contar registros actuales
    db.get('SELECT COUNT(*) as count FROM directorio', (err, row) => {
      if (err) {
        console.error('❌ Error contando registros:', err);
        db.close();
        process.exit(1);
      }

      const currentCount = row.count;
      console.log(`📊 Registros actuales en BD: ${currentCount}`);

      // Si ya hay registros, preguntar si continuar
      if (currentCount > 0 && directorio.length > currentCount) {
        console.log(`⚠️ BD tiene ${currentCount} pero JSON tiene ${directorio.length}`);
        console.log('🔄 Agregando registros faltantes...\n');
      } else if (currentCount >= directorio.length) {
        console.log('✓ BD ya tiene todos los registros del JSON');
        db.close();
        process.exit(0);
      }

      // Preparar actualización
      insertarRegistros(db, directorio, currentCount);
    });
  });
}

function insertarRegistros(db, registros, startIndex) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let insertados = 0;
    let saltados = 0;
    let errores = 0;

    registros.forEach((registro, index) => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO directorio 
        (nombreCompleto, telefono, cargo, region, oficina, establecimiento)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const nombre = (registro.nombreCompleto || '').toUpperCase().trim();
      const telefono = (registro.telefono || '').trim();
      const cargo = (registro.cargo || '').toUpperCase().trim();
      const region = (registro.region || '').toUpperCase().trim();
      const oficina = (registro.oficina || '').toUpperCase().trim();
      const establecimiento = (registro.establecimiento || '').toUpperCase().trim();

      stmt.run(
        [nombre, telefono, cargo, region, oficina, establecimiento],
        function(err) {
          if (err) {
            console.error(`❌ Error en registro ${index + 1}:`, err.message);
            errores++;
          } else if (this.changes > 0) {
            insertados++;
            if (insertados % 100 === 0) {
              process.stdout.write(`.`);
            }
          } else {
            saltados++;
          }
        }
      );

      stmt.finalize();
    });

    // Después de todos los inserts, hacer commit y reportar
    setTimeout(() => {
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('\n❌ Error en COMMIT:', err);
          db.close();
          process.exit(1);
        }

        // Contar total final
        db.get('SELECT COUNT(*) as count FROM directorio', (err, row) => {
          if (err) {
            console.error('❌ Error contando final:', err);
            db.close();
            process.exit(1);
          }

          console.log(`\n\n✅ SEED COMPLETADO`);
          console.log(`   Insertados: ${insertados}`);
          console.log(`   Duplicados (saltados): ${saltados}`);
          console.log(`   Errores: ${errores}`);
          console.log(`   Total en BD: ${row.count}`);
          console.log(`   Total en JSON: ${registros.length}`);

          if (row.count === registros.length) {
            console.log('\n🎉 ¡BD sincronizada 100% con JSON!');
          } else {
            console.log(`\n⚠️ Diferencia: ${registros.length - row.count} registros`);
          }

          db.close();
          process.exit(0);
        });
      });
    }, 1000);
  });
}

// Ejecutar
seedDirectorio();
