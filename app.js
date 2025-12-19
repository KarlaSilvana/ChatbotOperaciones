/**
 * Chatbot con Twilio - Menú Genérico
 * Servidor Express que recibe mensajes de Twilio WhatsApp
 */

require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const { procesarMensaje } = require('./src/bot/messageRouter');
const logger = require('./src/utils/logger');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Variables de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilio_client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
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

    // Enviar respuesta a través de Twilio
    await twilio_client.messages.create({
      from: to,
      to: from,
      body: respuesta.text
    });

    logger.success(`Respuesta enviada a ${from}`);

    // Responder a Twilio que recibimos el webhook
    res.status(200).send('Message processed');

  } catch (error) {
    logger.error('Error procesando mensaje:', error);
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
    name: 'Chatbot Twilio',
    version: '1.0.0',
    status: 'running',
    webhook: '/webhook/messages'
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
