# TASK 26 — CRM — Leads / Sales Pipeline (Kanban)

## Objective
Add a lightweight sales-pipeline kanban for tracking prospects before they become active clients.

## Why This Task Exists
The defining CRM capability beyond plain project tracking.

## Dependencies
- TASK 24

## Current State
clients only track active/paused/completed status; no lead stage.

## Files To Inspect
- supabase/migrations/0004_crm_clients.sql

## Files To Create
- supabase/migrations/0010_leads_pipeline.sql
- app/(dashboard)/leads/page.tsx

## Files To Modify


## Implementation Instructions
- Add pipeline_stage (new/contacted/qualified/proposal_sent/won/lost) and lost_reason to clients.
- Kanban with drag-and-drop between stages; won converts to active client automatically.

## UI Requirements
- Kanban columns, card shows name/company/value estimate; lost-reason modal.

## Backend Requirements
- Server action validating allowed stage transitions server-side.

## Database Requirements
- pipeline_stage enum + lost_reason columns.

## API Requirements
- N/A

## Security Requirements
- Stage transitions respect org RLS.

## Testing Requirements
- Test drag through every stage; test won-conversion.

## Acceptance Criteria
- [ ] Pipeline persists correctly; winning a lead activates the client record.

## Git Commit
Recommended commit:

`feat(crm): add sales pipeline kanban for lead tracking`

## Verification
- Drag a card through all stages and confirm persistence after reload.

## Next Task
`TASK 27`
