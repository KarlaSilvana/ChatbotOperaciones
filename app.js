/**
 * Chatbot con Twilio - Menú Dinámico con Navegación
 * Servidor Express que recibe mensajes de Twilio WhatsApp
 */

require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const path = require('path');
const { procesarMensaje } = require('./src/bot/messageRouter');
const mediaService = require('./src/services/mediaService');
const logger = require('./src/utils/logger');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Servir archivos multimedia estáticos
app.use('/media', express.static(path.join(__dirname, 'src/media')));

// Variables de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilio_client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    service: 'AndyBot - Caja Los Andes'
  });
});

/**
 * Webhook de Twilio para recibir mensajes
 * POST /webhook/messages
 */
app.post('/webhook/messages', async (req, res) => {
  try {
    const incoming_msg = req.body.Body;
    const from = req.body.From;
    const to = req.body.To;

    logger.info(`Mensaje recibido de ${from}:`, incoming_msg);

    // Extraer número de teléfono sin prefijo de WhatsApp
    const phoneNumber = from.replace('whatsapp:', '');

    // Procesar el mensaje y obtener respuesta
    const respuesta = await procesarMensaje(phoneNumber, incoming_msg);

    // Manejar diferentes tipos de acciones
    if (respuesta.action === 'send_video') {
      // Enviar video del procedimiento
      const resultado = await mediaService.enviarVideo(twilio_client, from, respuesta.procedimientoId);
      
      if (!resultado.success) {
        logger.warn(`No se pudo enviar video: ${resultado.error}`);
      } else {
        logger.success(`Video enviado a ${from}: ${resultado.fileName}`);
      }
    } else if (respuesta.action === 'send_documento') {
      // Enviar documento del procedimiento
      const resultado = await mediaService.enviarDocumento(twilio_client, from, respuesta.procedimientoId);
      
      if (!resultado.success) {
        logger.warn(`No se pudo enviar documento: ${resultado.error}`);
      } else {
        logger.success(`Documento enviado a ${from}: ${resultado.fileName}`);
      }
    } else {
      // Enviar mensaje de texto normal
      const messageData = {
        from: to,
        to: from,
        body: respuesta.text
      };

      await twilio_client.messages.create(messageData);
      logger.success(`Respuesta enviada a ${from}`);
    }

    // Responder a Twilio que recibimos el webhook
    res.status(200).send('Message processed');

  } catch (error) {
    logger.error('Error procesando mensaje:', error);
    
    // Intentar enviar mensaje de error al usuario
    try {
      await twilio_client.messages.create({
        from: req.body.To,
        to: req.body.From,
        body: '❌ Ocurrió un error procesando tu mensaje. Por favor intenta nuevamente.'
      });
    } catch (sendError) {
      logger.error('Error enviando mensaje de error:', sendError);
    }
    
    res.status(500).send('Error processing message');
  }
});

/**
 * Webhook para validación de Twilio (GET)
 */
app.get('/webhook/messages', (req, res) => {
  logger.info('Webhook validado por Twilio');
  res.status(200).send('Webhook validated');
});

/**
 * Ruta raíz
 */
app.get('/', (req, res) => {
  res.json({
    name: 'AndyBot - Caja Los Andes',
    version: '2.0.0',
    status: 'running',
    webhook: '/webhook/messages',
    media: '/media'
  });
});

/**
 * Endpoint para listar procedimientos (útil para debug)
 */
app.get('/api/procedimientos', (req, res) => {
  const menus = require('./src/bot/menus');
  res.json({
    total: menus.procedimientos.length,
    procedimientos: menus.procedimientos
  });
});

/**
 * Error handling
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;