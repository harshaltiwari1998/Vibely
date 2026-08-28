#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely Production Readiness Check"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check command exists
check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    echo "  ✓ $1 installed"
  else
    echo "  ✗ $1 not found"
    ((ERRORS++))
  fi
}

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo "  ✓ $1 exists"
  else
    echo "  ✗ $1 missing"
    ((ERRORS++))
  fi
}

# Function to check env variable
check_env() {
  if [ -f ".env" ]; then
    if grep -q "^$1=" .env; then
      VALUE=$(grep "^$1=" .env | cut -d'=' -f2)
      if [ -n "$VALUE" ] && [ "$VALUE" != "change-me-$2" ]; then
        echo "  ✓ $1 configured"
      else
        echo "  ✗ $1 not configured properly"
        ((ERRORS++))
      fi
    else
      echo "  ✗ $1 not found in .env"
      ((ERRORS++))
    fi
  else
    echo "  ✗ .env file not found"
    ((ERRORS++))
  fi
}

echo "1. Checking Prerequisites..."
check_command "node"
check_command "npm"
check_command "docker"
check_command "docker compose"
echo ""

echo "2. Checking Project Structure..."
check_file "package.json"
check_file "docker-compose.yml"
check_file ".env.example"
check_file ".gitignore"
check_file "README.md"
echo ""

echo "3. Checking Environment Configuration..."
check_env "JWT_SECRET" "access-secret"
check_env "JWT_REFRESH_SECRET" "refresh-secret"
check_env "DATABASE_URL" ""
check_env "REDIS_URL" ""
check_env "CORS_ORIGIN" ""
echo ""

echo "4. Checking Build Status..."
if [ -d "services/backend/dist" ]; then
  echo "  ✓ Backend built"
else
  echo "  ⚠ Backend not built (run: npm run build)"
  ((WARNINGS++))
fi

if [ -d "apps/web/dist" ]; then
  echo "  ✓ Web built"
else
  echo "  ⚠ Web not built (run: npm run build)"
  ((WARNINGS++))
fi

if [ -d "apps/admin/dist" ]; then
  echo "  ✓ Admin built"
else
  echo "  ⚠ Admin not built (run: npm run build)"
  ((WARNINGS++))
fi
echo ""

echo "5. Checking Documentation..."
check_file "README.md"
check_file "docs/DEPLOYMENT.md"
check_file "docs/SECURITY.md"
check_file "docs/WEBRTC.md"
check_file "docs/MONITORING.md"
check_file "docs/RUNBOOK.md"
echo ""

echo "6. Checking Scripts..."
check_file "scripts/security/harden.sh"
check_file "scripts/deployment/deploy.sh"
check_file "scripts/database/backup.sh"
check_file "scripts/monitoring/setup-monitoring.sh"
echo ""

echo "7. Checking Docker Configuration..."
check_file "docker/backend.Dockerfile"
check_file "docker/web.Dockerfile"
check_file "docker/nginx.conf"
check_file "docker-compose.monitoring.yml"
echo ""

echo "8. Checking CI/CD..."
check_file ".github/workflows/ci-cd.yml"
echo ""

echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✓ READY FOR PRODUCTION"
  echo ""
  echo "Next steps:"
  echo "1. Review warnings"
  echo "2. Run security hardening: bash scripts/security/harden.sh"
  echo "3. Deploy: bash scripts/deployment/deploy.sh"
  echo "4. Set up monitoring: bash scripts/monitoring/setup-monitoring.sh"
  exit 0
else
  echo "✗ NOT READY - Fix errors before deployment"
  exit 1
fi
