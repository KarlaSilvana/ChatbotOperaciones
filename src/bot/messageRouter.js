/**
 * Enrutador de mensajes
 * Procesa mensajes usando navigationManager para navegación dinámica
 */

const navigationManager = require('./navigationManager');
const logger = require('../utils/logger');
const messages = require('../config/messages');

/**
 * Procesa un mensaje del usuario y retorna la respuesta apropiada
 * @param {string} userId - ID del usuario (número de teléfono)
 * @param {string} mensaje - Mensaje del usuario
 * @returns {object} Respuesta a enviar al usuario
 */
async function procesarMensaje(userId, mensaje) {
  try {
    // Primero, obtener el estado actual del usuario (sin reinicializar)
    let userState = navigationManager.getUserState(userId);
    
    // Si el usuario NO existe, inicializarlo (es su primer mensaje)
    if (!userState) {
      navigationManager.initUser(userId);
      userState = navigationManager.getUserState(userId);
    } else {
      // El usuario existe, verificar si la sesión expiró
      const sessionHasExpired = navigationManager.isSessionExpired(userId);
      
      if (sessionHasExpired) {
        // La sesión expiró
        const expiredMessage = messages.SESSION_EXPIRED;
        
        // Reinicializar la sesión para que esté lista
        navigationManager.initUser(userId);
        
        return {
          text: expiredMessage,
          action: 'session_expired'
        };
      }
      
      // Actualizar lastActivity si NO ha expirado
      // Asegurarse de guardar cambios al estado
      const currentState = navigationManager.getUserState(userId);
      currentState.lastActivity = Date.now();
      navigationManager.userStates.set(userId, currentState);
    }

    // ⭐ NUEVO: Detectar si usuario está en modo IA
    const modoIA = navigationManager.getIAMode(userId);
    
    // Detectar si usuario está en modo directorio
    const modoDirectorio = navigationManager.isInDirectorioMode(userId);
    
    // Normalizar el mensaje
    const mensajeNormalizado = mensaje.toLowerCase().trim();
    
    if (modoIA) {
      // Verificar si usuario quiere salir del modo IA (0)
      if (mensajeNormalizado === '0') {
        navigationManager.exitIAMode(userId);
        const menu = navigationManager.getCurrentMenu(userId);
        return {
          text: '👋 Saliste del modo consulta.\n\n' + menu.text,
          action: 'navigate'
        };
      }
      
      // Usuario está en modo IA - retornar acción para que app.js llame a RAG
      return {
        text: mensaje,
        action: 'chat_ia_response',
        modoIA: modoIA,
        context: navigationManager.getIAContext(userId)
      };
    }

    if (modoDirectorio) {
      // Verificar si usuario quiere salir del directorio (0)
      if (mensajeNormalizado === '0') {
        navigationManager.exitDirectorio(userId);
        const menu = navigationManager.getCurrentMenu(userId);
        return {
          text: '👋 Saliste del directorio.\n\n' + menu.text,
          action: 'navigate'
        };
      }

      // Usuario está en modo directorio - procesar búsqueda
      return {
        text: mensaje,
        action: 'directorio_search',
        query: mensaje
      };
    }

    // ⭐ NUEVO: Detectar si usuario está en modo directorio
    const enDirectorio = navigationManager.isInDirectorioMode(userId);

    if (enDirectorio) {
      // Verificar si usuario quiere salir del directorio (0)
      if (mensajeNormalizado === '0') {
        navigationManager.exitDirectorio(userId);
        const menu = navigationManager.getCurrentMenu(userId);
        return {
          text: menu.text,
          action: 'navigate'
        };
      }

      // Usuario está en modo directorio - retornar acción para búsqueda
      navigationManager.incrementDirectorioSearches(userId);
      return {
        text: mensaje,
        action: 'directorio_search',
        query: mensaje
      };
    }
    
    // Obtener si es primer mensaje del usuario
    const isFirstMessage = navigationManager.getAndClearNewSessionFlag(userId);

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
      // Opción 1 - Chat IA General (sin contexto de procedimiento)
      navigationManager.startChatIA(userId);
      return {
        text: resultado.message,
        action: 'navigate'
      };
    }

    if (resultado.action === 'start_consulta_ia') {
      // Opción 3 - Consulta IA sobre procedimiento (con contexto)
      navigationManager.startConsultaIA(userId, resultado.procedimientoId, resultado.procedimientoNombre);
      return {
        text: resultado.message,
        action: 'navigate'
      };
    }

    if (resultado.action === 'invalid') {
      const currentMenu = navigationManager.getCurrentMenu(userId);
      
      // Si es el primer mensaje, NO mostrar error, solo mostrar menú
      if (isFirstMessage) {
        return {
          text: currentMenu.text,
          action: 'navigate'
        };
      }
      
      // Si no es primer mensaje, mostrar error + menú
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
      text: messages.ERROR_PROCESSING_MESSAGE,
      action: 'error'
    };
  }
}

module.exports = {
  procesarMensaje
};
