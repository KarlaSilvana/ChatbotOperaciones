# Chatbot con Twilio - Menú Genérico

Chatbot basado en Node.js y Express que integra Twilio WhatsApp para proporcionar un menú genérico con opciones predefinidas.

## 🎯 Funcionalidades

- ✅ Integración con Twilio WhatsApp
- ✅ Menú genérico con 4 opciones predefinidas
- ✅ Gestión de estados de usuario
- ✅ Rutas de mensaje inteligentes
- ⏳ Preparado para integración con API de chatbot

## 📋 Estructura del Proyecto

```
chatbot/
├── src/
│   ├── bot/
│   │   ├── menus.js              # Menús y respuestas genéricas
│   │   ├── messageRouter.js      # Enrutador de mensajes
│   │   └── stateManager.js       # Gestión de estados de usuario
│   ├── services/
│   │   └── chatbotAPI.js         # (Próximo: integración con API)
│   └── utils/
│       └── logger.js              # Sistema de logging
├── app.js                         # Servidor principal
├── package.json                   # Dependencias
├── .env.example                   # Variables de entorno (ejemplo)
└── README.md                      # Este archivo
```

## 🚀 Instalación

### Requisitos previos
- Node.js 14+ 
- npm o yarn
- Cuenta de Twilio con WhatsApp Business

### Pasos de instalación

1. **Clonar o descargar el proyecto**
```bash
cd chatbot
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env basado en .env.example
cp .env.example .env
```

4. **Obtener credenciales de Twilio**
   - Ir a https://console.twilio.com
   - Copiar `ACCOUNT_SID` y `AUTH_TOKEN`
   - Editar `.env` con tus credenciales

5. **Configurar el webhook en Twilio**
   - En Twilio Console → Messaging → Settings → WhatsApp Sandbox
   - Configurar webhook URL: `https://tu-servidor.com/webhook/messages`

## 🔧 Configuración

### Variables de entorno (.env)

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=tu_twilio_sid_aqui
TWILIO_AUTH_TOKEN=tu_token_aqui
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Chatbot API Configuration (próximo)
CHATBOT_API_URL=https://tu-api.com/chat
CHATBOT_API_KEY=tu_api_key_aqui

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 📱 Menú de Opciones

Cuando un usuario envía un mensaje, recibe:

```
👋 ¡Bienvenido!

¿En qué puedo ayudarte?

1️⃣ 📅 Horarios de atención
2️⃣ 📍 Ubicación y sucursales
3️⃣ 💰 Precios y servicios
4️⃣ 📞 Información de contacto
5️⃣ 💬 Hablar con asistente (IA)

Escribe el número de tu opción o haz una pregunta directamente.
```

### Opciones disponibles

| Opción | Función |
|--------|---------|
| **1** | Muestra horarios de atención |
| **2** | Muestra ubicaciones y sucursales |
| **3** | Muestra precios y servicios |
| **4** | Información de contacto |
| **5** | Conecta con asistente IA (próximo) |
| **menu** | Vuelve al menú principal |

## 💻 Desarrollo

### Modo desarrollo con hot-reload
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

## 🧪 Testing

### 1. Probar localmente con ngrok
```bash
# En otra terminal
ngrok http 3000

# Copiar URL de ngrok y configurar en Twilio webhook
```

### 2. Enviar mensaje de prueba
- Agregar número de Twilio a contactos
- Enviar mensaje: "Hola" o "menu"
- Responder con número (1-5)


## 🛠️ Troubleshooting

### Webhook no se conecta
- Verificar `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
- Asegurar que el servidor está corriendo
- Verificar que ngrok está activo (si usa localmente)

### Mensajes no se reciben
- Confirmar webhook URL en Twilio Console
- Revisar logs en `npm run dev`
- Verificar permisos de Twilio

### Error de credenciales
- Regenerar tokens en Twilio Console
- Actualizar `.env`
- Reiniciar servidor

## 📄 Licencia

MIT

## 👥 Contacto

Para preguntas o soporte, contactar al equipo de desarrollo.
