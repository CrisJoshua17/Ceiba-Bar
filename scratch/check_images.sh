#!/bin/bash
eval $(minikube docker-env)
echo "=== Docker Images Created At ==="
docker images --format "{{.Repository}}:{{.Tag}} - {{.CreatedAt}}" | grep -E "usuarios|customer|productos|realtime"
