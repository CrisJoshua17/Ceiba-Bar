#!/bin/bash
echo "=== Enabling User Registration in Keycloak DB ==="
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
UPDATE realm SET registration_allowed = 't' WHERE name = 'ceiba-bar';"

echo "=== Restarting Keycloak to apply database changes ==="
kubectl rollout restart deployment/keycloak -n ceiba-bar
kubectl rollout status deployment/keycloak -n ceiba-bar
