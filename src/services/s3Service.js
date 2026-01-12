const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * Servicio para generar URLs firmadas de archivos en AWS S3
 * URLs expiran en 1 hora (3600 segundos)
 * Usa IAM Role de EC2 para autenticación (sin credenciales hardcodeadas)
 */
class S3Service {
  constructor() {
    this.s3Client = new S3Client({ 
      region: process.env.AWS_REGION || "us-east-1"
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "chatbot-media-operaciones";
    this.urlExpirationSeconds = 3600; // 1 hora
  }

  /**
   * Genera URL firmada para video de procedimiento
   * @param {string} procedimientoId - ID del procedimiento (ej: "firma_electronica")
   * @returns {Promise<string|null>} - URL firmada o null si hay error
   */
  async getVideoUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/video.mp4`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpirationSeconds
      });

      console.log(`✅ URL de video generada para ${procedimientoId}`);
      return url;
    } catch (error) {
      console.error(`❌ Error generando URL para video ${procedimientoId}:`, error);
      return null;
    }
  }

  /**
   * Genera URL firmada para documento PDF de procedimiento
   * @param {string} procedimientoId - ID del procedimiento (ej: "firma_electronica")
   * @returns {Promise<string|null>} - URL firmada o null si hay error
   */
  async getDocumentoUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/documento.pdf`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpirationSeconds
      });

      console.log(`✅ URL de documento generada para ${procedimientoId}`);
      return url;
    } catch (error) {
      console.error(`❌ Error generando URL para documento ${procedimientoId}:`, error);
      return null;
    }
  }

  /**
   * Verifica si un archivo existe en S3
   * @param {string} key - Ruta completa del archivo en S3
   * @returns {Promise<boolean>}
   */
  async fileExists(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retorna información del servicio S3
   * @returns {Object} - Info de configuración
   */
  getInfo() {
    return {
      bucket: this.bucketName,
      region: process.env.AWS_REGION || "us-east-1",
      urlExpiration: `${this.urlExpirationSeconds} segundos (1 hora)`,
      status: 'ready'
    };
  }
}

module.exports = new S3Service();
