/**
 * Tests para logger.js
 */

const logger = require('./logger');

describe('Logger Module', () => {
  // Mock console methods
  let consoleLog, consoleError, consoleWarn;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  describe('info()', () => {
    it('debe llamar a console.log', () => {
      logger.info('Mensaje de prueba');
      expect(consoleLog).toHaveBeenCalled();
    });

    it('debe incluir el mensaje', () => {
      logger.info('Mensaje de prueba');
      const call = consoleLog.mock.calls[0];
      expect(call.some(arg => arg.includes('Mensaje de prueba'))).toBe(true);
    });

    it('debe incluir timestamp', () => {
      logger.info('Mensaje');
      const call = consoleLog.mock.calls[0];
      expect(call.some(arg => arg.includes(':'))).toBe(true); // Contiene timestamp
    });

    it('debe incluir "INFO"', () => {
      logger.info('Mensaje');
      const call = consoleLog.mock.calls[0];
      expect(call.some(arg => arg.includes('INFO'))).toBe(true);
    });

    it('debe aceptar parámetro de datos', () => {
      const datos = { id: 1, nombre: 'test' };
      logger.info('Mensaje', datos);
      expect(consoleLog).toHaveBeenCalledTimes(2);
    });
  });

  describe('error()', () => {
    it('debe llamar a console.error', () => {
      logger.error('Error de prueba');
      expect(consoleError).toHaveBeenCalled();
    });

    it('debe incluir el mensaje de error', () => {
      logger.error('Error de prueba');
      const call = consoleError.mock.calls[0];
      expect(call.some(arg => arg.includes('Error de prueba'))).toBe(true);
    });

    it('debe incluir "ERROR"', () => {
      logger.error('Error');
      const call = consoleError.mock.calls[0];
      expect(call.some(arg => arg.includes('ERROR'))).toBe(true);
    });

    it('debe aceptar parámetro de error', () => {
      const error = new Error('Test error');
      logger.error('Mensaje', error);
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('success()', () => {
    it('debe llamar a console.log', () => {
      logger.success('Éxito');
      expect(consoleLog).toHaveBeenCalled();
    });

    it('debe incluir el mensaje de éxito', () => {
      logger.success('Operación exitosa');
      const call = consoleLog.mock.calls[0];
      expect(call.some(arg => arg.includes('Operación exitosa'))).toBe(true);
    });

    it('debe incluir "SUCCESS"', () => {
      logger.success('OK');
      const call = consoleLog.mock.calls[0];
      expect(call.some(arg => arg.includes('SUCCESS'))).toBe(true);
    });
  });

  describe('warning()', () => {
    it('debe llamar a console.warn', () => {
      logger.warning('Advertencia');
      expect(consoleWarn).toHaveBeenCalled();
    });

    it('debe incluir el mensaje de advertencia', () => {
      logger.warning('Cuidado');
      const call = consoleWarn.mock.calls[0];
      expect(call.some(arg => arg.includes('Cuidado'))).toBe(true);
    });

    it('debe incluir "WARN"', () => {
      logger.warning('Aviso');
      const call = consoleWarn.mock.calls[0];
      expect(call.some(arg => arg.includes('WARN'))).toBe(true);
    });
  });

  describe('debug()', () => {
    it('debe solo funcionar en desarrollo', () => {
      const originalEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');
      expect(consoleLog).toHaveBeenCalled();
      
      consoleLog.mockClear();
      
      process.env.NODE_ENV = 'production';
      logger.debug('Debug message');
      expect(consoleLog).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('debe incluir "DEBUG" en desarrollo', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      logger.debug('Debug');
      const call = consoleLog.mock.calls[consoleLog.mock.calls.length - 1];
      expect(call.some(arg => arg.includes('DEBUG'))).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Funcionalidad general', () => {
    it('debe aceptar cualquier tipo de mensaje', () => {
      expect(() => logger.info(123)).not.toThrow();
      expect(() => logger.info(true)).not.toThrow();
      expect(() => logger.info(null)).not.toThrow();
      expect(() => logger.info(undefined)).not.toThrow();
    });

    it('debe aceptar cualquier tipo de datos', () => {
      expect(() => logger.info('msg', { key: 'value' })).not.toThrow();
      expect(() => logger.info('msg', [1, 2, 3])).not.toThrow();
      expect(() => logger.info('msg', 'string')).not.toThrow();
    });

    it('debe tener métodos consistentes', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.success).toBe('function');
      expect(typeof logger.warning).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Colores en la consola', () => {
    it('debe incluir códigos de color ANSI', () => {
      logger.info('Test');
      const call = consoleLog.mock.calls[0];
      const hasColorCode = call.some(arg => 
        typeof arg === 'string' && arg.includes('\x1b[')
      );
      expect(hasColorCode).toBe(true);
    });

    it('debe resetear colores después de cada mensaje', () => {
      logger.info('Test');
      const call = consoleLog.mock.calls[0];
      const hasReset = call.some(arg => 
        typeof arg === 'string' && arg.includes('\x1b[0m')
      );
      expect(hasReset).toBe(true);
    });
  });

  describe('Casos especiales', () => {
    it('debe manejar mensajes muy largos', () => {
      const mensajeLargo = 'a'.repeat(10000);
      expect(() => logger.info(mensajeLargo)).not.toThrow();
    });

    it('debe manejar caracteres especiales', () => {
      expect(() => logger.info('!@#$%^&*()')).not.toThrow();
      expect(() => logger.info('émojis: 👋 🚀')).not.toThrow();
    });

    it('debe manejar saltos de línea', () => {
      expect(() => logger.info('línea 1\nlínea 2')).not.toThrow();
    });

    it('debe manejar objetos circulares', () => {
      const obj = { a: 1 };
      obj.self = obj;
      expect(() => logger.info('Circular', obj)).not.toThrow();
    });
  });
});
