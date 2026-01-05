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
   * Busca en el directorio por criterio
   * @param {string} query - Texto a buscar
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
      // Buscar en los campos permitidos (SIN región)
      const coincidencias = this.directorio.filter(registro => {
        const nombreCompleto = (registro.nombreCompleto || '').toLowerCase();
        const telefono = (registro.telefono || '').toLowerCase();
        const cargo = (registro.cargo || '').toLowerCase();
        const oficina = (registro.oficina || '').toLowerCase();
        const establecimiento = (registro.establecimiento || '').toLowerCase();

        // Búsqueda parcial en cada campo (sin región)
        return (
          nombreCompleto.includes(termino) ||
          telefono.includes(termino) ||
          cargo.includes(termino) ||
          oficina.includes(termino) ||
          establecimiento.includes(termino)
        );
      });

      const totalEncontrados = coincidencias.length;
      const hayMas = totalEncontrados > 5;

      // Retornar máximo 5 resultados
      const resultados = coincidencias.slice(0, 5).map((registro, indice) => ({
        numero: indice + 1,
        nombreCompleto: registro.nombreCompleto,
        telefono: this.formatearTelefono(registro.telefono),
        cargo: registro.cargo,
        oficina: registro.oficina,
        region: registro.region || '',
        establecimiento: registro.establecimiento || ''
      }));

      logger.info(
        `[DirectorioService] Búsqueda: "${query}" → ${totalEncontrados} resultados ` +
        `(mostrando ${resultados.length}${hayMas ? ' de más' : ''})`
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
