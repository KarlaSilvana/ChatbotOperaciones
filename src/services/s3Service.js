const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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
      
      console.log(`🔗 Generando URL firmada para video: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpiration
      });
      
      console.log(`✅ URL firmada generada (expira en ${this.urlExpiration}s)`);
      return url;
    } catch (error) {
      console.error(`❌ Error generando URL para video ${procedimientoId}:`, error);
      return null;
    }
  }

  /**
   * Genera URL firmada temporal para documento PDF
   * @param {string} procedimientoId - ID del procedimiento
   * @returns {Promise<string>} URL firmada válida por 1 hora
   */
  async getDocumentoUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/documento.pdf`;
      
      console.log(`🔗 Generando URL firmada para documento: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpiration
      });
      
      console.log(`✅ URL firmada de documento generada (expira en ${this.urlExpiration}s)`);
      return url;
    } catch (error) {
      console.error(`❌ Error generando URL para documento ${procedimientoId}:`, error);
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