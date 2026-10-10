#!/bin/bash
# =============================================================================
# Innoventix Platform v2 — Automated S3 / Cloudflare R2 Offsite Backup
# =============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-innoventix}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
S3_BUCKET="${S3_BACKUP_BUCKET:-innoventix-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-}" # e.g. https://<account_id>.r2.cloudflarestorage.com

LOCAL_BACKUP="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Generating PostgreSQL dump for offsite sync: ${DB_NAME}..."

PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  | gzip > "$LOCAL_BACKUP"

echo "☁️ Uploading ${LOCAL_BACKUP} to S3 bucket ${S3_BUCKET}..."

if [ -n "$S3_ENDPOINT" ]; then
  aws s3 cp "$LOCAL_BACKUP" "s3://${S3_BUCKET}/${DB_NAME}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz" --endpoint-url "$S3_ENDPOINT"
else
  aws s3 cp "$LOCAL_BACKUP" "s3://${S3_BUCKET}/${DB_NAME}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"
fi

echo "✅ Offsite backup sync completed successfully."
