#!/bin/bash
# =============================================================================
# Innoventix Platform v2 — PostgreSQL Automated Backup Script
# =============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-innoventix}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54322}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Starting PostgreSQL backup for ${DB_NAME} at ${TIMESTAMP}..."

PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  | gzip > "$BACKUP_FILE"

FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "✅ Backup successfully created: ${BACKUP_FILE} (${FILE_SIZE})"

# Retain last 7 days of backups
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -mtime +7 -exec rm {} \;
echo "🧹 Old backups cleaned up (7-day retention policy enforced)."
