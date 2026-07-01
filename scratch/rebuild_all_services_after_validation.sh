#!/bin/bash
cd /home/joshua/projects/ceibav2

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🏗️ Iniciando reconstrucción rápida ==="

echo "🐳 Recompilando usuarios..."
docker build -t usuarios:latest backend-delivery/micro_users/

echo "🐳 Recompilando customer..."
docker build -t customer:latest backend-delivery/micro-customer/

echo "🐳 Recompilando drivers..."
docker build -t drivers:latest backend-delivery/micro-drivers/

echo "🐳 Recompilando productos..."
docker build -t productos:latest backend-delivery/micro_products/

echo "🐳 Recompilando payments..."
docker build -t payments:latest backend-delivery/micro_payments/

echo "🐳 Recompilando realtime..."
docker build -t realtime:latest backend-delivery/micro-realtime/

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/usuarios deployment/customer deployment/drivers deployment/productos deployment/payments deployment/realtime -n ceiba-bar

echo "=== ⌛ Esperando rollout status ==="
kubectl rollout status deployment/usuarios -n ceiba-bar
kubectl rollout status deployment/customer -n ceiba-bar
kubectl rollout status deployment/drivers -n ceiba-bar
kubectl rollout status deployment/productos -n ceiba-bar
kubectl rollout status deployment/payments -n ceiba-bar
kubectl rollout status deployment/realtime -n ceiba-bar

echo "=== 🎉 Reconstrucción y despliegue finalizados con éxito! ==="
