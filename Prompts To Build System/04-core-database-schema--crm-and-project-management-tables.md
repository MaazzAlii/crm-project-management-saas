# TASK 04 — Core Database Schema — CRM & Project Management Tables

## Objective
Create the CRM and project-management domain tables (clients, projects, tasks, deliverables), each scoped to an organization.

## Why This Task Exists
This is the direct evolution of the original assignment's clients/projects/tasks/deliverables tables, now made tenant-aware so any organization — not just Innoventix — can use them.

## Dependencies
- TASK 03

## Current State
Original assignment defines clients, projects, tasks, deliverables, team_members without organization_id. These must be re-designed as tenant-scoped.

## Files To Inspect
- Original assignment doc (clients/projects/tasks/deliverables SQL)
- supabase/migrations/0001_organizations.sql

## Files To Create
- supabase/migrations/0003_crm_clients.sql
- supabase/migrations/0004_projects_tasks_deliverables.sql

## Files To Modify


## Implementation Instructions
- Re-implement `clients` table from the original spec, adding organization_id (fk, not null).
- Re-implement `projects` table, adding organization_id and keeping the status flow: brief_received → in_progress → review → delivered → invoiced → paid, plus on_hold.
- Re-implement `tasks` table (project sub-tasks), adding organization_id (denormalized for RLS simplicity) alongside project_id.
- Re-implement `deliverables` table, adding organization_id.
- Add `team_members` as a view or extension of organization_members rather than a separate disconnected table, so team membership and task-assignment share one source of truth.
- Add indexes on organization_id for every table (mandatory for RLS performance at multi-tenant scale).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- clients: id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes, created_at
- projects: id, organization_id, client_id, title, description, type, brief_source, amount, currency, status, priority, start_date, deadline, delivered_at, invoice_triggered, assigned_to (fk user), notes, created_at
- tasks: id, organization_id, project_id, title, description, assigned_to, status, priority, due_date, completed_at, created_at
- deliverables: id, organization_id, project_id, title, file_url, drive_link, status, client_feedback, submitted_at
- Foreign key + index on organization_id for all four tables

## API Requirements
- N/A

## Security Requirements
- No cross-organization foreign keys permitted anywhere (e.g. a project must never reference a client from a different organization) — add a check via trigger or application-layer validation.

## Testing Requirements
- Seed 2 test organizations, each with its own clients/projects/tasks, and verify no accidental cross-org linkage is possible.

## Acceptance Criteria
- [ ] All four tables created with organization_id.
- [ ] Trigger or constraint prevents cross-org client/project linkage.
- [ ] Seed data for 2 orgs is isolated correctly.

## Git Commit
Recommended commit:

`feat(db): add tenant-scoped CRM and project management schema`

## Verification
- Attempt to create a project referencing a client from a different org and confirm it is rejected.

## Next Task
`TASK 05`
