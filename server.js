/**
 * Servidor - Punto de entrada
 * Inicia el servidor Express
 */

require('dotenv').config();
const app = require('./app');
const logger = require('./src/utils/logger');

const port = process.env.PORT || 3000;

/**
 * Iniciar servidor
 */
app.listen(port, () => {
  logger.success(`🚀 Servidor iniciado en puerto ${port}`);
  logger.info(`Webhook configurado en: http://localhost:${port}/webhook/messages`);
});

module.exports = app;
