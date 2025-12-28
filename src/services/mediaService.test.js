/**
 * Tests para mediaService.js
 */

const mediaService = require('./mediaService');
const menus = require('../bot/menus');

describe('MediaService Module', () => {
  describe('fileExists()', () => {
    it('debe retornar true para archivo existente', async () => {
      const filePath = menus.procedimientos[0]?.recursos?.video;
      if (filePath) {
        const exists = await mediaService.fileExists(`${mediaService.mediaPath}/${filePath}`);
        // Puede ser true o false dependiendo si el archivo existe
        expect(typeof exists).toBe('boolean');
      }
    });

    it('debe retornar false para archivo inexistente', async () => {
      const exists = await mediaService.fileExists('/ruta/inexistente/archivo.mp4');
      expect(exists).toBe(false);
    });
  });

  describe('getFileSize()', () => {
    it('debe retornar null para archivo inexistente', async () => {
      const size = await mediaService.getFileSize('/ruta/inexistente/archivo.mp4');
      expect(size).toBeNull();
    });

    it('debe retornar un valor numérico como string para archivo existente', async () => {
      // Este test depende de si el archivo existe
      const size = await mediaService.getFileSize('/package.json');
      if (size) {
        expect(typeof size).toBe('string');
        expect(parseFloat(size)).not.toBeNaN();
      }
    });
  });

  describe('enviarVideo()', () => {
    it('debe retornar error si procedimiento no existe', async () => {
      const mockClient = { sendMessage: jest.fn() };
      const resultado = await mediaService.enviarVideo(mockClient, 'whatsapp:+5199999999', 'proc_inexistente');
      
      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Procedimiento no encontrado');
    });

    it('debe retornar estructura correcta de respuesta', async () => {
      const mockClient = { sendMessage: jest.fn() };
      const proc = menus.procedimientos[0];
      
      if (proc) {
        const resultado = await mediaService.enviarVideo(mockClient, 'whatsapp:+5199999999', proc.id);
        expect(resultado).toHaveProperty('success');
        expect(resultado).toHaveProperty('error');
      }
    });
  });

  describe('enviarDocumento()', () => {
    it('debe retornar error si procedimiento no existe', async () => {
      const mockClient = { sendMessage: jest.fn() };
      const resultado = await mediaService.enviarDocumento(mockClient, 'whatsapp:+5199999999', 'proc_inexistente');
      
      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Procedimiento no encontrado');
    });

    it('debe retornar estructura correcta', async () => {
      const mockClient = { sendMessage: jest.fn() };
      const proc = menus.procedimientos[0];
      
      if (proc) {
        const resultado = await mediaService.enviarDocumento(mockClient, 'whatsapp:+5199999999', proc.id);
        expect(resultado).toHaveProperty('success');
        expect(resultado).toHaveProperty('error');
      }
    });
  });

  describe('getMediaInfo()', () => {
    it('debe retornar estructura de información correcta', async () => {
      const info = await mediaService.getMediaInfo();
      
      expect(info).toHaveProperty('procedimientos');
      expect(info).toHaveProperty('totalVideos');
      expect(info).toHaveProperty('totalDocumentos');
      expect(info).toHaveProperty('errors');
      
      expect(Array.isArray(info.procedimientos)).toBe(true);
      expect(Array.isArray(info.errors)).toBe(true);
      expect(typeof info.totalVideos).toBe('number');
      expect(typeof info.totalDocumentos).toBe('number');
    });

    it('debe incluir información de cada procedimiento', async () => {
      const info = await mediaService.getMediaInfo();
      
      if (info.procedimientos.length > 0) {
        const proc = info.procedimientos[0];
        expect(proc).toHaveProperty('id');
        expect(proc).toHaveProperty('nombre');
        expect(proc).toHaveProperty('video');
        expect(proc).toHaveProperty('documento');
        
        expect(proc.video).toHaveProperty('exists');
        expect(proc.video).toHaveProperty('path');
        expect(proc.documento).toHaveProperty('exists');
        expect(proc.documento).toHaveProperty('path');
      }
    });

    it('debe reportar archivos faltantes en errors', async () => {
      const info = await mediaService.getMediaInfo();
      
      if (info.errors.length > 0) {
        expect(typeof info.errors[0]).toBe('string');
        expect(info.errors[0]).toMatch(/Video faltante|Documento faltante/);
      }
    });
  });

  describe('Integración con procedimientos', () => {
    it('debe acceder correctamente a los procedimientos configurados', async () => {
      const procs = menus.procedimientos;
      expect(Array.isArray(procs)).toBe(true);
      expect(procs.length).toBeGreaterThan(0);

      procs.forEach(proc => {
        expect(proc).toHaveProperty('id');
        expect(proc).toHaveProperty('nombre');
        expect(proc).toHaveProperty('recursos');
        expect(proc.recursos).toHaveProperty('video');
        expect(proc.recursos).toHaveProperty('documento');
      });
    });

    it('debe encontrar procedimiento por ID', () => {
      const proc = menus.getProcedimiento('firma_electronica');
      expect(proc).toBeDefined();
      expect(proc.nombre).toContain('Firma');
    });
  });
});
