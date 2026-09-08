# TASK 26 — Communication Hub — Architecture & Unified Inbox Data Layer

## Objective
Design and implement the data-access layer that all channel integrations (Slack/WhatsApp/Email/etc) will write into and the UI will read from.

## Why This Task Exists
This is the backbone of the 'all communication handled from this platform' requirement — every channel integration from here on plugs into one consistent contract.

## Dependencies
- TASK 05
- TASK 13

## Current State
messages/communication_channels tables exist (Task 05); no ingestion or read layer built yet.

## Files To Inspect
- supabase/migrations/0005_communication_hub.sql
- documentation/architecture.md

## Files To Create
- documentation/adr/002-communication-hub.md
- lib/inbox/ingest.ts
- lib/inbox/query.ts

## Files To Modify


## Implementation Instructions
- Define a single ingestion function `ingestMessage(orgId, channelId, payload)` that every provider webhook (Tasks 27-30) calls, normalizing provider-specific payloads into the `messages` schema.
- Define matching logic: attempt to auto-link an inbound message to an existing client by phone/email; if no match, leave client_id null for manual triage.
- Define `lib/inbox/query.ts` with filters: by channel, by client, by read/unread, by organization, used by both the global inbox (Task 31) and the client-scoped timeline (Task 17).

## UI Requirements
- N/A — data layer only, UI in Task 31.

## Backend Requirements
- This is the core backend module of the hub — no HTTP routes yet, just the shared library.

## Database Requirements
- No schema change — uses Task 05 tables.

## API Requirements
- N/A yet — provider webhook routes are added per-channel in Tasks 27-30.

## Security Requirements
- Ensure ingestion always resolves organization_id from the channel record, never trusts a client-supplied org id.

## Testing Requirements
- Unit test ingestMessage with mock payloads for each future provider shape.
- Unit test client-matching logic against ambiguous/no-match cases.

## Acceptance Criteria
- [ ] ingestMessage normalizes and stores messages correctly.
- [ ] Client auto-matching works for clear matches and safely no-ops for ambiguous ones.

## Git Commit
Recommended commit:

`feat(inbox): build unified communication hub data layer`

## Verification
- Feed synthetic payloads for 3 different providers through ingestMessage and confirm consistent row shape in messages table.

## Next Task
`TASK 27`
