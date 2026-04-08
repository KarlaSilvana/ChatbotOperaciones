const DirectorioRouter = require('../../../src/bot/directorioRouter');

describe('DirectorioRouter', () => {
  describe('getMenuMessage()', () => {
    test('debería retornar mensaje de menú del directorio', () => {
      const mensaje = DirectorioRouter.getMenuMessage();
      expect(mensaje).toContain('DIRECTORIO TELEFÓNICO');
      expect(mensaje).toContain('escribe el nombre');
      expect(mensaje).toContain('Volver al Menú Principal');
    });

    test('debería incluir emojis de teléfono', () => {
      const mensaje = DirectorioRouter.getMenuMessage();
      expect(mensaje).toContain('📞');
      expect(mensaje).toContain('👤');
    });
  });

  describe('getNoResultsMessage()', () => {
    test('debería retornar mensaje de sin resultados', () => {
      const mensaje = DirectorioRouter.getNoResultsMessage();
      expect(mensaje).toContain('No se encontraron resultados');
      expect(mensaje).toContain('no existen en el directorio');
    });

    test('debería incluir opciones de reintentos', () => {
      const mensaje = DirectorioRouter.getNoResultsMessage();
      expect(mensaje).toContain('otro criterio');
      expect(mensaje).toContain('Volver al Menú Principal');
    });
  });

  describe('getContinueSearchMessage()', () => {
    test('debería retornar mensaje de continuación sin hayMas', () => {
      const mensaje = DirectorioRouter.getContinueSearchMessage(false);
      expect(mensaje).toContain('¿Deseas continuar');
      expect(mensaje).toContain('Volver al Menú Principal');
      expect(mensaje).not.toContain('Hay más resultados');
    });

    test('debería incluir advertencia de más resultados si hayMas=true', () => {
      const mensaje = DirectorioRouter.getContinueSearchMessage(true);
      expect(mensaje).toContain('Hay más resultados');
      expect(mensaje).toContain('Proporciona más contexto');
    });

    test('debería incluir emoji de búsqueda', () => {
      const mensaje = DirectorioRouter.getContinueSearchMessage();
      expect(mensaje).toContain('🔍');
    });
  });

  describe('routeInput()', () => {
    test('debería retornar exit_directorio cuando input es "0"', () => {
      const resultado = DirectorioRouter.routeInput('0');
      expect(resultado.action).toBe('exit_directorio');
      expect(resultado.nextState).toBe('menu');
    });

    test('debería retornar directorio_search para búsqueda normal', () => {
      const resultado = DirectorioRouter.routeInput('ALATA PAYE');
      expect(resultado.action).toBe('directorio_search');
      expect(resultado.query).toBe('ALATA PAYE');
      expect(resultado.nextState).toBe('searching');
    });

    test('debería ser case-insensitive para opción 0', () => {
      const resultado = DirectorioRouter.routeInput('  0  ');
      expect(resultado.action).toBe('exit_directorio');
    });

    test('debería preservar query original (no lowercased)', () => {
      const resultado = DirectorioRouter.routeInput('EJECUTIVO');
      expect(resultado.query).toBe('EJECUTIVO');
    });

    test('debería manejar input vacío', () => {
      const resultado = DirectorioRouter.routeInput('');
      expect(resultado.action).toBe('directorio_search');
      expect(resultado.query).toBe('');
    });

    test('debería manejar espacios en blanco', () => {
      const resultado = DirectorioRouter.routeInput('   ');
      expect(resultado.action).toBe('directorio_search');
    });

    test('debería preservar espacios en búsquedas de múltiples palabras', () => {
      const resultado = DirectorioRouter.routeInput('Puno Sur');
      expect(resultado.query).toContain('Puno Sur');
    });
  });

  describe('isInDirectorioMode()', () => {
    test('debería retornar true si currentMenu es directorio', () => {
      const context = { currentMenu: 'directorio' };
      expect(DirectorioRouter.isInDirectorioMode(context)).toBe(true);
    });

    test('debería retornar false si currentMenu no es directorio', () => {
      const context = { currentMenu: 'main' };
      expect(DirectorioRouter.isInDirectorioMode(context)).toBe(false);
    });

    test('debería retornar false para contexto vacío', () => {
      expect(DirectorioRouter.isInDirectorioMode({})).toBe(false);
      expect(DirectorioRouter.isInDirectorioMode(null)).toBe(false);
    });
  });

  describe('getCurrentState()', () => {
    test('debería retornar estado actual del directorio', () => {
      const context = { directorioState: 'results' };
      expect(DirectorioRouter.getCurrentState(context)).toBe('results');
    });

    test('debería retornar "menu" por defecto', () => {
      expect(DirectorioRouter.getCurrentState({})).toBe('menu');
      expect(DirectorioRouter.getCurrentState(null)).toBe('menu');
    });

    test('debería soportar diferentes estados', () => {
      expect(DirectorioRouter.getCurrentState({ directorioState: 'menu' })).toBe('menu');
      expect(DirectorioRouter.getCurrentState({ directorioState: 'searching' })).toBe('searching');
      expect(DirectorioRouter.getCurrentState({ directorioState: 'results' })).toBe('results');
    });
  });

  describe('updateState()', () => {
    test('debería actualizar directorioState', () => {
      const context = { directorioState: 'menu', otrocampo: 'valor' };
      const actualizado = DirectorioRouter.updateState(context, 'results');
      expect(actualizado.directorioState).toBe('results');
      expect(actualizado.otroField).toBeUndefined();
    });

    test('debería preservar otros campos del contexto', () => {
      const context = { directorioState: 'menu', userId: '123', userName: 'test' };
      const actualizado = DirectorioRouter.updateState(context, 'searching');
      expect(actualizado.userId).toBe('123');
      expect(actualizado.userName).toBe('test');
    });

    test('debería manejar contexto vacío', () => {
      const actualizado = DirectorioRouter.updateState({}, 'menu');
      expect(actualizado.directorioState).toBe('menu');
    });

    test('debería crear nuevo estado si no existe', () => {
      const context = { otrosCampos: 'valores' };
      const actualizado = DirectorioRouter.updateState(context, 'searching');
      expect(actualizado.directorioState).toBe('searching');
      expect(actualizado.otrosCampos).toBe('valores');
    });
  });
});
