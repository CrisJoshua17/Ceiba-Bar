#!/bin/bash
cd /home/joshua/projects/ceibav2

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🏗️ Iniciando reconstrucción rápida ==="

echo "🐳 Recompilando gateway..."
docker build -t gateway:latest backend-delivery/micro-gateway/

echo "🐳 Recompilando realtime..."
docker build -t realtime:latest backend-delivery/micro-realtime/

echo "🐳 Recompilando payments..."
docker build -t payments:latest backend-delivery/micro_payments/

echo "🐳 Recompilando drivers..."
docker build -t drivers:latest backend-delivery/micro-drivers/

echo "=== 🚀 Aplicando manifiestos actualizados ==="
kubectl apply -f k8s/base/07-microservices.yaml

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/gateway deployment/realtime deployment/payments deployment/drivers -n ceiba-bar

echo "=== ⌛ Esperando rollout status ==="
kubectl rollout status deployment/gateway -n ceiba-bar
kubectl rollout status deployment/realtime -n ceiba-bar
kubectl rollout status deployment/payments -n ceiba-bar
kubectl rollout status deployment/drivers -n ceiba-bar

echo "=== 🎉 Reconstrucción y despliegue finalizados con éxito! ==="
