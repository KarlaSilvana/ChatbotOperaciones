/**
 * Enrutador de mensajes
 * Decide si la pregunta es genérica (1-4) o requiere la API (5)
 */

const { obtenerRespuestaGenerica, obtenerMenuPrincipal } = require('./menus');
const stateManager = require('./stateManager');

/**
 * Procesa un mensaje del usuario y retorna la respuesta apropiada
 * @param {string} userId - ID del usuario (número de teléfono)
 * @param {string} mensaje - Mensaje del usuario
 * @returns {object} Respuesta a enviar al usuario
 */
async function procesarMensaje(userId, mensaje) {
  // Obtener estado actual del usuario
  const userState = stateManager.getState(userId);
  
  // Incrementar contador de mensajes
  stateManager.incrementMessageCount(userId);
  
  // Normalizar el mensaje
  const mensajeNormalizado = mensaje.toLowerCase().trim();

  // Comando para volver al menú
  if (mensajeNormalizado === 'menu' || mensajeNormalizado === 'menú') {
    stateManager.setState(userId, { state: 'menu', lastMessage: mensaje });
    return obtenerMenuPrincipal();
  }

  // Si el usuario está en estado de menú
  if (userState.state === 'menu' || !userState.state) {
    // Verificar si es una opción válida (1-4: genérica, 5: API)
    if (mensajeNormalizado === '1' || mensajeNormalizado === '2' || 
        mensajeNormalizado === '3' || mensajeNormalizado === '4') {
      
      // Es una pregunta genérica
      stateManager.setState(userId, { 
        state: 'generico',
        lastMessage: mensaje 
      });
      
      const respuesta = obtenerRespuestaGenerica(mensajeNormalizado);
      return respuesta || obtenerMenuPrincipal();
    }
    
    // Si es opción 5 o pregunta libre, prepararía para API
    if (mensajeNormalizado === '5') {
      stateManager.setState(userId, { 
        state: 'chatbot',
        lastMessage: mensaje 
      });
      
      return {
        text: `💬 *Conectando con nuestro asistente IA...*

_Un momento por favor, estamos procesando tu pregunta._`,
        nextState: 'chatbot'
      };
    }
    
    // Si no es una opción reconocida, mostrar menú nuevamente
    stateManager.setState(userId, { state: 'menu' });
    return obtenerMenuPrincipal();
  }

  // Si viene del menú genérico, volver al menú
  if (userState.state === 'generico') {
    stateManager.setState(userId, { state: 'menu' });
    return obtenerMenuPrincipal();
  }

  // Fallback: mostrar menú
  stateManager.setState(userId, { state: 'menu' });
  return obtenerMenuPrincipal();
}

module.exports = {
  procesarMensaje
};
