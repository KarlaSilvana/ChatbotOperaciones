const menusConfig = require('../bot/menus');
const s3Service = require('./s3Service');

/**
 * Servicio para manejar envío de archivos multimedia
 * Videos y PDFs de procedimientos desde AWS S3
 * 
 * ✅ ACTUALIZADO A AWS S3:
 * - URLs firmadas con expiración de 1 hora
 * - Archivos almacenados en s3://chatbot-media-operaciones/procedimientos/{id}/
 * - Sin necesidad de credenciales (usa IAM Role de EC2)
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
      const videoUrl = await this.s3Service.getVideoUrl(procedimientoId);
      
      if (!videoUrl) {
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

      // Enviar mensaje de espera
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `⏳ *Enviando video...*\n\n📹 ${proc.nombre}\n⏱️ Por favor espera, el video está siendo enviado...`
      });

      // Enviar video desde URL de S3
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        mediaUrl: [videoUrl],
        body: `📹 *${proc.nombre}*\n\n✅ Aquí está el video solicitado. La URL es válida por 1 hora.\n\n¿Hay algo más en lo que pueda ayudarte?`
      });

      return {
        success: true,
        fileName: `${procedimientoId}/video.mp4`,
        source: 'AWS S3'
      };

    } catch (error) {
      console.error('Error enviando video:', error);
      
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `❌ *Error al enviar video*\n\nHubo un problema al enviar el video. Por favor intenta nuevamente o contacta al administrador.`
      });

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
      const docUrl = await this.s3Service.getDocumentoUrl(procedimientoId);
      
      if (!docUrl) {
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

      // Enviar mensaje de espera
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `⏳ *Enviando documento...*\n\n📄 ${proc.nombre}\n⏱️ Por favor espera...`
      });

      // Enviar documento desde URL de S3
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        mediaUrl: [docUrl],
        body: `📄 *${proc.nombre}*\n\n✅ Aquí está el documento solicitado. La URL es válida por 1 hora.\n\n¿Hay algo más en lo que pueda ayudarte?`
      });

      return {
        success: true,
        fileName: `${procedimientoId}/documento.pdf`,
        source: 'AWS S3'
      };

    } catch (error) {
      console.error('Error enviando documento:', error);
      
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `❌ *Error al enviar documento*\n\nHubo un problema al enviar el documento. Por favor intenta nuevamente o contacta al administrador.`
      });

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