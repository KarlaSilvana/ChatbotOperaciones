const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Nightly Analytics Job
 * Ejecuta diariamente a las 22:00 PM y genera reporte con:
 * 1. Top procedimientos consultados
 * 2. Ratio Video vs Documento
 * 3. Uso de IA por procedimiento y modo
 * 4. Consultas IA más frecuentes
 * 5. Colaboradores más activos en IA
 */

const dbPath = path.join(__dirname, '../../data/chatbot_metrics.db');
const reportsDir = path.join(__dirname, '../../reports');

// Asegurar que el directorio /reports existe
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

let db = null;

/**
 * Conectar a la base de datos de métricas
 */
function connectDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to metrics database:', err);
        reject(err);
        return;
      }
      console.log('✓ Connected to metrics database');
      resolve(true);
    });
  });
}

/**
 * Query 1: Top 10 procedimientos consultados
 */
function getTopProcedimientos() {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        procedimiento_nombre,
        COUNT(*) as total_consultations
      FROM interaction_events
      WHERE procedimiento_nombre IS NOT NULL
      GROUP BY procedimiento_nombre
      ORDER BY total_consultations DESC
      LIMIT 10
    `;

    db.all(query, (err, rows) => {
      if (err) {
        console.error('Error in query 1 (Top procedimientos):', err);
        resolve([]);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Query 2: Ratio Video vs Documento
 */
function getVideoVsDocumento() {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        event_type,
        COUNT(*) as count
      FROM interaction_events
      WHERE event_type IN ('USER_REQUEST_VIDEO', 'USER_REQUEST_DOCUMENTO')
      GROUP BY event_type
    `;

    db.all(query, (err, rows) => {
      if (err) {
        console.error('Error in query 2 (Video vs Documento):', err);
        resolve([]);
        return;
      }

      const result = {};
      let videoCount = 0;
      let documentoCount = 0;

      (rows || []).forEach(row => {
        if (row.event_type === 'USER_REQUEST_VIDEO') {
          videoCount = row.count;
        } else if (row.event_type === 'USER_REQUEST_DOCUMENTO') {
          documentoCount = row.count;
        }
      });

      resolve({
        video_requests: videoCount,
        documento_requests: documentoCount,
        ratio: videoCount > 0 ? (documentoCount / videoCount).toFixed(2) : 0,
        description: `Video:Documento = 1:${videoCount > 0 ? (documentoCount / videoCount).toFixed(2) : 0}`
      });
    });
  });
}

/**
 * Query 3: Uso de IA por procedimiento y modo
 */
