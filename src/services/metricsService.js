const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/chatbot_metrics.db');

// Asegurar que el directorio /data existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

/**
 * Inicializar conexión a SQLite y crear tablas si no existen
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Si DB ya está inicializada, solo resolver
    if (db) {
      resolve(true);
      return;
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }

      db.serialize(() => {
        // Crear tabla interaction_events
        db.run(`
          CREATE TABLE IF NOT EXISTS interaction_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            event_type TEXT NOT NULL,
            procedimiento_id TEXT,
            procedimiento_nombre TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Crear tabla ia_consultations
        db.run(`
          CREATE TABLE IF NOT EXISTS ia_consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            procedimiento_id TEXT,
            procedimiento_nombre TEXT,
            mode TEXT,
            user_query TEXT,
            rag_response TEXT,
            response_length INTEGER,
            query_date DATE,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Crear tabla procedimientos (para admin panel)
        db.run(`
          CREATE TABLE IF NOT EXISTS procedimientos (
            id TEXT PRIMARY KEY,
            numero INTEGER UNIQUE,
            nombre TEXT NOT NULL,
            emoji TEXT,
            recursos_json TEXT
          )
        `);

        // Crear tabla directorio (para admin panel)
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
            console.error('Error creating admin tables:', err);
            reject(err);
            return;
          }
          console.log('✓ Database initialized successfully with admin tables');
          resolve(true);
        });
      });
    });
  });
}

/**
 * Registrar evento de interacción general
 */
async function recordEvent(phoneNumber, eventType, procedimientoId = null, procedimientoNombre = null) {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve) => {
    const stmt = db.prepare(`
      INSERT INTO interaction_events (phone_number, event_type, procedimiento_id, procedimiento_nombre)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run([phoneNumber, eventType, procedimientoId, procedimientoNombre], (err) => {
      if (err) {
        console.error(`Error recording event ${eventType}:`, err);
      } else {
        console.log(`✓ Event recorded: ${eventType} from ${phoneNumber}`);
      }
      stmt.finalize();
      resolve();
    });
  });
}

/**
 * Registrar consulta de IA con respuesta completa
 */
async function recordIAConsultation(phoneNumber, procedimientoId, procedimientoNombre, mode, userQuery, ragResponse) {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve) => {
    const responseLength = ragResponse ? ragResponse.length : 0;
    const queryDate = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO ia_consultations (
        phone_number, procedimiento_id, procedimiento_nombre, mode, 
        user_query, rag_response, response_length, query_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      [phoneNumber, procedimientoId, procedimientoNombre, mode, userQuery, ragResponse, responseLength, queryDate],
      (err) => {
        if (err) {
          console.error('Error recording IA consultation:', err);
        } else {
          console.log(`✓ IA consultation recorded from ${phoneNumber}`);
        }
        stmt.finalize();
        resolve();
      }
    );
  });
}

/**
 * Obtener estadísticas de events
 */
async function getInteractionStats() {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve) => {
    db.all('SELECT event_type, COUNT(*) as count FROM interaction_events GROUP BY event_type', (err, rows) => {
      if (err) {
        console.error('Error fetching stats:', err);
        resolve([]);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Obtener estadísticas de consultas IA
 */
async function getIAConsultationStats() {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve) => {
    db.all('SELECT mode, COUNT(*) as count FROM ia_consultations GROUP BY mode', (err, rows) => {
      if (err) {
        console.error('Error fetching IA stats:', err);
        resolve([]);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Obtener consultas IA para exportar CSV (con query_type)
 * @param {string} fromDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} toDate - Fecha fin (YYYY-MM-DD)
 */
async function getIAConsultationsForExport(fromDate, toDate) {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        timestamp,
        phone_number,
        CASE 
          WHEN procedure_name = 'Chat General' THEN 'general'
          ELSE 'procedure'
        END as query_type,
        procedure_name,
        user_query,
        rag_response,
        mode as ia_mode
      FROM ia_consultations
      WHERE query_date BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `;
    
    db.all(query, [fromDate, toDate], (err, rows) => {
      if (err) {
        console.error('Error fetching IA consultations for export:', err);
        reject(err);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Obtener eventos para exportar CSV
 * @param {string} fromDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} toDate - Fecha fin (YYYY-MM-DD)
 */
async function getEventsForExport(fromDate, toDate) {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        timestamp,
        phone_number,
        event_type,
        procedure_name
      FROM interaction_events
      WHERE DATE(timestamp) BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `;
    
    db.all(query, [fromDate, toDate], (err, rows) => {
      if (err) {
        console.error('Error fetching events for export:', err);
        reject(err);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Contar consultas IA y eventos para preview
 * @param {string} fromDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} toDate - Fecha fin (YYYY-MM-DD)
 */
async function getRecordCounts(fromDate, toDate) {
  if (!db) {
    await initializeDatabase();
  }

  return new Promise((resolve, reject) => {
    let consultCount = 0;
    let eventCount = 0;

    // Contar consultas IA
    db.get(
      'SELECT COUNT(*) as count FROM ia_consultations WHERE query_date BETWEEN ? AND ?',
      [fromDate, toDate],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        consultCount = row?.count || 0;

        // Contar eventos
        db.get(
          'SELECT COUNT(*) as count FROM interaction_events WHERE DATE(timestamp) BETWEEN ? AND ?',
          [fromDate, toDate],
          (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            eventCount = row?.count || 0;

            // Estimar tamaño (cada consulta ~2KB, cada evento ~200B)
            const estimatedSizeKB = 
              ((consultCount * 2) + (eventCount * 0.2)) / 1024;

            resolve({
              consultations: consultCount,
              events: eventCount,
              estimatedSizeKB: parseFloat(estimatedSizeKB.toFixed(1))
            });
          }
        );
      }
    );
  });
}

/**
 * Cerrar conexión a BD
 */
function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Resetear BD (para tests)
 */
function resetDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Inicializar DB al importar el módulo
initializeDatabase().catch(err => console.error('Failed to initialize DB on import:', err));

module.exports = {
  recordEvent,
  recordIAConsultation,
  getInteractionStats,
  getIAConsultationStats,
  getIAConsultationsForExport,
  getEventsForExport,
  getRecordCounts,
  closeDatabase,
  resetDatabase,
  initializeDatabase
};
