#!/bin/bash
cd /home/joshua/projects/ceibav2

export PATH=/usr/local/bin:/usr/bin:/bin

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🏗️ Recompilando micro_products ==="
docker build --pull=false -t productos:latest backend-delivery/micro_products/

echo "=== 🏗️ Recompilando micro_users ==="
docker build --pull=false -t usuarios:latest backend-delivery/micro_users/

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/productos deployment/usuarios -n ceiba-bar

echo "=== ⌛ Esperando rollout status ==="
kubectl rollout status deployment/productos -n ceiba-bar
kubectl rollout status deployment/usuarios -n ceiba-bar

echo "=== 🎉 Reconstrucción y despliegue finalizados con éxito! ==="
