#!/bin/bash
set -e

# ========================================
# PostgreSQL Backup Script
# ========================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DB_NAME:-innoventix}"
DB_USER="${DB_USER:-innoventix_app}"
DB_HOST="${DB_HOST:-localhost}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "Starting backup to $BACKUP_FILE..."

pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v \
  --no-password \
  | gzip > "$BACKUP_FILE"

# Verify backup
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not created"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3 (optional)
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_FILE" \
    "s3://${S3_BACKUP_BUCKET}/backups/$(basename $BACKUP_FILE)" \
    --region us-east-1
  echo "✅ Uploaded to S3"
fi

# Cleanup old backups (keep last 7 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
echo "✅ Cleanup complete"
