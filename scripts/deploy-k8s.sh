#!/bin/bash

# ==============================================================================
# Script de Despliegue en Kubernetes (Minikube) — Ceiba-Bar Delivery
# ==============================================================================

# Colores para salida en consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando despliegue de Ceiba Bar en Kubernetes (Minikube)...${NC}"

# 1. Verificar si Minikube está instalado
if ! command -v minikube &> /dev/null; then
    echo -e "${RED}❌ Minikube no está instalado en este sistema. Por favor instálalo e intenta nuevamente.${NC}"
    exit 1
fi

# 2. Verificar estado de Minikube y arrancarlo si es necesario
echo -e "\n${BLUE}🔄 Verificando estado de Minikube...${NC}"
MINIKUBE_STATUS=$(minikube status --format='{{.Host}}')

if [ "$MINIKUBE_STATUS" != "Running" ]; then
    echo -e "${YELLOW}⚠️ Minikube no está corriendo. Iniciando clúster local...${NC}"
    minikube start --cpus=4 --memory=8192 --driver=docker
else
    echo -e "${GREEN}✅ Minikube ya está corriendo.${NC}"
fi

# 3. Habilitar Addons Críticos en Minikube
echo -e "\n${BLUE}🔄 Habilitando addons de Ingress y Metrics Server...${NC}"
minikube addons enable ingress
minikube addons enable metrics-server

# 4. Crear el espacio de nombres (Namespace)
echo -e "\n${BLUE}🔄 Aplicando Namespace ceiba-bar...${NC}"
kubectl apply -f k8s/base/00-namespace.yaml

# 5. Crear ConfigMaps dinámicos a partir de archivos
echo -e "\n${BLUE}🔄 Creando ConfigMaps dinámicos para base de datos y Keycloak...${NC}"

# Crear ConfigMap para inicializar base de datos Postgres
if [ -f "backend-delivery/init-databases.sql" ]; then
    echo -e "📦 Creando ConfigMap 'postgres-init-sql'..."
    kubectl create configmap postgres-init-sql \
        --from-file=backend-delivery/init-databases.sql \
        -n ceiba-bar \
        --dry-run=client -o yaml | kubectl apply -f -
else
    echo -e "${RED}❌ Archivo 'backend-delivery/init-databases.sql' no encontrado.${NC}"
    exit 1
fi

# Crear ConfigMap para importar el reino de Keycloak
if [ -f "backend-delivery/keycloak/ceiba-bar-realm.json" ]; then
    echo -e "📦 Creando ConfigMap 'keycloak-realm'..."
    kubectl create configmap keycloak-realm \
        --from-file=backend-delivery/keycloak/ceiba-bar-realm.json \
        -n ceiba-bar \
        --dry-run=client -o yaml | kubectl apply -f -
else
    echo -e "${RED}❌ Archivo 'backend-delivery/keycloak/ceiba-bar-realm.json' no encontrado.${NC}"
    exit 1
fi

# 6. Configurar entorno Docker para compilar dentro de Minikube
echo -e "\n${BLUE}🔄 Conectando el entorno Docker al demonio interno de Minikube...${NC}"
eval $(minikube docker-env)

# 7. Compilar imágenes Docker locales dentro del clúster
echo -e "\n${YELLOW}🏗️ Compilando imágenes Docker locales en Minikube (esto tomará unos minutos)...${NC}"

# Compilar Eureka Discovery Server
echo -e "🐳 Compilando Eureka Discovery Server..."
docker build -t eureka:latest backend-delivery/eureka/

# Compilar API Gateway
echo -e "🐳 Compilando API Gateway..."
docker build -t gateway:latest backend-delivery/micro-gateway/

# Compilar microservicios de negocio
echo -e "🐳 Compilando Microservicio Usuarios..."
docker build -t usuarios:latest backend-delivery/micro_users/

# Compilar microservicio Clientes
echo -e "🐳 Compilando Microservicio Clientes..."
docker build -t customer:latest backend-delivery/micro-customer/

# Compilar microservicio Conductores
echo -e "🐳 Compilando Microservicio Conductores..."
docker build -t drivers:latest backend-delivery/micro-drivers/

# Compilar microservicio Productos
echo -e "🐳 Compilando Microservicio Productos..."
docker build -t productos:latest backend-delivery/micro_products/

# Compilar microservicio Pagos
echo -e "🐳 Compilando Microservicio Pagos..."
docker build -t payments:latest backend-delivery/micro_payments/

# Compilar microservicio Realtime
echo -e "🐳 Compilando Microservicio Realtime y Órdenes..."
docker build -t realtime:latest backend-delivery/micro-realtime/

# Compilar Frontend Angular
echo -e "🐳 Compilando Frontend Angular..."
docker build -t frontend-angular:latest deliveryFront/delivery-frontendd/

# Compilar Frontend Next.js
echo -e "🐳 Compilando Frontend Next.js..."
docker build -t frontend-nextjs:latest frontend-nextjs/

echo -e "${GREEN}✅ Todas las imágenes compiladas con éxito dentro de Minikube.${NC}"

# 8. Aplicar manifiestos de Kubernetes en orden
echo -e "\n${BLUE}🔄 Aplicando manifiestos de Kubernetes...${NC}"
kubectl apply -f k8s/base/01-secrets.yaml
kubectl apply -f k8s/base/02-configmaps.yaml
kubectl apply -f k8s/base/03-databases.yaml
kubectl apply -f k8s/base/04-messaging.yaml
kubectl apply -f k8s/base/05-keycloak.yaml
kubectl apply -f k8s/base/06-infra-services.yaml
kubectl apply -f k8s/base/07-microservices.yaml
kubectl apply -f k8s/base/08-frontends.yaml
kubectl apply -f k8s/base/09-monitoring.yaml
kubectl apply -f k8s/base/10-ingress.yaml

echo -e "\n${GREEN}🎉 ¡Despliegue aplicado con éxito!${NC}"

# 9. Mostrar información de conexión
MINIKUBE_IP=$(minikube ip)
echo -e "\n${YELLOW}======================================================================${NC}"
echo -e "${GREEN}📌 PRÓXIMOS PASOS REQUERIDOS PARA ACCEDER A LA APP:${NC}"
echo -e "1. Ejecuta este comando en otra ventana de tu terminal para activar el Ingress:"
echo -e "   ${BLUE}minikube tunnel${NC}"
echo -e ""
echo -e "2. Agrega las siguientes líneas a tu archivo de hosts de Windows:"
echo -e "   Archivo: ${BLUE}C:\\Windows\\System32\\drivers\\etc\\hosts${NC}"
echo -e "   Contenido:"
echo -e "   ${GREEN}${MINIKUBE_IP} ceiba-bar.local nextjs.ceiba-bar.local api.ceiba-bar.local auth.ceiba-bar.local${NC}"
echo -e ""
echo -e "3. Abre tu navegador y accede a:"
echo -e "   - Frontend Angular (Principal): ${BLUE}http://ceiba-bar.local${NC}"
echo -e "   - Frontend Next.js: ${BLUE}http://nextjs.ceiba-bar.local${NC}"
echo -e "   - Eureka Dashboard: ${BLUE}http://api.ceiba-bar.local/eureka/ (vía Gateway)${NC}"
echo -e "   - Keycloak Admin Panel: ${BLUE}http://auth.ceiba-bar.local${NC}"
echo -e "======================================================================"
