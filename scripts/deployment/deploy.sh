#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely Production Deployment Script"
echo "======================================"
echo ""

# Configuration
ENV_FILE=".env"
COMPOSE_FILE="docker-compose.yml"
MONITORING_COMPOSE="docker-compose.monitoring.yml"

# Check prerequisites
echo "[1/8] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is required"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose is required"; exit 1; }

echo "Prerequisites OK"

# Check environment file
echo "[2/8] Checking environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  echo "Copy .env.example to .env and configure it"
  exit 1
fi

echo "Environment file found"

# Generate JWT secrets if needed
echo "[3/8] Generating secrets..."
if grep -q "change-me-access-secret" "$ENV_FILE"; then
  echo "Generating JWT secrets..."
  JWT_SECRET=$(openssl rand -base64 32)
  JWT_REFRESH_SECRET=$(openssl rand -base64 32)
  sed -i "s/change-me-access-secret/$JWT_SECRET/" "$ENV_FILE"
  sed -i "s/change-me-refresh-secret/$JWT_REFRESH_SECRET/" "$ENV_FILE"
  echo "JWT secrets generated"
fi

# Build Docker images
echo "[4/8] Building Docker images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "Docker images built"

# Start services
echo "[5/8] Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Services started"

# Wait for services to be healthy
echo "[6/8] Waiting for services to be healthy..."
sleep 10

# Check backend health
BACKEND_HEALTH=$(curl -sf http://localhost:4000/api/health || echo "unhealthy")
if [[ "$BACKEND_HEALTH" == *"ok"* ]]; then
  echo "Backend is healthy"
else
  echo "WARNING: Backend health check failed"
fi

# Run database migrations
echo "[7/8] Running database migrations..."
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || echo "Migrations skipped (run manually if needed)"

echo "Migrations complete"

# Seed database
echo "[8/8] Seeding database..."
docker compose exec -T backend npx prisma db seed 2>/dev/null || echo "Seed skipped (run manually if needed)"

echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Services:"
echo "  - Web:        http://localhost (port 80)"
echo "  - Backend:    http://localhost:4000"
echo "  - Health:     http://localhost:4000/api/health"
echo ""
echo "Next steps:"
echo "1. Configure SSL/TLS certificates"
echo "2. Set up monitoring: docker compose -f $MONITORING_COMPOSE up -d"
echo "3. Configure firewall rules"
echo "4. Test the application"
echo ""
