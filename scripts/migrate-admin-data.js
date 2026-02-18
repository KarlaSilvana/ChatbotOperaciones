/**
 * Script para migrar datos de JSON a SQLite
 * Migra procedimientos.json y directorio.json a las nuevas tablas admin
 * 
 * Uso: node scripts/migrate-admin-data.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/chatbot_metrics.db');
const procedimientosPath = path.join(__dirname, '../src/config/procedimientos.json');
const directorioPath = path.join(__dirname, '../src/config/directorio.json');

let db = null;

/**
 * Conectar a la BD
 */
function connectDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error conectando a BD:', err);
        reject(err);
      } else {
        console.log('✓ Conectado a BD');
        resolve(true);
      }
    });
  });
}

/**
 * Crear tablas admin si no existen
 */
function createAdminTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crear tabla procedimientos
      db.run(`
        CREATE TABLE IF NOT EXISTS procedimientos (
          id TEXT PRIMARY KEY,
          numero INTEGER UNIQUE,
          nombre TEXT NOT NULL,
          emoji TEXT,
          recursos_json TEXT
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creando tabla procedimientos:', err);
          reject(err);
          return;
        }
        console.log('✓ Tabla procedimientos lista');
      });

      // Crear tabla directorio
      db.run(`
        CREATE TABLE IF NOT EXISTS directorio (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombreCompleto TEXT NOT NULL,
          telefono TEXT,
          cargo TEXT,
          region TEXT,
          oficina TEXT,
          establecimiento TEXT
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creando tabla directorio:', err);
          reject(err);
          return;
        }
        console.log('✓ Tabla directorio lista');
        resolve(true);
      });
    });
  });
}

/**
 * Migrar procedimientos.json a tabla procedimientos
 */
function migrateProcedimientos() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(procedimientosPath)) {
      console.warn('⚠ procedimientos.json no encontrado en:', procedimientosPath);
      resolve(0);
      return;
    }

    try {
      const content = fs.readFileSync(procedimientosPath, 'utf-8');
      const data = JSON.parse(content);
      const procedimientos = data.procedimientos || [];

      if (procedimientos.length === 0) {
        console.warn('⚠ No hay procedimientos para migrar');
        resolve(0);
        return;
      }

      // Limpiar tabla antes de migrar
      db.run('DELETE FROM procedimientos', (err) => {
        if (err) {
          console.error('❌ Error limpiando tabla procedimientos:', err);
          reject(err);
          return;
        }

        // Insertar cada procedimiento
        let insertedCount = 0;
        const stmt = db.prepare(`
          INSERT INTO procedimientos (id, numero, nombre, emoji, recursos_json)
          VALUES (?, ?, ?, ?, ?)
        `);

        procedimientos.forEach((proc) => {
          const recursos = {
            video: proc.recursos?.video || '',
            documento: proc.recursos?.documento || ''
          };

          stmt.run(
            [
              proc.id,
              proc.numero,
              proc.nombre,
              proc.emoji,
              JSON.stringify(recursos)
            ],
            (err) => {
              if (err) {
                console.error(`❌ Error insertando procedimiento ${proc.id}:`, err);
              } else {
                insertedCount++;
              }
            }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('❌ Error finalizando statement:', err);
            reject(err);
          } else {
            console.log(`✓ Procedimientos migrados: ${insertedCount}/${procedimientos.length}`);
            resolve(insertedCount);
          }
        });
      });
    } catch (err) {
      console.error('❌ Error leyendo/parseando procedimientos.json:', err.message);
      reject(err);
    }
  });
}

/**
 * Migrar directorio.json a tabla directorio
 */
function migrateDirectorio() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(directorioPath)) {
      console.warn('⚠ directorio.json no encontrado en:', directorioPath);
      resolve(0);
      return;
    }

    try {
      const content = fs.readFileSync(directorioPath, 'utf-8');
      const data = JSON.parse(content);
      // directorio.json es un array directo
      const contacts = Array.isArray(data) ? data : (data.directorio || data.contacts || []);

      if (contacts.length === 0) {
        console.warn('⚠ No hay contactos para migrar');
        resolve(0);
        return;
      }

      // Limpiar tabla antes de migrar
      db.run('DELETE FROM directorio', (err) => {
        if (err) {
          console.error('❌ Error limpiando tabla directorio:', err);
          reject(err);
          return;
        }

        // Insertar cada contacto
        let insertedCount = 0;
        const stmt = db.prepare(`
          INSERT INTO directorio (nombreCompleto, telefono, cargo, region, oficina, establecimiento)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        contacts.forEach((contact) => {
          stmt.run(
            [
              contact.nombreCompleto || '',
              contact.telefono || '',
              contact.cargo || '',
              contact.region || '',
              contact.oficina || '',
              contact.establecimiento || ''
            ],
            (err) => {
              if (err) {
                console.error(`❌ Error insertando contacto ${contact.nombreCompleto}:`, err);
              } else {
                insertedCount++;
              }
            }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('❌ Error finalizando statement:', err);
            reject(err);
          } else {
            console.log(`✓ Directorio migrado: ${insertedCount}/${contacts.length}`);
            resolve(insertedCount);
          }
        });
      });
    } catch (err) {
      console.error('❌ Error leyendo/parseando directorio.json:', err.message);
      reject(err);
    }
  });
}

/**
 * Verificar integridad
 */
function verifyMigration() {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Verificando integridad de datos...\n');

    db.get('SELECT COUNT(*) as count FROM procedimientos', (err, row) => {
      if (err) {
        console.error('❌ Error verificando procedimientos:', err);
        reject(err);
        return;
      }
      console.log(`✓ Procedimientos en BD: ${row.count}`);

      db.get('SELECT COUNT(*) as count FROM directorio', (err, row) => {
        if (err) {
          console.error('❌ Error verificando directorio:', err);
          reject(err);
          return;
        }
        console.log(`✓ Contactos en directorio: ${row.count}`);

        // Mostrar ejemplo de procedimiento
        db.get(
          'SELECT id, numero, nombre, emoji FROM procedimientos LIMIT 1',
          (err, proc) => {
            if (proc) {
              console.log(`\n📋 Ejemplo procedimiento:`, proc);
            }

            // Mostrar ejemplo de contacto
            db.get(
              'SELECT nombreCompleto, telefono, cargo, region FROM directorio LIMIT 1',
              (err, contact) => {
                if (contact) {
                  console.log(`\n👤 Ejemplo contacto:`, contact);
                }

                resolve(true);
              }
            );
          }
        );
      });
    });
  });
}

/**
 * Cerrar BD
 */
function closeDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('❌ Error cerrando BD:', err);
          reject(err);
        } else {
          console.log('\n✓ Conexión cerrada');
          resolve(true);
        }
      });
    } else {
      resolve(true);
    }
  });
}

/**
 * Ejecutar migración completa
 */
async function runMigration() {
  console.log('🚀 Iniciando migracion de datos admin...\n');

  try {
    await connectDB();
    await createAdminTables();
    await migrateProcedimientos();
    await migrateDirectorio();
    await verifyMigration();
    await closeDB();

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error durante migracion:', err);
    closeDB().then(() => process.exit(1));
  }
}

// Ejecutar
runMigration();
