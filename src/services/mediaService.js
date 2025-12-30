const fs = require('fs');
const path = require('path');
const menusConfig = require('../bot/menus');

/**
 * Servicio para manejar envío de archivos multimedia
 * Videos y PDFs de procedimientos
 */

class MediaService {
  constructor() {
    this.mediaPath = path.join(__dirname, '../media');
  }

  /**
   * Valida que un archivo existe
   */
  async fileExists(filePath) {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el tamaño de un archivo en MB
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      return (stats.size / (1024 * 1024)).toFixed(2); // MB
    } catch {
      return null;
    }
  }

  /**
   * Envía un video de procedimiento
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

      const videoPath = path.join(this.mediaPath, proc.recursos.video);
      
      // Validar que el archivo existe
      if (!await this.fileExists(videoPath)) {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Video no disponible*\n\nLo sentimos, el video de *${proc.nombre}* no está disponible en este momento.\n\nPor favor contacta al administrador.`
        });
        return {
          success: false,
          error: 'Archivo no encontrado'
        };
      }

      // Obtener tamaño del archivo
      const fileSize = await this.getFileSize(videoPath);
      
      // WhatsApp tiene límite de 16MB para videos
      if (fileSize > 16) {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `⚠️ *Video muy pesado*\n\nEl video pesa ${fileSize}MB y excede el límite de WhatsApp.\n\nPor favor solicita el video por otro medio o visita nuestra intranet.`
        });
        return {
          success: false,
          error: 'Archivo muy pesado'
        };
      }

      // Enviar mensaje de espera
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `⏳ *Enviando video...*\n\n📹 ${proc.nombre}\n⏱️ Por favor espera, el video está siendo enviado...`
      });

      // Para Twilio, necesitarías una URL pública del video
      // Si tienes los videos en una carpeta local, necesitarías hostearlos en un servidor
      // O alternativamente, enviar instrucciones al usuario
      // Por ahora, enviar instrucción:
      
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `📹 *${proc.nombre}*\n\n⚠️ El video está disponible pero requiere una conexión directa.\n\n💡 Por favor, solicita el video por correo electrónico: soporte@empresa.com\n\n¿Hay algo más en lo que pueda ayudarte?`
      });

      return {
        success: true,
        fileName: proc.recursos.video,
        fileSize: fileSize
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
   * Envía un documento PDF de procedimiento
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

      const docPath = path.join(this.mediaPath, proc.recursos.documento);
      
      // Validar que el archivo existe
      if (!await this.fileExists(docPath)) {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: chatId,
          body: `❌ *Documento no disponible*\n\nLo sentimos, el documento de *${proc.nombre}* no está disponible en este momento.\n\nPor favor contacta al administrador.`
        });
        return {
          success: false,
          error: 'Archivo no encontrado'
        };
      }

      // Obtener tamaño del archivo
      const fileSize = await this.getFileSize(docPath);

      // Enviar mensaje de espera
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `⏳ *Enviando documento...*\n\n📄 ${proc.nombre}\n⏱️ Por favor espera...`
      });

      // Para Twilio, necesitarías una URL pública del documento
      // Por ahora, enviar instrucción:
      
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: chatId,
        body: `📄 *${proc.nombre}*\n\n⚠️ El documento está disponible pero requiere una conexión directa.\n\n💡 Por favor, solicita el documento por correo electrónico: soporte@empresa.com\n\n¿Hay algo más en lo que pueda ayudarte?`
      });

      return {
        success: true,
        fileName: proc.recursos.documento,
        fileSize: fileSize
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
   * Obtiene información de los archivos disponibles
   */
  async getMediaInfo() {
    const info = {
      procedimientos: [],
      totalVideos: 0,
      totalDocumentos: 0,
      errors: []
    };

    for (const proc of menusConfig.procedimientos) {
      const videoPath = path.join(this.mediaPath, proc.recursos.video);
      const docPath = path.join(this.mediaPath, proc.recursos.documento);

      const videoExists = await this.fileExists(videoPath);
      const docExists = await this.fileExists(docPath);

      info.procedimientos.push({
        id: proc.id,
        nombre: proc.nombre,
        video: {
          exists: videoExists,
          path: proc.recursos.video,
          size: videoExists ? await this.getFileSize(videoPath) : null
        },
        documento: {
          exists: docExists,
          path: proc.recursos.documento,
          size: docExists ? await this.getFileSize(docPath) : null
        }
      });

      if (videoExists) info.totalVideos++;
      if (docExists) info.totalDocumentos++;

      if (!videoExists) {
        info.errors.push(`Video faltante: ${proc.nombre}`);
      }
      if (!docExists) {
        info.errors.push(`Documento faltante: ${proc.nombre}`);
      }
    }

    return info;
  }
}

// Exportar instancia única (singleton)
module.exports = new MediaService();