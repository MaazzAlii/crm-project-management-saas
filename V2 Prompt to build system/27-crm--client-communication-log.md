# TASK 27 — CRM — Client Communication Log

## Objective
Surface a chronological, filterable per-client communication history pulling from the unified inbox.

## Why This Task Exists
Ties CRM to the Communication Hub — without it 'CRM' is just a database, not the all-in-one platform requested.

## Dependencies
- TASK 25
- TASK 10

## Current State
messages table exists; client detail exists without a real communication tab yet.

## Files To Inspect
- supabase/migrations/0006_communication_hub.sql

## Files To Create
- components/clients/CommunicationTimeline.tsx

## Files To Modify
- app/(dashboard)/clients/[id]/page.tsx

## Implementation Instructions
- Query messages filtered by client_id, chronological, grouped by day, channel icon per message.
- Manual-log quick-add for Manual-mode clients or off-channel events (e.g. a phone call).

## UI Requirements
- Chat-style timeline, channel filter chips, manual-log form.

## Backend Requirements
- Server action for manual logging; read path reused from TASK 42.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Manual log entries respect organization/client scoping.

## Testing Requirements
- Test timeline with mixed-channel and manual entries.

## Acceptance Criteria
- [ ] Communication history renders correctly across channels and manual entries for both client modes.

## Git Commit
Recommended commit:

`feat(crm): add per-client communication timeline`

## Verification
- Log a manual entry for a Manual-mode client and confirm correct chronological placement.

## Next Task
`TASK 28`
