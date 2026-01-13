const menusConfig = require('../bot/menus');
const s3Service = require('./s3Service');

class MediaService {
  constructor() {
    this.s3Service = s3Service;
  }

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
        body: `❌ Video no disponible para *${proc.nombre}*`
      });
      return { success: false, error: 'URL no generada' };
    }

    console.log(`✅ URL generada, enviando a usuario...`);

    // MENSAJE CORTO - Solo el link
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `📹 *${proc.nombre}*\n\n${videoUrl}`
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
        body: `❌ Error al enviar video`
      });
    } catch (sendError) {
      console.error('Error enviando mensaje de error:', sendError);
    }

    return { success: false, error: error.message };
  }
}

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
        body: `❌ Documento no disponible para *${proc.nombre}*`
      });
      return { success: false, error: 'URL no generada' };
    }

    console.log(`✅ URL de documento generada, enviando...`);

    // MENSAJE CORTO - Solo el link
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `📄 *${proc.nombre}*\n\n${docUrl}`
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
        body: `❌ Error al enviar documento`
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