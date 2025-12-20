#!/bin/bash

# ================================================
# Comandos útiles de Docker para Chatbot
# ================================================

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Comandos útiles de Docker${NC}\n"

case "$1" in
  
  # ================================================
  # DESARROLLO
  # ================================================
  dev)
    echo -e "${GREEN}Iniciando en modo desarrollo...${NC}"
    docker-compose -f docker-compose.dev.yml up --build
    ;;
  
  dev:d)
    echo -e "${GREEN}Iniciando en background (desarrollo)...${NC}"
    docker-compose -f docker-compose.dev.yml up -d --build
    ;;
  
  dev:logs)
    echo -e "${GREEN}Viendo logs (desarrollo)...${NC}"
    docker-compose -f docker-compose.dev.yml logs -f
    ;;
  
  dev:down)
    echo -e "${RED}Deteniendo contenedores (desarrollo)...${NC}"
    docker-compose -f docker-compose.dev.yml down
    ;;
  
  # ================================================
  # PRODUCCIÓN
  # ================================================
  prod)
    echo -e "${GREEN}Iniciando en modo producción...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    ;;
  
  prod:logs)
    echo -e "${GREEN}Viendo logs (producción)...${NC}"
    docker-compose -f docker-compose.prod.yml logs -f
    ;;
  
  prod:down)
    echo -e "${RED}Deteniendo servicios (producción)...${NC}"
    docker-compose -f docker-compose.prod.yml down
    ;;
  
  # ================================================
  # GENERAL
  # ================================================
  up)
    echo -e "${GREEN}Iniciando con docker-compose.yml...${NC}"
    docker-compose up -d
    ;;
  
  down)
    echo -e "${RED}Deteniendo...${NC}"
    docker-compose down
    ;;
  
  logs)
    echo -e "${YELLOW}Últimos 50 logs:${NC}"
    docker-compose logs --tail 50
    ;;
  
  logs:f)
    echo -e "${YELLOW}Logs en tiempo real:${NC}"
    docker-compose logs -f
    ;;
  
  rebuild)
    echo -e "${GREEN}Reconstruyendo (sin caché)...${NC}"
    docker-compose build --no-cache
    ;;
  
  restart)
    echo -e "${GREEN}Reiniciando contenedor...${NC}"
    docker-compose restart
    ;;
  
  status)
    echo -e "${BLUE}Estado actual:${NC}"
    docker-compose ps -a
    ;;
  
  health)
    echo -e "${BLUE}Estado de salud:${NC}"
    docker-compose ps
    echo ""
    docker ps --format "table {{.Names}}\t{{.Status}}"
    ;;
  
  shell)
    echo -e "${YELLOW}Accediendo al contenedor...${NC}"
    docker-compose exec bot /bin/sh
    ;;
  
  test)
    echo -e "${BLUE}Ejecutando tests...${NC}"
    docker-compose exec bot npm test
    ;;
  
  clean)
    echo -e "${RED}Limpiando dangling images...${NC}"
    docker image prune -f
    docker container prune -f
    ;;
  
  info)
    echo -e "${BLUE}Información de Docker:${NC}"
    docker --version
    docker-compose --version
    docker ps -a
    ;;
  
  *)
    echo -e "${YELLOW}Uso: ./docker-commands.sh [comando]${NC}\n"
    echo "Comandos disponibles:"
    echo ""
    echo -e "${GREEN}Desarrollo:${NC}"
    echo "  dev              - Iniciar en desarrollo (foreground)"
    echo "  dev:d            - Iniciar en desarrollo (background)"
    echo "  dev:logs         - Ver logs en tiempo real (desarrollo)"
    echo "  dev:down         - Detener servicios (desarrollo)"
    echo ""
    echo -e "${GREEN}Producción:${NC}"
    echo "  prod             - Iniciar en producción (background)"
    echo "  prod:logs        - Ver logs en tiempo real (producción)"
    echo "  prod:down        - Detener servicios (producción)"
    echo ""
    echo -e "${GREEN}General:${NC}"
    echo "  up               - Iniciar con docker-compose.yml"
    echo "  down             - Detener todos los servicios"
    echo "  logs             - Ver últimos 50 logs"
    echo "  logs:f           - Ver logs en tiempo real"
    echo "  rebuild          - Reconstruir imagen (sin caché)"
    echo "  restart          - Reiniciar contenedor"
    echo "  status           - Ver estado de servicios"
    echo "  health           - Ver salud del contenedor"
    echo "  shell            - Acceder al shell del contenedor"
    echo "  test             - Ejecutar tests en el contenedor"
    echo "  clean            - Limpiar imágenes dangling"
    echo "  info             - Información de Docker"
    echo ""
    ;;
esac
