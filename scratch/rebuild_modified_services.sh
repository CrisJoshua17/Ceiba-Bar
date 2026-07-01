#!/bin/bash
cd /home/joshua/projects/ceibav2

# 1. Apuntar Docker al demonio interno de Minikube
eval $(minikube docker-env)

echo "=== 🏗️ Iniciando reconstrucción de servicios modificados ==="

# 2. Compilar microservicio pagos con las URLs dinámicas
echo "🐳 Recompilando micro_payments..."
docker build --no-cache -t payments:latest backend-delivery/micro_payments/

# 3. Compilar frontend Angular con los nuevos paths de imágenes y redirecciones
echo "🐳 Recompilando frontend Angular..."
docker build --build-arg NG_CONFIG=k8s --no-cache -t frontend-angular:latest deliveryFront/delivery-frontendd/

# 4. Compilar frontend Next.js con los nuevos paths de imágenes y redirecciones
echo "🐳 Recompilando frontend Next.js..."
docker build --build-arg ENV_FILE=.env.k8s --no-cache -t frontend-nextjs:latest frontend-nextjs/

echo "=== 🚀 Reiniciando pods en Kubernetes ==="
kubectl rollout restart deployment/payments deployment/frontend-angular deployment/frontend-nextjs -n ceiba-bar

echo "=== ⌛ Esperando el estado de listos (rollout status) ==="
kubectl rollout status deployment/payments -n ceiba-bar
kubectl rollout status deployment/frontend-angular -n ceiba-bar
kubectl rollout status deployment/frontend-nextjs -n ceiba-bar

echo "=== 🎉 ¡Reconstrucción y despliegue finalizados con éxito! ==="
