const fs = require('fs');
const path = require('path');

/**
 * Configuración de menús del chatbot
 * Carga dinámicamente los procedimientos desde JSON
 */

class MenusConfig {
  constructor() {
    this.procedimientos = this.cargarProcedimientos();
  }

  /**
   * Carga los procedimientos desde el archivo JSON
   */
  cargarProcedimientos() {
    try {
      const jsonPath = path.join(__dirname, '../config/procedimientos.json');
      const data = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(data).procedimientos;
    } catch (error) {
      console.error('Error cargando procedimientos.json:', error);
      return [];
    }
  }

  /**
   * Obtiene el menú principal
   */
  getMenuPrincipal() {
    return {
      id: 'principal',
      text: `👋 *¡Hola!* Gracias por contactar con *AndyBot* de Caja Los Andes 🏢😁

¿En qué puedo ayudarte?

1️⃣ 💬 Hablar con asistente (IA)
2️⃣ 📄 Procedimientos de Operaciones
3️⃣ 📝 Formularios
4️⃣ 📞 Directorio Telefónico

_Escribe el número de tu opción o haz una pregunta directamente._`,
      opciones: {
        '1': 'chatbot',
        '2': 'procedimientos',
        '3': 'formularios',
        '4': 'directorio'
      }
    };
  }

  /**
   * Obtiene el menú de procedimientos (dinámico)
   */
  getMenuProcedimientos() {
    let texto = `📄 *PROCEDIMIENTOS DE OPERACIONES* 📋\n\n`;
    texto += `Selecciona el procedimiento que necesitas:\n\n`;

    this.procedimientos.forEach(proc => {
      texto += `🔹 ${proc.numero}. ${proc.nombre} ${proc.emoji}\n`;
    });

    texto += `\n🔙 0. Volver al Menú Principal 🏠\n`;
    texto += `\n_Escribe el número del procedimiento._`;

    const opciones = { '0': 'volver' };
    this.procedimientos.forEach(proc => {
      opciones[proc.numero.toString()] = proc.id;
    });

    return {
      id: 'procedimientos',
      text: texto,
      opciones: opciones
    };
  }

  /**
   * Obtiene el menú detalle de un procedimiento específico
   */
  getMenuDetalleProcedimiento(procedimientoId) {
    const proc = this.procedimientos.find(p => p.id === procedimientoId);
    
    if (!proc) {
      return null;
    }

    const texto = `${proc.emoji} *${proc.nombre.toUpperCase()}* ${proc.emoji}

¡Estamos para ayudarte! ✍️💻 
Elige una de las siguientes opciones ⬇️

1️⃣ 📽️ Ver video tutorial del procedimiento
2️⃣ 📄 Ver el PDF o flyer informativo
3️⃣ 💬 Tengo una consulta, quiero escribirla

🔙 0. Volver a Procedimientos

_Escribe el número de tu opción._`;

    return {
      id: 'detalle_procedimiento',
      procedimientoId: procedimientoId,
      text: texto,
      opciones: {
        '1': 'ver_video',
        '2': 'ver_documento',
        '3': 'consulta_ia',
        '0': 'volver'
      },
      recursos: proc.recursos
    };
  }

  /**
   * Obtiene el menú de formularios
   */
  getMenuFormularios() {
    return {
      id: 'formularios',
      text: `📝 *FORMULARIOS*

Por favor, selecciona el formulario que deseas completar:

1️⃣ *Formulario de Derivados Canales*
👉 https://forms.office.com/pages/responsepage.aspx?id=tAtDi4qVqUmuymK19TwNw5orTWtuFeFBp1ksf761BypUNzMwVUhGSlo4UTZST042SUwzMzFYWkk3My4u&route=shorturl

2️⃣ *Formulario de Seguimiento de Derivados*
👉 https://forms.office.com/pages/responsepage.aspx?id=tAtDi4qVqUmuymK19TwNw5orTWtuFeFBp1ksf761BypUNDRYWVc3WFE4QllaV1VWVTM5TjFHNDgxRy4u&route=shorturl

🔙 Escribe *menu* para volver al inicio.`,
      opciones: {
        'menu': 'principal'
      }
    };
  }

  /**
   * Obtiene el menú del directorio telefónico
   */
  getMenuDirectorio() {
    return {
      id: 'directorio',
      text: `📞 DIRECTORIO TELEFÓNICO CORPORATIVO
👤 escribe el nombre, cargo u oficina de la persona
para consultar su número corporativo. ✨

🔙 0. Volver al Menú Principal 🏠`,
      opciones: {
        '0': 'volver'
      }
    };
  }

  /**
   * Obtiene información de un procedimiento por ID
   */
  getProcedimiento(procedimientoId) {
    return this.procedimientos.find(p => p.id === procedimientoId);
  }

  /**
   * Obtiene información de un procedimiento por número
   */
  getProcedimientoPorNumero(numero) {
    return this.procedimientos.find(p => p.numero === parseInt(numero));
  }
}

// Exportar instancia única (singleton)
module.exports = new MenusConfig();