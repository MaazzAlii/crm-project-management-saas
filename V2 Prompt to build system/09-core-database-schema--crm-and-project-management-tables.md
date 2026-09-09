# TASK 09 — Core Database Schema — CRM & Project Management Tables

## Objective
Create clients, projects, tasks, deliverables tables, tenant-scoped, including the new per-client communication_mode field.

## Why This Task Exists
Direct evolution of the original CRM/PM tables, now with the manual-vs-auto-sync distinction for existing vs new clients.

## Dependencies
- TASK 08

## Current State
Original single-tenant table definitions exist only in the source assignment doc; not yet implemented in this self-hosted schema.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- supabase/migrations/0004_crm_clients.sql
- supabase/migrations/0005_projects_tasks_deliverables.sql

## Files To Modify


## Implementation Instructions
- clients: id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes, communication_mode ('manual'|'connected', default 'manual'), created_at.
- projects: id, organization_id, client_id, title, description, type, brief_source, amount, currency, status (brief_received→in_progress→review→delivered→invoiced→paid, plus on_hold), priority, start_date, deadline, delivered_at, invoice_triggered, assigned_to, notes, created_at.
- tasks and deliverables tables as previously specified, organization_id denormalized for RLS.
- Add indexes on organization_id for every table.
- communication_mode is the field the unified inbox (TASK 40) and manual-log flow (TASK 41) both branch on.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- No cross-organization foreign keys permitted — enforced via trigger or app-layer check.

## Testing Requirements
- Seed clients in both communication_mode states across 2 test orgs.

## Acceptance Criteria
- [ ] Schema created with communication_mode field.
- [ ] Cross-org linkage blocked.

## Git Commit
Recommended commit:

`feat(db): add tenant-scoped CRM/PM schema with communication-mode field`

## Verification
- Attempt cross-org client/project linkage and confirm rejection.

## Next Task
`TASK 10`
