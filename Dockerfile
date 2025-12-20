# =================================
# Stage 1: Builder (compilación)
# =================================
FROM node:20-alpine AS builder

# Metadata
LABEL maintainer="tu-email@ejemplo.com"
LABEL description="Chatbot Twilio con integración API"

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
# --omit=dev excluye devDependencies
# --frozen-lockfile usa versiones exactas del lock
RUN npm ci --omit=dev --frozen-lockfile && \
    npm cache clean --force

# =================================
# Stage 2: Runtime (imagen final)
# =================================
FROM node:20-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias desde builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto (se sobrescriben con .env)
ENV NODE_ENV=production \
    PORT=3000

# Health check (usa wget disponible en Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "server.js"]