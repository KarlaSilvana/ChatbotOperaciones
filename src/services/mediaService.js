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

    // MENSAJE CON VIDEO Y OPCIÓN PARA REGRESAR
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `📹 *${proc.nombre}*\n\n${videoUrl}\n\n🔙 *0.* Volver`
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

    console.log(`🔗 Solicitando URLs acortadas para documento y flyer: ${procedimientoId}`);
    
    // Obtener URLs acortadas para PDF y Flyer
    const docUrl = await this.s3Service.getDocumentoUrl(procedimientoId);
    const flyerUrl = await this.s3Service.getFlyerUrl(procedimientoId);
    
    if (!docUrl && !flyerUrl) {
      console.error(`❌ No se pudieron generar URLs para documentos: ${procedimientoId}`);
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `❌ Documentos no disponibles para *${proc.nombre}*`
      });
      return { success: false, error: 'URLs no generadas' };
    }

    console.log(`✅ URLs de documentos generadas, enviando...`);

    // Mensaje 1: Encabezado con nombre del procedimiento
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `📄 *${proc.nombre}*`
    });

    // Mensaje 2: PDF
    if (docUrl) {
      const pdfMessage = `📋 PDF:\n${docUrl}`;
      console.log(`📊 Mensaje PDF - Longitud: ${pdfMessage.length} caracteres`);
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: pdfMessage
      });
    }

    // Mensaje 3: Flyer
    if (flyerUrl) {
      const flyerMessage = `📰 Flyer:\n${flyerUrl}`;
      console.log(`📊 Mensaje Flyer - Longitud: ${flyerMessage.length} caracteres`);
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: flyerMessage
      });
    }

    // Mensaje 4: Opción para regresar
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: chatId,
      body: `🔙 *0.* Volver`
    });

    console.log(`✅ Documentos enviados a ${chatId}: ${procedimientoId}`);

    return {
      success: true,
      fileName: `${procedimientoId}/documento.pdf`,
      files: (docUrl ? 1 : 0) + (flyerUrl ? 1 : 0),
      source: 'AWS S3'
    };

  } catch (error) {
    console.error('❌ Error enviando documento:', error);
    
    try {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `❌ Error al enviar documentos`
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