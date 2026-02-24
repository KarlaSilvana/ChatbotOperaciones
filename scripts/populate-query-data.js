/**
 * Script para poblar BD con datos ficticios de consultas IA
 * Propósito: Generar datos de prueba para demostración de reportes
 * 
 * Uso: node scripts/populate-query-data.js
 * 
 * ⚠️ IMPORTANTE: Estos son datos ficticios para prueba
 * Ejecuta UNA SOLA VEZ o se duplicarán registros
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/chatbot_metrics.db');

let db = null;

/**
 * Base de datos de Firma Electrónica - 46 preguntas y respuestas
 */
const qaDatabase = [
  {
    question: '¿A firma electronica aplica para todos los clientes?',
    answer: 'No. Solo aplica para clientes de nacionalidad peruana. No aplica para clientes iletrados ni personas jurídicas.'
  },
  {
    question: '¿Se puede hacer firma electronica para creditos grupales?',
    answer: 'No. Solo aplica para créditos individuales (Campaña, Preaprobados, Evaluación regular y Reprogramaciones).'
  },
  {
    question: '¿Hasta cuanto es el monto maximo para firma electronica?',
    answer: 'Hasta S/ 80,000.'
  },
  {
    question: '¿El cliente tiene que ir a la oficina para firmar?',
    answer: 'No. El proceso es 100% a distancia, sin firma física ni visita del cliente.'
  },
  {
    question: '¿Qué documentos se firman con firma electronica?',
    answer: 'Contrato de crédito, Hoja resumen, Pagaré (mayor a S/5,000), Declaración jurada de endoso, Seguro de desgravamen, Seguros optativos, Tratamiento de datos personales (cliente nuevo), FUS (si hay transferencia) y Contrato de apertura (si aplica).'
  },
  {
    question: '¿El pagare siempre se firma?',
    answer: 'Solo si el monto es mayor a S/ 5,000.'
  },
  {
    question: '¿Hasta que hora puedo enviar el link al cliente?',
    answer: 'Hasta las 6:00 p.m. en oficina y hasta las 5:00 p.m. en EOB.'
  },
  {
    question: '¿Si ayer envie el link y hoy quiero desembolsar se puede?',
    answer: 'No. La firma electrónica debe ejecutarse el mismo día. Se debe anular y generar una nueva solicitud.'
  },
  {
    question: '¿Los avales tambien firman?',
    answer: 'Sí. Todos los intervinientes (titular, avales, cónyuges, etc.) deben firmar electrónicamente el mismo día.'
  },
  {
    question: '¿Se puede transferir a cuentas de terceros?',
    answer: 'No. Está prohibido realizar transferencias a terceros o personas jurídicas. Solo al titular del crédito.'
  },
  {
    question: '¿Qué pasa si el cliente no termina de firmar el mismo dia?',
    answer: 'Se debe anular la solicitud desde el Módulo de Gestión de Firma Electrónica y generar una nueva.'
  },
  {
    question: '¿Qué hago si sale error en la firma?',
    answer: 'El cliente debe volver a ingresar al link y repetir la foto del DNI o el video, pronunciando fuerte los números.'
  },
  {
    question: '¿Un asesor extranjero puede hacer firma electronica?',
    answer: 'No, hasta que el área de Producción confirme la actualización de esa observación.'
  },
  {
    question: '¿Se puede extornar un desembolso con firma electronica?',
    answer: 'Sí, pero solo si la solicitud está en estado "desembolsado".'
  },
  {
    question: '¿Si el cliente es iletrado puede firmar electronico?',
    answer: 'No. No aplica para clientes iletrados.'
  },
  {
    question: '¿Clientes PEP pueden hacer firma electronica?',
    answer: 'No pueden realizar desembolsos con firma electrónica.'
  },
  {
    question: '¿Qué pasa si sale estado error?',
    answer: 'Se debe volver a intentar desde generación de plan de pagos. Si continúa el error, TI debe anular desde base de datos.'
  },
  {
    question: '¿Cuantas modalidades de envio del link puedo marcar?',
    answer: 'Solo una (Correo, WhatsApp o SMS).'
  },
  {
    question: '¿El voucher se imprime?',
    answer: 'No requiere impresión. Se guarda en PDF.'
  },
  {
    question: '¿Qué pasa si el cliente es nuevo y pide huella por tratamiento de datos?',
    answer: 'Se debe registrar de forma remota y cargar el archivo en blanco.'
  },
  {
    question: '¿Puedo vincular cuenta de otra persona?',
    answer: 'No. Solo cuentas del mismo titular del crédito.'
  },
  {
    question: '¿Si el cliente pregunta por sus documentos?',
    answer: 'Debe ingresar al enlace digital que recibió al concluir la firma.'
  },
  {
    question: '¿Se puede hacer firma electronica para persona juridica?',
    answer: 'No aplica para personas jurídicas.'
  },
  {
    question: '¿El desembolso es el mismo dia?',
    answer: 'Sí. El desembolso se realiza el mismo día.'
  },
  {
    question: '¿Si ayer firmo y hoy me sale alerta de fecha que hago?',
    answer: 'Anular la solicitud y generar una nueva.'
  },
  {
    question: '¿Cuántos intentos de huella antes de pedir excepcion?',
    answer: 'Tres intentos fallidos.'
  },
  {
    question: '¿Si no reconoce la huella que hago primero?',
    answer: 'Verificar rasgos faciales con RENIEC, comparar huella en hoja blanca y realizar protocolo de preguntas.'
  },
  {
    question: '¿Si es mayor a 10 mil quien aprueba la excepcion?',
    answer: 'Requiere aprobación adicional del Supervisor Regional de Operaciones. En su ausencia, el Analista de Operaciones Corporativo.'
  },
  {
    question: '¿Se puede fraccionar monto para evitar aprobacion?',
    answer: 'No. Está estrictamente prohibido.'
  },
  {
    question: '¿Qué debe decir el sustento de excepcion biometrica?',
    answer: 'Actividad del cliente, confirmación de validación de identidad y asumir responsabilidad ante suplantaciones.'
  },
  {
    question: '¿Se puede reutilizar fotos?',
    answer: 'No. Cada solicitud debe tener foto única.'
  },
  {
    question: '¿Si el ejecutivo no pasa su huella que hago?',
    answer: 'Se activa validación dual con otro Ejecutivo o Jefe de Oficina.'
  },
  {
    question: '¿Se puede extornar una operacion de ayer?',
    answer: 'No. Solo operaciones del mismo día.'
  },
  {
    question: '¿Qué debe traer el cliente para extorno?',
    answer: 'DOI físico vigente y voucher original.'
  },
  {
    question: '¿Si es extorno de desembolso que pasa con los documentos?',
    answer: 'Se destruyen los documentos contractuales.'
  },
  {
    question: '¿Quién registra el extorno?',
    answer: 'El Ejecutivo de Servicios o Coordinador de Operaciones.'
  },
  {
    question: '¿Quién aprueba los extornos?',
    answer: 'Supervisor de Operaciones. Luego Jefe de Oficina, Coordinador de Operaciones o Analista de Operaciones (según orden).'
  },
  {
    question: '¿Si no procede el extorno?',
    answer: 'Se informa al cliente y se deja constancia en el formulario.'
  },
  {
    question: '¿Quién aprueba clientes PEP?',
    answer: 'Jefe de Oficina.'
  },
  {
    question: '¿Quién aprueba ampliacion de montos?',
    answer: 'Supervisor de Operaciones y luego Analista de Operaciones.'
  },
  {
    question: '¿Quién aprueba reimpresion de voucher?',
    answer: 'Coordinador de Operaciones, Supervisor de Operaciones, Jefe de Oficina y Analista de Operaciones (en ese orden).'
  },
  {
    question: '¿Quién aprueba excepciones biometrica mayor a 10 mil?',
    answer: 'Supervisor de Operaciones y luego Analista de Operaciones.'
  },
  {
    question: '¿Dónde solicito actualizacion de datos?',
    answer: 'En Core Bank → Módulo Clientes → Mantenimiento Cliente.'
  },
  {
    question: '¿Quién aprueba actualizacion de datos?',
    answer: 'Analista de Operaciones.'
  },
  {
    question: '¿Se puede generar otra solicitud del mismo tipo?',
    answer: 'No. Hasta que la anterior sea aprobada.'
  },
  {
    question: '¿Si cambio DNI o nombre que pasa?',
    answer: 'Se deben volver a firmar los documentos contractuales.'
  }
];

