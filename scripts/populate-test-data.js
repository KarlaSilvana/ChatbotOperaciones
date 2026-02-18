/**
 * Script para insertar datos de ejemplo en las tablas de métricas
 * Uso: node scripts/populate-test-data.js
 */

const metricsService = require('../src/services/metricsService');

async function populateTestData() {
  try {
    console.log('🔄 Inicializando datos de prueba...\n');

    // Usuarios de prueba
    const usuarios = ['51987654321', '51912345678', '51998765432', '51945678901'];
    const procedimientos = [
      { id: 'proc_001', nombre: 'Apertura de Cuenta' },
      { id: 'proc_002', nombre: 'Transferencias' },
      { id: 'proc_003', nombre: 'Depósitos' },
      { id: 'proc_004', nombre: 'Retiros' },
      { id: 'proc_005', nombre: 'Cambio de Contraseña' }
    ];

    // =====================================================
    // 1. REGISTRAR EVENTOS DE INTERACCIÓN
    // =====================================================
    console.log('📊 Registrando eventos de interacción...');

    for (let i = 0; i < 3; i++) {
      for (const usuario of usuarios) {
        // Búsquedas en directorio
        await metricsService.recordEvent(
          usuario,
          'USER_SEARCH_DIRECTORIO',
          null,
          'Directorio'
        );

        // Solicitudes de videos
        const procVideo = procedimientos[Math.floor(Math.random() * procedimientos.length)];
        await metricsService.recordEvent(
          usuario,
          'USER_REQUEST_VIDEO',
          procVideo.id,
          procVideo.nombre
        );

        // Solicitudes de documentos
        const procDoc = procedimientos[Math.floor(Math.random() * procedimientos.length)];
        await metricsService.recordEvent(
          usuario,
          'USER_REQUEST_DOCUMENTO',
          procDoc.id,
          procDoc.nombre
        );

        // Inicio de IA
        const procIA = procedimientos[Math.floor(Math.random() * procedimientos.length)];
        await metricsService.recordEvent(
          usuario,
          'USER_START_IA_CONSULTA',
          procIA.id,
          procIA.nombre
        );
      }
    }

    console.log('✓ Eventos de interacción registrados\n');

    // =====================================================
    // 2. REGISTRAR CONSULTAS DE IA
    // =====================================================
    console.log('🤖 Registrando consultas de IA...');

    const consultasChat = [
      {
        query: '¿Cuál es el horario de atención?',
        response: 'Nuestro horario de atención es de lunes a viernes 08:00 - 17:00, sábado 08:00 - 13:00. Estamos cerrados los domingos.'
      },
      {
        query: '¿Cuáles son los requisitos para abrir una cuenta?',
        response: 'Los requisitos para abrir una cuenta son: 1. DNI o Pasaporte válido, 2. Comprobante de domicilio, 3. Número de teléfono activo, 4. Depósito inicial mínimo de S/ 100.00'
      },
      {
        query: '¿Cuál es la comisión para transferencias?',
        response: 'La comisión por transferencia es: Transferencias nacionales: 0%, Transferencias internacionales: 1.5% del monto'
      },
      {
        query: '¿Cuánto tarda una transferencia?',
        response: 'El tiempo de procesamiento es: Transferencias nacionales: 24 horas hábiles, Transferencias internacionales: 3-5 días hábiles'
      }
    ];

    const consultasConsulta = [
      {
        query: '¿Qué documentos necesito para abrir una cuenta de ahorros?',
        response: 'Para abrir una cuenta de ahorros necesitas: DNI original y copia, comprobante de domicilio reciente (máximo 3 meses), teléfono de contacto'
      },
      {
        query: '¿Cuál es la tasa de interés anual?',
        response: 'La tasa de interés anual es del 2.5% para cuentas de ahorros ordinarias, 3.5% para depósitos a plazo fijo por 6 meses'
      },
      {
        query: '¿Hay límite de depósitos diarios?',
        response: 'No hay límite de depósitos diarios. Sin embargo, depósitos mayores a S/ 10,000 deben ser reportados a SUNAT según normativas'
      }
    ];

    for (let i = 0; i < 2; i++) {
      for (const usuario of usuarios) {
        // Consultas en modo chat
        const chatRandom = consultasChat[Math.floor(Math.random() * consultasChat.length)];
        await metricsService.recordIAConsultation(
          usuario,
          'general_chat',
          'Chat General',
          'chat',
          chatRandom.query,
          chatRandom.response
        );

        // Consultas en modo consulta (específico de procedimiento)
        const procConsulta = procedimientos[Math.floor(Math.random() * procedimientos.length)];
        const consultaRandom = consultasConsulta[Math.floor(Math.random() * consultasConsulta.length)];
        await metricsService.recordIAConsultation(
          usuario,
          procConsulta.id,
          procConsulta.nombre,
          'consulta',
          consultaRandom.query,
          consultaRandom.response
        );
      }
    }

    console.log('✓ Consultas de IA registradas\n');

    // =====================================================
    // 3. MOSTRAR ESTADÍSTICAS
    // =====================================================
    console.log('📈 Estadísticas de eventos:');
    const eventStats = await metricsService.getInteractionStats();
    console.table(eventStats);

    console.log('\n📈 Estadísticas de consultas IA:');
    const iaStats = await metricsService.getIAConsultationStats();
    console.table(iaStats);

    console.log('\n✅ Datos de prueba insertados exitosamente');
    console.log('📁 Base de datos: /data/chatbot_metrics.db');
    console.log('\n💡 Próximo paso: Ejecutar en Postman:');
    console.log('   POST http://localhost:3000/api/metrics/generate-report');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateTestData();
