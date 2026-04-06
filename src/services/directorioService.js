const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');
const DirectorioParserService = require('./directorioParserService');

/**
 * Servicio de búsqueda en el Directorio Telefónico Corporativo (SQLite-based)
 * 
 * CAMBIOS (Fase 4):
 * - Migración de JSON en memoria a base de datos SQLite
 * - Uso de OpenAI para interpretar búsquedas en lenguaje natural
 * - Resultados limitados a 3 registros (antes 5)
 * - Solo búsqueda con IA (removida búsqueda manual con formato "cargo:x")
 * 
 * Flujo:
 * 1. Usuario ingresa búsqueda natural: "Jefe de oficina Juliaca"
 * 2. DirectorioParserService (OpenAI) extrae: { campo: "oficina", valor: "OFICINA JULIACA TUPAC" }
 * 3. Construimos WHERE dinámico: WHERE oficina LIKE '%JULIACA%'
 * 4. Ejecutamos: SELECT TOP 3 FROM directorio WHERE ...
 * 5. Retornamos resultados
 */
class DirectorioService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/chatbot_metrics.db');
    this.parserService = null;
    this.initializeDB();
    this.initializeParser();
  }

  /**
   * Inicializa conexión a base de datos
   */
  initializeDB() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        logger.error(`[DirectorioService] Error conectando a BD: ${err.message}`);
      } else {
        logger.info('[DirectorioService] Conectado a BD SQLite');
        this.verifyTable();
      }
    });
  }

  /**
   * Inicializa el parser de OpenAI
   */
  initializeParser() {
    try {
      this.parserService = new DirectorioParserService();
      logger.info('[DirectorioService] DirectorioParserService inicializado');
    } catch (error) {
      logger.warning(`[DirectorioService] DirectorioParserService error (require OPENAI_API_KEY): ${error.message}`);
      this.parserService = null;
    }
  }

  /**
   * Normaliza acentos y caracteres especiales para búsquedas
   * Transforma: "Jaén" → "Jaen", "pérdida" → "perdida", "Perú" → "Peru"
   * @param {string} texto - Texto a normalizar
   * @returns {string} Texto normalizado sin acentos
   */
  normalizarAcentos(texto) {
    if (!texto) return texto;
    
    return texto
      .normalize('NFD')                    // Descomponer caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '')    // Remover marcas diacríticas
      .toUpperCase();                      // Convertir a mayúsculas
  }

  /**
   * Verifica que la tabla directorio exista
   */
  verifyTable() {
    if (!this.db) return;

    this.db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='directorio'",
      (err, row) => {
        if (err) {
          logger.error(`[DirectorioService] Error verificando tabla: ${err.message}`);
        } else if (row) {
          // Obtener cantidad de registros
          this.db.get('SELECT COUNT(*) as count FROM directorio', (err, countRow) => {
            if (!err) {
              logger.info(`[DirectorioService] Tabla 'directorio' OK - ${countRow.count} registros`);
            }
          });
        } else {
          logger.warning('[DirectorioService] Tabla "directorio" no existe');
        }
      }
    );
  }

  /**
   * Construye cláusula WHERE dinámica basada en parámetros extraídos
   * Soporta múltiples filtros combinados con AND
   * @param {Object} params - {filtros: [{campo, valor}]} or {campo, valor}
   * @returns {Object} {whereSql: "", params: []}
   */
  buildWhereClause(params) {
    if (!params || params.error) {
      return { whereSql: '', params: [] };
    }

    // Normalizar a formato de múltiples filtros
    let filtros = [];
    if (params.filtros && Array.isArray(params.filtros)) {
      filtros = params.filtros;
    } else if (params.campo && params.valor) {
      // Formato antiguo simple: convertir a nuevo formato
      filtros = [{ campo: params.campo, valor: params.valor }];
    } else {
      return { whereSql: '', params: [] };
    }

    if (filtros.length === 0) {
      return { whereSql: '', params: [] };
    }

    // Construir WHERE con múltiples condiciones AND
    const whereParts = [];
    const sqlParams = [];

    for (const filtro of filtros) {
      let { campo, valor } = filtro;
      
      // Normalizar acentos en el valor (remover tildes)
      valor = this.normalizarAcentos(valor);

      switch (campo) {
        case 'cargo':
          whereParts.push('cargo LIKE ?');
          sqlParams.push(`%${valor}%`);
          break;

        case 'region':
          whereParts.push('region = ?');
          sqlParams.push(valor);
          break;

        case 'oficina':
          whereParts.push('oficina LIKE ?');
          sqlParams.push(`%${valor}%`);
          break;

        case 'establecimiento':
          whereParts.push('establecimiento LIKE ?');
          sqlParams.push(`%${valor}%`);
          break;

        case 'nombreCompleto':
          // Para nombres, dividir en palabras y buscar todas
          const nombres = valor.split(/\s+/).filter(n => n.length > 0);
          if (nombres.length > 0) {
            const nombreParts = nombres.map(() => 'nombreCompleto LIKE ?');
            whereParts.push(`(${nombreParts.join(' AND ')})`);
            nombres.forEach(n => sqlParams.push(`%${n}%`));
          }
          break;
      }
    }

    if (whereParts.length === 0) {
      return { whereSql: '', params: [] };
    }

    const whereSql = `WHERE ${whereParts.join(' AND ')}`;
    return { whereSql, params: sqlParams };
  }

  /**
   * Busca en el directorio usando OpenAI para interpretar la búsqueda
   * @param {string} query - Búsqueda en lenguaje natural (ej: "Jefe de oficina Juliaca")
   * @returns {Promise} {resultados: [], totalEncontrados: number, error?: string}
   */
  async buscar(query) {
    if (!query || typeof query !== 'string') {
      return {
        resultados: [],
        totalEncontrados: 0,
        error: 'Criterio de búsqueda inválido'
      };
    }

    const termino = query.trim();
    if (termino === '') {
      return {
        resultados: [],
        totalEncontrados: 0,
        error: 'Por favor ingresa un criterio de búsqueda'
      };
    }

    // Verificar que parser esté disponible
    if (!this.parserService) {
      logger.error('[DirectorioService] DirectorioParserService no disponible');
      return {
        resultados: [],
        totalEncontrados: 0,
        error: 'Servicio de búsqueda no disponible. Configura OPENAI_API_KEY en .env'
      };
    }

    try {
      // 1. Usar OpenAI para extraer parámetros
      logger.info(`[DirectorioService] Procesando búsqueda: "${query}"`);
      const params = await this.parserService.extractParams(query);

      if (params.error) {
        logger.warning(`[DirectorioService] Parser error: ${params.error}`);
        return {
          resultados: [],
          totalEncontrados: 0,
          error: params.error
        };
      }

      // Log de parámetros extraídos
      let logFiltros = '';
      if (params.filtros) {
        logFiltros = params.filtros
          .map(f => `${f.campo}=${f.valor}`)
          .join(', ');
      }

      // 2. Construir cláusula WHERE
      const { whereSql, params: whereParams } = this.buildWhereClause(params);

      if (!whereSql) {
        return {
          resultados: [],
          totalEncontrados: 0,
          error: 'No se pudo procesar la búsqueda'
        };
      }

      // 3. Ejecutar consulta en BD (LIMIT 3)
      return new Promise((resolve) => {
        const sql = `
          SELECT id, nombreCompleto, telefono, cargo, oficina, region, establecimiento
          FROM directorio
          ${whereSql}
          LIMIT 3
        `;

        this.db.all(sql, whereParams, (err, rows) => {
          if (err) {
            logger.error(`[DirectorioService] Error en consulta: ${err.message}`);
            return resolve({
              resultados: [],
              totalEncontrados: 0,
              error: 'Error al procesar la búsqueda'
            });
          }

          const resultados = (rows || []).map((row, indice) => ({
            numero: indice + 1,
            nombreCompleto: row.nombreCompleto || '',
            telefono: this.formatearTelefono(row.telefono || ''),
            cargo: row.cargo || '',
            oficina: row.oficina || '',
            region: row.region || '',
            establecimiento: row.establecimiento || ''
          }));

          logger.info(
            `[DirectorioService] Búsqueda: "${query}" → ${resultados.length} resultados ` +
            `[Filtros: ${logFiltros}]`
          );

          resolve({
            resultados,
            totalEncontrados: resultados.length,
            error: null
          });
        });
      });
    } catch (error) {
      logger.error(`[DirectorioService] Error inesperado: ${error.message}`);
      return {
        resultados: [],
        totalEncontrados: 0,
        error: 'Error al procesar la búsqueda'
      };
    }
  }

  /**
   * Formatea teléfono para visualización
   * Ejemplo: 958315121 → 958 315 121
   * @param {string} telefono
   * @returns {string}
   */
  formatearTelefono(telefono) {
    if (!telefono || telefono.length < 9) {
      return telefono;
    }

    // Formato: XXX XXX XXX para números de 9 dígitos
    if (telefono.length === 9) {
      return `${telefono.substring(0, 3)} ${telefono.substring(3, 6)} ${telefono.substring(6)}`;
    }

    return telefono;
  }

  /**
   * Obtiene el total de registros en la BD
   */
  getTotalRegistros() {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0);
        return;
      }

      this.db.get('SELECT COUNT(*) as count FROM directorio', (err, row) => {
        if (err) {
          logger.error(`[DirectorioService] Error contando registros: ${err.message}`);
          resolve(0);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  /**
   * Valida si un teléfono está registrado en el directorio
   * Se usa en el webhook para bloquear números no autorizados
   * @param {string} phoneNumber - Número sin +51 (ej: "984444015")
   * @returns {Promise<boolean>} true si existe, false si no
   */
  async validarTelefonoEnDirectorio(phoneNumber) {
    return new Promise((resolve) => {
      if (!phoneNumber || phoneNumber.length < 9) {
        logger.warning(`[DirectorioService] Número inválido: ${phoneNumber}`);
        resolve(false);
        return;
      }

      const sql = "SELECT COUNT(*) as count FROM directorio WHERE telefono = ?";
      this.db.get(sql, [phoneNumber], (err, row) => {
        if (err) {
          logger.error(`[DirectorioService] Error validando teléfono: ${err.message}`);
          resolve(false); // Seguro: si hay error en BD, rechazar
        } else {
          const isValid = row && row.count > 0;
          if (!isValid) {
            logger.debug(`[DirectorioService] Teléfono no encontrado: ${phoneNumber}`);
          }
          resolve(isValid);
        }
      });
    });
  }

  /**
   * Cierra la conexión a la BD
   */
  cerrar() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error(`[DirectorioService] Error cerrando BD: ${err.message}`);
        } else {
          logger.info('[DirectorioService] Conexión BD cerrada');
        }
      });
    }
  }
}

module.exports = new DirectorioService();
