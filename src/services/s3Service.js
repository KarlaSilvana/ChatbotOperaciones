const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const TinyURL = require('tinyurl');

/**
 * Servicio para generar URLs firmadas temporales de archivos en AWS S3
 * URLs expiran en 1 hora por seguridad
 * Compatible con S3 buckets privados
 */
class S3Service {
  constructor() {
    this.s3Client = new S3Client({ 
      region: process.env.AWS_REGION || "us-east-1"
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "chatbot-media-operaciones";
    this.region = process.env.AWS_REGION || "us-east-1";
    this.urlExpiration = 3600; // 1 hora
  }

  /**
   * Genera URL firmada temporal para video
   * @param {string} procedimientoId - ID del procedimiento
   * @returns {Promise<string>} URL firmada válida por 1 hora
   */
  async getVideoUrl(procedimientoId) {
  try {
    const key = `procedimientos/${procedimientoId}/video.mp4`;
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const longUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.urlExpiration
    });
    
    // Acortar URL
    const shortUrl = await TinyURL.shorten(longUrl);
    
    console.log(`✅ URL acortada: ${shortUrl}`);
    return shortUrl;
  } catch (error) {
    console.error(`❌ Error:`, error);
    return null;
  }
}

  /**
   * Genera URL acortada temporal para documento PDF
   * @param {string} procedimientoId - ID del procedimiento
   * @returns {Promise<string>} URL acortada válida por 1 hora
   */
  async getDocumentoUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/documento.pdf`;
      
      console.log(`🔗 Generando URL firmada para documento: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const longUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpiration
      });
      
      // Acortar URL
      const shortUrl = await TinyURL.shorten(longUrl);
      
      console.log(`✅ URL acortada de documento generada: ${shortUrl}`);
      return shortUrl;
    } catch (error) {
      console.error(`❌ Error generando URL para documento ${procedimientoId}:`, error);
      return null;
    }
  }

  /**
   * Genera URL acortada temporal para flyer informativo
   * @param {string} procedimientoId - ID del procedimiento
   * @returns {Promise<string>} URL acortada válida por 1 hora
   */
  async getFlyerUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/flyer.pdf`;
      
      console.log(`🔗 Generando URL firmada para flyer: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const longUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpiration
      });
      
      // Acortar URL
      const shortUrl = await TinyURL.shorten(longUrl);
      
      console.log(`✅ URL acortada de flyer generada: ${shortUrl}`);
      return shortUrl;
    } catch (error) {
      console.error(`❌ Error generando URL para flyer ${procedimientoId}:`, error);
      return null;
    }
  }

  /**
   * Retorna información del servicio S3
   */
  getInfo() {
    return {
      bucket: this.bucketName,
      region: this.region,
      urlType: 'presigned-temporary',
      expiresIn: `${this.urlExpiration}s`,
      status: 'ready'
    };
  }
}

module.exports = new S3Service();