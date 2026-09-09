#!/usr/bin/env bash
#
# Nightly Automated Backup Script for Self-Hosted Supabase Postgres & Storage Volume
# Usage: bash scripts/infra/backup-postgres.sh
#

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/supabase}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
STORAGE_BACKUP_FILE="${BACKUP_DIR}/storage_backup_${TIMESTAMP}.tar.gz"

echo "[Backup] Starting backup at ${TIMESTAMP}..."

mkdir -p "${BACKUP_DIR}"

# 1. Dump PostgreSQL Database from Docker Container
echo "[Backup] Executing pg_dumpall from supabase-db container..."
docker exec -t supabase-db pg_dumpall -U postgres | gzip -9 > "${DB_BACKUP_FILE}"
chmod 600 "${DB_BACKUP_FILE}"

# 2. Archive Storage Volume
echo "[Backup] Archiving storage volume..."
if docker volume inspect crm-project-management-saas_supabase-storage-data &>/dev/null; then
    docker run --rm -v crm-project-management-saas_supabase-storage-data:/storage -v "${BACKUP_DIR}:/backup" alpine tar -czf "/backup/storage_backup_${TIMESTAMP}.tar.gz" -C /storage .
    chmod 600 "${STORAGE_BACKUP_FILE}"
fi

# 3. Apply Local Retention Policy (Prune backups older than RETENTION_DAYS)
echo "[Backup] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "*.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[Backup] Backup complete! DB: ${DB_BACKUP_FILE}"
