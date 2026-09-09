# TASK 36 — Communication Hub — Architecture & Unified Inbox Data Layer

## Objective
Implement the ingestion/query layer every channel integration writes into and the UI reads from.

## Why This Task Exists
Backbone of the 'all communication from one platform' requirement.

## Dependencies
- TASK 10
- TASK 23

## Current State
messages/communication_channels tables exist; no ingestion/read layer yet.

## Files To Inspect
- supabase/migrations/0006_communication_hub.sql

## Files To Create
- documentation/adr/002-communication-hub.md
- lib/inbox/ingest.ts
- lib/inbox/query.ts

## Files To Modify


## Implementation Instructions
- ingestMessage(orgId, channelId, payload) normalizing provider-specific payloads into the messages schema, called by every provider webhook (TASKS 37-40).
- Auto-match inbound message to an existing client by phone/email; leave client_id null for manual triage if no match.
- lib/inbox/query.ts filters by channel/client/read-unread/org, used by the global inbox (TASK 41) and client timeline (TASK 27).

## UI Requirements
- N/A — data layer only.

## Backend Requirements
- Core backend module of the hub; no HTTP routes here.

## Database Requirements
- No schema change.

## API Requirements
- N/A here — added per provider in TASKS 37-40.

## Security Requirements
- Ingestion always resolves organization_id from the channel record, never a client-supplied org id.

## Testing Requirements
- Unit test ingestMessage with mock payloads per future provider shape; test client-matching edge cases.

## Acceptance Criteria
- [ ] ingestMessage normalizes/stores correctly; auto-matching works for clear matches and safely no-ops for ambiguous ones.

## Git Commit
Recommended commit:

`feat(inbox): build unified communication hub data layer`

## Verification
- Feed synthetic payloads for 3 providers through ingestMessage and confirm consistent row shape.

## Next Task
`TASK 37`
