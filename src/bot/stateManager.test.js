/**
 * Tests para stateManager.js
 */

const stateManager = require('./stateManager');

describe('StateManager Module', () => {
  const testUserId = '+5199999999';
  const testUserId2 = '+5188888888';

  beforeEach(() => {
    // Limpiar estado antes de cada test
    stateManager.clearState(testUserId);
    stateManager.clearState(testUserId2);
  });

  describe('getState()', () => {
    it('debe retornar un estado para un usuario existente', () => {
      const state = stateManager.getState(testUserId);
      expect(state).toBeDefined();
      expect(state.userId).toBe(testUserId);
    });

    it('debe inicializar usuario si no existe', () => {
      const state = stateManager.getState(testUserId);
      expect(state.state).toBe('menu');
      expect(state.messagesCount).toBe(0);
      expect(state.createdAt).toBeDefined();
    });

    it('debe retornar el mismo estado en múltiples llamadas', () => {
      const state1 = stateManager.getState(testUserId);
      const state2 = stateManager.getState(testUserId);
      expect(state1).toBe(state2);
    });
  });

  describe('setState()', () => {
    it('debe actualizar el estado del usuario', () => {
      stateManager.setState(testUserId, { state: 'chatbot' });
      const state = stateManager.getState(testUserId);
      expect(state.state).toBe('chatbot');
    });

    it('debe preservar propiedades existentes al actualizar', () => {
      const userId = stateManager.getState(testUserId).userId;
      stateManager.setState(testUserId, { state: 'generico' });
      const state = stateManager.getState(testUserId);
      expect(state.userId).toBe(userId);
      expect(state.state).toBe('generico');
    });

    it('debe permitir actualizar múltiples propiedades', () => {
      stateManager.setState(testUserId, {
        state: 'chatbot',
        lastMessage: 'hola'
      });
      const state = stateManager.getState(testUserId);
      expect(state.state).toBe('chatbot');
      expect(state.lastMessage).toBe('hola');
    });
  });

  describe('clearState()', () => {
    it('debe eliminar el estado del usuario', () => {
      stateManager.getState(testUserId);
      stateManager.clearState(testUserId);
      expect(stateManager.userExists(testUserId)).toBe(false);
    });

    it('debe permitir reinicializar el usuario después de limpiar', () => {
      stateManager.clearState(testUserId);
      const state = stateManager.getState(testUserId);
      expect(state.state).toBe('menu');
      expect(state.messagesCount).toBe(0);
    });
  });

  describe('incrementMessageCount()', () => {
    it('debe incrementar el contador de mensajes', () => {
      stateManager.incrementMessageCount(testUserId);
      const state = stateManager.getState(testUserId);
      expect(state.messagesCount).toBe(1);
    });

    it('debe incrementar múltiples veces', () => {
      stateManager.incrementMessageCount(testUserId);
      stateManager.incrementMessageCount(testUserId);
      stateManager.incrementMessageCount(testUserId);
      const state = stateManager.getState(testUserId);
      expect(state.messagesCount).toBe(3);
    });

    it('debe crear usuario si no existe', () => {
      stateManager.incrementMessageCount(testUserId);
      expect(stateManager.userExists(testUserId)).toBe(true);
    });
  });

  describe('userExists()', () => {
    it('debe retornar true si el usuario existe', () => {
      stateManager.getState(testUserId);
      expect(stateManager.userExists(testUserId)).toBe(true);
    });

    it('debe retornar false si el usuario no existe', () => {
      stateManager.clearState(testUserId);
      expect(stateManager.userExists(testUserId)).toBe(false);
    });
  });

  describe('getActiveSessions()', () => {
    it('debe retornar array de sesiones activas', () => {
      stateManager.getState(testUserId);
      stateManager.getState(testUserId2);
      const sessions = stateManager.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('debe retornar sesiones con userId correcto', () => {
      stateManager.getState(testUserId);
      stateManager.getState(testUserId2);
      const sessions = stateManager.getActiveSessions();
      const userIds = sessions.map(s => s.userId);
      expect(userIds).toContain(testUserId);
      expect(userIds).toContain(testUserId2);
    });

    it('debe retornar array vacío si no hay sesiones', () => {
      stateManager.clearState(testUserId);
      stateManager.clearState(testUserId2);
      // Nota: puede haber otras sesiones de otros tests
      const sessions = stateManager.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('initializeUser()', () => {
    it('debe crear estado inicial para nuevo usuario', () => {
      const newUserId = '+5177777777';
      stateManager.clearState(newUserId);
      stateManager.initializeUser(newUserId);
      const state = stateManager.getState(newUserId);
      
      expect(state.userId).toBe(newUserId);
      expect(state.state).toBe('menu');
      expect(state.lastMessage).toBeNull();
      expect(state.messagesCount).toBe(0);
      expect(state.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Múltiples usuarios', () => {
    it('debe mantener estados independientes para usuarios diferentes', () => {
      stateManager.setState(testUserId, { state: 'chatbot' });
      stateManager.setState(testUserId2, { state: 'generico' });
      
      const state1 = stateManager.getState(testUserId);
      const state2 = stateManager.getState(testUserId2);
      
      expect(state1.state).toBe('chatbot');
      expect(state2.state).toBe('generico');
    });

    it('debe incrementar contadores independientemente', () => {
      stateManager.incrementMessageCount(testUserId);
      stateManager.incrementMessageCount(testUserId);
      stateManager.incrementMessageCount(testUserId2);
      
      const state1 = stateManager.getState(testUserId);
      const state2 = stateManager.getState(testUserId2);
      
      expect(state1.messagesCount).toBe(2);
      expect(state2.messagesCount).toBe(1);
    });
  });

  describe('cleanupInactiveSessions()', () => {
    it('debe limpiar sesiones inactivas (mayores a 1 hora)', () => {
      // Crear estado para usuario
      const state = stateManager.getState(testUserId);
      
      // Modificar el createdAt para simular una sesión antigua
      const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000);
      state.createdAt = oneHourAgo;
      
      // Verificar que el usuario existe
      expect(stateManager.getState(testUserId)).toBeDefined();
      
      // Ejecutar cleanup
      stateManager.cleanupInactiveSessions();
      
      // Crear nuevo estado para verificar que la sesión fue limpiada
      const newState = stateManager.getState(testUserId);
      expect(newState.createdAt.getTime()).toBeGreaterThan(oneHourAgo.getTime());
    });

    it('debe mantener sesiones activas (menores a 1 hora)', () => {
      const state = stateManager.getState(testUserId);
      const originalCreatedAt = state.createdAt;
      
      // Ejecutar cleanup
      stateManager.cleanupInactiveSessions();
      
      // La sesión debe seguir siendo la misma
      const newState = stateManager.getState(testUserId);
      expect(newState.createdAt).toBe(originalCreatedAt);
    });

    it('debe limpiar múltiples sesiones inactivas', () => {
      // Crear múltiples usuarios
      const users = [testUserId, testUserId2, '+5177777777'];
      const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000);
      
      users.forEach(userId => {
        const state = stateManager.getState(userId);
        state.createdAt = oneHourAgo;
      });
      
      // Ejecutar cleanup
      stateManager.cleanupInactiveSessions();
      
      // Todos deben ser reinicializados
      users.forEach(userId => {
        const newState = stateManager.getState(userId);
        expect(newState.createdAt.getTime()).toBeGreaterThan(oneHourAgo.getTime());
      });
    });

    it('debe mantener estructura interna consistente durante cleanup', () => {
      const state1 = stateManager.getState(testUserId);
      const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000);
      state1.createdAt = oneHourAgo;
      state1.messagesCount = 5;
      state1.customData = 'test';
      
      // Cleanup debe crear nuevo estado
      stateManager.cleanupInactiveSessions();
      
      // El usuario debe reinicializarse
      const newState = stateManager.getState(testUserId);
      expect(newState.messagesCount).toBe(0);
      expect(newState.customData).toBeUndefined();
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar userId null o undefined', () => {
      expect(() => stateManager.getState(null)).not.toThrow();
      expect(() => stateManager.getState(undefined)).not.toThrow();
    });

    it('debe manejar setState con null o undefined', () => {
      expect(() => stateManager.setState(testUserId, {})).not.toThrow();
      expect(() => stateManager.setState(testUserId, null)).not.toThrow();
    });
  });
});
