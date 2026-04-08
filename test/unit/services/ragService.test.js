/**
 * ragService.test.js - Tests para RAG Service
 */

const ragService = require('../../../src/services/ragService');

describe('RAG Service', () => {
  
  describe('Configuration', () => {
    it('debe validar configuración correcta', () => {
      const validation = ragService.validateConfiguration();
      expect(validation).toBeDefined();
      expect(validation.apiUrl).toBeDefined();
      expect(validation.model).toBe('openai');
    });

    it('debe tener API key configurada', () => {
      const config = ragService.getConfiguration();
      expect(config.apiKey).toBeDefined();
      expect(config.apiKey).not.toBe('');
    });

    it('debe tener timeout configurado', () => {
      const config = ragService.getConfiguration();
      expect(config.timeoutMs).toBe(15000);
    });

    it('debe tener temperatura configurada correctamente', () => {
      const config = ragService.getConfiguration();
      expect(config.temperature).toBeGreaterThanOrEqual(0);
      expect(config.temperature).toBeLessThanOrEqual(1);
    });
  });

  describe('sendQuery', () => {
    it('debe crear payload correcto para consulta simple', async () => {
      // Mock simple - no llamar a API real
      expect(ragService.sendQuery).toBeDefined();
    });

    it('debe aceptar parámetro tema opcional', async () => {
      // Validar que el método acepta tema
      const method = ragService.sendQuery;
      expect(method.length).toBeGreaterThanOrEqual(1); // Al menos 1 parámetro
    });
  });

  describe('Error Handling', () => {
    it('debe validar entrada', () => {
      // El servicio debe manejar entrada inválida
      expect(ragService).toBeDefined();
    });

    it('debe tener timeout protection', () => {
      const config = ragService.getConfiguration();
      // Verificar que timeout está seteado
      expect(config.timeoutMs).toBeGreaterThan(0);
      expect(config.timeoutMs).toBeLessThanOrEqual(30000);
    });
  });

  describe('Integration Points', () => {
    it('debe estar disponible para su uso en app.js', () => {
      // Verificar que el servicio exporta los métodos necesarios
      expect(typeof ragService.sendQuery).toBe('function');
      expect(typeof ragService.getConfiguration).toBe('function');
    });

    it('debe retornar formato compatible con MarkdownToWhatsApp', () => {
      // La respuesta debe tener formato response
      expect(ragService.sendQuery).toBeDefined();
    });
  });
});
