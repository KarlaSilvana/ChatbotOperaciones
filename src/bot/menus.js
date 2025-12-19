/**
 * Menús y opciones genéricas del chatbot
 * Estas opciones NO requieren integración con la API
 */

const menus = {
  principal: {
    text: `👋 *¡Bienvenido!*

¿En qué puedo ayudarte?

1️⃣ 📅 Horarios de atención
2️⃣ 📍 Ubicación y sucursales
3️⃣ 💰 Precios y servicios
4️⃣ 📞 Información de contacto
5️⃣ 💬 Hablar con asistente (IA)

_Escribe el número de tu opción o haz una pregunta directamente._`,
    
    opciones: {
      '1': 'horarios',
      '2': 'ubicacion',
      '3': 'precios',
      '4': 'contacto',
      '5': 'chatbot'
    }
  }
};

const respuestasGenericas = {
  horarios: {
    text: `📅 *HORARIOS DE ATENCIÓN*

🕐 Lunes a Viernes: 9:00 AM - 6:00 PM
🕐 Sábados: 9:00 AM - 2:00 PM
🕐 Domingos: Cerrado

⚠️ Horarios especiales en feriados

━━━━━━━━━━━━━━━━━━━━━━
Escribe *menu* para volver al inicio`,
    nextState: 'menu'
  },
  
  ubicacion: {
    text: `📍 *NUESTRAS UBICACIONES*

*Sede Principal:*
Av. Larco 1234, Miraflores
Lima, Perú

*Sucursal 2:*
Av. Arequipa 567, San Isidro
Lima, Perú

*Sucursal 3:*
Av. Javier Prado 890, Surco
Lima, Perú

🚗 Contamos con estacionamiento
🚇 Cerca de estaciones de Metro

━━━━━━━━━━━━━━━━━━━━━━
Escribe *menu* para volver al inicio`,
    nextState: 'menu'
  },
  
  precios: {
    text: `💰 *PRECIOS Y SERVICIOS*

*Servicio Básico:* S/. 99
✓ Consulta inicial
✓ Diagnóstico
✓ Recomendaciones

*Servicio Premium:* S/. 199
✓ Todo lo del básico
✓ Seguimiento personalizado
✓ Soporte 24/7

*Servicio Enterprise:* S/. 399
✓ Todo lo del premium
✓ Atención prioritaria
✓ Reportes detallados

📞 Pregunta por nuestras promociones

━━━━━━━━━━━━━━━━━━━━━━
Escribe *menu* para volver al inicio`,
    nextState: 'menu'
  },
  
  contacto: {
    text: `📞 *INFORMACIÓN DE CONTACTO*

📱 WhatsApp: +51 999 888 777
📧 Email: contacto@empresa.com
🌐 Web: www.empresa.com
⏰ Atención: Lunes a Viernes 9 AM - 6 PM

¡Nos encantaría escucharte!

━━━━━━━━━━━━━━━━━━━━━━
Escribe *menu* para volver al inicio`,
    nextState: 'menu'
  }
};

/**
 * Obtiene la respuesta genérica basada en la opción
 * @param {string} opcion - La opción seleccionada (1-4)
 * @returns {object} La respuesta genérica
 */
function obtenerRespuestaGenerica(opcion) {
  const opcionMap = menus.principal.opciones[opcion];
  return respuestasGenericas[opcionMap] || null;
}

/**
 * Obtiene el menú principal
 * @returns {object} El menú principal
 */
function obtenerMenuPrincipal() {
  return menus.principal;
}

module.exports = {
  menus,
  respuestasGenericas,
  obtenerRespuestaGenerica,
  obtenerMenuPrincipal
};
