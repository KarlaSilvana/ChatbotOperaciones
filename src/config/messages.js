/**
 * Mensajes del Sistema
 * Centraliza todos los mensajes para fácil mantenimiento e i18n
 */

require('dotenv').config();
const sessionConfig = require('./sessionConfig');

const messages = {
  // Mensaje cuando la sesión expira
  SESSION_EXPIRED: `⏰ *Tu sesión ha expirado*

Has estado inactivo por ${sessionConfig.timeoutMinutes} minutos. La sesión se ha cerrado.`,

  // Mensaje de opción no válida
  INVALID_OPTION: '❌ Opción no válida. Por favor selecciona una opción del menú.',
  
  // Mensaje de error genérico
  ERROR_PROCESSING_MESSAGE: '❌ Ocurrió un error procesando tu mensaje. Por favor intenta nuevamente.',
  
  // Mensajes de preparación (multimedia)
  PREPARING_VIDEO: 'Preparando video...',
  PREPARING_DOCUMENT: 'Preparando documento...',
  
  // Mensajes del menú (importados dinámicamente desde menus.js)
  // Estos se cargan desde src/bot/menus.js
};

module.exports = messages;
