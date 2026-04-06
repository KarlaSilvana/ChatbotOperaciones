/**
 * Script para verificar si la tabla directorio existe y cuántos registros tiene
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/chatbot_metrics.db');

function verifyDirectorio() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error conectando a BD:', err);
      process.exit(1);
    }

    console.log('✓ Conectado a BD:', dbPath);

    // Verificar si tabla existe
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='directorio'",
      (err, rows) => {
        if (err) {
          console.error('❌ Error verificando tabla:', err);
          db.close();
          process.exit(1);
        }

        if (rows.length === 0) {
          console.log('❌ ¡La tabla "directorio" NO existe!');
          console.log('\n🔧 Debes crear la tabla primero con:');
          console.log('   npm run seed-directorio');
          db.close();
          process.exit(1);
        }

        console.log('✓ Tabla "directorio" existe');

        // Contar registros
        db.get('SELECT COUNT(*) as count FROM directorio', (err, row) => {
          if (err) {
            console.error('❌ Error contando registros:', err);
            db.close();
            process.exit(1);
          }

          const count = row.count;
          console.log(`✓ Total de registros: ${count}`);

          if (count === 0) {
            console.log('⚠️ ¡La tabla está VACÍA! Ejecuta: npm run seed-directorio');
          }

          // Verificar campos
          db.all('PRAGMA table_info(directorio)', (err, columns) => {
            if (err) {
              console.error('❌ Error verificando campos:', err);
              db.close();
              process.exit(1);
            }

            console.log('\n📋 Campos en tabla:');
            columns.forEach(col => {
              console.log(`  - ${col.name} (${col.type})`);
            });

            // Mostrar estadísticas por región
            db.all(
              `SELECT region, COUNT(*) as count FROM directorio 
               WHERE region IS NOT NULL AND region != '' 
               GROUP BY region 
               ORDER BY count DESC`,
              (err, regions) => {
                if (err) {
                  console.log('⚠️ Error obteniendo regiones');
                } else {
                  console.log('\n🗂️ Registros por región:');
                  regions.forEach(r => {
                    console.log(`  - ${r.region}: ${r.count} registros`);
                  });
                }

                // Mostrar estadísticas por cargo (top 10)
                db.all(
                  `SELECT cargo, COUNT(*) as count FROM directorio 
                   WHERE cargo IS NOT NULL AND cargo != '' 
                   GROUP BY cargo 
                   ORDER BY count DESC 
                   LIMIT 10`,
                  (err, cargos) => {
                    if (err) {
                      console.log('⚠️ Error obteniendo cargos');
                    } else {
                      console.log('\n💼 Top 10 Cargos:');
                      cargos.forEach(c => {
                        console.log(`  - ${c.cargo}: ${c.count} registros`);
                      });
                    }

                    // Ejemplo de búsqueda
                    console.log('\n📝 Ejemplo de búsqueda:');
                    db.all(
                      `SELECT nombreCompleto, cargo, region, oficina FROM directorio 
                       WHERE cargo LIKE '%COORDINADOR%' 
                       LIMIT 3`,
                      (err, results) => {
                        if (err) {
                          console.log('⚠️ Error en búsqueda de ejemplo');
                        } else if (results.length > 0) {
                          console.log('  Búsqueda: COORDINADOR');
                          results.forEach(r => {
                            console.log(`    - ${r.nombreCompleto} | ${r.cargo} | ${r.region} | ${r.oficina}`);
                          });
                        } else {
                          console.log('  No hay coordinadores en BD');
                        }

                        db.close();
                        console.log('\n✅ Verificación completada');
                      }
                    );
                  }
                );
              }
            );
          });
        });
      }
    );
  });
}

verifyDirectorio();
