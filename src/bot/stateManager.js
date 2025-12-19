/**
 * Gestor de estados del usuario en la conversación
 * Mantiene el contexto de cada usuario
 */

class StateManager {
  constructor() {
    // Almacena el estado de cada usuario por su número de teléfono
    this.userStates = new Map();
  }

  /**
   * Obtiene el estado del usuario
   * @param {string} userId - Número de teléfono del usuario
   * @returns {object} Estado actual del usuario
   */
  getState(userId) {
    if (!this.userStates.has(userId)) {
      this.initializeUser(userId);
    }
    return this.userStates.get(userId);
  }

  /**
   * Actualiza el estado del usuario
   * @param {string} userId - Número de teléfono del usuario
   * @param {object} newState - Nuevo estado a establecer
   */
  setState(userId, newState) {
    const currentState = this.getState(userId);
    this.userStates.set(userId, { ...currentState, ...newState });
  }

  /**
   * Inicializa el estado de un usuario
   * @param {string} userId - Número de teléfono del usuario
   */
  initializeUser(userId) {
    this.userStates.set(userId, {
      userId,
      state: 'menu',
      lastMessage: null,
      createdAt: new Date(),
      messagesCount: 0
    });
  }

  /**
   * Limpia el estado del usuario (después de cierto tiempo de inactividad)
   * @param {string} userId - Número de teléfono del usuario
   */
  clearState(userId) {
    this.userStates.delete(userId);
  }

  /**
   * Incrementa el contador de mensajes del usuario
   * @param {string} userId - Número de teléfono del usuario
   */
  incrementMessageCount(userId) {
    const state = this.getState(userId);
    state.messagesCount++;
  }

  /**
   * Verifica si el usuario existe
   * @param {string} userId - Número de teléfono del usuario
   * @returns {boolean} true si el usuario existe
   */
  userExists(userId) {
    return this.userStates.has(userId);
  }

  /**
   * Obtiene todas las sesiones activas (para debug)
   * @returns {array} Lista de sesiones activas
   */
  getActiveSessions() {
    return Array.from(this.userStates.values());
  }

  /**
   * Limpia sesiones inactivas (mayores a 1 hora)
   */
  cleanupInactiveSessions() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [userId, state] of this.userStates.entries()) {
      if (state.createdAt < oneHourAgo) {
        this.clearState(userId);
      }
    }
  }
}

// Crear una instancia única del gestor de estados
const stateManager = new StateManager();

// Ejecutar limpieza cada 30 minutos (solo en producción/desarrollo, no en tests)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    stateManager.cleanupInactiveSessions();
  }, 30 * 60 * 1000);
}

module.exports = stateManager;
