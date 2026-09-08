# TASK 17 — CRM — Client Communication Log

## Objective
Surface a chronological, filterable communication history per client, pulling from the unified Communication Hub.

## Why This Task Exists
This ties the CRM module to the Communication Hub (Phase 6) — without it, 'CRM' just means a client database, not the all-in-one platform requested.

## Dependencies
- TASK 15
- TASK 05

## Current State
messages table exists (Task 05); client detail page exists (Task 15) but without a real communication tab yet.

## Files To Inspect
- supabase/migrations/0005_communication_hub.sql
- app/(dashboard)/clients/[id]/page.tsx

## Files To Create
- components/clients/CommunicationTimeline.tsx

## Files To Modify
- app/(dashboard)/clients/[id]/page.tsx

## Implementation Instructions
- Query messages filtered by client_id, ordered chronologically, grouped by day.
- Show channel icon (Slack/WhatsApp/Email/etc) per message.
- Allow manually logging a communication that happened outside connected channels (e.g. a phone call) as a manual message row.

## UI Requirements
- Chat-style timeline UI.
- Channel filter chips.
- Manual-log quick-add form.

## Backend Requirements
- Server action for manual message logging; read path reuses inbox query layer from Task 31.

## Database Requirements
- No schema change — reads/writes messages table.

## API Requirements
- N/A

## Security Requirements
- Manual log entries still respect organization_id/client_id scoping.

## Testing Requirements
- Test timeline with mixed-channel messages.
- Test manual log entry appears correctly interleaved by time.

## Acceptance Criteria
- [ ] Communication history renders correctly per client across all channels plus manual entries.

## Git Commit
Recommended commit:

`feat(crm): add per-client communication timeline`

## Verification
- Log a manual entry and confirm it appears in correct chronological position.

## Next Task
`TASK 18`
