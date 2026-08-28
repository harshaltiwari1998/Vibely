#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely Monitoring Setup Script"
echo "======================================"
echo ""

COMPOSE_FILE="docker-compose.monitoring.yml"

# Check prerequisites
echo "[1/4] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is required"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose is required"; exit 1; }

echo "Prerequisites OK"

# Start monitoring services
echo "[2/4] Starting monitoring services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Monitoring services started"

# Wait for services to be ready
echo "[3/4] Waiting for services to be ready..."
sleep 10

# Check services
echo "[4/4] Checking services..."
PROMETHEUS_HEALTH=$(curl -sf http://localhost:9090/-/healthy 2>/dev/null || echo "unhealthy")
GRAFANA_HEALTH=$(curl -sf http://localhost:3000/api/health 2>/dev/null || echo "unhealthy")

echo ""
echo "======================================"
echo "Monitoring Setup Complete!"
echo "======================================"
echo ""
echo "Services:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana:    http://localhost:3000 (admin / admin)"
echo ""
echo "Next steps:"
echo "1. Access Grafana and configure data sources"
echo "2. Import dashboard from monitoring/grafana/dashboards/vibely-dashboard.json"
echo "3. Configure alerts"
echo "4. Update notification channels"
echo ""
