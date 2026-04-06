/**
 * Script de test simple para DirectorioParserService
 * Valida que:
 * 1. OPENAI_API_KEY está configurada
 * 2. DirectorioParserService puede conectarse
 * 3. Extrae parámetros correctamente
 */

require('dotenv').config();
const DirectorioParserService = require('../src/services/directorioParserService');

async function testDirectorioParser() {
  console.log('🧪 Iniciando test de DirectorioParserService...\n');

  // 1. Verificar API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY no está configurada en .env');
    console.log('   Por favor, agrega: OPENAI_API_KEY=tu-clave-aqui');
    process.exit(1);
  }

  console.log('✓ OPENAI_API_KEY detectada');
  console.log(`✓ Modelo: ${process.env.OPENAI_MODEL || 'gpt-4-turbo'}\n`);

  // 2. Crear instancia del parser
  let parser;
  try {
    parser = new DirectorioParserService();
    console.log('✓ DirectorioParserService inicializado\n');
  } catch (error) {
    console.error('❌ Error inicializando DirectorioParserService:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  // 3. Test queries
  const testCases = [
    'Jefe de oficina Juliaca',
    'Coordinadores de operaciones de puno sur',
    'Ejecutivo de servicios EOB PANGOA',
    'Sra Ruth Torres',
    'Asesores de negocios'
  ];

  console.log('🔍 Testeando extracción de parámetros...\n');

  for (const query of testCases) {
    try {
      console.log(`Query: "${query}"`);
      const params = await parser.extractParams(query);

      if (params.error) {
        console.log(`❌ Error: ${params.error}`);
      } else if (params.filtros && Array.isArray(params.filtros)) {
        // Nuevo formato: {filtros: [{campo, valor}, ...]}
        console.log(`✓ Filtros encontrados: ${params.filtros.length}`);
        params.filtros.forEach((f, i) => {
          console.log(`  [${i + 1}] ${f.campo}: "${f.valor}"`);
        });
      } else if (params.campo && params.valor) {
        // Formato antiguo compatible: {campo, valor}
        console.log(`✓ campo: ${params.campo}`);
        console.log(`✓ valor: ${params.valor}`);
      } else {
        console.log('⚠️  Parámetros no reconocidos');
      }
      console.log();
    } catch (error) {
      console.error(`❌ Exception: ${error.message}\n`);
    }
  }

  console.log('✅ Test completado');
  process.exit(0);
}

testDirectorioParser().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
