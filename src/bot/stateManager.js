/**
 * Gestor de estados del usuario en la conversación
 * Mantiene el contexto de cada usuario
 */

class StateManager {
  constructor() {
    this.userStates = new Map();
  }

  getState(userId) {
    if (!this.userStates.has(userId)) {
      this.initializeUser(userId);
    }
    return this.userStates.get(userId);
  }

  setState(userId, newState) {
    const currentState = this.getState(userId);
    this.userStates.set(userId, { ...currentState, ...newState });
  }

  initializeUser(userId) {
    this.userStates.set(userId, {
      userId,
      state: 'menu',
      mode: null, // 'chatbot_ia', 'consulta_ia', null
      context: {},
      lastMessage: null,
      createdAt: new Date(),
      messagesCount: 0
    });
  }

  clearState(userId) {
    this.userStates.delete(userId);
  }

  incrementMessageCount(userId) {
    const state = this.getState(userId);
    state.messagesCount++;
  }

  userExists(userId) {
    return this.userStates.has(userId);
  }

  getActiveSessions() {
    return Array.from(this.userStates.values());
  }

  // NUEVOS MÉTODOS
  setMode(userId, mode, context = {}) {
    const state = this.getState(userId);
    state.mode = mode;
    state.context = { ...state.context, ...context };
    this.setState(userId, state);
  }

  clearMode(userId) {
    const state = this.getState(userId);
    state.mode = null;
    state.context = {};
    this.setState(userId, state);
  }

  getMode(userId) {
    const state = this.getState(userId);
    return state.mode;
  }

  getContext(userId) {
    const state = this.getState(userId);
    return state.context || {};
  }

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

const stateManager = new StateManager();

if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    stateManager.cleanupInactiveSessions();
  }, 30 * 60 * 1000);
}

module.exports = stateManager;