#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely Database Backup Script"
echo "======================================"
echo ""

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vibely_backup_$TIMESTAMP.sql"
COMPOSE_FILE="docker-compose.yml"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL container is running
echo "[1/4] Checking PostgreSQL..."
if ! docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "running"; then
  echo "ERROR: PostgreSQL container is not running"
  exit 1
fi

echo "PostgreSQL is running"

# Get database credentials from .env
echo "[2/4] Reading database configuration..."
if [ -f ".env" ]; then
  source .env
else
  echo "ERROR: .env file not found"
  exit 1
fi

DB_USER=${POSTGRES_USER:-vibely}
DB_NAME=${POSTGRES_DB:-vibely}

echo "Database: $DB_NAME"

# Create backup
echo "[3/4] Creating backup..."
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
echo "[4/4] Compressing backup..."
gzip "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)

echo "======================================"
echo "Backup Complete!"
echo "======================================"
echo ""
echo "Backup file: $BACKUP_FILE.gz"
echo "Backup size: $BACKUP_SIZE"
echo ""
echo "To restore:"
echo "  gunzip -c $BACKUP_FILE.gz | docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER $DB_NAME"
echo ""
