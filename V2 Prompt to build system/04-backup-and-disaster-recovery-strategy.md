# TASK 04 — Backup & Disaster Recovery Strategy

## Objective
Implement automated backups for the Postgres database and uploaded files, with a documented restore procedure.

## Why This Task Exists
Self-hosting means you own disaster recovery too — there's no managed-cloud safety net. This must exist before real client data lives on the server.

## Dependencies
- TASK 02

## Current State
No backup automation exists yet.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- scripts/infra/backup-postgres.sh
- scripts/infra/restore-postgres.sh
- documentation/infra/backup-restore.md

## Files To Modify


## Implementation Instructions
- Nightly automated pg_dump of the Postgres database, retained on a rolling window (e.g. 14 days) plus a weekly off-VPS copy (a separate storage location, not just local disk).
- Back up the Storage volume (uploaded deliverables/files) on the same cadence.
- Write and test a documented restore procedure — a backup nobody has restored from is not a real backup.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Backups stored encrypted if placed on any external/off-VPS location.

## Testing Requirements
- Actually run the restore procedure against a scratch instance and confirm data integrity.

## Acceptance Criteria
- [ ] Nightly backups running automatically and verifiably.
- [ ] Restore procedure tested successfully at least once, off-VPS copy confirmed present.

## Git Commit
Recommended commit:

`feat(infra): add automated backup and tested disaster-recovery procedure`

## Verification
- Delete a test table locally, run the restore script, and confirm the table returns intact.

## Next Task
`TASK 05`
