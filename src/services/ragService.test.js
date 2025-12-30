/**
 * Test Básico de RAG Service
 * Ejecutar: node src/services/ragService.test.js
 */

const ragService = require('./ragService');
const logger = require('../utils/logger');

async function testRAGService() {
  logger.info('🧪 Iniciando tests de RAG Service...\n');

  // Test 1: Validar configuración
  logger.info('📋 TEST 1: Validar Configuración');
  try {
    const config = ragService.validateConfiguration();
    logger.success('✅ Configuración válida');
  } catch (error) {
    logger.error('❌ Error en configuración:', error.message);
  }

  // Test 2: Consulta simple
  logger.info('\n🤖 TEST 2: Consulta Simple');
  try {
    logger.info('Enviando: "Hola, ¿cómo estás?"');
    const response = await ragService.sendQuery('Hola, ¿cómo estás?');
    
    logger.success('✅ Respuesta recibida:');
    logger.info(`📝 ${response.response.substring(0, 200)}...`);
    logger.info(`⏱️ Tiempo respuesta: ${response.metadata?.response_time_seconds || 'N/A'}s`);
    
  } catch (error) {
    logger.error('❌ Error en consulta:', error.message);
  }

  // Test 3: Consulta con contexto temático
  logger.info('\n📚 TEST 3: Consulta con Contexto Temático');
  try {
    logger.info('Enviando: "Firma Electronica: ¿Cuáles son los requisitos?"');
    const response = await ragService.sendQuery(
      '¿Cuáles son los requisitos?',
      'Firma Electronica'
    );
    
    logger.success('✅ Respuesta recibida:');
    logger.info(`📝 ${response.response.substring(0, 200)}...`);
    
  } catch (error) {
    logger.error('❌ Error en consulta con contexto:', error.message);
  }

  // Test 4: Error handling - Mensaje vacío
  logger.info('\n⚠️ TEST 4: Manejo de Error (Mensaje vacío)');
  try {
    await ragService.sendQuery('');
    logger.error('❌ Debería haber lanzado un error');
  } catch (error) {
    logger.success('✅ Error capturado correctamente:', error.message);
  }

  logger.info('\n✅ Tests completados');
}

// Ejecutar tests
if (require.main === module) {
  testRAGService().catch(error => {
    logger.error('Error fatal en tests:', error);
    process.exit(1);
  });
}

module.exports = { testRAGService };
