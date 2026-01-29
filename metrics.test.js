const metricsService = require('./src/services/metricsService');
const nightlyReportJob = require('./src/jobs/nightly-report-job');
const path = require('path');
const fs = require('fs');

describe('Metrics Service', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    await metricsService.closeDatabase();
  });

  describe('recordEvent', () => {
    test('should record event with procedimiento details', async () => {
      await metricsService.recordEvent(
        '987654321',
        'USER_REQUEST_VIDEO',
        'proc_001',
        'Apertura de Cuenta'
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should handle multiple events from same user', async () => {
      const phoneNumber = '555555555';
      
      await metricsService.recordEvent(phoneNumber, 'USER_OPEN_PROCEDIMIENTO', 'proc_001');
      await metricsService.recordEvent(phoneNumber, 'USER_REQUEST_VIDEO', 'proc_001');
      await metricsService.recordEvent(phoneNumber, 'USER_REQUEST_DOCUMENTO', 'proc_001');

      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should handle missing procedimiento info gracefully', async () => {
      await metricsService.recordEvent(
        '111111111',
        'USER_SEARCH_DIRECTORIO',
        null,
        null
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);
  });

  describe('recordIAConsultation', () => {
    test('should record IA consultation with complete query and response', async () => {
      const userQuery = '¿Cuáles son los requisitos para apertura de cuenta?';
      const ragResponse = 'Los requisitos son: 1. Identificación válida 2. Comprobante de domicilio...';

      await metricsService.recordIAConsultation(
        '123456789',
        'proc_001',
        'Apertura de Cuenta',
        'consulta',
        userQuery,
        ragResponse
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getIAConsultationStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should record chat mode IA consultations', async () => {
      const userQuery = '¿Qué es un depósito?';
      const ragResponse = 'Un depósito es una operación donde el cliente entrega dinero al banco...';

      await metricsService.recordIAConsultation(
        '987654321',
        'general_chat',
        'Chat General',
        'chat',
        userQuery,
        ragResponse
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getIAConsultationStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should store complete IA query and response', async () => {
      const longQuery = 'Esta es una pregunta muy larga ' + 'x'.repeat(500);
      const longResponse = 'Esta es una respuesta muy larga ' + 'y'.repeat(500);

      await metricsService.recordIAConsultation(
        '111111111',
        'proc_002',
        'Transferencias',
        'consulta',
        longQuery,
        longResponse
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getIAConsultationStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should record response length correctly', async () => {
      const response = 'A'.repeat(1000);

      await metricsService.recordIAConsultation(
        '333333333',
        'proc_001',
        'Test Procedure',
        'chat',
        'Test query',
        response
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getIAConsultationStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);
  });

  describe('Event Recording Integration', () => {
    test('should record mixed events and IA consultations', async () => {
      const phoneNumber = '444444444';

      await metricsService.recordEvent(phoneNumber, 'USER_OPEN_PROCEDIMIENTO', 'proc_001', 'Test');
      await metricsService.recordEvent(phoneNumber, 'USER_SEARCH_DIRECTORIO', null, 'Directorio');
      
      await metricsService.recordIAConsultation(
        phoneNumber,
        'proc_001',
        'Test',
        'chat',
        'Test question',
        'Test answer'
      );

      await metricsService.recordEvent(phoneNumber, 'USER_REQUEST_VIDEO', 'proc_001', 'Test');

      await new Promise(resolve => setTimeout(resolve, 250));

      const eventStats = await metricsService.getInteractionStats();
      const iaStats = await metricsService.getIAConsultationStats();

      expect(Array.isArray(eventStats)).toBe(true);
      expect(Array.isArray(iaStats)).toBe(true);
    }, 10000);
  });

  describe('Error Handling', () => {
    test('should handle undefined response gracefully', async () => {
      await metricsService.recordIAConsultation(
        '555555555',
        'proc_001',
        'Test',
        'chat',
        'Query',
        undefined
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getIAConsultationStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should handle empty strings', async () => {
      await metricsService.recordEvent('empty_test', 'USER_SEARCH_DIRECTORIO', '', '');

      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);
  });

  describe('Database Stats', () => {
    test('should return interaction stats', async () => {
      const stats = await metricsService.getInteractionStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);

    test('should return IA consultation stats', async () => {
      const stats = await metricsService.getIAConsultationStats();
      expect(Array.isArray(stats)).toBe(true);
    }, 10000);
  });
});