/**
 * Lista de procedimientos para randomizar
 */
const procedures = [
  'Firma Electrónica',
  'Créditos',
  'Control Biométrico',
  'Extornos',
  'Actualización de Datos',
  'Chat General'
];

/**
 * Lista de modos IA
 */
const modes = ['chat', 'consulta', 'assistant', 'guide'];

/**
 * Conectar a BD
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
 * Generar fecha aleatoria entre 1 enero y 23 febrero 2026
 */
function generateRandomDate() {
  const start = new Date('2026-01-01');
  const end = new Date('2026-02-23');
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  // Agregar hora aleatoria (7am - 6pm)
  date.setHours(Math.floor(Math.random() * 11) + 7);
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  
  return date.toISOString();
}

/**
 * Generar fecha en formato YYYY-MM-DD
 */
function getDateOnly(isoString) {
  return isoString.split('T')[0];
}

/**
 * Obtener elemento random de array
 */
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Insertar consultas IA ficticias
 */
function populateIAConsultations() {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Insertando consultas IA ficticias...');
    
    let insertedCount = 0;
    
    qaDatabase.forEach((qa, index) => {
      const timestamp = generateRandomDate();
      const dateOnly = getDateOnly(timestamp);
      const phoneNumber = ''; // Vacío como solicitó
      const queryType = getRandomElement(['procedure', 'general']);
      const procedureName = getRandomElement(procedures);
      const mode = getRandomElement(modes);
      
      const stmt = db.prepare(`
        INSERT INTO ia_consultations (
          phone_number, procedimiento_id, procedimiento_nombre, mode,
          user_query, rag_response, response_length, query_date, timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const responseLength = qa.answer.length;
      
      stmt.run(
        [phoneNumber, `proc_${index}`, procedureName, mode, qa.question, qa.answer, responseLength, dateOnly, timestamp],
        (err) => {
          if (err) {
            console.error(`❌ Error insertando consulta ${index + 1}:`, err);
          } else {
            insertedCount++;
          }
        }
      );
      
      stmt.finalize();
    });
    
    // Esperar a que todos terminen
    setTimeout(() => {
      console.log(`✓ Consultas IA insertadas: ${insertedCount}/${qaDatabase.length}`);
      resolve(insertedCount);
    }, 500);
  });
}

/**
 * Insertar eventos generales ficticios
 */
function populateEvents() {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Insertando eventos generales ficticios...');
    
    const eventTypes = [
      'USER_SEARCH_DIRECTORIO',
      'USER_REQUEST_VIDEO',
      'USER_REQUEST_DOCUMENTO',
      'USER_START_IA_CONSULTA',
      'MENU_CLICK',
      'PROCEDURE_VIEW'
    ];
    
    let insertedCount = 0;
    const numEvents = 35;
    
    for (let i = 0; i < numEvents; i++) {
      const timestamp = generateRandomDate();
      const dateOnly = getDateOnly(timestamp);
      const phoneNumber = ''; // Vacío
      const eventType = getRandomElement(eventTypes);
      const procedureName = getRandomElement(procedures);
      
      const stmt = db.prepare(`
        INSERT INTO interaction_events (
          phone_number, event_type, procedimiento_id, procedimiento_nombre, timestamp
        )
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        [phoneNumber, eventType, `event_${i}`, procedureName, timestamp],
        (err) => {
          if (err) {
            console.error(`❌ Error insertando evento ${i + 1}:`, err);
          } else {
            insertedCount++;
          }
        }
      );
      
      stmt.finalize();
    }
    
    // Esperar
    setTimeout(() => {
      console.log(`✓ Eventos generales insertados: ${insertedCount}/${numEvents}`);
      resolve(insertedCount);
    }, 500);
  });
}

/**
 * Cerrar BD
 */
function closeDB() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error cerrando BD:', err);
        } else {
          console.log('✓ BD cerrada');
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Ejecutar todo
 */
async function main() {
  try {
    console.log('🚀 Iniciando población de datos ficticios...\n');
    console.log('⚠️  Estos son datos de PRUEBA para demostración');
    console.log('📅 Período: 1 enero - 23 febrero 2026\n');
    
    await connectDB();
    
    const consultasCount = await populateIAConsultations();
    const eventsCount = await populateEvents();
    
    await closeDB();
    
    console.log('\n✅ ¡COMPLETADO!\n');
    console.log(`📊 Resumen:`);
    console.log(`   • ${consultasCount} Consultas IA insertadas`);
    console.log(`   • ${eventsCount} Eventos generales insertados`);
    console.log(`   • Total: ${consultasCount + eventsCount} registros\n`);
    console.log('💡 Ahora puedes descargar el reporte en el panel admin');
    console.log('📲 Accede a: http://TU_IP:3000/admin/reportes.html\n');
    
  } catch (err) {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  }
}

main();
