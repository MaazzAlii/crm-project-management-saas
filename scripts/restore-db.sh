#!/bin/bash
# =============================================================================
# Innoventix Platform v2 — PostgreSQL Database Restore Script
# =============================================================================

set -e

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-innoventix}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-54322}"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not specified."
  echo "Usage: ./scripts/restore-db.sh <path_to_backup.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: File $BACKUP_FILE does not exist."
  exit 1
fi

echo "⚠️  Restoring database ${DB_NAME} from ${BACKUP_FILE}..."

PGPASSWORD="${DB_PASSWORD}" gunzip -c "$BACKUP_FILE" | psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME"

echo "✅ Database ${DB_NAME} restored successfully from ${BACKUP_FILE}."
