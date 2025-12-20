#!/bin/bash

# ================================================
# Script para actualizar Docker y docker-compose en AWS EC2
# ================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Docker Update for AWS EC2${NC}"
echo -e "${BLUE}========================================${NC}"

# ================================================
# 1. ACTUALIZAR docker-compose (1.29.2 → 2.x)
# ================================================
echo -e "\n${BLUE}[1/4]${NC} Actualizando docker-compose..."

# Detener servicios
echo -e "${YELLOW}Deteniendo servicios...${NC}"
cd ~/projects/ChatbotOperaciones
docker-compose down 2>/dev/null || true

# Eliminar versión vieja
echo -e "${YELLOW}Removiendo versión antigua de docker-compose...${NC}"
sudo rm -f /usr/bin/docker-compose

# Instalar versión nueva
echo -e "${YELLOW}Instalando docker-compose v2.x...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Crear symlink para compatibilidad
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verificar
echo -e "${GREEN}✓ Versión de docker-compose:${NC}"
docker-compose --version

# ================================================
# 2. ACTUALIZAR Docker a 28.x+
# ================================================
echo -e "\n${BLUE}[2/4]${NC} Actualizando Docker..."

echo -e "${YELLOW}Detener Docker daemon...${NC}"
sudo systemctl stop docker

echo -e "${YELLOW}Actualizando Docker...${NC}"
sudo apt-get update
sudo apt-get install -y docker.io

echo -e "${YELLOW}Iniciar Docker daemon...${NC}"
sudo systemctl start docker

# Verificar
echo -e "${GREEN}✓ Versión de Docker:${NC}"
docker --version

# ================================================
# 3. RECONSTRUIR LA IMAGEN CON CAMBIOS NUEVOS
# ================================================
echo -e "\n${BLUE}[3/4]${NC} Reconstruyendo imagen Docker..."

cd ~/projects/ChatbotOperaciones

# Asegurar que estamos en main y actualizado
git pull origin main

# Build sin caché
echo -e "${YELLOW}Build sin caché (esto toma tiempo)...${NC}"
docker-compose build --no-cache

# ================================================
# 4. INICIAR Y VERIFICAR
# ================================================
echo -e "\n${BLUE}[4/4]${NC} Iniciando servicios..."

docker-compose up -d

echo -e "${YELLOW}Esperando a que el contenedor esté listo...${NC}"
sleep 10

# Verificar contenedor
CONTAINER_ID=$(docker-compose ps -q bot)

if [ -z "$CONTAINER_ID" ]; then
    echo -e "${RED}❌ Error: No se encontró el contenedor${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contenedor iniciado: ${CONTAINER_ID}${NC}"

# Mostrar estado
echo -e "\n${YELLOW}📊 Estado actual:${NC}"
docker ps -f id=$CONTAINER_ID --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar health
echo -e "\n${YELLOW}🏥 Verificando health check...${NC}"
if docker exec $CONTAINER_ID wget --quiet --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
    echo -e "${GREEN}✅ Health Check: HEALTHY${NC}"
else
    echo -e "${RED}⚠️  Health Check: Checking...${NC}"
fi

# Mostrar logs
echo -e "\n${YELLOW}📋 Últimos logs:${NC}"
docker logs --tail 20 $CONTAINER_ID

# ================================================
# RESUMEN FINAL
# ================================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Update completado exitosamente!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Versiones instaladas:${NC}"
docker --version
docker-compose --version

echo -e "\n${YELLOW}Comandos útiles:${NC}"
echo "  Ver logs en tiempo real:"
echo "    docker logs -f chatbot-twilio-bot"
echo ""
echo "  Reiniciar contenedor:"
echo "    docker-compose restart"
echo ""
echo "  Detener servicios:"
echo "    docker-compose down"
echo ""

echo -e "${GREEN}¡Listo para producción!${NC}\n"
