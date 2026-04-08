const DirectorioService = require('../../../src/services/directorioService');

/**
 * Tests para DirectorioService - Fase 1: Búsqueda Mejorada
 * Incluye:
 * - Stop words (ignorar "de", "la", etc)
 * - Filtros por campo (cargo:, oficina:, establecimiento:)
 * - Sistema de puntuación y ranking
 * - Coincidencia exacta primero
 * - Casos de uso reales
 */

describe('DirectorioService - Fase 1: Búsqueda Mejorada', () => {
  let directorioService;

  beforeEach(() => {
    directorioService = require('./directorioService');
    directorioService.recargar();
  });

  // ============ TESTS DE MÉTODOS NUEVOS (FASE 1) ============

  describe('getStopWords()', () => {
    test('debería retornar un Set de palabras vacías', () => {
      const stopWords = directorioService.getStopWords();

      expect(stopWords).toBeInstanceOf(Set);
      expect(stopWords.has('de')).toBe(true);
      expect(stopWords.has('la')).toBe(true);
      expect(stopWords.has('el')).toBe(true);
      expect(stopWords.has('y')).toBe(true);
      expect(stopWords.has('para')).toBe(true);
    });

    test('no debería contener palabras relevantes', () => {
      const stopWords = directorioService.getStopWords();

      expect(stopWords.has('jefe')).toBe(false);
      expect(stopWords.has('ejecutivo')).toBe(false);
      expect(stopWords.has('oficina')).toBe(false);
    });
  });

  describe('extraerFiltros()', () => {
    test('debería extraer filtro de cargo', () => {
      const resultado = directorioService.extraerFiltros('cargo:jefe');

      expect(resultado.palabras).toEqual([]);
      expect(resultado.filtros).toEqual({ cargo: 'jefe' });
    });

    test('debería extraer múltiples filtros', () => {
      const resultado = directorioService.extraerFiltros('cargo:jefe oficina:puno');

      expect(resultado.palabras).toEqual([]);
      expect(resultado.filtros.cargo).toBe('jefe');
      expect(resultado.filtros.oficina).toBe('puno');
    });

    test('debería mezclar palabras y filtros', () => {
      const resultado = directorioService.extraerFiltros('juan cargo:ejecutivo');

      expect(resultado.palabras).toContain('juan');
      expect(resultado.filtros.cargo).toBe('ejecutivo');
    });

    test('debería ignorar filtros inválidos', () => {
      const resultado = directorioService.extraerFiltros('region:norte cargo:jefe');

      expect(resultado.palabras).toContain('region:norte');
      expect(resultado.filtros.cargo).toBe('jefe');
    });

    test('debería manejar entrada vacía', () => {
      const resultado = directorioService.extraerFiltros('');

      expect(resultado.palabras).toEqual([]);
      expect(Object.keys(resultado.filtros).length).toBe(0);
    });
  });

  describe('calcularPuntuacion()', () => {
    const registroEjemplo = {
      nombreCompleto: 'JUAN CARLOS PEREZ',
      cargo: 'EJECUTIVO DE SERVICIOS',
      oficina: 'OFICINA LIMA',
      establecimiento: 'EOB LIMA',
      telefono: '987654321'
    };

    test('debería dar máxima puntuación a coincidencia exacta de nombre', () => {
      const puntuacion = directorioService.calcularPuntuacion(
        registroEjemplo,
        ['juan', 'carlos', 'perez'],
        {}
      );

      expect(puntuacion).toBeGreaterThan(0);
    });

    test('debería penalizar (-1) registros que no cumplen filtros', () => {
      const resultado = directorioService.calcularPuntuacion(
        registroEjemplo,
        ['juan'],
        { cargo: 'supervisor' } // El registro NO es supervisor
      );

      expect(resultado).toBe(-1);
    });

    test('debería bonificar cuando cumple filtro de cargo', () => {
      const conFiltro = directorioService.calcularPuntuacion(
        registroEjemplo,
        ['juan'],
        { cargo: 'ejecutivo de servicios' }
      );

      const sinFiltro = directorioService.calcularPuntuacion(
        registroEjemplo,
        ['juan'],
        {}
      );

      expect(conFiltro).toBeGreaterThan(sinFiltro);
    });

    test('debería manejar registro con campos vacíos', () => {
      const registroIncompleto = {
        nombreCompleto: 'JUAN PEREZ',
        cargo: '',
        oficina: '',
        establecimiento: '',
        telefono: ''
      };

      const puntuacion = directorioService.calcularPuntuacion(
        registroIncompleto,
        ['juan'],
        {}
      );

      expect(puntuacion).toBeGreaterThan(0);
    });
  });

  // ============ TESTS DE BÚSQUEDA (RETROCOMPATIBILIDAD + MEJORAS) ============

  describe('buscar() - Búsqueda básica', () => {
    test('debería encontrar registros por teléfono exacto', () => {
      const resultado = directorioService.buscar('958315121');
      expect(resultado.resultados.length).toBeGreaterThan(0);
      expect(resultado.resultados[0].telefono).toMatch(/\d{3}\s\d{3}\s\d{3}/);
    });

    test('debería encontrar registros por nombre', () => {
      const resultado = directorioService.buscar('JHOVANNA');
      expect(resultado.resultados.length).toBeGreaterThan(0);
    });

    test('debería encontrar registros por cargo', () => {
      const resultado = directorioService.buscar('EJECUTIVO');
      expect(resultado.resultados.length).toBeGreaterThan(0);
    });

    test('debería retornar error con búsqueda vacía', () => {
      const resultado = directorioService.buscar('');

      expect(resultado.error).toBeTruthy();
      expect(resultado.totalEncontrados).toBe(0);
    });

    test('debería retornar error con entrada null/undefined', () => {
      const resultado1 = directorioService.buscar(null);
      const resultado2 = directorioService.buscar(undefined);

      expect(resultado1.error).toBeTruthy();
      expect(resultado2.error).toBeTruthy();
    });

    test('debería hacer búsqueda case-insensitive', () => {
      const resultado1 = directorioService.buscar('jefe');
      const resultado2 = directorioService.buscar('JEFE');

      expect(resultado1.totalEncontrados).toBe(resultado2.totalEncontrados);
    });

    test('debería limitar a 5 resultados', () => {
      const resultado = directorioService.buscar('ejecutivo');

      expect(resultado.resultados.length).toBeLessThanOrEqual(5);
    });

    test('debería indicar hayMas si hay más de 5 resultados', () => {
      const resultado = directorioService.buscar('ejecutivo');

      if (resultado.totalEncontrados > 5) {
        expect(resultado.hayMas).toBe(true);
      }
    });

    test('debería retornar estructura consistente', () => {
      const resultado = directorioService.buscar('ejecutivo');

      if (resultado.resultados.length > 0) {
        const primer = resultado.resultados[0];
        expect(primer).toHaveProperty('numero');
        expect(primer).toHaveProperty('nombreCompleto');
        expect(primer).toHaveProperty('telefono');
        expect(primer).toHaveProperty('cargo');
        expect(primer).toHaveProperty('oficina');
        expect(primer).toHaveProperty('relevancia');
      }
    });
  });

  describe('buscar() - Mejoras Fase 1', () => {
    test('debería ignorar stop words en búsqueda', () => {
      // "de" es un stop word y debe ignorarse
      const resultado = directorioService.buscar('jefe de oficina');

      expect(resultado.error).toBeNull();
      expect(resultado.resultados).toBeInstanceOf(Array);
    });

    test('debería buscar por filtro de cargo', () => {
      const resultado = directorioService.buscar('cargo:ejecutivo');

      expect(resultado.error).toBeNull();
      resultado.resultados.forEach(r => {
        expect(r.cargo.toLowerCase()).toContain('ejecutivo');
      });
    });

    test('debería buscar por filtro de oficina', () => {
      const resultado = directorioService.buscar('oficina:lima');

      expect(resultado.error).toBeNull();
      resultado.resultados.forEach(r => {
        expect(r.oficina.toLowerCase()).toContain('lima');
      });
    });

    test('debería buscar por filtro de establecimiento', () => {
      const resultado = directorioService.buscar('establecimiento:eob');

      expect(resultado.error).toBeNull();
      resultado.resultados.forEach(r => {
        expect(r.establecimiento.toLowerCase()).toContain('eob');
      });
    });

    test('debería combinar palabra + filtro', () => {
      const resultado = directorioService.buscar('jefe oficina:lima');

      expect(resultado.error).toBeNull();
      resultado.resultados.forEach(r => {
        expect(r.oficina.toLowerCase()).toContain('lima');
      });
    });

    test('debería ordenar por relevancia (puntuación descendente)', () => {
      const resultado = directorioService.buscar('ejecutivo');

      for (let i = 0; i < resultado.resultados.length - 1; i++) {
        expect(resultado.resultados[i].relevancia).toBeGreaterThanOrEqual(
          resultado.resultados[i + 1].relevancia
        );
      }
    });

    test('debería rechazar búsquedas solo de stop words', () => {
      const resultado = directorioService.buscar('de la y');

      expect(resultado.error).toBeTruthy();
    });

    test('debería incluir campo relevancia en resultados', () => {
      const resultado = directorioService.buscar('ejecutivo');

      if (resultado.resultados.length > 0) {
        expect(resultado.resultados[0].relevancia).toBeDefined();
        expect(typeof resultado.resultados[0].relevancia).toBe('number');
      }
    });
  });

  // ============ TESTS DE UTILIDADES ============

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
    test('debería retornar número positivo', () => {
      const total = directorioService.getTotalRegistros();
      expect(total).toBeGreaterThan(0);
      expect(typeof total).toBe('number');
    });
  });

  describe('recargar()', () => {
    test('debería recargar sin errores', () => {
      expect(() => {
        directorioService.recargar();
      }).not.toThrow();

      const resultado = directorioService.buscar('ejecutivo');
      expect(resultado.resultados).toBeInstanceOf(Array);
    });
  });
});
