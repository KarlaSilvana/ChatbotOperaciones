/**
 * DirectorioParserService
 * 
 * Extrae parámetros de búsqueda del directorio a partir de lenguaje natural
 * usando OpenAI como intérprete.
 * 
 * Soporta búsqueda por:
 * - cargo: JEFE DE OFICINA, COORDINADOR DE OPERACIONES, EJECUTIVO, etc.
 * - region: SEDE, NORTE, PUNO SUR, CENTRO, PUNO NORTE, ESTE, OESTE, etc.
 * - oficina: PRINCIPAL, OFICINA JULIACA TUPAC, OFICINA PUNO, etc.
 * - establecimiento: EOB PANGOA, EOB PUNO, etc.
 * - nombreCompleto: Nombres y apellidos de personas
 */

const { OpenAI } = require('openai');

class DirectorioParserService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada en .env');
    }

    this.client = new OpenAI({ 
      apiKey: apiKey
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '500');
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');

    // Campos válidos para búsqueda
    this.validFields = ['cargo', 'region', 'oficina', 'establecimiento', 'nombrecompleto'];

    // Normalización de campos (minúsculas a formato correcto)
    this.fieldNormalization = {
      'cargo': 'cargo',
      'region': 'region',
      'oficina': 'oficina',
      'establecimiento': 'establecimiento',
      'nombrecompleto': 'nombreCompleto'
    };

    // Opciones conocidas de cada campo
    this.fieldOptions = {
      cargo: [
        'JEFE DE OFICINA',
        'COORDINADOR DE OPERACIONES',
        'EJECUTIVO DE SERVICIOS',
        'ASESOR DE NEGOCIOS',
        'ESPECIALISTA',
        'ASISTENTE',
        'GERENTE',
        'DIRECTOR',
        'SUPERVISOR'
      ],
      region: [
        'SEDE',
        'NORTE',
        'PUNO SUR',
        'CENTRO',
        'PUNO NORTE',
        'ESTE',
        'OESTE',
        'SUR',
        'NORTE I',
        'NORTE II'
      ]
    };
  }

  async extractParams(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        error: 'Por favor, proporciona una búsqueda válida'
      };
    }

    try {
      const prompt = this.buildPrompt(query);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content || '';
      const parsed = this.parseResponse(content, query);

      return parsed;
    } catch (error) {
      console.error('❌ Error en DirectorioParserService:', error.message);
      return {
        error: `No pude interpretar tu búsqueda: ${error.message}`
      };
    }
  }

  buildPrompt(query) {
    return `Analiza esta búsqueda en el directorio de una empresa y EXTRAE TODOS los parámetros relevantes:

BÚSQUEDA: "${query}"

CAMPOS DISPONIBLES:
1. "cargo": Puesto/posición - SIEMPRE EXTRAE EL CARGO COMPLETO, NO ABREVIATURAS
   Ejemplos comunes: JEFE DE OFICINA, COORDINADOR DE OPERACIONES, COORDINADOR DE CRÉDITOS,
   EJECUTIVO DE SERVICIOS, ASESOR DE NEGOCIOS, GESTOR DE RECUPERACIONES, SUPERVISOR DE OPERACIONES
2. "region": Región geográfica (ej: SEDE, NORTE, PUNO SUR, CENTRO, AREQUIPA)
3. "oficina": Oficina específica por CIUDAD/UBICACIÓN
   ⚠️ IMPORTANTE: Ciudades como "Abancay", "Aplao", "Puno", "Juliaca", "Camana", "Cajamarca", "Ica", "Lima", "Ayacucho", "Huancayo", "Pucallpa", etc.
   Se convierten en: "OFICINA ABANCAY", "OFICINA APLAO", "OFICINA PUNO", etc.
   Ejemplos: "de Abancay" → "OFICINA ABANCAY", "aplao" → "OFICINA APLAO", "puno" → "OFICINA PUNO"
4. "establecimiento": Sucursal tipo EOB (ej: EOB PANGOA, EOB PUNO)
5. "nombreCompleto": Nombres y apellidos de persona (ej: RUTH TORRES, JUAN PÉREZ)

⚠️ REGLAS CRÍTICAS PARA CARGOS:
- "coordinadores de operaciones" → Solo "COORDINADOR DE OPERACIONES" (completo), NO "COORDINADOR"
- "ejecutivo" → "EJECUTIVO DE SERVICIOS" (busca el tipo/categoría específico)
- "asesor" → "ASESOR DE NEGOCIOS" (no solo "ASESOR")
- "jefe" → "JEFE DE OFICINA" (no solo "JEFE")
- "gestor" → "GESTOR DE RECUPERACIONES" (no solo "GESTOR")
- "supervisor" → "SUPERVISOR DE OPERACIONES" (no solo "SUPERVISOR")

⚠️ REGLAS CRÍTICAS PARA CIUDADES = OFICINAS:
- "ejecutivo de servicios de Abancay" → AMBOS: cargo ("EJECUTIVO DE SERVICIOS") Y oficina ("OFICINA ABANCAY")
- "jefe aplao" → AMBOS: cargo ("JEFE DE OFICINA") Y oficina ("OFICINA APLAO")
- "coordinador puno" → AMBOS: cargo ("COORDINADOR DE CRÉDITOS" o lo que sea) Y oficina ("OFICINA PUNO")
- NUNCA dejes una ciudad sin convertirla a "OFICINA CIUDAD_NAME"

ESTRATEGIA DE EXTRACCIÓN (PRIORIDAD):
1. PRIMERO: Si hay UBICACIÓN ESPECÍFICA (CIUDAD/OFICINA o REGIÓN) → extrae OFICINA CIUDAD (formato: "OFICINA XXX") o REGIÓN
2. SEGUNDO: Si menciona CARGO → extrae EL CARGO COMPLETO (NO ABREVIATURAS)
3. TERCERO: Si menciona NOMBRE → extrae eso
4. CUARTO: Si menciona ESTABLECIMIENTO → extrae eso

RESPUESTA (JSON VÁLIDO):
- Con 1 parámetro: {"campo": "valor"}
- Con 2+ parámetros: {"filtros": [{"campo": "valor1"}, {"campo": "valor2"}]}

EJEMPLOS CORRECTOS:
✓ "coordinadores de operaciones" → {"campo":"cargo","valor":"COORDINADOR DE OPERACIONES"}
✓ "ejecutivos de servicios" → {"campo":"cargo","valor":"EJECUTIVO DE SERVICIOS"}
✓ "jefe de oficina" → {"campo":"cargo","valor":"JEFE DE OFICINA"}
✓ "jefe aplao" → {"filtros":[{"campo":"cargo","valor":"JEFE DE OFICINA"},{"campo":"oficina","valor":"APLAO"}]}
✓ "ejecutivo de servicios de abancay" → {"filtros":[{"campo":"cargo","valor":"EJECUTIVO DE SERVICIOS"},{"campo":"oficina","valor":"ABANCAY"}]}
✓ "coordinador operaciones puno" → {"filtros":[{"campo":"cargo","valor":"COORDINADOR DE OPERACIONES"},{"campo":"oficina","valor":"PUNO"}]}

EJEMPLOS INCORRECTOS (EVITAR):
✗ "ejecutivo de servicios de abancay" → {"campo":"cargo","valor":"EJECUTIVO DE SERVICIOS"} ← FALTA OFICINA
✗ "ejecutivo de servicios de abancay" → {"filtros":[{"campo":"cargo","valor":"EJECUTIVO"},{"campo":"oficina","valor":"ABANCAY"}]} ← CARGO INCOMPLETO
✗ "coordinadores de operaciones" → {"campo":"cargo","valor":"COORDINADOR"} ← INCOMPLETO

Responde SOLO con el JSON válido (sin explicaciones o comentarios).`;
  }

  parseResponse(response, originalQuery) {
    try {
      // Limpiar respuesta
      const cleaned = response.trim();
      
      // Intentar parsear JSON
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          error: `No identifiqué qué buscas. Reformula: "${originalQuery}"`
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Si hay error en la respuesta del IA
      if (parsed.error) {
        return {
          error: parsed.error
        };
      }

      // Validar estructura (puede ser múltiple o simple)
      if (parsed.filtros && Array.isArray(parsed.filtros)) {
        // Formato múltiple: {filtros: [{campo, valor}, {campo, valor}]}
        const filtros = parsed.filtros.map(f => ({
          campo: (f.campo || '').toLowerCase().trim(),
          valor: (f.valor || '').toString().toUpperCase().trim()
        }));

        // Validar todos los campos
        for (const f of filtros) {
          if (!f.campo || !f.valor) {
            return { error: 'Respuesta inválida del intérprete' };
          }
          if (!this.validFields.includes(f.campo)) {
            return { error: `Campo no válido: ${f.campo}` };
          }
          // Normalizar nombre del campo a camelCase
          f.campo = this.fieldNormalization[f.campo];
        }

        return {
          filtros: filtros,
          query: originalQuery
        };
      } else if (parsed.campo && parsed.valor) {
        // Formato simple: {campo: "valor"}
        const campo = parsed.campo.toLowerCase().trim();
        const valor = parsed.valor.toString().toUpperCase().trim();

        if (!this.validFields.includes(campo)) {
          return {
            error: `Campo no válido: ${campo}`
          };
        }

        const campoNormalizado = this.fieldNormalization[campo];

        return {
          filtros: [{ campo: campoNormalizado, valor: valor }],
          query: originalQuery
        };
      } else {
        return {
          error: 'Respuesta inválida del intérprete'
        };
      }
    } catch (error) {
      return {
        error: `No pude procesar la búsqueda: ${error.message}`
      };
    }
  }

  /**
   * Para testing: simula respuesta sin OpenAI
   */
  async extractParams_mock(query) {
    // Mock data para testing
    const mocks = {
      'jefe de oficina juliaca': { campo: 'oficina', valor: 'OFICINA JULIACA TUPAC' },
      'coordinadores de puno sur': { campo: 'region', valor: 'PUNO SUR' },
      'ejecutivo de servicios eob': { campo: 'establecimiento', valor: 'EOB PANGOA' },
      'ruth torres': { campo: 'nombreCompleto', valor: 'RUTH TORRES' },
      'asesores de negocios': { campo: 'cargo', valor: 'ASESOR DE NEGOCIOS' }
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, value] of Object.entries(mocks)) {
      if (lowerQuery.includes(key)) {
        return { ...value, query };
      }
    }

    return {
      error: `No identifiqué qué buscas para: "${query}"`
    };
  }
}

module.exports = DirectorioParserService;
