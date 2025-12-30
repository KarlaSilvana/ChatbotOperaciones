/**
 * markdownToWhatsApp.js
 * 
 * Convierte respuestas Markdown del RAG a formato WhatsApp
 * 
 * Conversiones:
 * - # Titulo → *Titulo* (negrita)
 * - **texto** → *texto* (negrita)
 * - - item → • item (viñeta)
 * - 1. item → 1️⃣ item (numerado)
 * - [texto](url) → texto (url)
 * - ```code``` → código sin procesar
 * - Limite: 4096 caracteres máximo
 */

const logger = require('../utils/logger');

class MarkdownToWhatsApp {
  /**
   * Convierte Markdown a formato WhatsApp compatible
   * @param {string} markdown - Texto en formato Markdown
   * @returns {string} Texto formateado para WhatsApp
   */
  static convert(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      logger.warning('markdownToWhatsApp: markdown inválido', { markdown });
      return '';
    }

    let text = markdown.trim();
    const maxLength = 4096;

    // 1. Preservar bloques de código (usar marcador especial único)
    const codeBlocks = [];
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODEBLOCK${codeBlocks.length - 1}CODEBLOCK__`;
    });

    // 2. Convertir títulos Markdown (# Titulo) → *Titulo*
    text = text.replace(/^#{1,6}\s+(.+?)$/gm, (match, title) => {
      return `*${title.trim()}*`;
    });

    // 3. Convertir negritas **texto** → *texto*
    text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');
    // NO procesar __ aquí porque se usa para código

    // 4. Convertir viñetas - item → • item
    text = text.replace(/^\s*[-*]\s+(.+?)$/gm, (match, item) => {
      return `• ${item.trim()}`;
    });

    // 5. Convertir listas numeradas 1. item → 1️⃣ item
    text = text.replace(/^\s*(\d+)\.\s+(.+?)$/gm, (match, number, item) => {
      const emoji = this._getNumberEmoji(parseInt(number));
      return `${emoji} ${item.trim()}`;
    });

    // 6. Convertir enlaces [texto](url) → texto (url)
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');

    // 7. Eliminar énfasis de subrayado
    text = text.replace(/_(.+?)_/g, '$1');

    // 8. Restaurar bloques de código
    codeBlocks.forEach((block, index) => {
      const codeContent = block
        .replace(/```/g, '')
        .trim();
      text = text.replace(`__CODEBLOCK${index}CODEBLOCK__`, codeContent);
    });

    // 9. Limpiar saltos de línea múltiples
    text = text.replace(/\n{3,}/g, '\n\n');

    // 10. Aplicar límite de caracteres
    if (text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...';
    }

    return text;
  }

  /**
   * Obtiene emoji numérico para listas
   * @param {number} number - Número (1-9)
   * @returns {string} Emoji correspondiente
   */
  static _getNumberEmoji(number) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    return (number >= 1 && number <= 9) ? emojis[number - 1] : `${number}.`;
  }

  /**
   * Calcula la cantidad de mensajes WhatsApp necesarios
   * @param {string} markdown - Texto en formato Markdown
   * @returns {number} Cantidad de mensajes requeridos
   */
  static getMessageCount(markdown) {
    const messages = this.splitMessages(markdown);
    return messages.length;
  }

  /**
   * Divide texto largo en múltiples mensajes WhatsApp
   * Sin aplicar truncamiento (el truncamiento se aplica en convert())
   * @param {string} markdown - Texto en formato Markdown
   * @returns {Array<string>} Array de mensajes
   */
  static splitMessages(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return [];
    }

    // Convertir sin truncamiento para dividir correctamente
    let text = markdown.trim();
    const maxLength = 4096;

    // 1. Preservar bloques de código
    const codeBlocks = [];
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODEBLOCK${codeBlocks.length - 1}CODEBLOCK__`;
    });

    // 2. Convertir títulos Markdown
    text = text.replace(/^#{1,6}\s+(.+?)$/gm, (match, title) => {
      return `*${title.trim()}*`;
    });

    // 3. Convertir negritas
    text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');

    // 4. Convertir viñetas
    text = text.replace(/^\s*[-*]\s+(.+?)$/gm, (match, item) => {
      return `• ${item.trim()}`;
    });

    // 5. Convertir listas numeradas
    text = text.replace(/^\s*(\d+)\.\s+(.+?)$/gm, (match, number, item) => {
      const emoji = this._getNumberEmoji(parseInt(number));
      return `${emoji} ${item.trim()}`;
    });

    // 6. Convertir enlaces
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');

    // 7. Eliminar énfasis de subrayado
    text = text.replace(/_(.+?)_/g, '$1');

    // 8. Restaurar bloques de código
    codeBlocks.forEach((block, index) => {
      const codeContent = block
        .replace(/```/g, '')
        .trim();
      text = text.replace(`__CODEBLOCK${index}CODEBLOCK__`, codeContent);
    });

    // 9. Limpiar saltos de línea múltiples
    text = text.replace(/\n{3,}/g, '\n\n');

    // 10. Dividir en mensajes sin truncar (cada mensaje puede tener hasta 4096 caracteres)
    const messages = [];
    let index = 0;
    while (index < text.length) {
      const chunk = text.substring(index, index + maxLength);
      messages.push(chunk);
      index += maxLength;
    }

    return messages;
  }

  /**
   * Validación de entrada Markdown
   * @param {string} markdown - Texto a validar
   * @returns {Object} { isValid, error }
   */
  static validate(markdown) {
    if (!markdown) {
      return {
        isValid: false,
        error: 'Markdown vacío'
      };
    }

    if (typeof markdown !== 'string') {
      return {
        isValid: false,
        error: 'Markdown debe ser string'
      };
    }

    if (markdown.length > 50000) {
      return {
        isValid: false,
        error: 'Markdown excede límite de 50000 caracteres'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }
}

module.exports = MarkdownToWhatsApp;
