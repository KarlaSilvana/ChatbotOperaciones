/**
 * Session Scheduler
 * Detecta y notifica automáticamente cuando sesiones expiran
 * Se ejecuta cada 1 minuto para chequear sesiones inactivas
 */

const logger = require('../utils/logger');
const sessionConfig = require('../config/sessionConfig');
const messages = require('../config/messages');

class SessionScheduler {
  constructor() {
    this.intervalId = null;
    this.twilio_client = null;
    this.navigationManager = null;
    // Track sesiones ya notificadas para no enviar múltiples mensajes
    this.notifiedSessions = new Set();
  }

  /**
   * Inicializa el scheduler
   * @param {object} twilio_client - Cliente de Twilio
   * @param {object} navigationManager - Gestor de navegación
   */
  init(twilio_client, navigationManager) {
    this.twilio_client = twilio_client;
    this.navigationManager = navigationManager;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Ejecutar cada 1 minuto (60000ms)
    this.intervalId = setInterval(() => {
      this.checkExpiredSessions();
    }, 60000);

    logger.info('⏱️ Session Scheduler iniciado - Chequea sesiones cada 1 minuto');
  }

  /**
   * Chequea todas las sesiones y notifica si expiraron
   */
  async checkExpiredSessions() {
    try {
      const userStates = this.navigationManager.userStates;

      if (userStates.size === 0) {
        return; // Sin usuarios activos
      }

      for (const [userId, state] of userStates.entries()) {
        // Ya fue notificado en este ciclo
        if (this.notifiedSessions.has(userId)) {
          continue;
        }

        // Chequear si sesión expiró
        if (this.navigationManager.isSessionExpired(userId)) {
          await this.notifyExpiredSession(userId);
        }
      }
    } catch (error) {
      logger.error('Error en checkExpiredSessions:', error);
    }
  }

  /**
   * Envía notificación de sesión expirada al usuario
   * @param {string} userId - ID del usuario (número de teléfono)
   */
  async notifyExpiredSession(userId) {
    try {
      // Marcar como notificado en este ciclo
      this.notifiedSessions.add(userId);

      // Marcar sesión como expirada en el gestor
      const state = this.navigationManager.getUserState(userId);
      if (state) {
        state.sessionExpired = true;
        state.notifiedOfExpiration = true; // Flag para saber que ya enviamos notificación
      }

      // Enviar mensaje automático
      // El formato debe ser consistente: si from es whatsapp:+xxx, to debe ser whatsapp:+xxx también
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const toNumber = userId.startsWith('whatsapp:') ? userId : `whatsapp:${userId}`;

      const resultado = await this.twilio_client.messages.create({
        from: fromNumber,
        to: toNumber,
        body: messages.SESSION_EXPIRED
      });

      logger.info(`⏰ Notificación automática de expiración enviada a ${userId}`);
      return resultado;
    } catch (error) {
      logger.error(`Error enviando notificación de expiración a ${userId}:`, error);
    }
  }

  /**
   * Limpia la lista de sesiones notificadas (para próximo ciclo)
   * Llamado cuando inicia un nuevo ciclo de chequeo
   */
  resetNotifiedSessions() {
    // Se resetea cada ciclo para permitir nueva notificación si la sesión sigue expirada
    // Por ahora, lo dejamos acumular para evitar spam. 
    // En producción, podrías hacer: this.notifiedSessions.clear() en ciertos intervalos
  }

  /**
   * Detiene el scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('⏹️ Session Scheduler detenido');
    }
  }
}

// Singleton
const scheduler = new SessionScheduler();

module.exports = scheduler;
