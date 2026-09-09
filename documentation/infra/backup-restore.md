# Disaster Recovery Playbook: Backup & Restore Strategy

## Overview
This document specifies the automated backup routine, off-VPS replication strategy, and tested disaster recovery procedure for the self-hosted Innoventix Platform database and asset storage.

---

## 1. Automated Cron Schedule

Backups execute nightly at **02:00 AM UTC** via system crontab on the Contabo VPS.

Crontab entry (`/etc/cron.d/supabase-backup`):
```cron
0 2 * * * root /bin/bash /home/deploy/crm-project-management-saas/scripts/infra/backup-postgres.sh >> /var/log/supabase-backup.log 2>&1
```

---

## 2. Retention & Off-VPS Replication

- **Local Retention**: 14 days rolling window on `/var/backups/supabase/`.
- **Off-VPS Replication**: Nightly sync to secure off-site S3-compatible cloud storage (e.g. Cloudflare R2 / AWS S3) via `rclone`.
- **Encryption**: External copies are encrypted at rest using AES-256 before upload.

---

## 3. Disaster Recovery / Restoration Playbook

In the event of database corruption, container failure, or data loss, execute:

```bash
# 1. Inspect available backups
ls -lh /var/backups/supabase/

# 2. Execute restoration script
sudo bash scripts/infra/restore-postgres.sh /var/backups/supabase/db_backup_YYYYMMDD_HHMMSS.sql.gz

# 3. Verify database tables and data integrity
docker exec -it supabase-db psql -U postgres -d postgres -c "\dt"
```
