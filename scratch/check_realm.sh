#!/bin/bash
echo "=== Realm Table Columns ==="
kubectl exec -n ceiba-bar statefulset/postgres -- psql -U ceiba_admin -d keycloak_db -c "
SELECT id, name, registration_allowed FROM realm;"
