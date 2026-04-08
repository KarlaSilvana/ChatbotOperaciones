/**
 * Tests para Activity Tracking y Session Management
 * Valida que lastActivity se actualiza en TODOS los flujos del chatbot
 */

const navigationManager = require('../../src/bot/navigationManager');

describe('Activity Tracking - Session Management', () => {
  
  const testUserId = 'test-activity-user-123';
  
  beforeEach(() => {
    navigationManager.userStates.delete(testUserId);
  });

  describe('updateUserActivity() - Método centralizado', () => {
    it('debe existir el método updateUserActivity', () => {
      expect(typeof navigationManager.updateUserActivity).toBe('function');
    });

    it('debe actualizar lastActivity cuando se llama', () => {
      navigationManager.initUser(testUserId);
      const stateBefore = navigationManager.getUserState(testUserId);
      const timeBefore = stateBefore.lastActivity;
      
      // Esperar un poco para asegurar que el timestamp cambió
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Pequeña pausa
      }
      
      navigationManager.updateUserActivity(testUserId);
      const stateAfter = navigationManager.getUserState(testUserId);
      const timeAfter = stateAfter.lastActivity;
      
      expect(timeAfter).toBeGreaterThan(timeBefore);
    });

    it('debe retornar true cuando se actualiza correctamente', () => {
      navigationManager.initUser(testUserId);
      const result = navigationManager.updateUserActivity(testUserId);
      expect(result).toBe(true);
    });

    it('debe retornar false si el usuario no existe', () => {
      const result = navigationManager.updateUserActivity('usuario-inexistente');
      expect(result).toBe(false);
    });

    it('debe mantener otros datos del usuario intactos', () => {
      navigationManager.initUser(testUserId);
      navigationManager.startChatIA(testUserId);
      
      const stateBefore = navigationManager.getUserState(testUserId);
      const modoIABefore = stateBefore.context.modoIA;
      
      navigationManager.updateUserActivity(testUserId);
      
      const stateAfter = navigationManager.getUserState(testUserId);
      const modoIAAfter = stateAfter.context.modoIA;
      
      expect(modoIAAfter).toBe(modoIABefore);
      expect(modoIAAfter).toBe('chat');
    });
  });

  describe('Actividad en diferentes flujos', () => {
    it('debe poder actualizarse múltiples veces', () => {
      navigationManager.initUser(testUserId);
      
      const times = [];
      for (let i = 0; i < 5; i++) {
        navigationManager.updateUserActivity(testUserId);
        times.push(navigationManager.getUserState(testUserId).lastActivity);
        
        // Pausa para diferenciar timestamps
        const start = Date.now();
        while (Date.now() - start < 5) {}
      }
      
      // Cada timestamp debe ser mayor que el anterior
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });

    it('debe prevenir expiración cuando se actualiza regularmente', () => {
      navigationManager.initUser(testUserId);
      let isExpired = navigationManager.isSessionExpired(testUserId);
      expect(isExpired).toBe(false);
      
      // Simular varias actividades
      for (let i = 0; i < 10; i++) {
        navigationManager.updateUserActivity(testUserId);
        isExpired = navigationManager.isSessionExpired(testUserId);
        expect(isExpired).toBe(false);
      }
    });

    it('debe registrar actividad en modo IA', () => {
      navigationManager.initUser(testUserId);
      const timeBeforeIA = navigationManager.getUserState(testUserId).lastActivity;
      
      // Simular entrada a modo IA y actualización
      navigationManager.startChatIA(testUserId);
      navigationManager.updateUserActivity(testUserId);
      
      const timeAfterIA = navigationManager.getUserState(testUserId).lastActivity;
      expect(timeAfterIA).toBeGreaterThanOrEqual(timeBeforeIA);
      expect(navigationManager.getIAMode(testUserId)).toBe('chat');
    });

    it('debe registrar actividad en modo directorio', () => {
      navigationManager.initUser(testUserId);
      const timeBeforeDir = navigationManager.getUserState(testUserId).lastActivity;
      
      // Simular entrada a directorio y actualización
      navigationManager.startDirectorio(testUserId);
      navigationManager.updateUserActivity(testUserId);
      
      const timeAfterDir = navigationManager.getUserState(testUserId).lastActivity;
      expect(timeAfterDir).toBeGreaterThanOrEqual(timeBeforeDir);
      expect(navigationManager.isInDirectorioMode(testUserId)).toBe(true);
    });

    it('debe registrar actividad en modo consulta IA', () => {
      navigationManager.initUser(testUserId);
      const timeBeforeConsulta = navigationManager.getUserState(testUserId).lastActivity;
      
      // Simular entrada a modo consulta IA y actualización
      navigationManager.startConsultaIA(testUserId, 'proc-001', 'Test Procedure');
      navigationManager.updateUserActivity(testUserId);
      
      const timeAfterConsulta = navigationManager.getUserState(testUserId).lastActivity;
      expect(timeAfterConsulta).toBeGreaterThanOrEqual(timeBeforeConsulta);
      expect(navigationManager.getIAMode(testUserId)).toBe('consulta');
    });
  });

  describe('Sincronización de actividad', () => {
    it('debe permitir múltiples actualizaciones rápidas sin problemas', () => {
      navigationManager.initUser(testUserId);
      
      // Simular múltiples acciones rápidas
      const actions = ['send_video', 'send_documento', 'directorio_search', 'chat_ia_response'];
      
      for (const action of actions) {
        const result = navigationManager.updateUserActivity(testUserId);
        expect(result).toBe(true);
      }
      
      // La sesión no debe expirar
      const isExpired = navigationManager.isSessionExpired(testUserId);
      expect(isExpired).toBe(false);
    });

    it('debe mantener lastActivity consistente con isSessionExpired', () => {
      navigationManager.initUser(testUserId);
      navigationManager.updateUserActivity(testUserId);
      
      // Inmediatamente después de actualizar, NO debe estar expirado
      let isExpired = navigationManager.isSessionExpired(testUserId);
      expect(isExpired).toBe(false);
      
      // Después de muchas más actualizaciones, aún NO debe estar expirado
      for (let i = 0; i < 100; i++) {
        navigationManager.updateUserActivity(testUserId);
      }
      
      isExpired = navigationManager.isSessionExpired(testUserId);
      expect(isExpired).toBe(false);
    });

    it('debe actualizar timestamp para todos los modos', () => {
      navigationManager.initUser(testUserId);
      
      const modes = [
        { setup: () => navigationManager.startChatIA(testUserId), mode: 'chat' },
        { setup: () => navigationManager.startDirectorio(testUserId), mode: 'directorio' },
        { setup: () => navigationManager.startConsultaIA(testUserId, 'proc-001', 'Test'), mode: 'consulta' }
      ];
      
      for (const modeTest of modes) {
        navigationManager.initUser(testUserId);
        modeTest.setup();
        
        const timeBefore = navigationManager.getUserState(testUserId).lastActivity;
        navigationManager.updateUserActivity(testUserId);
        const timeAfter = navigationManager.getUserState(testUserId).lastActivity;
        
        expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
      }
    });
  });

  describe('Flujo completo de sesión', () => {
    it('debe mantener sesión activa con actividad regular', () => {
      navigationManager.initUser(testUserId);
      
      // Simular flujo completo
      const actions = [
        { name: 'navigate', fn: () => navigationManager.updateUserActivity(testUserId) },
        { name: 'send_video', fn: () => navigationManager.updateUserActivity(testUserId) },
        { name: 'chat_ia', fn: () => {
          navigationManager.startChatIA(testUserId);
          navigationManager.updateUserActivity(testUserId);
        }},
        { name: 'send_documento', fn: () => navigationManager.updateUserActivity(testUserId) },
        { name: 'directorio', fn: () => {
          navigationManager.startDirectorio(testUserId);
          navigationManager.updateUserActivity(testUserId);
        }}
      ];
      
      for (const action of actions) {
        action.fn();
        const isExpired = navigationManager.isSessionExpired(testUserId);
        expect(isExpired).toBe(false);
      }
    });

    it('debe permitir flujo: menú → video → IA → documento → directorio', () => {
      navigationManager.initUser(testUserId);
      
      // Menú principal
      expect(navigationManager.getUserState(testUserId).currentMenu).toBe('principal');
      navigationManager.updateUserActivity(testUserId);
      
      // Video
      navigationManager.updateUserActivity(testUserId);
      expect(navigationManager.isSessionExpired(testUserId)).toBe(false);
      
      // IA Chat
      navigationManager.startChatIA(testUserId);
      navigationManager.updateUserActivity(testUserId);
      expect(navigationManager.getIAMode(testUserId)).toBe('chat');
      expect(navigationManager.isSessionExpired(testUserId)).toBe(false);
      
      // Documento
      navigationManager.exitIAMode(testUserId);
      navigationManager.updateUserActivity(testUserId);
      expect(navigationManager.getIAMode(testUserId)).toBeNull();
      expect(navigationManager.isSessionExpired(testUserId)).toBe(false);
      
      // Directorio
      navigationManager.startDirectorio(testUserId);
      navigationManager.updateUserActivity(testUserId);
      expect(navigationManager.isInDirectorioMode(testUserId)).toBe(true);
      expect(navigationManager.isSessionExpired(testUserId)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('debe manejar user null sin crash', () => {
      const result = navigationManager.updateUserActivity(null);
      expect(result).toBe(false);
    });

    it('debe manejar user undefined sin crash', () => {
      const result = navigationManager.updateUserActivity(undefined);
      expect(result).toBe(false);
    });

    it('debe manejar user string vacío', () => {
      const result = navigationManager.updateUserActivity('');
      expect(result).toBe(false);
    });

    it('debe funcionar después de limpiar usuarios inactivos', () => {
      navigationManager.initUser(testUserId);
      navigationManager.updateUserActivity(testUserId);
      
      // Limpiar
      navigationManager.cleanInactiveUsers();
      
      // El usuario activo debe seguir existiendo
      const state = navigationManager.getUserState(testUserId);
      expect(state).toBeDefined();
      
      // Y debe ser actualizable
      const result = navigationManager.updateUserActivity(testUserId);
      expect(result).toBe(true);
    });
  });
});
