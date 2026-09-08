# TASK 16 — CRM — Leads / Sales Pipeline (Kanban)

## Objective
Add a lightweight sales-pipeline kanban for tracking prospective clients before they become active clients — the genuinely new CRM capability beyond the original PM-only spec.

## Why This Task Exists
The user explicitly wants a 'CRM type platform,' not just project tracking — a pipeline view is the defining CRM feature the original assignment lacked.

## Dependencies
- TASK 14

## Current State
clients table only tracks active/paused/completed — no lead/prospect stage.

## Files To Inspect
- supabase/migrations/0003_crm_clients.sql

## Files To Create
- supabase/migrations/0008_leads_pipeline.sql
- app/(dashboard)/leads/page.tsx
- components/leads/KanbanBoard.tsx

## Files To Modify


## Implementation Instructions
- Add `pipeline_stage` to clients (or a separate `leads` table if a stricter distinction from active clients is wanted): new, contacted, qualified, proposal_sent, won, lost.
- Kanban board with drag-and-drop between stages (reuse the drag interaction pattern planned for Task 19's project kanban).
- Converting a lead to 'won' flips it into an active client automatically.
- Track lost-reason on the 'lost' stage for basic reporting.

## UI Requirements
- Kanban columns per stage, card shows client name/company/value estimate.
- Drag-and-drop with optimistic UI update.
- Lost-reason modal.

## Backend Requirements
- Server action for stage transitions, validating allowed transitions server-side (not purely a UI drag).

## Database Requirements
- pipeline_stage enum column + lost_reason text column on clients (or dedicated leads table + FK on conversion).

## API Requirements
- N/A

## Security Requirements
- Stage transitions still respect organization RLS.

## Testing Requirements
- Test drag between every stage.
- Test won-conversion correctly flips client status.

## Acceptance Criteria
- [ ] Pipeline kanban works with persisted stage on drag.
- [ ] Winning a lead correctly activates the client record.

## Git Commit
Recommended commit:

`feat(crm): add sales pipeline kanban for lead tracking`

## Verification
- Drag a card through all stages and confirm persistence after page reload.

## Next Task
`TASK 17`
