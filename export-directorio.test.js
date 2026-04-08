/**
 * export-directorio.test.js
 * Tests para validar que los CSVs descargados incluyen datos del directorio
 * (región, oficina, establecimiento)
 * 
 * Phase 4G: Solución 1 - JOIN en tiempo de exportación
 */

const request = require('supertest');
const app = require('./app');
const metricsService = require('./src/services/metricsService');

describe('CSV Export with Directorio Data (region, oficina, establecimiento)', () => {
  
  beforeAll(async () => {
    // Inicializar BD
    await metricsService.initializeDatabase();
  });

  describe('getIAConsultationsForExport', () => {
    it('should include region, oficina, establecimiento from directorio', async () => {
      // Registrar una consulta IA
      // Nota: No especificamos teléfono real de directorio para no asumir datos
      await metricsService.recordIAConsultation(
        '984123456',  // Teléfono genérico de prueba
        'Firma Electrónica',
        'Chat General',
        'Test query',
        'Test response',
        'rag',
        'conv_123',
        'test_sources.json'
      );

      // Obtener datos de exportación
      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const consultations = await metricsService.getIAConsultationsForExport(fromDate, toDate);
      
      // Validar que tiene al menos 1 registro
      expect(consultations.length).toBeGreaterThan(0);
      
      // Validar que las columnas existen
      const row = consultations[0];
      expect(row).toHaveProperty('region');
      expect(row).toHaveProperty('oficina');
      expect(row).toHaveProperty('establecimiento');
      expect(row).toHaveProperty('phone_number');
      
      // Validar que si no existe en directorio, es N/A
      if (row.phone_number === '984123456') {
        expect(row.region).toBe('N/A');
        expect(row.oficina).toBe('N/A');
        expect(row.establecimiento).toBe('N/A');
      }
      
      console.log('✓ IA consultation has directorio fields:', {
        phone: row.phone_number,
        region: row.region,
        oficina: row.oficina,
        establecimiento: row.establecimiento
      });
    });

    it('should match phone_number from ia_consultations with telefono from directorio', async () => {
      // Este test verifica que la estructura del JOIN es correcta
      // Registrar consulta con un teléfono de prueba
      await metricsService.recordIAConsultation(
        '999888777',
        'Chat General',
        'Chat General',
        'Test query',
        'Test response',
        'rag',
        'conv_456',
        'test_sources.json'
      );

      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const consultations = await metricsService.getIAConsultationsForExport(fromDate, toDate);
      
      // Buscar el registro
      const row = consultations.find(r => r.phone_number === '999888777');
      expect(row).toBeDefined();
      
      // Debe tener las columnas directorio (aunque sean N/A si no está en directorio)
      expect(row.region).toBeDefined();
      expect(row.oficina).toBeDefined();
      expect(row.establecimiento).toBeDefined();
      
      console.log('✓ Directorio columns present for:', {
        phone: row.phone_number,
        region: row.region,
        oficina: row.oficina,
        establecimiento: row.establecimiento
      });
    });
  });

  describe('getEventsForExport', () => {
    it('should include region, oficina, establecimiento columns in events export', async () => {
      // Registrar un evento
      await metricsService.recordEvent(
        '984333444',
        'USER_REQUEST_VIDEO',
        'proc_123',
        'Firma Electrónica'
      );

      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const events = await metricsService.getEventsForExport(fromDate, toDate);
      
      // Validar que tiene al menos 1 registro
      expect(events.length).toBeGreaterThan(0);
      
      // Validar que las columnas existen
      const row = events[0];
      expect(row).toHaveProperty('region');
      expect(row).toHaveProperty('oficina');
      expect(row).toHaveProperty('establecimiento');
      expect(row).toHaveProperty('phone_number');
      
      console.log('✓ Event has directorio fields:', {
        phone: row.phone_number,
        region: row.region,
        oficina: row.oficina,
        establecimiento: row.establecimiento
      });
    });

    it('should handle multiple events with consistent join behavior', async () => {
      // Registrar múltiples eventos
      await metricsService.recordEvent(
        '982111222',
        'USER_REQUEST_DOCUMENTO',
        'proc_456',
        'Transferencias'
      );

      await metricsService.recordEvent(
        '987555666',
        'USER_REQUEST_VIDEO',
        'proc_789',
        'Consultas'
      );

      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const events = await metricsService.getEventsForExport(fromDate, toDate);
      
      // Validar que todos los eventos tienen las columnas
      for (const event of events) {
        expect(event).toHaveProperty('region');
        expect(event).toHaveProperty('oficina');
        expect(event).toHaveProperty('establecimiento');
      }
      
      console.log(`✓ All ${events.length} events have directorio columns`);
    });
  });

  describe('CSV Download Endpoint', () => {
    it('should have region, oficina, establecimiento in CSV query results', async () => {
      // Obtener la consulta directa de metricsService (sin usar endpoint)
      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      
      const consultations = await metricsService.getIAConsultationsForExport(fromDate, toDate);
      const events = await metricsService.getEventsForExport(fromDate, toDate);
      
      // Validar que los primeros registros tienen las nuevas columnas
      if (consultations.length > 0) {
        const keys = Object.keys(consultations[0]);
        expect(keys).toContain('region');
        expect(keys).toContain('oficina');
        expect(keys).toContain('establecimiento');
        console.log('✓ IA Consultations export has columns:', {
          hasRegion: keys.includes('region'),
          hasOficina: keys.includes('oficina'),
          hasEstablecimiento: keys.includes('establecimiento')
        });
      }

      if (events.length > 0) {
        const keys = Object.keys(events[0]);
        expect(keys).toContain('region');
        expect(keys).toContain('oficina');
        expect(keys).toContain('establecimiento');
        console.log('✓ Events export has columns:', {
          hasRegion: keys.includes('region'),
          hasOficina: keys.includes('oficina'),
          hasEstablecimiento: keys.includes('establecimiento')
        });
      }
    });
  });
});
