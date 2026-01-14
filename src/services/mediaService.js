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

    // Mensaje 1: Contenido del video
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `Aquí tienes el video 📹 de *${proc.nombre}*`
    });

    // Mensaje 2: URL del video
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: videoUrl
    });

    console.log(`✅ Video enviado a ${chatId}: ${procedimientoId}`);

    return {
      success: true,
      fileName: `${procedimientoId}/video.mp4`,
      source: 'AWS S3',
      procedimientoId: procedimientoId
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

    console.log(`🔗 Solicitando URL acortada para documento: ${procedimientoId}`);
    
    // Obtener URL acortada para PDF
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

    // Mensaje 1: Contenido del documento
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `Aquí tienes el documento 📄 de *${proc.nombre}*`
    });

    // Mensaje 2: URL del documento
    const pdfMessage = docUrl;
    console.log(`📊 Mensaje PDF - Longitud: ${pdfMessage.length} caracteres`);
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: pdfMessage
    });

    console.log(`✅ Documento enviado a ${chatId}: ${procedimientoId}`);

    return {
      success: true,
      fileName: `${procedimientoId}/documento.pdf`,
      source: 'AWS S3',
      procedimientoId: procedimientoId
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