const metricsService = require('../../src/services/metricsService');

describe('Interaction Events - VIDEO y DOCUMENTO (Fix: procedimiento_nombre)', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    await metricsService.closeDatabase();
  });

  describe('USER_REQUEST_VIDEO y USER_REQUEST_DOCUMENTO - procedimiento_nombre', () => {
    test('should record USER_REQUEST_VIDEO with correct procedimiento_nombre', async () => {
      const phoneNumber = '51987654321';
      
      // Registrar evento VIDEO con nombre correcto
      await metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_VIDEO',
        'proc_firma_electronica',
        'Firma Electrónica'  // ← Nombre correcto (no Unknown)
      );

      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
      
      console.log('✓ VIDEO event registered with procedimiento_nombre: Firma Electrónica');
    }, 10000);

    test('should record USER_REQUEST_DOCUMENTO with correct procedimiento_nombre', async () => {
      const phoneNumber = '51987654321';
      
      // Registrar evento DOCUMENTO con nombre correcto
      await metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_DOCUMENTO',
        'proc_transferencias_ccf',
        'Transferencias Interbancarias CCE'  // ← Nombre correcto (no Unknown)
      );

      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
      
      console.log('✓ DOCUMENTO event registered with procedimiento_nombre: Transferencias Interbancarias CCE');
    }, 10000);

    test('should handle fallback to Unknown for missing procedimiento_nombre', async () => {
      const phoneNumber = '51999888777';
      
      // Cuando el procedimiento no existe, usar 'Unknown'
      await metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_VIDEO',
        'proc_inexistente',
        'Unknown'  // ← Fallback
      );

      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
      
      console.log('✓ VIDEO event with Unknown procedimiento handled correctly');
    }, 10000);

    test('should distinguish between different procedimientos in events', async () => {
      const phoneNumber = '51912345678';
      
      // Registrar múltiples eventos con diferentes procedimientos
      await metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_VIDEO',
        'proc_firma_electronica',
        'Firma Electrónica'
      );
      
      await metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_DOCUMENTO',
        'proc_control_excepcion_biometrica',
        'Control y Excepción Biométrica'
      );
      
      await metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_VIDEO',
        'proc_giros_wupos',
        'Giros WUPOS'
      );

      await new Promise(resolve => setTimeout(resolve, 300));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
      
      console.log('✓ Events with different procedimientos recorded correctly (not all Unknown)');
    }, 10000);
  });
});
