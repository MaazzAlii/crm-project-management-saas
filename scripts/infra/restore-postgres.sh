#!/usr/bin/env bash
#
# Restore Script for Self-Hosted Supabase Postgres & Storage Volume
# Usage: bash scripts/infra/restore-postgres.sh <path_to_db_backup.sql.gz> [path_to_storage_backup.tar.gz]
#

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: bash scripts/infra/restore-postgres.sh <path_to_db_backup.sql.gz> [path_to_storage_backup.tar.gz]"
    exit 1
fi

DB_BACKUP_FILE="$1"
STORAGE_BACKUP_FILE="${2:-}"

if [ ! -f "${DB_BACKUP_FILE}" ]; then
    echo "Error: File ${DB_BACKUP_FILE} not found."
    exit 1
fi

echo "======================================================"
echo " WARNING: THIS WILL OVERWRITE THE EXISTING DATABASE!"
echo " Target DB Backup: ${DB_BACKUP_FILE}"
echo "======================================================"

read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore canceled."
    exit 0
fi

# 1. Restore Postgres Database
echo "[Restore] Restoring database to supabase-db container..."
gunzip -c "${DB_BACKUP_FILE}" | docker exec -i supabase-db psql -U postgres

# 2. Restore Storage Volume if provided
if [ -n "${STORAGE_BACKUP_FILE}" ] && [ -f "${STORAGE_BACKUP_FILE}" ]; then
    echo "[Restore] Restoring storage volume from ${STORAGE_BACKUP_FILE}..."
    docker run --rm -v crm-project-management-saas_supabase-storage-data:/storage -v "$(dirname "${STORAGE_BACKUP_FILE}"):/backup" alpine tar -xzf "/backup/$(basename "${STORAGE_BACKUP_FILE}")" -C /storage
fi

echo "======================================================"
echo " Restoration Complete!"
echo "======================================================"
