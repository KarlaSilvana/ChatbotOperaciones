/**
 * Tests para messageRouter.js
 */

const { procesarMensaje } = require('./messageRouter');
const stateManager = require('./stateManager');

describe('MessageRouter Module', () => {
  const testUserId = '+5199999999';

  beforeEach(() => {
    stateManager.clearState(testUserId);
  });

  describe('procesarMensaje()', () => {
    it('debe retornar una respuesta', async () => {
      const respuesta = await procesarMensaje(testUserId, 'hola');
      expect(respuesta).toBeDefined();
      expect(respuesta.text).toBeDefined();
    });

    it('debe mostrar menú para primer mensaje', async () => {
      const respuesta = await procesarMensaje(testUserId, 'hola');
      expect(respuesta.text).toContain('¡Bienvenido!');
      expect(respuesta.text).toContain('¿En qué puedo ayudarte?');
    });

    it('debe responder a opción 1 (horarios)', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '1');
      expect(respuesta.text).toContain('HORARIOS');
    });

    it('debe responder a opción 2 (ubicación)', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '2');
      expect(respuesta.text).toContain('UBICACIONES');
    });

    it('debe responder a opción 3 (precios)', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '3');
      expect(respuesta.text).toContain('PRECIOS');
    });

    it('debe responder a opción 4 (contacto)', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '4');
      expect(respuesta.text).toContain('CONTACTO');
    });

    it('debe responder a opción 5 (chatbot)', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '5');
      expect(respuesta.text).toContain('IA');
    });
  });

  describe('Comando "menu"', () => {
    it('debe volver al menú cuando se envía "menu"', async () => {
      await procesarMensaje(testUserId, 'hola');
      await procesarMensaje(testUserId, '1');
      const respuesta = await procesarMensaje(testUserId, 'menu');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe ser insensible a mayúsculas', async () => {
      await procesarMensaje(testUserId, 'hola');
      await procesarMensaje(testUserId, '1');
      const respuesta = await procesarMensaje(testUserId, 'MENU');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe funcionar con "menú" (con acento)', async () => {
      await procesarMensaje(testUserId, 'hola');
      await procesarMensaje(testUserId, '1');
      const respuesta = await procesarMensaje(testUserId, 'menú');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });
  });

  describe('Entradas inválidas', () => {
    it('debe mostrar menú para opción inválida', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '99');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe mostrar menú para número mayor a 5', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '10');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe mostrar menú para texto aleatorio', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, 'texto aleatorio');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe ser insensible a espacios', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '  1  ');
      expect(respuesta.text).toContain('HORARIOS');
    });
  });

  describe('Navegación', () => {
    it('debe permitir navegar entre opciones', async () => {
      await procesarMensaje(testUserId, 'hola');
      await procesarMensaje(testUserId, '1');
      await procesarMensaje(testUserId, 'menu');
      
      const respuesta = await procesarMensaje(testUserId, '2');
      expect(respuesta.text).toContain('UBICACIONES');
    });

    it('debe permitir múltiples navegaciones', async () => {
      for (let i = 0; i < 5; i++) {
        await procesarMensaje(testUserId, 'hola');
        const respuesta = await procesarMensaje(testUserId, '1');
        expect(respuesta.text).toContain('HORARIOS');
        await procesarMensaje(testUserId, 'menu');
      }
    });

    it('debe mantener contador de mensajes', async () => {
      const n = 5;
      for (let i = 0; i < n; i++) {
        await procesarMensaje(testUserId, 'hola');
      }
      const state = stateManager.getState(testUserId);
      expect(state.messagesCount).toBe(n);
    });
  });

  describe('Normalización de mensajes', () => {
    it('debe convertir a minúsculas', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, 'MENU');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe eliminar espacios en blanco', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '  1  ');
      expect(respuesta.text).toContain('HORARIOS');
    });

    it('debe manejar números como strings', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, '1');
      expect(respuesta.text).toContain('HORARIOS');
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar cadena vacía', async () => {
      await procesarMensaje(testUserId, '');
      const state = stateManager.getState(testUserId);
      expect(state).toBeDefined();
    });

    it('debe manejar mensaje muy largo', async () => {
      const mensajeLargo = 'a'.repeat(1000);
      const respuesta = await procesarMensaje(testUserId, mensajeLargo);
      expect(respuesta).toBeDefined();
    });

    it('debe manejar caracteres especiales', async () => {
      const respuesta = await procesarMensaje(testUserId, '!@#$%^&*()');
      expect(respuesta).toBeDefined();
    });

    it('debe manejar emojis', async () => {
      const respuesta = await procesarMensaje(testUserId, '👋');
      expect(respuesta).toBeDefined();
    });
  });

  describe('Estado del usuario', () => {
    it('debe crear usuario si no existe', async () => {
      const userId = '+5166666666';
      stateManager.clearState(userId);
      
      const respuesta = await procesarMensaje(userId, 'hola');
      expect(respuesta).toBeDefined();
      expect(stateManager.userExists(userId)).toBe(true);
    });

    it('debe incrementar contador de mensajes', async () => {
      const initialCount = stateManager.getState(testUserId).messagesCount;
      await procesarMensaje(testUserId, 'hola');
      const finalCount = stateManager.getState(testUserId).messagesCount;
      
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('debe actualizar lastMessage', async () => {
      await procesarMensaje(testUserId, 'hola');
      const state1 = stateManager.getState(testUserId);
      
      await procesarMensaje(testUserId, '1');
      const state2 = stateManager.getState(testUserId);
      
      expect(state2.lastMessage).not.toBe(state1.lastMessage);
    });
  });

  describe('Estado generico', () => {
    it('debe volver al menú cuando está en estado "generico" y recibe texto', async () => {
      // Primer mensaje - entra a menu
      await procesarMensaje(testUserId, 'hola');
      
      // Selecciona opción 1 - entra a estado generico
      const respGenerico = await procesarMensaje(testUserId, '1');
      expect(respGenerico.text).toContain('HORARIOS');
      
      // Verifica que está en estado generico
      const state = stateManager.getState(testUserId);
      expect(state.state).toBe('generico');
      
      // Envía un mensaje que no sea "menu" - debe volver al menú
      const respuesta = await procesarMensaje(testUserId, 'cualquier cosa');
      expect(respuesta.text).toContain('¡Bienvenido!');
      
      // Verifica que volvió al estado menu
      const newState = stateManager.getState(testUserId);
      expect(newState.state).toBe('menu');
    });

    it('debe volver al menú desde estado generico para opción inválida', async () => {
      await procesarMensaje(testUserId, 'hola');
      await procesarMensaje(testUserId, '1');
      
      const respuesta = await procesarMensaje(testUserId, 'xxx');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe volver al menú desde estado generico para número', async () => {
      await procesarMensaje(testUserId, 'hola');
      await procesarMensaje(testUserId, '2');
      
      const respuesta = await procesarMensaje(testUserId, '999');
      expect(respuesta.text).toContain('¡Bienvenido!');
    });

    it('debe manejar estado "chatbot"', async () => {
      await procesarMensaje(testUserId, 'hola');
      const resp = await procesarMensaje(testUserId, '5');
      expect(resp.text).toContain('IA');
      
      // Verifica que está en estado chatbot
      const state = stateManager.getState(testUserId);
      expect(state.state).toBe('chatbot');
      
      // Envía un mensaje en estado chatbot
      const respuesta = await procesarMensaje(testUserId, 'cualquier cosa');
      expect(respuesta.text).toBeDefined();
    });
  });

  describe('Flujo completo', () => {
    it('debe completar un flujo desde inicio hasta menú nuevamente', async () => {
      const resp1 = await procesarMensaje(testUserId, 'hola');
      expect(resp1.text).toContain('¡Bienvenido!');

      const resp2 = await procesarMensaje(testUserId, '1');
      expect(resp2.text).toContain('HORARIOS');

      const resp3 = await procesarMensaje(testUserId, 'menu');
      expect(resp3.text).toContain('¡Bienvenido!');

      const resp4 = await procesarMensaje(testUserId, '2');
      expect(resp4.text).toContain('UBICACIONES');
    });

    it('debe completar flujo con todas las opciones', async () => {
      await procesarMensaje(testUserId, 'hola');

      for (let opcion = 1; opcion <= 4; opcion++) {
        const respuesta = await procesarMensaje(testUserId, String(opcion));
        expect(respuesta.text).toBeDefined();
        expect(respuesta.text.length).toBeGreaterThan(0);
        
        await procesarMensaje(testUserId, 'menu');
      }
    });
  });
});
