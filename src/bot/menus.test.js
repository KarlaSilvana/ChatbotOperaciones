/**
 * Tests para menus.js
 */

const {
  obtenerMenuPrincipal,
  obtenerRespuestaGenerica,
  menus,
  respuestasGenericas
} = require('./menus');

describe('Menus Module', () => {
  
  describe('obtenerMenuPrincipal()', () => {
    it('debe retornar el menú principal', () => {
      const menu = obtenerMenuPrincipal();
      expect(menu).toBeDefined();
      expect(menu.text).toBeDefined();
      expect(menu.opciones).toBeDefined();
    });

    it('debe contener 5 opciones', () => {
      const menu = obtenerMenuPrincipal();
      const opciones = Object.keys(menu.opciones);
      expect(opciones).toHaveLength(5);
      expect(opciones).toEqual(['1', '2', '3', '4', '5']);
    });

    it('debe contener emojis en el texto', () => {
      const menu = obtenerMenuPrincipal();
      expect(menu.text).toContain('👋');
      expect(menu.text).toContain('1️⃣');
      expect(menu.text).toContain('2️⃣');
    });

    it('debe contener el texto correcto en el menú', () => {
      const menu = obtenerMenuPrincipal();
      expect(menu.text).toContain('¡Bienvenido!');
      expect(menu.text).toContain('¿En qué puedo ayudarte?');
    });
  });

  describe('obtenerRespuestaGenerica()', () => {
    it('debe retornar respuesta para opción 1 (horarios)', () => {
      const respuesta = obtenerRespuestaGenerica('1');
      expect(respuesta).toBeDefined();
      expect(respuesta.text).toContain('HORARIOS');
      expect(respuesta.nextState).toBe('menu');
    });

    it('debe retornar respuesta para opción 2 (ubicación)', () => {
      const respuesta = obtenerRespuestaGenerica('2');
      expect(respuesta).toBeDefined();
      expect(respuesta.text).toContain('UBICACIONES');
      expect(respuesta.text).toContain('Lima');
    });

    it('debe retornar respuesta para opción 3 (precios)', () => {
      const respuesta = obtenerRespuestaGenerica('3');
      expect(respuesta).toBeDefined();
      expect(respuesta.text).toContain('PRECIOS');
      expect(respuesta.text).toContain('Básico');
      expect(respuesta.text).toContain('Premium');
    });

    it('debe retornar respuesta para opción 4 (contacto)', () => {
      const respuesta = obtenerRespuestaGenerica('4');
      expect(respuesta).toBeDefined();
      expect(respuesta.text).toContain('CONTACTO');
      expect(respuesta.text).toContain('contacto@empresa.com');
    });

    it('debe retornar null para opción inválida', () => {
      const respuesta = obtenerRespuestaGenerica('99');
      expect(respuesta).toBeNull();
    });

    it('todas las respuestas deben tener nextState', () => {
      for (let i = 1; i <= 4; i++) {
        const respuesta = obtenerRespuestaGenerica(String(i));
        expect(respuesta.nextState).toBeDefined();
      }
    });

    it('todas las respuestas deben tener texto', () => {
      for (let i = 1; i <= 4; i++) {
        const respuesta = obtenerRespuestaGenerica(String(i));
        expect(respuesta.text).toBeDefined();
        expect(respuesta.text.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Estructura de datos', () => {
    it('menus debe contener "principal"', () => {
      expect(menus.principal).toBeDefined();
    });

    it('respuestasGenericas debe contener todas las opciones', () => {
      expect(respuestasGenericas.horarios).toBeDefined();
      expect(respuestasGenericas.ubicacion).toBeDefined();
      expect(respuestasGenericas.precios).toBeDefined();
      expect(respuestasGenericas.contacto).toBeDefined();
    });

    it('cada respuesta debe contener separador', () => {
      Object.values(respuestasGenericas).forEach(respuesta => {
        expect(respuesta.text).toContain('━');
      });
    });

    it('cada respuesta debe contener instrucción de volver', () => {
      Object.values(respuestasGenericas).forEach(respuesta => {
        expect(respuesta.text).toContain('menu');
      });
    });
  });

  describe('Validación de contenido', () => {
    it('opción 1 debe contener horarios', () => {
      const resp = obtenerRespuestaGenerica('1');
      expect(resp.text).toContain('9:00 AM');
      expect(resp.text).toContain('6:00 PM');
    });

    it('opción 2 debe contener direcciones', () => {
      const resp = obtenerRespuestaGenerica('2');
      expect(resp.text).toMatch(/Av\./);
    });

    it('opción 3 debe contener precios', () => {
      const resp = obtenerRespuestaGenerica('3');
      expect(resp.text).toMatch(/S\/\.|soles/i);
    });

    it('opción 4 debe contener WhatsApp', () => {
      const resp = obtenerRespuestaGenerica('4');
      expect(resp.text).toContain('WhatsApp');
    });
  });
});
