const menusConfig = require('../bot/menus');
const s3Service = require('./s3Service');

class MediaService {
  constructor() {
    this.s3Service = s3Service;
  }

  /**
   * Envía un video de procedimiento desde S3
   */
  async enviarVideo(client, chatId, procedimientoId) {
    try {
      const proc = menusConfig.getProcedimiento(procedimientoId);
      
      if (!proc) {
        return { success: false, error: 'Procedimiento no encontrado' };
      }

      console.log(`🔗 Solicitando URL firmada para video: ${procedimientoId}`);
      const videoUrl = await this.s3Service.getVideoUrl(procedimientoId);
      
      if (!videoUrl) {
        console.error(`❌ No se pudo generar URL para: ${procedimientoId}`);
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Video no disponible*\n\nEl video de *${proc.nombre}* no está disponible.\n\n📞 Contacta al administrador.`
        });
        return { success: false, error: 'URL no generada' };
      }

      console.log(`✅ URL generada, enviando a usuario...`);

      // ENVIAR SOLO TEXTO CON EL LINK
      // Twilio WhatsApp descargará automáticamente si el link es válido
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `📹 *${proc.nombre}*\n\n✅ Aquí está tu video:\n\n${videoUrl}\n\n💡 Haz clic en el enlace para ver el video.\n\n_El enlace expira en 1 hora por seguridad._`
      });

      console.log(`✅ Video enviado a ${chatId}: ${procedimientoId}`);

      return {
        success: true,
        fileName: `${procedimientoId}/video.mp4`,
        source: 'AWS S3'
      };

    } catch (error) {
      console.error('❌ Error enviando video:', error);
      
      try {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Error al enviar video*\n\nIntenta nuevamente o contacta al administrador.`
        });
      } catch (sendError) {
        console.error('Error enviando mensaje de error:', sendError);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Envía un documento PDF desde S3
   */
  async enviarDocumento(client, chatId, procedimientoId) {
    try {
      const proc = menusConfig.getProcedimiento(procedimientoId);
      
      if (!proc) {
        return { success: false, error: 'Procedimiento no encontrado' };
      }

      console.log(`🔗 Solicitando URL firmada para documento: ${procedimientoId}`);
      const docUrl = await this.s3Service.getDocumentoUrl(procedimientoId);
      
      if (!docUrl) {
        console.error(`❌ No se pudo generar URL para documento: ${procedimientoId}`);
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Documento no disponible*\n\nEl documento de *${proc.nombre}* no está disponible.\n\n📞 Contacta al administrador.`
        });
        return { success: false, error: 'URL no generada' };
      }

      console.log(`✅ URL de documento generada, enviando...`);

      // ENVIAR SOLO TEXTO CON EL LINK
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `📄 *${proc.nombre}*\n\n✅ Aquí está tu documento:\n\n${docUrl}\n\n💡 Haz clic en el enlace para descargar el PDF.\n\n_El enlace expira en 1 hora por seguridad._`
      });

      console.log(`✅ Documento enviado a ${chatId}: ${procedimientoId}`);

      return {
        success: true,
        fileName: `${procedimientoId}/documento.pdf`,
        source: 'AWS S3'
      };

    } catch (error) {
      console.error('❌ Error enviando documento:', error);
      
      try {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Error al enviar documento*\n\nIntenta nuevamente o contacta al administrador.`
        });
      } catch (sendError) {
        console.error('Error enviando mensaje de error:', sendError);
      }

      return { success: false, error: error.message };
    }
  }

  getS3Info() {
    return this.s3Service.getInfo();
  }
}

module.exports = new MediaService();