#!/bin/bash
cd /home/joshua/projects/ceibav2

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🏗️ Iniciando reconstrucción de microservicios con la nueva configuración (SIN CACHÉ) ==="

# 2. Compilar cada imagen Docker localmente sin usar caché
echo "🐳 Recompilando micro-usuarios..."
docker build --no-cache -t usuarios:latest backend-delivery/micro_users/

echo "🐳 Recompilando micro-customer..."
docker build --no-cache -t customer:latest backend-delivery/micro-customer/

echo "🐳 Recompilando micro-drivers..."
docker build --no-cache -t drivers:latest backend-delivery/micro-drivers/

echo "🐳 Recompilando micro-productos..."
docker build --no-cache -t productos:latest backend-delivery/micro_products/

echo "🐳 Recompilando micro-payments..."
docker build --no-cache -t payments:latest backend-delivery/micro_payments/

echo "🐳 Recompilando micro-realtime..."
docker build --no-cache -t realtime:latest backend-delivery/micro-realtime/

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/usuarios deployment/customer deployment/drivers deployment/productos deployment/payments deployment/realtime -n ceiba-bar

echo "=== ⌛ Esperando el estado de listos (rollout status) ==="
kubectl rollout status deployment/usuarios -n ceiba-bar
kubectl rollout status deployment/customer -n ceiba-bar
kubectl rollout status deployment/productos -n ceiba-bar
kubectl rollout status deployment/realtime -n ceiba-bar

echo "=== 🎉 ¡Reconstrucción y despliegue finalizados con éxito! ==="
