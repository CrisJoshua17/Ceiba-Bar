#!/bin/bash
cd /home/joshua/projects/ceibav2

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🛡️ Aplicando secretos y configuración de K8s ==="
kubectl apply -f k8s/base/01-secrets.yaml
kubectl apply -f k8s/base/07-microservices.yaml

echo "=== 🏗️ Iniciando reconstrucción de microservicios y gateway ==="

echo "🐳 Recompilando gateway..."
docker build --pull=false -t gateway:latest backend-delivery/micro-gateway/

echo "🐳 Recompilando usuarios..."
docker build --pull=false -t usuarios:latest backend-delivery/micro_users/

echo "🐳 Recompilando customer..."
docker build --pull=false -t customer:latest backend-delivery/micro-customer/

echo "🐳 Recompilando drivers..."
docker build --pull=false -t drivers:latest backend-delivery/micro-drivers/

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/gateway deployment/usuarios deployment/customer deployment/drivers -n ceiba-bar

echo "=== ⌛ Esperando rollout status ==="
kubectl rollout status deployment/gateway -n ceiba-bar
kubectl rollout status deployment/usuarios -n ceiba-bar
kubectl rollout status deployment/customer -n ceiba-bar
kubectl rollout status deployment/drivers -n ceiba-bar

echo "=== 🎉 Reconstrucción y despliegue finalizados con éxito! ==="