function getIAUsageByProcedimiento() {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        procedimiento_nombre,
        mode,
        COUNT(*) as consultations,
        AVG(response_length) as avg_response_length
      FROM ia_consultations
      WHERE procedimiento_nombre IS NOT NULL
      GROUP BY procedimiento_nombre, mode
      ORDER BY consultations DESC
      LIMIT 20
    `;

    db.all(query, (err, rows) => {
      if (err) {
        console.error('Error in query 3 (IA usage by procedimiento):', err);
        resolve([]);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Query 4: Consultas IA más frecuentes (para mejora de RAG)
 * Agrupa por similitud de queries
 */
function getMostFrequentIAQuestions() {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        user_query,
        COUNT(*) as frequency,
        procedimiento_nombre,
        mode
      FROM ia_consultations
      WHERE user_query IS NOT NULL
      GROUP BY user_query
      HAVING frequency >= 2
      ORDER BY frequency DESC
      LIMIT 15
    `;

    db.all(query, (err, rows) => {
      if (err) {
        console.error('Error in query 4 (Most frequent questions):', err);
        resolve([]);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Query 5: Colaboradores más activos en IA
 */
function getMostActiveCollaborators() {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        phone_number,
        COUNT(*) as total_consultations,
        COUNT(DISTINCT procedimiento_nombre) as unique_procedures,
        COUNT(DISTINCT mode) as modes_used
      FROM ia_consultations
      GROUP BY phone_number
      ORDER BY total_consultations DESC
      LIMIT 10
    `;

    db.all(query, (err, rows) => {
      if (err) {
        console.error('Error in query 5 (Most active collaborators):', err);
        resolve([]);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Ejecutar todas las queries y generar reporte
 */
async function generateNightlyReport() {
  try {
    console.log('\n📊 Starting nightly analytics report generation...');

    // Ejecutar todas las queries en paralelo
    const [
      topProcedimientos,
      videoVsDocumento,
      iaUsageByProcedimiento,
      frequentQuestions,
      activeCollaborators
    ] = await Promise.all([
      getTopProcedimientos(),
      getVideoVsDocumento(),
      getIAUsageByProcedimiento(),
      getMostFrequentIAQuestions(),
      getMostActiveCollaborators()
    ]);

    // Construir reporte
    const report = {
      generated_at: new Date().toISOString(),
      report_date: new Date().toISOString().split('T')[0],
      summary: {
        total_queries_executed: 5,
        report_period: '06:00 AM - 22:00 PM'
      },
      analytics: {
        top_procedimientos: {
          description: 'Top 10 procedimientos más consultados',
          data: topProcedimientos
        },
        video_vs_documento: {
          description: 'Comparativa de solicitudes: videos vs documentos',
          data: videoVsDocumento
        },
        ia_usage_by_procedimiento: {
          description: 'Uso de IA por procedimiento y modo (chat/consulta)',
          data: iaUsageByProcedimiento
        },
        most_frequent_ia_questions: {
          description: 'Consultas IA más frecuentes (≥2 veces) - Para mejora de RAG',
          data: frequentQuestions
        },
        most_active_collaborators: {
          description: 'Top 10 colaboradores más activos en IA',
          data: activeCollaborators
        }
      }
    };

    // Guardar reporte en /reports/YYYY-MM-DD.json
    const reportDate = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportsDir, `${reportDate}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✓ Nightly report generated: ${reportPath}`);
    console.log('✓ Report contains:');
    console.log(`  - Top procedimientos: ${topProcedimientos.length} items`);
    console.log(`  - Video vs Documento: ${videoVsDocumento.video_requests || 0} vs ${videoVsDocumento.documento_requests || 0}`);
    console.log(`  - IA usage: ${iaUsageByProcedimiento.length} procedure/mode combinations`);
    console.log(`  - Frequent questions: ${frequentQuestions.length} items`);
    console.log(`  - Active collaborators: ${activeCollaborators.length} items`);

    return report;
  } catch (error) {
    console.error('Error generating nightly report:', error);
    throw error;
  }
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
 * Inicializar el CronJob
 * Ejecuta todos los días a las 22:00 PM (10:00 PM)
 * Formato: cron('0 22 * * *') = 00:00 minuto, 22:00 hora, todos los días
 */
function initNightlyReportJob() {
  console.log('🔧 Initializing nightly report job (22:00 PM daily)...');

  const job = cron.schedule('0 22 * * *', async () => {
    try {
      await connectDatabase();
      await generateNightlyReport();
      await closeDatabase();
    } catch (error) {
      console.error('❌ Nightly report job failed:', error);
    }
  });

  console.log('✓ Nightly report job scheduled for 22:00 PM daily');
  return job;
}

/**
 * Función para ejecutar manualmente (para testing)
 */
async function runReportManually() {
  try {
    await connectDatabase();
    const report = await generateNightlyReport();
    await closeDatabase();
    return report;
  } catch (error) {
    console.error('Error running manual report:', error);
    throw error;
  }
}

module.exports = {
  initNightlyReportJob,
  runReportManually,
  generateNightlyReport,
  connectDatabase,
  closeDatabase,
  // Exportar queries para testing
  getTopProcedimientos,
  getVideoVsDocumento,
  getIAUsageByProcedimiento,
  getMostFrequentIAQuestions,
  getMostActiveCollaborators
};
