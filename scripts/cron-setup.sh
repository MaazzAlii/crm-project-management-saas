#!/bin/bash

# ========================================
# Setup Cron Jobs for Production
# ========================================

# Backup daily at 2 AM
(crontab -l 2>/dev/null || echo "") | grep -v "backup.sh" | crontab -
(crontab -l 2>/dev/null || echo ""; echo "0 2 * * * /app/scripts/backup.sh >> /var/log/innoventix/backup.log 2>&1") | crontab -

echo "✅ Cron jobs configured"
echo "Current cron schedule:"
crontab -l | grep "backup\|sync\|cleanup"
