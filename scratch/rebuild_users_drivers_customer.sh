#!/bin/bash
cd /home/joshua/projects/ceibav2

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🏗️ Iniciando reconstrucción rápida de servicios ==="

echo "🐳 Recompilando usuarios..."
docker build --pull=false -t usuarios:latest backend-delivery/micro_users/

echo "🐳 Recompilando customer..."
docker build --pull=false -t customer:latest backend-delivery/micro-customer/

echo "🐳 Recompilando drivers..."
docker build --pull=false -t drivers:latest backend-delivery/micro-drivers/

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/usuarios deployment/customer deployment/drivers -n ceiba-bar

echo "=== ⌛ Esperando rollout status ==="
kubectl rollout status deployment/usuarios -n ceiba-bar
kubectl rollout status deployment/customer -n ceiba-bar
kubectl rollout status deployment/drivers -n ceiba-bar

echo "=== 🎉 Reconstrucción y despliegue finalizados con éxito! ==="
