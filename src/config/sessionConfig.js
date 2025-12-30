/**
 * Configuración de Sesiones
 * Lee valores desde .env para control dinámico
 */

require('dotenv').config();

const sessionConfig = {
  // Timeout de sesión en minutos (desde .env)
  timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30'),
  
  // Intervalo de limpieza de usuarios inactivos en minutos (desde .env)
  cleanupIntervalMinutes: parseInt(process.env.SESSION_CLEANUP_INTERVAL_MINUTES || '60'),
  
  /**
   * Obtiene el timeout en milisegundos
   */
  getTimeoutMs() {
    return this.timeoutMinutes * 60 * 1000;
  },
  
  /**
   * Obtiene el intervalo de limpieza en milisegundos
   */
  getCleanupIntervalMs() {
    return this.cleanupIntervalMinutes * 60 * 1000;
  },
  
  /**
   * Valida que los valores sean válidos
   */
  validate() {
    if (this.timeoutMinutes < 1) {
      throw new Error('SESSION_TIMEOUT_MINUTES debe ser mayor a 0');
    }
    if (this.cleanupIntervalMinutes < 1) {
      throw new Error('SESSION_CLEANUP_INTERVAL_MINUTES debe ser mayor a 0');
    }
    
    if (this.cleanupIntervalMinutes < this.timeoutMinutes) {
      console.warn('⚠️ SESSION_CLEANUP_INTERVAL_MINUTES debería ser >= SESSION_TIMEOUT_MINUTES');
    }
  }
};

// Validar en tiempo de carga
sessionConfig.validate();

// Log de configuración
console.log(`📋 Session Config: Timeout=${sessionConfig.timeoutMinutes}m, Cleanup=${sessionConfig.cleanupIntervalMinutes}m`);

module.exports = sessionConfig;
