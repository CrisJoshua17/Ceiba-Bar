#!/bin/bash
echo "=== Current Redirect URIs ==="
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
SELECT client_id, value FROM redirect_uris WHERE client_id IN ('81dfa2b3-3627-4a91-ba08-419787953414', 'bf5adc5c-58bf-46fc-9ea0-a9be16aa7f94');"

echo "=== Current Web Origins ==="
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
SELECT client_id, value FROM web_origins WHERE client_id IN ('81dfa2b3-3627-4a91-ba08-419787953414', 'bf5adc5c-58bf-46fc-9ea0-a9be16aa7f94');"
