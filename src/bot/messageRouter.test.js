/**
 * Tests para messageRouter.js con navigationManager
 */

const { procesarMensaje } = require('./messageRouter');
const navigationManager = require('./navigationManager');

describe('MessageRouter - Navigation Integration', () => {
  const testUserId = '+5199999999';

  beforeEach(() => {
    navigationManager.userStates.delete(testUserId);
  });

  describe('Primer Mensaje (Usuario Nuevo)', () => {
    it('debe mostrar menú sin error para primer mensaje inválido', async () => {
      const respuesta = await procesarMensaje(testUserId, 'hola');
      expect(respuesta.text).toContain('¡Hola!');
      expect(respuesta.text).toContain('AndyBot');
      expect(respuesta.action).toBe('navigate');
      expect(respuesta.text).not.toContain('Opción no válida');
    });

    it('debe mostrar menú sin error para primer mensaje con texto aleatorio', async () => {
      const respuesta = await procesarMensaje(testUserId, 'necesito ayuda');
      expect(respuesta.text).toContain('¡Hola!');
      expect(respuesta.action).toBe('navigate');
    });

    it('debe mostrar menú sin error para primer número inválido', async () => {
      const respuesta = await procesarMensaje(testUserId, '99');
      expect(respuesta.text).toContain('¡Hola!');
      expect(respuesta.text).not.toContain('Opción no válida');
    });
  });

  describe('Segundo Mensaje en Adelante', () => {
    it('debe mostrar error para segundo mensaje inválido', async () => {
      await procesarMensaje(testUserId, 'hola');
      const respuesta = await procesarMensaje(testUserId, 'xyz');
      expect(respuesta.text).toContain('Opción no válida');
      expect(respuesta.action).toBe('invalid');
    });

    it('debe mostrar error para número inválido en segundo mensaje', async () => {
      await procesarMensaje(testUserId, '2');
      const respuesta = await procesarMensaje(testUserId, '99');
      expect(respuesta.text).toContain('Opción no válida');
    });
  });

  it('debe retornar menú principal al inicio', async () => {
    const respuesta = await procesarMensaje(testUserId, '1');
    expect(respuesta.action).toBe('start_ia');
  });

  it('debe navegar a procedimientos con opción 2', async () => {
    const respuesta = await procesarMensaje(testUserId, '2');
    expect(respuesta.text).toContain('PROCEDIMIENTOS');
    expect(respuesta.action).toBe('navigate');
  });

  it('debe navegar a formularios con opción 3', async () => {
    const respuesta = await procesarMensaje(testUserId, '3');
    expect(respuesta.text).toContain('FORMULARIOS');
  });

  it('debe mostrar directorio con opción 4', async () => {
    const respuesta = await procesarMensaje(testUserId, '4');
    expect(respuesta.action).toBe('info');
  });

  it('debe activar chat IA con opción 1', async () => {
    const respuesta = await procesarMensaje(testUserId, '1');
    expect(respuesta.action).toBe('start_ia');
  });

  it('debe volver al menú con "menu"', async () => {
    await procesarMensaje(testUserId, '2');
    const respuesta = await procesarMensaje(testUserId, 'menu');
    expect(respuesta.text).toContain('¡Hola!');
    expect(respuesta.action).toBe('navigate');
  });

  it('debe permitir seleccionar procedimiento', async () => {
    await procesarMensaje(testUserId, '2');
    const respuesta = await procesarMensaje(testUserId, '1');
    expect(respuesta.text.toUpperCase()).toContain('FIRMA');
    expect(respuesta.action).toBe('navigate');
  });

  it('debe permitir solicitar video', async () => {
    await procesarMensaje(testUserId, '2');
    await procesarMensaje(testUserId, '1');
    const respuesta = await procesarMensaje(testUserId, '1');
    expect(respuesta.action).toBe('send_video');
  });

  it('debe permitir solicitar documento', async () => {
    await procesarMensaje(testUserId, '2');
    await procesarMensaje(testUserId, '1');
    const respuesta = await procesarMensaje(testUserId, '2');
    expect(respuesta.action).toBe('send_documento');
  });

  it('debe permitir consulta IA', async () => {
    await procesarMensaje(testUserId, '2');
    await procesarMensaje(testUserId, '1');
    const respuesta = await procesarMensaje(testUserId, '3');
    expect(respuesta.action).toBe('start_consulta_ia');
  });

  it('debe volver desde procedimiento con 0', async () => {
    await procesarMensaje(testUserId, '2');
    await procesarMensaje(testUserId, '1');
    const respuesta = await procesarMensaje(testUserId, '0');
    expect(respuesta.text).toContain('PROCEDIMIENTOS');
  });

  it('debe manejar entrada inválida', async () => {
    // Primer mensaje (incluso si es inválido, no muestra error)
    await procesarMensaje(testUserId, 'xyz');
    
    // Segundo mensaje inválido SÍ muestra error
    const respuesta = await procesarMensaje(testUserId, 'xyz');
    expect(respuesta.action).toBe('invalid');
  });

  it('debe manejar múltiples usuarios independientemente', async () => {
    const user1 = '+5511111111';
    const user2 = '+5522222222';

    const resp1 = await procesarMensaje(user1, '2');
    const resp2 = await procesarMensaje(user2, '1');

    expect(resp1.text).toContain('PROCEDIMIENTOS');
    expect(resp2.text).toContain('Asistente IA');
  });

  it('debe inicializar usuario automáticamente', async () => {
    const respuesta = await procesarMensaje(testUserId, 'hola');
    expect(respuesta).toBeDefined();
    expect(respuesta.action).toBeDefined();
  });

  it('debe recuperarse de errores', async () => {
    // Primer mensaje "xyz" (inválido pero es primer mensaje, no muestra error)
    const invalid = await procesarMensaje(testUserId, 'xyz');
    expect(invalid.action).toBe('navigate');
    
    // Segundo mensaje con opción válida "1"
    const valida = await procesarMensaje(testUserId, '1');
    expect(valida.action).toBe('start_ia');
  });

  describe('Sesión Expirada (30 minutos)', () => {
    it('debe detectar cuando la sesión ha expirado', async () => {
      const userId = '+5198888888';
      navigationManager.userStates.delete(userId);
      
      // Crear una sesión
      await procesarMensaje(userId, '1');
      
      // Obtener el estado y simular que pasaron 31 minutos
      const state = navigationManager.getUserState(userId);
      state.lastActivity = Date.now() - (31 * 60 * 1000); // 31 minutos atrás
      navigationManager.userStates.set(userId, state);
      
      // Siguiente mensaje debe detectar sesión expirada
      const respuesta = await procesarMensaje(userId, '2');
      expect(respuesta.action).toBe('session_expired');
      expect(respuesta.text).toContain('sesión ha expirado');
    });

    it('no debe expirar sesión activa (menos de 30 minutos)', async () => {
      const userId = '+5197777777';
      navigationManager.userStates.delete(userId);
      
      // Crear una sesión
      await procesarMensaje(userId, '1');
      
      // Simular que pasaron solo 5 minutos
      const state = navigationManager.getUserState(userId);
      state.lastActivity = Date.now() - (5 * 60 * 1000);
      navigationManager.userStates.set(userId, state);
      
      // Siguiente mensaje debe funcionar normalmente
      const respuesta = await procesarMensaje(userId, '2');
      expect(respuesta.action).toBe('navigate');
      expect(respuesta.text).toContain('PROCEDIMIENTOS');
    });

    it('debe permitir reiniciar sesión después de expiración', async () => {
      const userId = '+5196666666';
      navigationManager.userStates.delete(userId);
      
      // Crear una sesión
      await procesarMensaje(userId, '1');
      
      // Simular que pasaron 31 minutos
      const state = navigationManager.getUserState(userId);
      state.lastActivity = Date.now() - (31 * 60 * 1000);
      navigationManager.userStates.set(userId, state);
      
      // Primer mensaje después de expiración
      const respuesta1 = await procesarMensaje(userId, '2');
      expect(respuesta1.action).toBe('session_expired');
      
      // Segundo mensaje debe mostrar menú principal (sin error, primer mensaje "nuevo")
      const respuesta2 = await procesarMensaje(userId, 'hola');
      expect(respuesta2.text).toContain('¡Hola!');
      expect(respuesta2.text).not.toContain('Opción no válida');
    });
  });
});
