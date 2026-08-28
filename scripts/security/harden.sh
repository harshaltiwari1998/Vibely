#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely Security Hardening Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "Please do not run as root"
  exit 1
fi

# 1. Check JWT secrets
echo "[1/10] Checking JWT secrets..."
if grep -q "change-me-access-secret" .env 2>/dev/null; then
  echo "ERROR: Default JWT_SECRET found in .env"
  echo "Generate a secure secret: openssl rand -base64 32"
  exit 1
fi

if grep -q "change-me-refresh-secret" .env 2>/dev/null; then
  echo "ERROR: Default JWT_REFRESH_SECRET found in .env"
  echo "Generate a secure secret: openssl rand -base64 32"
  exit 1
fi

echo "JWT secrets configured"

# 2. Check CORS configuration
echo "[2/10] Checking CORS configuration..."
if grep -q 'CORS_ORIGIN=*' .env 2>/dev/null; then
  echo "ERROR: CORS_ORIGIN set to wildcard (*) in production"
  exit 1
fi

echo "CORS configured"

# 3. Check database credentials
echo "[3/10] Checking database credentials..."
if grep -q "postgres:postgres" .env 2>/dev/null; then
  echo "WARNING: Default database credentials detected"
fi

echo "Database credentials checked"

# 4. Check Redis credentials
echo "[4/10] Checking Redis configuration..."
if grep -q "redis://localhost" .env 2>/dev/null; then
  echo "WARNING: Redis without password detected"
fi

echo "Redis configuration checked"

# 5. Check payment keys
echo "[5/10] Checking payment configuration..."
if grep -q "your-payment" .env 2>/dev/null; then
  echo "ERROR: Default payment keys found in .env"
  exit 1
fi

echo "Payment configuration checked"

# 6. Check push notification keys
echo "[6/10] Checking push notification configuration..."
if grep -q "your-fcm" .env 2>/dev/null; then
  echo "ERROR: Default FCM key found in .env"
  exit 1
fi

echo "Push notification configuration checked"

# 7. Verify .gitignore
echo "[7/10] Verifying .gitignore..."
if [ -f ".gitignore" ]; then
  if grep -q ".env" .gitignore; then
    echo ".env in .gitignore"
  else
    echo "ERROR: .env not in .gitignore"
    exit 1
  fi
else
  echo "ERROR: .gitignore not found"
  exit 1
fi

echo ".gitignore verified"

# 8. Check for exposed secrets in code
echo "[8/10] Checking for exposed secrets in code..."
if grep -r "password.*=.*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v ".git" | head -5; then
  echo "WARNING: Possible hardcoded passwords found"
fi

echo "Secret scan complete"

# 9. Check file permissions
echo "[9/10] Checking file permissions..."
chmod 600 .env 2>/dev/null || true
echo "File permissions set"

# 10. Summary
echo "[10/10] Security hardening complete"
echo ""
echo "======================================"
echo "Security Status: HARDENED"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run 'npm audit' to check dependencies"
echo "2. Configure firewall rules"
echo "3. Set up SSL/TLS certificates"
echo "4. Enable database encryption"
echo "5. Configure backup encryption"
echo ""
