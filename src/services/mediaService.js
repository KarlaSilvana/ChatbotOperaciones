const menusConfig = require('../bot/menus');
const s3Service = require('./s3Service');

/**
 * Servicio para manejar envío de archivos multimedia
 * Videos y PDFs de procedimientos desde AWS S3
 * 
 * ✅ ACTUALIZADO A AWS S3:
 * - URLs públicas permanentes (sin expiración)
 * - Archivos almacenados en s3://chatbot-media-operaciones/procedimientos/{id}/
 * - Accesibles por Twilio para descargar y enviar por WhatsApp
 * - Sin necesidad de credenciales (S3 público)
 */
class MediaService {
  constructor() {
    this.s3Service = s3Service;
  }

  /**
   * Envía un video de procedimiento desde S3
   * @param {Object} client - Cliente de Twilio
   * @param {string} chatId - ID de chat de WhatsApp
   * @param {string} procedimientoId - ID del procedimiento
   */
  async enviarVideo(client, chatId, procedimientoId) {
    try {
      const proc = menusConfig.getProcedimiento(procedimientoId);
      
      if (!proc) {
        return {
          success: false,
          error: 'Procedimiento no encontrado'
        };
      }

      // Obtener URL firmada del S3
      console.log(`🔗 Generando URL firmada para video: ${procedimientoId}`);
      const videoUrl = await this.s3Service.getVideoUrl(procedimientoId);
      
      if (!videoUrl) {
        console.error(`❌ No se pudo generar URL para: ${procedimientoId}`);
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Video no disponible*\n\nLo sentimos, el video de *${proc.nombre}* no está disponible en este momento.\n\nPor favor contacta al administrador.`
        });
        return {
          success: false,
          error: 'URL de video no pudo ser generada'
        };
      }

      console.log(`✅ URL generada correctamente para: ${procedimientoId}`);

      // Enviar video desde URL de S3 (UN SOLO MENSAJE)
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        mediaUrl: [videoUrl],
        body: `📹 *${proc.nombre}*\n\n✅ Aquí está el video.`
      });

      console.log(`✅ Video enviado a ${chatId} para procedimiento: ${procedimientoId}`);

      // Mensaje de continuación
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `¿Hay algo más en lo que pueda ayudarte?\n\nEscribe 0 para volver al menú principal.`
      });

      return {
        success: true,
        fileName: `${procedimientoId}/video.mp4`,
        source: 'AWS S3'
      };

    } catch (error) {
      console.error('❌ Error enviando video:', error);
      console.error('Stack trace:', error.stack);
      
      try {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Error al enviar video*\n\nHubo un problema al enviar el video. Por favor intenta nuevamente o contacta al administrador.`
        });
      } catch (sendError) {
        console.error('Error enviando mensaje de error:', sendError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envía un documento PDF de procedimiento desde S3
   * @param {Object} client - Cliente de Twilio
   * @param {string} chatId - ID de chat de WhatsApp
   * @param {string} procedimientoId - ID del procedimiento
   */
  async enviarDocumento(client, chatId, procedimientoId) {
    try {
      const proc = menusConfig.getProcedimiento(procedimientoId);
      
      if (!proc) {
        return {
          success: false,
          error: 'Procedimiento no encontrado'
        };
      }

      // Obtener URL firmada del S3
      console.log(`🔗 Generando URL firmada para documento: ${procedimientoId}`);
      const docUrl = await this.s3Service.getDocumentoUrl(procedimientoId);
      
      if (!docUrl) {
        console.error(`❌ No se pudo generar URL para documento: ${procedimientoId}`);
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Documento no disponible*\n\nLo sentimos, el documento de *${proc.nombre}* no está disponible en este momento.\n\nPor favor contacta al administrador.`
        });
        return {
          success: false,
          error: 'URL de documento no pudo ser generada'
        };
      }

      console.log(`✅ URL de documento generada correctamente para: ${procedimientoId}`);

      // Enviar documento desde URL de S3 (UN SOLO MENSAJE)
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        mediaUrl: [docUrl],
        body: `📄 *${proc.nombre}*\n\n✅ Aquí está el documento.`
      });

      console.log(`✅ Documento enviado a ${chatId} para procedimiento: ${procedimientoId}`);

      // Mensaje de continuación
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `¿Hay algo más en lo que pueda ayudarte?\n\nEscribe 0 para volver al menú principal.`
      });

      return {
        success: true,
        fileName: `${procedimientoId}/documento.pdf`,
        source: 'AWS S3'
      };

    } catch (error) {
      console.error('❌ Error enviando documento:', error);
      console.error('Stack trace:', error.stack);
      
      try {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Error al enviar documento*\n\nHubo un problema al enviar el documento. Por favor intenta nuevamente o contacta al administrador.`
        });
      } catch (sendError) {
        console.error('Error enviando mensaje de error:', sendError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene información de estado del servicio S3
   */
  getS3Info() {
    return this.s3Service.getInfo();
  }
}

// Exportar instancia única (singleton)
module.exports = new MediaService();