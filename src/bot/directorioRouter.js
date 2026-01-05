const logger = require('../utils/logger');

/**
 * Router para gestionar el flujo del Directorio Telefónico
 * Administra los estados: menú principal → búsqueda → resultados → reintentos
 */
class DirectorioRouter {
  /**
   * Obtiene el mensaje de bienvenida del directorio
   * @returns {string}
   */
  static getMenuMessage() {
    return (
      '📞 DIRECTORIO TELEFÓNICO CORPORATIVO\n' +
      '👤 escribe el nombre, cargo u oficina de la persona\n' +
      'para consultar su número corporativo. ✨\n' +
      '\n' +
      '🔙 0. Volver al Menú Principal 🏠'
    );
  }

  /**
   * Formatea mensaje cuando no hay resultados
   * @returns {string}
   */
  static getNoResultsMessage() {
    return (
      '❌ No se encontraron resultados\n' +
      'El número, nombre, cargo u oficina ingresados no existen en el directorio.\n' +
      '\n' +
      '🔍 Puedes intentar con otro criterio de búsqueda\n' +
      '🔙 0. Volver al Menú Principal 🏠'
    );
  }

  /**
   * Obtiene el mensaje de continuación después de resultados
   * @param {boolean} hayMas - Si hay más de 5 resultados
   * @returns {string}
   */
  static getContinueSearchMessage(hayMas = false) {
    let mensaje = '🔍 ¿Deseas continuar con la búsqueda en el directorio?\n';

    if (hayMas) {
      mensaje = 'ℹ️ Hay más resultados. Proporciona más contexto para refinar la búsqueda\n\n' + mensaje;
    }

    mensaje += '🔙 0. Volver al Menú Principal 🏠';

    return mensaje;
  }

  /**
   * Determina la acción según el input del usuario
   * @param {string} userInput - Input del usuario
   * @param {Object} userContext - Contexto del usuario (sesión)
   * @returns {Object} {action: string, nextState?: string}
   */
  static routeInput(userInput, userContext = {}) {
    const input = (userInput || '').trim().toLowerCase();

    // Opción 0: Volver al menú principal
    if (input === '0') {
      logger.info('[DirectorioRouter] Usuario selecciona volver al menú principal');
      return {
        action: 'exit_directorio',
        nextState: 'menu'
      };
    }

    // Input vacío
    if (input === '') {
      logger.info('[DirectorioRouter] Input vacío en directorio');
      return {
        action: 'directorio_search',
        query: input,
        nextState: 'searching'
      };
    }

    // Búsqueda normal
    logger.info(`[DirectorioRouter] Búsqueda iniciada: "${userInput}"`);
    return {
      action: 'directorio_search',
      query: userInput,
      nextState: 'searching'
    };
  }

  /**
   * Validar si el usuario está en modo directorio
   * @param {Object} userContext - Contexto del usuario
   * @returns {boolean}
   */
  static isInDirectorioMode(userContext = {}) {
    return !!(userContext && userContext.currentMenu === 'directorio');
  }

  /**
   * Obtiene el estado actual del directorio
   * @param {Object} userContext - Contexto del usuario
   * @returns {string} Estado actual ('menu', 'searching', 'results')
   */
  static getCurrentState(userContext = {}) {
    return userContext && userContext.directorioState ? userContext.directorioState : 'menu';
  }

  /**
   * Actualiza el estado del directorio
   * @param {Object} userContext - Contexto del usuario
   * @param {string} newState - Nuevo estado
   * @returns {Object} Contexto actualizado
   */
  static updateState(userContext = {}, newState) {
    return {
      ...userContext,
      directorioState: newState
    };
  }
}

module.exports = DirectorioRouter;
