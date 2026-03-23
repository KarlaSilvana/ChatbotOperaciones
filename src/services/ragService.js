/**
 * RAG Service - Servicio para comunicación con API RAG
 * Maneja consultas a la API de IA con búsqueda de documentos (RAG)
 */

require('dotenv').config();
const logger = require('../utils/logger');

class RAGService {
  constructor() {
    this.apiUrl = process.env.RAG_API_URL || 'http://localhost:8000/api/v1/chat/message-rag';
    this.apiKey = process.env.RAG_API_KEY;
    this.model = process.env.RAG_MODEL || 'openai';
    this.maxTokens = parseInt(process.env.RAG_MAX_TOKENS || '2000');
    this.temperature = parseFloat(process.env.RAG_TEMPERATURE || '0.7');
    this.topK = parseInt(process.env.RAG_TOP_K || '5');
    this.timeoutMs = parseInt(process.env.RAG_TIMEOUT_MS || '15000');

    // Validar configuración
    if (!this.apiKey) {
      logger.warn('⚠️ RAG_API_KEY no está configurada. Las consultas a IA no funcionarán.');
    }
  }

  /**
   * Envía una consulta a la API RAG
   * @param {string} mensaje - Pregunta del usuario
   * @param {string} tema - Tema/contexto opcional (ej: nombre de procedimiento)
   * @param {string} conversationId - ID de conversación para mantener contexto (opcional)
   * @returns {Promise<object>} Respuesta de la API RAG con conversation_id
   */
  async sendQuery(mensaje, tema = null, conversationId = null) {
    try {
      // Validar entrada
      if (!mensaje || typeof mensaje !== 'string') {
        throw new Error('El mensaje debe ser un string no vacío');
      }

      // Preparar mensaje con tema si existe
      const mensajeFinal = tema ? `${tema}: ${mensaje}` : mensaje;

      logger.info(`📤 Enviando consulta RAG: "${mensajeFinal.substring(0, 100)}..."`);
      if (conversationId) {
        logger.info(`💬 Conversation ID: ${conversationId}`);
      }

      // Preparar payload
      const payload = {
        message: mensajeFinal,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_k: this.topK,
        model: this.model
      };

      // Agregar conversation_id si existe
      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      // Realizar llamada HTTP
      const startTime = Date.now();
      const response = await this._makeRequest(payload);
      const duration = Date.now() - startTime;

      logger.success(`✅ Respuesta recibida de RAG en ${duration}ms`);
      logger.info(`📊 Tokens usados: ${response.tokens_used || 'N/A'}`);

      // Validar respuesta
      if (!response.response) {
        throw new Error('Respuesta vacía de la API RAG');
      }

      // Si la API devuelve conversation_id, lo retornamos
      // Si no lo devuelve, pero lo enviamos, lo retornamos igual
      if (!response.conversation_id && conversationId) {
        response.conversation_id = conversationId;
      }

      return response;

    } catch (error) {
      logger.error('❌ Error en RAG Service:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Realiza la llamada HTTP a la API RAG
   * @private
   * @param {object} payload - Datos a enviar
   * @returns {Promise<object>} Respuesta de la API
   */
  async _makeRequest(payload) {
    try {
      // fetch está disponible globalmente en Node.js 18+
      // No requiere importación adicional

      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Verificar status HTTP
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 422) {
            throw new Error(
              `Validación rechazada (422): ${JSON.stringify(errorData.detail || 'Invalid input')}`
            );
          }

          throw new Error(
            `HTTP ${response.status}: ${errorData.message || response.statusText}`
          );
        }

        // Parsear respuesta
        const data = await response.json();

        // Validar estructura de respuesta
        if (!data.response) {
          throw new Error('Estructura de respuesta inválida: falta campo "response"');
        }

        return data;

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error(`Timeout: La API no respondió en ${this.timeoutMs}ms`);
        }

        throw fetchError;
      }

    } catch (error) {
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error(`No se puede conectar a la API RAG en ${this.apiUrl}`);
      }

      if (error.message.includes('ENOTFOUND')) {
        throw new Error(`Host no encontrado: ${this.apiUrl}`);
      }

      throw error;
    }
  }

  /**
   * Maneja y formatea errores de la API
   * @private
   * @param {Error} error - Error a manejar
   * @returns {Error} Error formateado
   */
  _handleError(error) {
    const errorMessages = {
      'ECONNREFUSED': '❌ No se puede conectar a la API RAG. Verifica que esté corriendo.',
      'ENOTFOUND': '❌ No se encontró el host de la API RAG. Verifica RAG_API_URL.',
      'Timeout': '❌ La API RAG tardó demasiado. Intenta nuevamente.',
      '422': '❌ Tu consulta tiene un formato inválido. Intenta con otra pregunta.',
      '500': '❌ Error interno de la API RAG. Intenta nuevamente.',
      'EACCES': '❌ Permiso denegado al conectarse a la API RAG.'
    };

    let userFriendlyMessage = error.message;

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        userFriendlyMessage = message;
        break;
      }
    }

    const customError = new Error(userFriendlyMessage);
    customError.originalError = error;
    customError.isRAGError = true;

    return customError;
  }

  /**
   * Valida la configuración del servicio
   * @returns {object} Estado de configuración
   */
  validateConfiguration() {
    const config = {
      apiUrl: this.apiUrl,
      apiKeyConfigured: !!this.apiKey,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      topK: this.topK,
      timeoutMs: this.timeoutMs
    };

    logger.info('🔧 RAG Service Configuration:', config);

    return config;
  }

  /**
   * Obtiene la configuración actual
   * @returns {object} Configuración
   */
  getConfiguration() {
    return {
      apiUrl: this.apiUrl,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      topK: this.topK,
      timeoutMs: this.timeoutMs
    };
  }
}

// Exportar instancia singleton
module.exports = new RAGService();
