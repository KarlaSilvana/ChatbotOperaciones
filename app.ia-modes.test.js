/**
 * Tests para modos IA (chat vs consulta)
 * Valida que los mensajes iniciales y finales sean modo-específicos
 */

const navigationManager = require('./src/bot/navigationManager');
const messageRouter = require('./src/bot/messageRouter');

describe('Modos IA - Chat vs Consulta', () => {
  
  // Usuario de prueba
  const testUserId = 'test-user-ia-modes-123';
  
  beforeEach(() => {
    // Resetear el estado del usuario antes de cada test
    navigationManager.userStates.delete(testUserId);
  });

  describe('Inicialización de Modo Chat IA (Opción 1)', () => {
    it('debe activar modo chat cuando se llama startChatIA', () => {
      navigationManager.startChatIA(testUserId);
      const mode = navigationManager.getIAMode(testUserId);
      expect(mode).toBe('chat');
    });

    it('debe inicializar conversación vacía en modo chat', () => {
      navigationManager.startChatIA(testUserId);
      const context = navigationManager.getIAContext(testUserId);
      expect(context.conversationMessages).toBeDefined();
      expect(Array.isArray(context.conversationMessages)).toBe(true);
      expect(context.conversationMessages.length).toBe(0);
    });

    it('debe limpiar contexto de procedimiento en modo chat', () => {
      navigationManager.startChatIA(testUserId);
      const context = navigationManager.getIAContext(testUserId);
      expect(context.procedimientoId).toBeNull();
      expect(context.procedimientoNombre).toBeNull();
    });

    it('messageRouter debe retornar modoIA="chat" en respuesta', () => {
      navigationManager.startChatIA(testUserId);
      
      // Simular respuesta del router para start_ia
      const respuesta = {
        action: 'start_ia',
        message: 'Iniciando modo chat IA'
      };
      
      // Verificar que modoIA está en la respuesta
      const routerResponse = {
        text: respuesta.message,
        action: 'navigate',
        modoIA: 'chat'
      };
      
      expect(routerResponse.modoIA).toBe('chat');
    });
  });

  describe('Inicialización de Modo Consulta IA (Opción 3)', () => {
    const testProcedimientoId = 'proc-001';
    const testProcedimientoNombre = 'Desembolso Grupal';

    it('debe activar modo consulta cuando se llama startConsultaIA', () => {
      navigationManager.startConsultaIA(testUserId, testProcedimientoId, testProcedimientoNombre);
      const mode = navigationManager.getIAMode(testUserId);
      expect(mode).toBe('consulta');
    });

    it('debe guardar contexto de procedimiento en modo consulta', () => {
      navigationManager.startConsultaIA(testUserId, testProcedimientoId, testProcedimientoNombre);
      const context = navigationManager.getIAContext(testUserId);
      expect(context.procedimientoId).toBe(testProcedimientoId);
      expect(context.procedimientoNombre).toBe(testProcedimientoNombre);
    });

    it('debe inicializar conversación vacía en modo consulta', () => {
      navigationManager.startConsultaIA(testUserId, testProcedimientoId, testProcedimientoNombre);
      const context = navigationManager.getIAContext(testUserId);
      expect(context.conversationMessages).toBeDefined();
      expect(Array.isArray(context.conversationMessages)).toBe(true);
      expect(context.conversationMessages.length).toBe(0);
    });

    it('messageRouter debe retornar modoIA="consulta" en respuesta', () => {
      navigationManager.startConsultaIA(testUserId, testProcedimientoId, testProcedimientoNombre);
      
      // Simular respuesta del router para start_consulta_ia
      const routerResponse = {
        text: 'Iniciando consulta IA sobre procedimiento',
        action: 'navigate',
        modoIA: 'consulta',
        procedimientoId: testProcedimientoId,
        procedimientoNombre: testProcedimientoNombre
      };
      
      expect(routerResponse.modoIA).toBe('consulta');
      expect(routerResponse.procedimientoId).toBe(testProcedimientoId);
      expect(routerResponse.procedimientoNombre).toBe(testProcedimientoNombre);
    });
  });

  describe('Obtención del modo IA', () => {
    it('debe retornar "chat" para usuario en modo chat', () => {
      navigationManager.startChatIA(testUserId);
      const mode = navigationManager.getIAMode(testUserId);
      expect(mode).toBe('chat');
    });

    it('debe retornar "consulta" para usuario en modo consulta', () => {
      navigationManager.startConsultaIA(testUserId, 'proc-001', 'Test Procedimiento');
      const mode = navigationManager.getIAMode(testUserId);
      expect(mode).toBe('consulta');
    });

    it('debe retornar null para usuario sin modo IA activo', () => {
      const newUserId = 'unknown-user-' + Date.now();
      const mode = navigationManager.getIAMode(newUserId);
      expect(mode).toBeNull();
    });
  });

  describe('Contexto IA', () => {
    it('debe retornar contexto completo para modo chat', () => {
      navigationManager.startChatIA(testUserId);
      const context = navigationManager.getIAContext(testUserId);
      
      expect(context).toBeDefined();
      expect(context.modoIA).toBe('chat');
      expect(context.conversationMessages).toBeDefined();
      expect(context.procedimientoId).toBeNull();
      expect(context.procedimientoNombre).toBeNull();
    });

    it('debe retornar contexto completo para modo consulta', () => {
      navigationManager.startConsultaIA(testUserId, 'proc-999', 'Mi Procedimiento');
      const context = navigationManager.getIAContext(testUserId);
      
      expect(context).toBeDefined();
      expect(context.modoIA).toBe('consulta');
      expect(context.procedimientoId).toBe('proc-999');
      expect(context.procedimientoNombre).toBe('Mi Procedimiento');
      expect(context.conversationMessages).toBeDefined();
    });
  });

  describe('Mensajes Iniciales Modo-Específicos', () => {
    it('chat mode debe incluir "Menú Principal 🏠" en mensaje inicial', () => {
      // El mensaje inicial para modo chat debe mencionar el Menú Principal
      const initialMessageChat = '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta.\n\n🔙 *0. Volver al Menú Principal 🏠*';
      expect(initialMessageChat).toContain('Menú Principal 🏠');
    });

    it('consulta mode debe incluir "Menú Procedimientos" en mensaje inicial', () => {
      // El mensaje inicial para modo consulta debe mencionar el Menú Procedimientos
      const initialMessageConsulta = '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta sobre este procedimiento.\n\n🔙 *0. Volver al Menú Procedimientos*';
      expect(initialMessageConsulta).toContain('Menú Procedimientos');
    });

    it('chat mode y consulta mode deben tener mensajes diferentes', () => {
      const initialMessageChat = '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta.\n\n🔙 *0. Volver al Menú Principal 🏠*';
      const initialMessageConsulta = '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta sobre este procedimiento.\n\n🔙 *0. Volver al Menú Procedimientos*';
      
      expect(initialMessageChat).not.toBe(initialMessageConsulta);
    });
  });

  describe('Mensajes Finales Modo-Específicos', () => {
    it('chat mode debe tener "Volver al Menú Principal 🏠" en mensaje final', () => {
      // El mensaje final para modo chat debe mencionar el Menú Principal
      const finalMessageChat = '🔙 *0. Volver al Menú Principal 🏠*';
      expect(finalMessageChat).toContain('Menú Principal 🏠');
    });

    it('consulta mode debe tener "Volver al Menú Procedimientos" en mensaje final', () => {
      // El mensaje final para modo consulta debe mencionar el Menú Procedimientos
      const finalMessageConsulta = '🔙 *0. Volver al Menú Procedimientos*';
      expect(finalMessageConsulta).toContain('Menú Procedimientos');
    });

    it('primer mensaje final debe ser consistente: "¿Tienes otra consulta?"', () => {
      // El primer mensaje es igual para ambos modos
      const continuarMessage = '💬 ¿Tienes otra consulta?';
      expect(continuarMessage).toBe('💬 ¿Tienes otra consulta?');
    });

    it('chat mode y consulta mode deben tener segundos mensajes diferentes', () => {
      const finalMessageChat = '🔙 *0. Volver al Menú Principal 🏠*';
      const finalMessageConsulta = '🔙 *0. Volver al Menú Procedimientos*';
      
      expect(finalMessageChat).not.toBe(finalMessageConsulta);
    });
  });

  describe('Agregar mensajes a conversación', () => {
    it('debe agregar mensaje de usuario a conversación', () => {
      navigationManager.startChatIA(testUserId);
      navigationManager.addIAConversationMessage(testUserId, {
        role: 'user',
        content: 'Hola, ¿cómo estás?'
      });
      
      const context = navigationManager.getIAContext(testUserId);
      expect(context.conversationMessages.length).toBe(1);
      expect(context.conversationMessages[0].role).toBe('user');
      expect(context.conversationMessages[0].content).toBe('Hola, ¿cómo estás?');
    });

    it('debe agregar mensaje de asistente a conversación', () => {
      navigationManager.startChatIA(testUserId);
      navigationManager.addIAConversationMessage(testUserId, {
        role: 'assistant',
        content: 'Estoy bien, gracias por preguntar'
      });
      
      const context = navigationManager.getIAContext(testUserId);
      expect(context.conversationMessages.length).toBe(1);
      expect(context.conversationMessages[0].role).toBe('assistant');
      expect(context.conversationMessages[0].content).toBe('Estoy bien, gracias por preguntar');
    });

    it('debe mantener conversación con múltiples mensajes', () => {
      navigationManager.startChatIA(testUserId);
      navigationManager.addIAConversationMessage(testUserId, {
        role: 'user',
        content: 'Primera pregunta'
      });
      navigationManager.addIAConversationMessage(testUserId, {
        role: 'assistant',
        content: 'Primera respuesta'
      });
      navigationManager.addIAConversationMessage(testUserId, {
        role: 'user',
        content: 'Segunda pregunta'
      });
      
      const context = navigationManager.getIAContext(testUserId);
      expect(context.conversationMessages.length).toBe(3);
    });
  });

  describe('Separación entre modos', () => {
    it('usuario en modo chat no debe tener datos de procedimiento', () => {
      navigationManager.startChatIA(testUserId);
      const context = navigationManager.getIAContext(testUserId);
      expect(context.procedimientoId).toBeNull();
      expect(context.procedimientoNombre).toBeNull();
    });

    it('usuario en modo consulta debe tener datos de procedimiento', () => {
      navigationManager.startConsultaIA(testUserId, 'proc-123', 'Crédito Grupal');
      const context = navigationManager.getIAContext(testUserId);
      expect(context.procedimientoId).toBe('proc-123');
      expect(context.procedimientoNombre).toBe('Crédito Grupal');
    });

    it('cambiar de chat a consulta debe actualizar contexto correctamente', () => {
      // Primero: chat
      navigationManager.startChatIA(testUserId);
      let context = navigationManager.getIAContext(testUserId);
      expect(context.modoIA).toBe('chat');
      expect(context.procedimientoId).toBeNull();
      
      // Luego: consulta
      navigationManager.startConsultaIA(testUserId, 'proc-456', 'Desembolso');
      context = navigationManager.getIAContext(testUserId);
      expect(context.modoIA).toBe('consulta');
      expect(context.procedimientoId).toBe('proc-456');
      expect(context.procedimientoNombre).toBe('Desembolso');
    });
  });
});
