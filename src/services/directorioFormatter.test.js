const DirectorioFormatter = require('./directorioFormatter');

describe('DirectorioFormatter', () => {
  const resultadoEjemplo = {
    numero: 1,
    nombreCompleto: 'ALATA PAYE CARLOS EDUARDO',
    telefono: '958 315 121',
    cargo: 'Coordinador de Operaciones',
    oficina: 'Puno Sur – Of. Juliaca',
    region: 'Puno Sur',
    establecimiento: ''
  };

  const resultadoCompleto = {
    numero: 2,
    nombreCompleto: 'HANI VILCA EDUARDO ALFREDO',
    telefono: '968 759 397',
    cargo: 'Ejecutivo de Servicios',
    oficina: 'Puno Sur – Of. Juliaca',
    region: 'Puno Sur',
    establecimiento: 'EOB Lampa'
  };

  describe('formatearResultado()', () => {
    test('debería formatear resultado correctamente', () => {
      const formateado = DirectorioFormatter.formatearResultado(resultadoEjemplo);
      expect(formateado).toContain('ALATA PAYE CARLOS EDUARDO');
      expect(formateado).toContain('958 315 121');
      expect(formateado).toContain('Coordinador de Operaciones');
    });

    test('debería incluir emojis de identificación', () => {
      const formateado = DirectorioFormatter.formatearResultado(resultadoEjemplo);
      expect(formateado).toContain('🔹');
      expect(formateado).toContain('📞');
      expect(formateado).toContain('💼');
      expect(formateado).toContain('🏢');
      expect(formateado).toContain('🌍');
    });

    test('debería excluir 🏬 si no hay establecimiento', () => {
      const formateado = DirectorioFormatter.formatearResultado(resultadoEjemplo);
      expect(formateado).not.toContain('🏬');
    });

    test('debería incluir 🏬 si hay establecimiento', () => {
      const formateado = DirectorioFormatter.formatearResultado(resultadoCompleto);
      expect(formateado).toContain('🏬');
      expect(formateado).toContain('EOB Lampa');
    });

    test('debería incluir región con emoji 🌍', () => {
      const formateado = DirectorioFormatter.formatearResultado(resultadoEjemplo);
      expect(formateado).toContain('🌍 Región: Puno Sur');
    });

    test('debería retornar string vacío para resultado null', () => {
      expect(DirectorioFormatter.formatearResultado(null)).toBe('');
    });

    test('debería retornar string vacío para resultado undefined', () => {
      expect(DirectorioFormatter.formatearResultado(undefined)).toBe('');
    });

    test('debería incluir número de resultado', () => {
      const formateado = DirectorioFormatter.formatearResultado(resultadoEjemplo);
      expect(formateado).toMatch(/🔹 1\./);
    });
  });

  describe('formatearMultiplesResultados()', () => {
    test('debería formatear múltiples resultados separados por líneas en blanco', () => {
      const resultados = [resultadoEjemplo, resultadoCompleto];
      const formateado = DirectorioFormatter.formatearMultiplesResultados(resultados);
      expect(formateado).toContain('ALATA PAYE');
      expect(formateado).toContain('HANI VILCA');
      expect(formateado.split('\n\n').length).toBeGreaterThan(1);
    });

    test('debería incluir advertencia si hayMas=true', () => {
      const resultados = [resultadoEjemplo];
      const formateado = DirectorioFormatter.formatearMultiplesResultados(resultados, true);
      expect(formateado).toContain('Hay más resultados');
      expect(formateado).toContain('Proporciona más contexto');
    });

    test('debería no incluir advertencia si hayMas=false', () => {
      const resultados = [resultadoEjemplo];
      const formateado = DirectorioFormatter.formatearMultiplesResultados(resultados, false);
      expect(formateado).not.toContain('Hay más resultados');
    });

    test('debería retornar string vacío si no hay resultados', () => {
      expect(DirectorioFormatter.formatearMultiplesResultados([])).toBe('');
      expect(DirectorioFormatter.formatearMultiplesResultados(null)).toBe('');
    });
  });

  describe('formatearResultadosConEncabezado()', () => {
    test('debería incluir encabezado de cantidad de resultados', () => {
      const resultados = [resultadoEjemplo];
      const formateado = DirectorioFormatter.formatearResultadosConEncabezado(resultados, 1);
      expect(formateado).toContain('📊');
      expect(formateado).toContain('1 resultado encontrado');
    });

    test('debería usar plural para múltiples resultados', () => {
      const resultados = [resultadoEjemplo, resultadoCompleto];
      const formateado = DirectorioFormatter.formatearResultadosConEncabezado(resultados, 2);
      expect(formateado).toContain('2 resultados encontrado');
    });

    test('debería mostrar "Mostrando 5 de X" cuando hay más de 5 resultados', () => {
      const resultados = [resultadoEjemplo];
      const formateado = DirectorioFormatter.formatearResultadosConEncabezado(resultados, 15, true);
      expect(formateado).toContain('Mostrando 5 de 15');
    });

    test('debería retornar string vacío si no hay resultados', () => {
      expect(DirectorioFormatter.formatearResultadosConEncabezado([], 0)).toBe('');
    });
  });

  describe('formatearMensajeFinal()', () => {
    test('debería agregar opciones de continuación', () => {
      const contenido = 'Resultado de búsqueda';
      const mensaje = DirectorioFormatter.formatearMensajeFinal(contenido);
      expect(mensaje).toContain('¿Deseas continuar');
      expect(mensaje).toContain('Volver al Menú Principal');
    });

    test('debería incluir emojis de búsqueda y volver', () => {
      const contenido = 'Resultado';
      const mensaje = DirectorioFormatter.formatearMensajeFinal(contenido);
      expect(mensaje).toContain('🔍');
      expect(mensaje).toContain('🔙');
    });

    test('debería agregar advertencia si hayMas=true', () => {
      const contenido = 'Resultado';
      const mensaje = DirectorioFormatter.formatearMensajeFinal(contenido, true);
      expect(mensaje).toContain('Hay más resultados');
    });

    test('debería no agregar advertencia si hayMas=false', () => {
      const contenido = 'Resultado';
      const mensaje = DirectorioFormatter.formatearMensajeFinal(contenido, false);
      const primeraMencion = mensaje.indexOf('Hay más resultados');
      expect(primeraMencion).toBe(-1);
    });
  });

  describe('validarResultado()', () => {
    test('debería retornar true para resultado válido', () => {
      expect(DirectorioFormatter.validarResultado(resultadoEjemplo)).toBe(true);
    });

    test('debería retornar false si falta nombreCompleto', () => {
      const invalido = { ...resultadoEjemplo, nombreCompleto: undefined };
      expect(DirectorioFormatter.validarResultado(invalido)).toBe(false);
    });

    test('debería retornar false si falta telefono', () => {
      const invalido = { ...resultadoEjemplo, telefono: undefined };
      expect(DirectorioFormatter.validarResultado(invalido)).toBe(false);
    });

    test('debería retornar false para null o undefined', () => {
      expect(DirectorioFormatter.validarResultado(null)).toBe(false);
      expect(DirectorioFormatter.validarResultado(undefined)).toBe(false);
    });

    test('debería retornar false si no es objeto', () => {
      expect(DirectorioFormatter.validarResultado('string')).toBe(false);
      expect(DirectorioFormatter.validarResultado(123)).toBe(false);
    });
  });

  describe('validarResultados()', () => {
    test('debería retornar true para array válido de resultados', () => {
      expect(DirectorioFormatter.validarResultados([resultadoEjemplo, resultadoCompleto])).toBe(
        true
      );
    });

    test('debería retornar true para array vacío', () => {
      expect(DirectorioFormatter.validarResultados([])).toBe(true);
    });

    test('debería retornar false si algún elemento es inválido', () => {
      const invalidos = [resultadoEjemplo, { nombres: 'Sin teléfono' }];
      expect(DirectorioFormatter.validarResultados(invalidos)).toBe(false);
    });

    test('debería retornar false para null o undefined', () => {
      expect(DirectorioFormatter.validarResultados(null)).toBe(false);
      expect(DirectorioFormatter.validarResultados(undefined)).toBe(false);
    });

    test('debería retornar false si no es array', () => {
      expect(DirectorioFormatter.validarResultados('no es array')).toBe(false);
      expect(DirectorioFormatter.validarResultados({})).toBe(false);
    });
  });
});
