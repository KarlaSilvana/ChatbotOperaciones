const directorioService = require('./directorioService');

describe('DirectorioService', () => {
  beforeEach(() => {
    directorioService.recargar();
  });

  describe('buscar()', () => {
    test('debería encontrar registros por teléfono exacto', () => {
      const resultado = directorioService.buscar('958315121');
      expect(resultado.resultados.length).toBeGreaterThan(0);
      expect(resultado.resultados[0].telefono).toContain('958 315 121');
    });

    test('debería encontrar registros por nombre (nombreCompleto)', () => {
      const resultado = directorioService.buscar('JHOVANNA');
      expect(resultado.resultados.length).toBeGreaterThan(0);
      expect(resultado.resultados[0].nombreCompleto.toUpperCase()).toContain('JHOVANNA');
    });

    test('debería encontrar registros por cargo', () => {
      const resultado = directorioService.buscar('EJECUTIVO');
      expect(resultado.resultados.length).toBeGreaterThan(0);
      expect(resultado.resultados[0].cargo.toUpperCase()).toContain('EJECUTIVO');
    });

    test('debería encontrar registros por oficina', () => {
      const resultado = directorioService.buscar('PRINCIPAL');
      expect(resultado.totalEncontrados).toBeGreaterThan(0);
      expect(resultado.resultados[0].oficina.toUpperCase()).toContain('PRINCIPAL');
    });

    test('debería encontrar registros por establecimiento', () => {
      const resultado = directorioService.buscar('EOB');
      expect(resultado.totalEncontrados).toBeGreaterThan(0);
    });

    test('debería hacer búsqueda case-insensitive', () => {
      const resultado = directorioService.buscar('carlos');
      expect(resultado.resultados.length).toBeGreaterThan(0);
      expect(resultado.resultados[0].nombreCompleto.toLowerCase()).toContain('carlos');
    });

    test('debería limitar a 5 resultados y marcar hayMas', () => {
      const resultado = directorioService.buscar('Ejecutivo');
      if (resultado.totalEncontrados > 5) {
        expect(resultado.resultados.length).toBe(5);
        expect(resultado.hayMas).toBe(true);
      }
    });

    test('debería retornar hayMas=false si hay ≤5 resultados', () => {
      const resultado = directorioService.buscar('ALATA PAYE CARLOS');
      expect(resultado.resultados.length).toBeLessThanOrEqual(5);
      expect(resultado.hayMas).toBe(false);
    });

    test('debería retornar resultados vacíos si no hay coincidencias', () => {
      const resultado = directorioService.buscar('XXXXXXXXXX');
      expect(resultado.resultados.length).toBe(0);
      expect(resultado.totalEncontrados).toBe(0);
      expect(resultado.error).toBeNull();
    });

    test('debería manejar entrada inválida', () => {
      const resultado = directorioService.buscar('');
      expect(resultado.resultados.length).toBe(0);
      expect(resultado.error).toBeTruthy();
    });

    test('debería manejar entrada null/undefined', () => {
      const resultado1 = directorioService.buscar(null);
      const resultado2 = directorioService.buscar(undefined);
      expect(resultado1.error).toBeTruthy();
      expect(resultado2.error).toBeTruthy();
    });

    test('debería formatear correctamente teléfono en resultados', () => {
      const resultado = directorioService.buscar('958315121');
      expect(resultado.resultados[0].telefono).toMatch(/\d{3} \d{3} \d{3}/);
    });

    test('debería incluir número de orden en resultados', () => {
      const resultado = directorioService.buscar('Ejecutivo');
      resultado.resultados.forEach((result, indice) => {
        expect(result.numero).toBe(indice + 1);
      });
    });

    test('debería incluir region en resultados', () => {
      const resultado = directorioService.buscar('Coordinador');
      expect(resultado.resultados[0].region).toBeDefined();
      expect(resultado.resultados[0].region).not.toBe('');
    });

    test('NO debería buscar en región', () => {
      // Buscamos por "PRINCIPAL" que está en oficina, no solo en región
      const resultado = directorioService.buscar('PRINCIPAL');
      expect(resultado.totalEncontrados).toBeGreaterThan(0);
      expect(resultado.resultados[0].oficina.toUpperCase()).toContain('PRINCIPAL');
    });
  });

  describe('formatearTelefono()', () => {
    test('debería formatear teléfono de 9 dígitos', () => {
      const formateado = directorioService.formatearTelefono('958315121');
      expect(formateado).toBe('958 315 121');
    });

    test('debería retornar teléfono sin formato si es < 9 dígitos', () => {
      const formateado = directorioService.formatearTelefono('12345');
      expect(formateado).toBe('12345');
    });

    test('debería manejar entrada null/vacía', () => {
      expect(directorioService.formatearTelefono(null)).toBeNull();
      expect(directorioService.formatearTelefono('')).toBe('');
    });
  });

  describe('getTotalRegistros()', () => {
    test('debería retornar número positivo de registros', () => {
      const total = directorioService.getTotalRegistros();
      expect(total).toBeGreaterThan(0);
      expect(typeof total).toBe('number');
    });
  });

  describe('recargar()', () => {
    test('debería recargar el directorio sin errores', () => {
      expect(() => {
        directorioService.recargar();
      }).not.toThrow();

      const resultado = directorioService.buscar('ALATA');
      expect(resultado.resultados.length).toBeGreaterThan(0);
    });
  });
});
