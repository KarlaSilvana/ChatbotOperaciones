/**
 * Script para verificar el estado de la migración
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/chatbot_metrics.db');

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a BD:', err);
    process.exit(1);
  }

  console.log('✓ Conectado a BD\n');

  // Verificar procedimientos
  db.get('SELECT COUNT(*) as count FROM procedimientos', (err, row) => {
    if (err) {
      console.error('❌ Error verificando procedimientos:', err);
      process.exit(1);
    }
    console.log(`📋 Procedimientos en BD: ${row.count}`);

    // Mostrar ejemplo
    db.get(
      'SELECT id, numero, nombre, emoji FROM procedimientos LIMIT 1',
      (err, proc) => {
        if (proc) {
          console.log(`   Ejemplo: [${proc.numero}] ${proc.emoji} ${proc.nombre}`);
        }

        // Verificar directorio
        db.get('SELECT COUNT(*) as count FROM directorio', (err, row) => {
          if (err) {
            console.error('❌ Error verificando directorio:', err);
            process.exit(1);
          }
          console.log(`\n👤 Contactos en directorio: ${row.count}`);

          // Mostrar ejemplo
          db.get(
            'SELECT nombreCompleto, telefono, cargo, region FROM directorio LIMIT 1',
            (err, contact) => {
              if (contact) {
                console.log(`   Ejemplo: ${contact.nombreCompleto} - ${contact.cargo}`);
              }

              console.log('\n✅ Migración completada exitosamente');
              db.close();
            }
          );
        });
      }
    );
  });
});
