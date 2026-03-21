#!/usr/bin/env bash
set -euo pipefail

echo "=== CherryOps Deploy ==="
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cd "$(dirname "$0")/.."

echo "→ Pulling latest code..."
git pull origin main

echo "→ Building Docker image..."
docker compose -f docker-compose.prod.yml build

echo "→ Starting API..."
docker compose -f docker-compose.prod.yml up -d api

echo "→ Reloading nginx..."
docker exec infra-nginx nginx -s reload || true

echo "→ Health check..."
API_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cherryops-api)
for i in 1 2 3 4 5; do
  sleep 3
  if curl -sf "http://${API_IP}:3100/api/v1/health" > /dev/null 2>&1; then
    echo "✓ API is healthy"
    break
  fi
  if [ "$i" -eq 5 ]; then
    echo "✗ Health check failed after 5 attempts"
    docker logs cherryops-api --tail 30
    exit 1
  fi
  echo "  Attempt $i/5 — waiting..."
done

echo "→ Cleaning up old images..."
docker image prune -f

echo "=== Deploy complete ==="
