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
    const invalid = await procesarMensaje(testUserId, 'xyz');
    expect(invalid.action).toBe('invalid');

    const valida = await procesarMensaje(testUserId, '1');
    expect(valida.action).toBe('start_ia');
  });
});
