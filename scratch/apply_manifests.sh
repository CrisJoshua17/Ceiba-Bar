#!/bin/bash
echo "=== Applying Updated ConfigMap ==="
kubectl apply -f k8s/base/02-configmaps.yaml

echo "=== Applying Updated Microservices Manifests ==="
kubectl apply -f k8s/base/07-microservices.yaml

echo "=== Waiting for Rollout Restarts ==="
kubectl rollout restart deployment/usuarios deployment/customer deployment/productos -n ceiba-bar
kubectl rollout restart deployment/realtime -n ceiba-bar

echo "=== Monitoring Rollout Status ==="
kubectl rollout status deployment/usuarios -n ceiba-bar
kubectl rollout status deployment/customer -n ceiba-bar
kubectl rollout status deployment/productos -n ceiba-bar
kubectl rollout status deployment/realtime -n ceiba-bar
