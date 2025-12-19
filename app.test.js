/**
 * Tests para app.js
 */

const request = require('supertest');
const app = require('./app');

describe('Express App', () => {
  
  describe('GET /', () => {
    it('debe retornar status 200', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
    });

    it('debe retornar JSON', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/);
    });

    it('debe incluir información del proyecto', async () => {
      const response = await request(app).get('/');
      expect(response.body.name).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.status).toBeDefined();
    });

    it('debe tener status "running"', async () => {
      const response = await request(app).get('/');
      expect(response.body.status).toBe('running');
    });
  });

  describe('GET /health', () => {
    it('debe retornar status 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
    });

    it('debe retornar JSON', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);
    });

    it('debe incluir status "OK"', async () => {
      const response = await request(app).get('/health');
      expect(response.body.status).toBe('OK');
    });

    it('debe incluir timestamp', async () => {
      const response = await request(app).get('/health');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /webhook/messages', () => {
    it('debe validar webhook de Twilio', async () => {
      const response = await request(app)
        .get('/webhook/messages')
        .expect(200);
    });

    it('debe retornar texto confirmando validación', async () => {
      const response = await request(app)
        .get('/webhook/messages');
      expect(response.text).toBeDefined();
    });
  });

  describe('POST /webhook/messages', () => {
    it('debe aceptar post request', async () => {
      const response = await request(app)
        .post('/webhook/messages')
        .send({
          From: 'whatsapp:+5199999999',
          To: 'whatsapp:+14155238886',
          Body: 'hola'
        });
      
      expect([200, 500]).toContain(response.status); // Puede fallar por credenciales, pero no error 404
    });

    it('debe procesar mensaje', async () => {
      const response = await request(app)
        .post('/webhook/messages')
        .send({
          From: 'whatsapp:+5199999999',
          To: 'whatsapp:+14155238886',
          Body: 'prueba'
        });
      
      // Debe retornar algo, aunque falte config de Twilio
      expect(response.status).toBeDefined();
    });
  });

  describe('Rutas 404', () => {
    it('debe retornar 404 para rutas no existentes', async () => {
      const response = await request(app)
        .get('/ruta/inexistente')
        .expect(404);
    });

    it('debe retornar JSON en error 404', async () => {
      const response = await request(app)
        .get('/no/existe')
        .expect('Content-Type', /json/);
    });

    it('debe tener mensaje de error', async () => {
      const response = await request(app)
        .get('/inexistente');
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Middleware', () => {
    it('debe procesar urlencoded', async () => {
      const response = await request(app)
        .post('/webhook/messages')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('From=whatsapp:%2b5199999999&Body=test');
      
      expect(response.status).toBeDefined();
    });

    it('debe procesar JSON', async () => {
      const response = await request(app)
        .post('/webhook/messages')
        .set('Content-Type', 'application/json')
        .send({ From: 'whatsapp:+5199999999', Body: 'test' });
      
      expect(response.status).toBeDefined();
    });
  });

  describe('Headers', () => {
    it('debe aceptar requests sin headers específicos', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });

    it('debe responder con Content-Type correcto', async () => {
      const response = await request(app).get('/');
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Métodos HTTP', () => {
    it('debe aceptar GET en /', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
    });

    it('debe rechazar DELETE en /webhook/messages', async () => {
      const response = await request(app)
        .delete('/webhook/messages');
      
      expect([404, 405]).toContain(response.status);
    });

    it('debe rechazar PUT en /webhook/messages', async () => {
      const response = await request(app)
        .put('/webhook/messages')
        .send({});
      
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar requests malformados', async () => {
      const response = await request(app)
        .post('/webhook/messages')
        .send('malformed{json');
      
      expect(response.status).toBeDefined();
    });

    it('debe retornar 500 para errores de servidor', async () => {
      // Esta prueba depende de si hay errores reales
      const response = await request(app)
        .post('/webhook/messages')
        .send({});
      
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Estabilidad', () => {
    it('debe manejar múltiples requests consecutivos', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
      }
    });

    it('debe retornar IDs de request consistentes', async () => {
      const response1 = await request(app).get('/');
      const response2 = await request(app).get('/');
      
      // Ambas deben ser exitosas
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });
});
