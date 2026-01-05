/**
 * Formateador de resultados del Directorio para WhatsApp
 * Convierte datos de directorio en mensajes visuales para WhatsApp
 */
class DirectorioFormatter {
  /**
   * Formatea un resultado individual para WhatsApp
   * @param {Object} resultado - Objeto con datos del contacto
   * @returns {string} Mensaje formateado
   */
  static formatearResultado(resultado) {
    if (!resultado) {
      return '';
    }

    const {
      numero = '',
      nombreCompleto = '',
      telefono = '',
      cargo = '',
      oficina = '',
      region = '',
      establecimiento = ''
    } = resultado;

    let mensaje = `🔹 ${numero}. ${nombreCompleto}\n`;
    mensaje += `📞 Teléfono: ${telefono}\n`;

    if (cargo) {
      mensaje += `💼 Cargo: ${cargo}\n`;
    }

    if (oficina) {
      mensaje += `🏢 Oficina: ${oficina}\n`;
    }

    if (region) {
      mensaje += `🌍 Región: ${region}\n`;
    }

    if (establecimiento) {
      mensaje += `🏬 Establecimiento: ${establecimiento}`;
    } else {
      // Remover última línea si no hay establecimiento
      mensaje = mensaje.trimEnd();
    }

    return mensaje;
  }

  /**
   * Formatea múltiples resultados en un mensaje único
   * @param {Array} resultados - Array de resultados
   * @param {boolean} hayMas - Si hay más de 5 resultados
   * @returns {string} Mensaje completo formateado
   */
  static formatearMultiplesResultados(resultados = [], hayMas = false) {
    if (!resultados || resultados.length === 0) {
      return '';
    }

    let mensaje = resultados.map(r => this.formatearResultado(r)).join('\n\n');

    if (hayMas) {
      mensaje += '\n\nℹ️ Hay más resultados. Proporciona más contexto para refinar la búsqueda';
    }

    return mensaje;
  }

  /**
   * Formatea el mensaje de resultados con número encontrados
   * @param {Array} resultados - Array de resultados
   * @param {number} totalEncontrados - Total de registros encontrados
   * @param {boolean} hayMas - Si hay más resultados
   * @returns {string} Mensaje con encabezado de resultados
   */
  static formatearResultadosConEncabezado(resultados = [], totalEncontrados = 0, hayMas = false) {
    if (!resultados || resultados.length === 0) {
      return '';
    }

    let cantidad = resultados.length;
    let encabezado = `\n📊 ${cantidad} resultado${cantidad > 1 ? 's encontrado' : ' encontrado'}\n`;

    if (totalEncontrados > 5) {
      encabezado = `\n📊 Mostrando 5 de ${totalEncontrados} resultados\n`;
    }

    let mensaje = encabezado + '\n' + this.formatearMultiplesResultados(resultados, hayMas);

    return mensaje;
  }

  /**
   * Crea el mensaje final con opciones de continuación
   * @param {string} contenidoResultados - Contenido ya formateado de resultados
   * @param {boolean} hayMas - Si hay más de 5 resultados
   * @returns {string} Mensaje completo con opciones
   */
  static formatearMensajeFinal(contenidoResultados, hayMas = false) {
    let mensaje = contenidoResultados;

    mensaje += '\n\n🔍 ¿Deseas continuar con la búsqueda en el directorio?';

    if (hayMas) {
      mensaje =
        '📊 Hay más resultados. Proporciona más contexto para refinar la búsqueda\n\n' + mensaje;
    }

    mensaje += '\n🔙 0. Volver al Menú Principal 🏠';

    return mensaje;
  }

  /**
   * Valida que un resultado tenga la estructura correcta
   * @param {Object} resultado - Objeto a validar
   * @returns {boolean}
   */
  static validarResultado(resultado) {
    if (!resultado || typeof resultado !== 'object') {
      return false;
    }

    return (
      typeof resultado.nombreCompleto === 'string' &&
      typeof resultado.telefono === 'string'
    );
  }

  /**
   * Valida que un array de resultados sea válido
   * @param {Array} resultados
   * @returns {boolean}
   */
  static validarResultados(resultados) {
    if (!Array.isArray(resultados)) {
      return false;
    }

    return resultados.every(r => this.validarResultado(r));
  }
}

module.exports = DirectorioFormatter;
