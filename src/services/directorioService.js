const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Servicio de búsqueda en el Directorio Telefónico Corporativo
 * Busca registros por teléfono, nombre, cargo, oficina o establecimiento
 */
class DirectorioService {
  constructor() {
    this.directorio = null;
    this.loadDirectorio();
  }

  /**
   * Carga el archivo directorio.json
   */
  loadDirectorio() {
    try {
      const filePath = path.join(__dirname, '../config/directorio.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.directorio = JSON.parse(data);
      logger.info(`[DirectorioService] ${this.directorio.length} registros cargados`);
    } catch (error) {
      logger.error(`[DirectorioService] Error al cargar directorio.json: ${error.message}`);
      this.directorio = [];
    }
  }

  /**
   * Palabras vacías a ignorar en búsquedas
   */
  getStopWords() {
    return new Set(['de', 'la', 'el', 'los', 'las', 'y', 'o', 'en', 'a', 'por', 'para', 'con', 'sin']);
  }

  /**
   * Extrae filtros de formato especial: "cargo:jefe oficina:puno"
   * @param {string} query
   * @returns {Object} {palabras: [], filtros: {}}
   */
  extraerFiltros(query) {
    const filtros = {};
    const palabras = [];
    const partes = query.toLowerCase().split(/\s+/);

    for (const parte of partes) {
      if (parte.includes(':')) {
        const [campo, valor] = parte.split(':');
        if (['cargo', 'oficina', 'establecimiento'].includes(campo)) {
          filtros[campo] = valor;
        }
      } else {
        palabras.push(parte);
      }
    }

    return { palabras, filtros };
  }

  /**
   * Calcula puntuación de relevancia para un registro
   * @param {Object} registro - Registro del directorio
   * @param {Array} palabras - Palabras a buscar
   * @param {Object} filtros - Filtros aplicados
   * @returns {number} Puntuación de relevancia
   */
  calcularPuntuacion(registro, palabras, filtros) {
    let puntuacion = 0;
    const nombreCompleto = (registro.nombreCompleto || '').toLowerCase();
    const cargo = (registro.cargo || '').toLowerCase();
    const oficina = (registro.oficina || '').toLowerCase();
    const establecimiento = (registro.establecimiento || '').toLowerCase();
    const telefono = (registro.telefono || '').toLowerCase();

    // 1. Verificar si cumple filtros (requisito obligatorio)
    for (const [campo, valor] of Object.entries(filtros)) {
      const fieldValue = (registro[campo] || '').toLowerCase();
      if (!fieldValue.includes(valor)) {
        return -1; // No cumple filtro, excluir
      }
      puntuacion += 50; // Bonificación por cumplir filtro
    }

    // 2. Puantuar coincidencias de palabras
    for (const palabra of palabras) {
      // Coincidencia exacta de nombre completo
      if (nombreCompleto === palabra) {
        puntuacion += 100;
      }
      // Nombre comienza con palabra
      else if (nombreCompleto.startsWith(palabra)) {
        puntuacion += 80;
      }
      // Nombre contiene palabra
      else if (nombreCompleto.includes(palabra)) {
        puntuacion += 60;
      }

      // Cargo coincide exacto
      if (cargo === palabra) {
        puntuacion += 70;
      }
      // Cargo contiene palabra
      else if (cargo.includes(palabra)) {
        puntuacion += 40;
      }

      // Oficina coincide exacto
      if (oficina === palabra) {
        puntuacion += 60;
      }
      // Oficina contiene palabra
      else if (oficina.includes(palabra)) {
        puntuacion += 30;
      }

      // Establecimiento contiene palabra
      if (establecimiento.includes(palabra)) {
        puntuacion += 20;
      }

      // Teléfono coincide
      if (telefono === palabra) {
        puntuacion += 50;
      }
    }

    return puntuacion;
  }

  /**
   * Busca en el directorio con Fase 1 mejorada
   * @param {string} query - Texto a buscar (ej: "alex juan" o "cargo:jefe oficina:puno")
   * @returns {Object} {resultados: [], totalEncontrados: number, hayMas: boolean}
   */
  buscar(query) {
    if (!query || typeof query !== 'string') {
      return {
        resultados: [],
        totalEncontrados: 0,
        hayMas: false,
        error: 'Criterio de búsqueda inválido'
      };
    }

    const termino = query.toLowerCase().trim();

    if (termino === '') {
      return {
        resultados: [],
        totalEncontrados: 0,
        hayMas: false,
        error: 'Por favor ingresa un criterio de búsqueda'
      };
    }

    try {
      // Extraer filtros especiales (ej: "cargo:jefe oficina:puno")
      const { palabras: palabrasBusqueda, filtros } = this.extraerFiltros(termino);
      const stopWords = this.getStopWords();

      // Limpiar palabras: remover stop words y palabras muy cortas
      const palabrasLimpias = palabrasBusqueda.filter(
        p => !stopWords.has(p) && p.length > 1
      );

      if (palabrasLimpias.length === 0 && Object.keys(filtros).length === 0) {
        return {
          resultados: [],
          totalEncontrados: 0,
          hayMas: false,
          error: 'Por favor ingreda criterios de búsqueda válidos'
        };
      }

      // Calcular puntuación para cada registro
      const registrosConPuntuacion = this.directorio
        .map(registro => ({
          registro,
          puntuacion: this.calcularPuntuacion(registro, palabrasLimpias, filtros)
        }))
        .filter(item => item.puntuacion >= 0) // Excluir registros que no cumplan filtros
        .sort((a, b) => b.puntuacion - a.puntuacion); // Ordenar por relevancia

      const totalEncontrados = registrosConPuntuacion.length;
      const hayMas = totalEncontrados > 5;

      // Retornar máximo 5 resultados ordenados por relevancia
      const resultados = registrosConPuntuacion.slice(0, 5).map((item, indice) => ({
        numero: indice + 1,
        nombreCompleto: item.registro.nombreCompleto,
        telefono: this.formatearTelefono(item.registro.telefono),
        cargo: item.registro.cargo,
        oficina: item.registro.oficina,
        region: item.registro.region || '',
        establecimiento: item.registro.establecimiento || '',
        relevancia: Math.round(item.puntuacion) // Para debugging
      }));

      logger.info(
        `[DirectorioService] Búsqueda: "${query}" → ${totalEncontrados} resultados ` +
        `(mostrando ${resultados.length}${hayMas ? ' de más' : ''})` +
        (Object.keys(filtros).length > 0 ? ` [Filtros: ${JSON.stringify(filtros)}]` : '')
      );

      return {
        resultados,
        totalEncontrados,
        hayMas,
        error: null
      };
    } catch (error) {
      logger.error(`[DirectorioService] Error en búsqueda: ${error.message}`);
      return {
        resultados: [],
        totalEncontrados: 0,
        hayMas: false,
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
   * Obtiene el total de registros en el directorio
   * @returns {number}
   */
  getTotalRegistros() {
    return this.directorio.length;
  }

  /**
   * Recarga el directorio (útil para actualizaciones)
   */
  recargar() {
    this.loadDirectorio();
  }
}

module.exports = new DirectorioService();
