#!/bin/bash
echo "=== Fixing Keycloak Database Config ==="

# 1. Corregir los Web Origins (quitar el '/*' final)
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
UPDATE web_origins 
SET value = 'http://ceiba-bar.local' 
WHERE client_id = '81dfa2b3-3627-4a91-ba08-419787953414' AND value = 'http://ceiba-bar.local/*';"

kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
UPDATE web_origins 
SET value = 'http://nextjs.ceiba-bar.local' 
WHERE client_id = 'bf5adc5c-58bf-46fc-9ea0-a9be16aa7f94' AND value = 'http://nextjs.ceiba-bar.local/*';"

# 2. Corregir la política Content Security Policy (CSP) en el reino 'ceiba-bar'
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
UPDATE realm_attribute 
SET value = 'frame-src ''self''; frame-ancestors ''self'' http://ceiba-bar.local http://nextjs.ceiba-bar.local http://localhost:4200 http://localhost:3000; object-src ''none'';' 
WHERE realm_id = '80d4e531-cc53-4a8f-add1-8745f7d26523' AND name = '_browser_header.contentSecurityPolicy';"

echo "=== Verifying Updated Web Origins ==="
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
SELECT client_id, value FROM web_origins WHERE client_id IN ('81dfa2b3-3627-4a91-ba08-419787953414', 'bf5adc5c-58bf-46fc-9ea0-a9be16aa7f94');"

echo "=== Verifying Updated CSP ==="
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
SELECT name, value FROM realm_attribute WHERE realm_id = '80d4e531-cc53-4a8f-add1-8745f7d26523' AND name = '_browser_header.contentSecurityPolicy';"
