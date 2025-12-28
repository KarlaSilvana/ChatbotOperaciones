/**
 * Enrutador de mensajes
 * Procesa mensajes usando navigationManager para navegación dinámica
 */

const navigationManager = require('./navigationManager');
const logger = require('../utils/logger');

/**
 * Procesa un mensaje del usuario y retorna la respuesta apropiada
 * @param {string} userId - ID del usuario (número de teléfono)
 * @param {string} mensaje - Mensaje del usuario
 * @returns {object} Respuesta a enviar al usuario
 */
async function procesarMensaje(userId, mensaje) {
  try {
    // Inicializar usuario si no existe
    navigationManager.initUser(userId);
    
    // Normalizar el mensaje
    const mensajeNormalizado = mensaje.toLowerCase().trim();

    // Comando para volver al menú principal
    if (mensajeNormalizado === 'menu' || mensajeNormalizado === 'menú') {
      const menu = navigationManager.reset(userId);
      return {
        text: menu.text,
        action: 'navigate'
      };
    }

    // Procesar la opción seleccionada
    const resultado = navigationManager.processOption(userId, mensajeNormalizado);

    // Retornar resultado con formato compatible
    if (resultado.action === 'navigate' && resultado.menu) {
      return {
        text: resultado.menu.text,
        action: 'navigate',
        procedimientoId: resultado.menu.procedimientoId
      };
    }

    if (resultado.action === 'send_video') {
      return {
        text: 'Preparando video...',
        action: 'send_video',
        procedimientoId: resultado.procedimientoId
      };
    }

    if (resultado.action === 'send_documento') {
      return {
        text: 'Preparando documento...',
        action: 'send_documento',
        procedimientoId: resultado.procedimientoId
      };
    }

    if (resultado.action === 'start_ia') {
      return {
        text: resultado.message,
        action: 'start_ia'
      };
    }

    if (resultado.action === 'start_consulta_ia') {
      return {
        text: resultado.message,
        action: 'start_consulta_ia',
        procedimientoId: resultado.procedimientoId
      };
    }

    if (resultado.action === 'invalid') {
      const currentMenu = navigationManager.getCurrentMenu(userId);
      return {
        text: resultado.message + '\n\n' + currentMenu.text,
        action: 'invalid'
      };
    }

    if (resultado.action === 'info') {
      return {
        text: resultado.message,
        action: 'info'
      };
    }

    // Fallback
    const menu = navigationManager.getCurrentMenu(userId);
    return {
      text: menu.text,
      action: 'navigate'
    };

  } catch (error) {
    logger.error('Error en procesarMensaje:', error);
    return {
      text: '❌ Ocurrió un error procesando tu mensaje. Por favor intenta nuevamente.',
      action: 'error'
    };
  }
}

module.exports = {
  procesarMensaje
};
