#!/usr/bin/env bash
# Prepare namespace, secret et config d'init PostGIS (ne remplace jamais un secret existant)
set -e
cd "$(dirname "$0")/.."
kubectl get namespace naseej >/dev/null 2>&1 || kubectl create namespace naseej
if kubectl get secret naseej-secret -n naseej >/dev/null 2>&1; then
  echo "naseej-secret existe deja : conserve tel quel"
else
  kubectl create secret generic naseej-secret -n naseej \
    --from-literal=AUTH_DB_PASSWORD=$(openssl rand -hex 16) \
    --from-literal=EMERGENCY_DB_PASSWORD=$(openssl rand -hex 16) \
    --from-literal=JWT_SECRET=$(openssl rand -hex 48)
fi
kubectl create configmap emergency-init -n naseej \
  --from-file=01-postgis.sql=infrastructure/postgres/init-postgis.sql \
  --dry-run=client -o yaml | kubectl apply -f -
