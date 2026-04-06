/**
 * Tests para menus.js (MenusConfig)
 */

const MenusConfig = require('./menus');

describe('MenusConfig Module', () => {
  
  describe('getMenuPrincipal()', () => {
    it('debe retornar el menú principal', () => {
      const menu = MenusConfig.getMenuPrincipal();
      expect(menu).toBeDefined();
      expect(menu.text).toBeDefined();
      expect(menu.opciones).toBeDefined();
    });

    it('debe contener 4 opciones', () => {
      const menu = MenusConfig.getMenuPrincipal();
      const opciones = Object.keys(menu.opciones);
      expect(opciones.length).toBeGreaterThanOrEqual(4);
      expect(opciones).toContain('1');
      expect(opciones).toContain('2');
      expect(opciones).toContain('3');
      expect(opciones).toContain('4');
    });

    it('debe contener emojis en el texto', () => {
      const menu = MenusConfig.getMenuPrincipal();
      expect(menu.text).toContain('👋');
      expect(menu.text).toContain('1️⃣');
      expect(menu.text).toContain('2️⃣');
    });

    it('debe contener el texto correcto en el menú', () => {
      const menu = MenusConfig.getMenuPrincipal();
      expect(menu.text).toContain('¡Hola!');
      expect(menu.text).toContain('Chispa');
    });
  });

  describe('getMenuProcedimientos()', () => {
    it('debe retornar menú de procedimientos', () => {
      const menu = MenusConfig.getMenuProcedimientos();
      expect(menu).toBeDefined();
      expect(menu.text).toContain('PROCEDIMIENTOS');
      expect(menu.opciones).toBeDefined();
    });

    it('debe incluir opción de volver', () => {
      const menu = MenusConfig.getMenuProcedimientos();
      expect(menu.opciones['0']).toBe('volver');
    });

    it('debe incluir todos los procedimientos', () => {
      const menu = MenusConfig.getMenuProcedimientos();
      const numProcs = MenusConfig.procedimientos.length;
      
      for (let i = 1; i <= numProcs; i++) {
        expect(menu.opciones[i.toString()]).toBeDefined();
      }
    });
  });

  describe('getMenuDetalleProcedimiento()', () => {
    it('debe retornar null para procedimiento inexistente', () => {
      const menu = MenusConfig.getMenuDetalleProcedimiento('proc_inexistente');
      expect(menu).toBeNull();
    });

    it('debe retornar menú para procedimiento válido', () => {
      const proc = MenusConfig.procedimientos[0];
      const menu = MenusConfig.getMenuDetalleProcedimiento(proc.id);
      expect(menu).toBeDefined();
      expect(menu.text.toUpperCase()).toContain(proc.nombre.toUpperCase());
    });

    it('debe incluir opciones de video, documento y consulta', () => {
      const proc = MenusConfig.procedimientos[0];
      const menu = MenusConfig.getMenuDetalleProcedimiento(proc.id);
      expect(menu.opciones['1']).toBe('ver_video');
      expect(menu.opciones['2']).toBe('ver_documento');
      expect(menu.opciones['3']).toBe('consulta_ia');
    });
  });

  describe('getProcedimiento()', () => {
    it('debe retornar procedimiento por ID', () => {
      const proc = MenusConfig.procedimientos[0];
      const found = MenusConfig.getProcedimiento(proc.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(proc.id);
    });

    it('debe retornar undefined para ID inexistente', () => {
      const found = MenusConfig.getProcedimiento('inexistente');
      expect(found).toBeUndefined();
    });
  });

  describe('getProcedimientoPorNumero()', () => {
    it('debe encontrar procedimiento por número', () => {
      const proc = MenusConfig.procedimientos[0];
      const found = MenusConfig.getProcedimientoPorNumero(proc.numero);
      expect(found).toBeDefined();
      expect(found.numero).toBe(proc.numero);
    });

    it('debe retornar undefined para número inexistente', () => {
      const found = MenusConfig.getProcedimientoPorNumero(999);
      expect(found).toBeUndefined();
    });
  });

  describe('cargarProcedimientos()', () => {
    it('debe cargar procedimientos desde JSON', () => {
      expect(MenusConfig.procedimientos).toBeDefined();
      expect(Array.isArray(MenusConfig.procedimientos)).toBe(true);
      expect(MenusConfig.procedimientos.length).toBeGreaterThan(0);
    });

    it('cada procedimiento debe tener estructura correcta', () => {
      MenusConfig.procedimientos.forEach(proc => {
        expect(proc.id).toBeDefined();
        expect(proc.numero).toBeDefined();
        expect(proc.nombre).toBeDefined();
        expect(proc.emoji).toBeDefined();
        expect(proc.recursos).toBeDefined();
        expect(proc.recursos.video).toBeDefined();
        expect(proc.recursos.documento).toBeDefined();
      });
    });

    it('debe incluir contexto IA en recursos', () => {
      MenusConfig.procedimientos.forEach(proc => {
        expect(proc.recursos.contexto_ia).toBeDefined();
        expect(typeof proc.recursos.contexto_ia).toBe('string');
        expect(proc.recursos.contexto_ia.length).toBeGreaterThan(0);
      });
    });

    it('debe incluir keywords en recursos', () => {
      MenusConfig.procedimientos.forEach(proc => {
        expect(proc.recursos.keywords).toBeDefined();
        expect(Array.isArray(proc.recursos.keywords)).toBe(true);
      });
    });
  });

  describe('getMenuFormularios()', () => {
    it('debe retornar menú de formularios', () => {
      const menu = MenusConfig.getMenuFormularios();
      expect(menu).toBeDefined();
      expect(menu.text).toContain('FORMULARIOS');
    });
  });

  describe('Integración completa', () => {
    it('debe permitir navegar: principal → procedimientos → detalle', () => {
      const principal = MenusConfig.getMenuPrincipal();
      expect(principal.opciones['2']).toBe('procedimientos');

      const procedimientos = MenusConfig.getMenuProcedimientos();
      expect(procedimientos.opciones['1']).toBeDefined();

      const proc = MenusConfig.procedimientos[0];
      const detalle = MenusConfig.getMenuDetalleProcedimiento(proc.id);
      expect(detalle).not.toBeNull();
      expect(detalle.text.toUpperCase()).toContain(proc.nombre.toUpperCase());
    });
  });
});
