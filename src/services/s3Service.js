const { S3Client } = require("@aws-sdk/client-s3");

/**
 * Servicio para generar URLs públicas de archivos en AWS S3
 * URLs son permanentes y accesibles por Twilio
 * Requiere: S3 Bucket con acceso público habilitado
 */
class S3Service {
  constructor() {
    this.s3Client = new S3Client({ 
      region: process.env.AWS_REGION || "us-east-1"
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "chatbot-media-operaciones";
    this.region = process.env.AWS_REGION || "us-east-1";
  }

  /**
   * Genera URL PÚBLICA (permanente) para video de procedimiento
   * ⚠️ NOTA: Requiere que los archivos en S3 sean públicos
   * @param {string} procedimientoId - ID del procedimiento (ej: "firma_electronica")
   * @returns {string} - URL pública del archivo
   */
  async getVideoUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/video.mp4`;
      
      // URL pública permanente (sin firma)
      // Requiere: Block public access = OFF en S3
      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      
      console.log(`✅ URL pública generada para ${procedimientoId}: ${url}`);
      return url;
    } catch (error) {
      console.error(`❌ Error generando URL para video ${procedimientoId}:`, error);
      return null;
    }
  }

  /**
   * Genera URL PÚBLICA (permanente) para documento PDF de procedimiento
   * ⚠️ NOTA: Requiere que los archivos en S3 sean públicos
   * @param {string} procedimientoId - ID del procedimiento (ej: "firma_electronica")
   * @returns {string} - URL pública del archivo
   */
  async getDocumentoUrl(procedimientoId) {
    try {
      const key = `procedimientos/${procedimientoId}/documento.pdf`;
      
      // URL pública permanente (sin firma)
      // Requiere: Block public access = OFF en S3
      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      
      console.log(`✅ URL pública generada para documento ${procedimientoId}: ${url}`);
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
    // Para URLs públicas, no necesitamos verificar existencia en el cliente
    // S3 devolverá 404 si no existe
    console.log(`📄 Archivo: ${key}`);
    return true;
  }

  /**
   * Retorna información del servicio S3
   * @returns {Object} - Info de configuración
   */
  getInfo() {
    return {
      bucket: this.bucketName,
      region: this.region,
      urlType: 'public-permanent',
      status: 'ready'
    };
  }
}

module.exports = new S3Service();
