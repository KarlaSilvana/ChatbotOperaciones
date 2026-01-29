require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const path = require('path');
const { procesarMensaje } = require('./src/bot/messageRouter');
const mediaService = require('./src/services/mediaService');
const s3Service = require('./src/services/s3Service');
const navigationManager = require('./src/bot/navigationManager');
const sessionScheduler = require('./src/bot/sessionScheduler');
const ragService = require('./src/services/ragService');
const MarkdownToWhatsApp = require('./src/services/markdownToWhatsApp');
const directorioService = require('./src/services/directorioService');
const DirectorioFormatter = require('./src/services/directorioFormatter');
const DirectorioRouter = require('./src/bot/directorioRouter');
const menus = require('./src/bot/menus');
const logger = require('./src/utils/logger');
const metricsService = require('./src/services/metricsService');
const nightlyReportJob = require('./src/jobs/nightly-report-job');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// NOTA: src/media ya no se sirve localmente (archivos en AWS S3)
// app.use('/media', express.static(path.join(__dirname, 'src/media'))); // ❌ DEPRECATED

// Variables de Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilio_client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Inicializar Session Scheduler
sessionScheduler.init(twilio_client, navigationManager);

// Inicializar Nightly Report Job
nightlyReportJob.initNightlyReportJob();

/**
 * Health check + S3 Status
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    service: 'AndyBot - Caja Los Andes',
    multimedia: s3Service.getInfo()
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

    // Manejar sesión expirada
    if (respuesta.action === 'session_expired') {
      // Enviar mensaje de sesión expirada
      await twilio_client.messages.create({
        from: to,
        to: from,
        body: respuesta.text
      });
      logger.info(`Sesión expirada para ${from}`);
      res.status(200).send('Message processed');
      return;
    }

    // Manejar diferentes tipos de acciones
    if (respuesta.action === 'chat_ia_response') {
      // ⭐ Actualizar actividad del usuario
      navigationManager.updateUserActivity(phoneNumber);
      
    // ⭐ NUEVO: Manejar consulta a RAG
      try {
        // Obtener contexto IA
        const context = navigationManager.getIAContext(phoneNumber);
        const modoIA = respuesta.modoIA || navigationManager.getIAMode(phoneNumber);
        
        // Llamar a RAG Service con o sin tema
        const tema = modoIA === 'consulta' ? context.procedimientoNombre : null;
        const ragResponse = await ragService.sendQuery(respuesta.text, tema);
        
        // ⭐ REGISTRAR CONSULTA DE IA EN METRICS
        const procedimientoId = modoIA === 'consulta' ? context.procedimientoId : 'general_chat';
        const procedimientoNombre = modoIA === 'consulta' ? context.procedimientoNombre : 'Chat General';
        metricsService.recordIAConsultation(
          phoneNumber,
          procedimientoId,
          procedimientoNombre,
          modoIA,
          respuesta.text,
          ragResponse.response
        ).catch(err => logger.error('Error recording IA consultation:', err));
        
        // Agregar mensaje de usuario al historial
        navigationManager.addIAConversationMessage(phoneNumber, {
          role: 'user',
          content: respuesta.text
        });
        
        // Agregar respuesta de IA al historial
        navigationManager.addIAConversationMessage(phoneNumber, {
          role: 'assistant',
          content: ragResponse.response
        });
        
        // Convertir respuesta Markdown a WhatsApp
        const messages = MarkdownToWhatsApp.splitMessages(ragResponse.response);
        
        // Enviar todos los mensajes
        for (const msg of messages) {
          await twilio_client.messages.create({
            from: to,
            to: from,
            body: msg
          });
        }
        
        // ⭐ ACTUALIZADO: Enviar mensaje final modo-específico (en dos mensajes separados)
        
        // Primer mensaje: pregunta de continuación
        const continuarMessage = '💬 ¿Tienes otra consulta?';
        await twilio_client.messages.create({
          from: to,
          to: from,
          body: continuarMessage
        });
        
        // Segundo mensaje: opción de volver según el modo
        let volverMessage = '';
        if (modoIA === 'chat') {
          volverMessage = '🔙 *0. Volver al Menú Principal 🏠*';
        } else if (modoIA === 'consulta') {
          volverMessage = '🔙 *0. Volver al Menú Procedimientos*';
        } else {
          volverMessage = '🔙 *0. Volver*';
        }
        
        await twilio_client.messages.create({
          from: to,
          to: from,
          body: volverMessage
        });
        
        // Log de éxito
        logger.success(`Respuesta IA enviada a ${from} (${messages.length} mensaje${messages.length > 1 ? 's' : ''}, modo: ${modoIA})`);
        
        res.status(200).send('Message processed');
        return;
        
      } catch (ragError) {
        logger.error('Error consultando RAG API:', ragError);
        
        // Enviar mensaje de error al usuario
        const errorMessage = '❌ Disculpa, hubo un problema al procesar tu pregunta. Por favor intenta nuevamente.';
        await twilio_client.messages.create({
          from: to,
          to: from,
          body: errorMessage
        });
        
        res.status(500).send('RAG API error');
        return;
      }
    }

    // ⭐ NUEVO: Manejar búsqueda en directorio
    if (respuesta.action === 'directorio_search') {
      try {
        // ⭐ Actualizar actividad del usuario
        navigationManager.updateUserActivity(phoneNumber);
        
        // ⭐ REGISTRAR EVENTO DE BÚSQUEDA EN DIRECTORIO
        metricsService.recordEvent(phoneNumber, 'USER_SEARCH_DIRECTORIO', null, 'Directorio')
          .catch(err => logger.error('Error recording directorio search:', err));
        
        // Realizar búsqueda
        const busqueda = directorioService.buscar(respuesta.query);

        // Caso 1: Sin resultados
        if (busqueda.resultados.length === 0) {
          const mensajeNoResultados = DirectorioRouter.getNoResultsMessage();
          await twilio_client.messages.create({
            from: to,
            to: from,
            body: mensajeNoResultados
          });

          logger.info(
            `[DirectorioSearch] Sin resultados para: "${respuesta.query}" del usuario ${from}`
          );
          res.status(200).send('Message processed');
          return;
        }

        // Caso 2: Con resultados
        const contenidoResultados = DirectorioFormatter.formatearResultadosConEncabezado(
          busqueda.resultados,
          busqueda.totalEncontrados,
          busqueda.hayMas
        );

        const mensajeFinal = DirectorioFormatter.formatearMensajeFinal(
          contenidoResultados,
          busqueda.hayMas
        );

        await twilio_client.messages.create({
          from: to,
          to: from,
          body: mensajeFinal
        });

        logger.success(
          `[DirectorioSearch] Búsqueda exitosa: "${respuesta.query}" → ` +
          `${busqueda.resultados.length} resultado(s), ` +
          `total encontrado: ${busqueda.totalEncontrados} para ${from}`
        );

        res.status(200).send('Message processed');
        return;

      } catch (dirError) {
        logger.error('[DirectorioSearch] Error en búsqueda:', dirError);

        const errorMessage =
          '❌ Error en la búsqueda del directorio.\n' +
          'Por favor intenta nuevamente o escribe 0 para volver al menú.';

        await twilio_client.messages.create({
          from: to,
          to: from,
          body: errorMessage
        });

        res.status(500).send('Directorio search error');
        return;
      }
    }
    
    if (respuesta.action === 'send_video') {
      // ⭐ Actualizar actividad del usuario
      navigationManager.updateUserActivity(phoneNumber);
      
      // ⭐ REGISTRAR EVENTO DE SOLICITUD DE VIDEO
      metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_VIDEO',
        respuesta.procedimientoId,
        respuesta.procedimientoNombre || 'Unknown'
      ).catch(err => logger.error('Error recording video request:', err));
      
      // Enviar video del procedimiento
      const resultado = await mediaService.enviarVideo(twilio_client, from, respuesta.procedimientoId);
      
      if (!resultado.success) {
        logger.warning(`No se pudo enviar video: ${resultado.error}`);
      } else {
        logger.success(`Video enviado a ${from}: ${resultado.fileName}`);
        
        // Enviar automáticamente el menú del procedimiento nuevamente
        const menuDetalle = menus.getMenuDetalleProcedimiento(resultado.procedimientoId);
        if (menuDetalle) {
          await twilio_client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: from,
            body: menuDetalle.text
          });
          logger.success(`Menú del procedimiento reenviado a ${from}`);
        }
      }
    } else if (respuesta.action === 'send_documento') {
      // ⭐ Actualizar actividad del usuario
      navigationManager.updateUserActivity(phoneNumber);
      
      // ⭐ REGISTRAR EVENTO DE SOLICITUD DE DOCUMENTO
      metricsService.recordEvent(
        phoneNumber,
        'USER_REQUEST_DOCUMENTO',
        respuesta.procedimientoId,
        respuesta.procedimientoNombre || 'Unknown'
      ).catch(err => logger.error('Error recording documento request:', err));
      
      // Enviar documento del procedimiento
      const resultado = await mediaService.enviarDocumento(twilio_client, from, respuesta.procedimientoId);
      
      if (!resultado.success) {
        logger.warning(`No se pudo enviar documento: ${resultado.error}`);
      } else {
        logger.success(`Documento enviado a ${from}: ${resultado.fileName}`);
        
        // Enviar automáticamente el menú del procedimiento nuevamente
        const menuDetalle = menus.getMenuDetalleProcedimiento(resultado.procedimientoId);
        if (menuDetalle) {
          await twilio_client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: from,
            body: menuDetalle.text
          });
          logger.success(`Menú del procedimiento reenviado a ${from}`);
        }
      }
    } else if (respuesta.action === 'navigate' && respuesta.modoIA) {
      // ⭐ Actualizar actividad del usuario
      navigationManager.updateUserActivity(phoneNumber);
      
      // ⭐ REGISTRAR EVENTO DE INICIO DE IA
      const modoIA = respuesta.modoIA;
      const procedimientoId = modoIA === 'consulta' ? respuesta.procedimientoId : 'general_chat';
      const procedimientoNombre = modoIA === 'consulta' ? respuesta.procedimientoNombre : 'Chat General';
      
      metricsService.recordEvent(phoneNumber, 'USER_START_IA_CONSULTA', procedimientoId, procedimientoNombre)
        .catch(err => logger.error('Error recording IA start:', err));
      
      // ⭐ NUEVO: Manejo especial para inicio de modo IA con mensaje inicial modo-específico
      
      // Mensaje inicial según el modo
      let initialMessage = '';
      if (modoIA === 'chat') {
        initialMessage = '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta.\n\n🔙 *0. Volver al Menú Principal 🏠*';
      } else if (modoIA === 'consulta') {
        initialMessage = '🤖 *Asistente IA Activado*\n\nPuedes hacerme cualquier pregunta sobre este procedimiento.\n\n🔙 *0. Volver al Menú Procedimientos*';
      }
      
      // Enviar mensaje inicial
      if (initialMessage) {
        await twilio_client.messages.create({
          from: to,
          to: from,
          body: initialMessage
        });
        logger.success(`Mensaje inicial IA enviado a ${from} (modo: ${modoIA})`);
      }
      
      res.status(200).send('Message processed');
      return;
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
 * ⭐ TESTING: Endpoint para obtener estadísticas de eventos
 * GET /api/metrics/stats/events
 */
app.get('/api/metrics/stats/events', async (req, res) => {
  try {
    const stats = await metricsService.getInteractionStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching event stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error.message
    });
  }
});

/**
 * ⭐ TESTING: Endpoint para obtener estadísticas de consultas IA
 * GET /api/metrics/stats/ia-consultations
 */
app.get('/api/metrics/stats/ia-consultations', async (req, res) => {
  try {
    const stats = await metricsService.getIAConsultationStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching IA stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error.message
    });
  }
});

/**
 * ⭐ TESTING: Endpoint para ejecutar reporte manualmente
 * POST /api/metrics/generate-report
 */
app.post('/api/metrics/generate-report', async (req, res) => {
  try {
    const report = await nightlyReportJob.generateNightlyReport();
    res.status(200).json({
      success: true,
      message: 'Reporte generado exitosamente',
      report: report
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
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