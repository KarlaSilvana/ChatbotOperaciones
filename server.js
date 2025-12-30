/**
 * Servidor - Punto de entrada
 * Inicia el servidor Express
 */

require('dotenv').config();
const app = require('./app');
const sessionScheduler = require('./src/bot/sessionScheduler');
const logger = require('./src/utils/logger');

const port = process.env.PORT || 3000;

/**
 * Iniciar servidor
 */
const server = app.listen(port, () => {
  logger.success(`🚀 Servidor iniciado en puerto ${port}`);
  logger.info(`Webhook configurado en: http://localhost:${port}/webhook/messages`);
});

/**
 * Manejar shutdown del servidor
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  sessionScheduler.stop();
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  sessionScheduler.stop();
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;
