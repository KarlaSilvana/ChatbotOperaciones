const s3Service = require('../../../src/services/s3Service');
const menusConfig = require('../../src/bot/menus');

describe('S3Service', () => {
  
  test('debería inicializarse correctamente', () => {
    const info = s3Service.getInfo();
    expect(info).toHaveProperty('bucket');
    expect(info).toHaveProperty('region');
    expect(info).toHaveProperty('urlType');
    expect(info.bucket).toBe('chatbot-media-operaciones');
    expect(info.urlType).toBe('public-permanent');
  });

  test('debería generar URL correcta para video', async () => {
    const procedimientoId = 'firma_electronica';
    const url = await s3Service.getVideoUrl(procedimientoId);
    
    expect(url).toBeDefined();
    expect(url).toContain('https://');
    expect(url).toContain('chatbot-media-operaciones');
    expect(url).toContain('procedimientos');
    expect(url).toContain('firma_electronica');
    expect(url).toContain('video.mp4');
    expect(url).toBe('https://chatbot-media-operaciones.s3.us-east-1.amazonaws.com/procedimientos/firma_electronica/video.mp4');
  });

  test('debería generar URL correcta para documento', async () => {
    const procedimientoId = 'control_biometrico';
    const url = await s3Service.getDocumentoUrl(procedimientoId);
    
    expect(url).toBeDefined();
    expect(url).toContain('https://');
    expect(url).toContain('chatbot-media-operaciones');
    expect(url).toContain('procedimientos');
    expect(url).toContain('control_biometrico');
    expect(url).toContain('documento.pdf');
    expect(url).toBe('https://chatbot-media-operaciones.s3.us-east-1.amazonaws.com/procedimientos/control_biometrico/documento.pdf');
  });

  test('debería generar URLs para todos los procedimientos', async () => {
    const procedimientos = menusConfig.procedimientos;
    
    for (const proc of procedimientos) {
      const videoUrl = await s3Service.getVideoUrl(proc.id);
      const docUrl = await s3Service.getDocumentoUrl(proc.id);
      
      expect(videoUrl).toBeDefined();
      expect(videoUrl).toContain(proc.id);
      expect(videoUrl).toContain('video.mp4');
      
      expect(docUrl).toBeDefined();
      expect(docUrl).toContain(proc.id);
      expect(docUrl).toContain('documento.pdf');
      
      console.log(`✅ ${proc.id}: Video URL y Documento URL generados correctamente`);
    }
  });

  test('debería generar URLs públicas (sin parámetros de firma)', async () => {
    const url = await s3Service.getVideoUrl('firma_electronica');
    
    // No debe contener parámetros de firma (X-Amz-Signature, X-Amz-Expires, etc)
    expect(url).not.toContain('X-Amz-Signature');
    expect(url).not.toContain('X-Amz-Expires');
    expect(url).not.toContain('X-Amz-Date');
    
    // Debe ser una URL simple y directa
    expect(url.split('?').length).toBe(1);
  });

  test('debería generar URLs accesibles desde cualquier lugar', async () => {
    const url = await s3Service.getVideoUrl('test');
    
    // URL debe ser HTTP/HTTPS
    expect(url).toMatch(/^https?:\/\//);
    
    // URL debe ser valida
    expect(() => new URL(url)).not.toThrow();
  });
});
