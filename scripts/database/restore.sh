#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely Database Restore Script"
echo "======================================"
echo ""

# Check arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Example: $0 ./backups/vibely_backup_20260827.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Configuration
COMPOSE_FILE="docker-compose.yml"

# Get database credentials from .env
echo "[1/5] Reading database configuration..."
if [ -f ".env" ]; then
  source .env
else
  echo "ERROR: .env file not found"
  exit 1
fi

DB_USER=${POSTGRES_USER:-vibely}
DB_NAME=${POSTGRES_DB:-vibely}

echo "Database: $DB_NAME"

# Confirm restore
echo "[2/5] Confirming restore..."
echo "WARNING: This will overwrite the current database!"
echo "Database: $DB_NAME"
echo "Backup: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Stop backend service
echo "[3/5] Stopping backend service..."
docker compose -f "$COMPOSE_FILE" stop backend

# Drop and recreate database
echo "[4/5] Restoring database..."
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" "$DB_NAME"

# Restart backend service
echo "[5/5] Restarting backend service..."
docker compose -f "$COMPOSE_FILE" start backend

echo "======================================"
echo "Restore Complete!"
echo "======================================"
echo ""
echo "Verify the restore by checking:"
echo "  curl http://localhost:4000/api/health"
echo ""
