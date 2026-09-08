# TASK 27 — Communication Hub — Slack Integration

## Objective
Connect an organization's own Slack workspace so messages flow into the unified inbox and outbound replies can be sent from the platform.

## Why This Task Exists
Slack is already used internally at Innoventix for notifications (per the original spec) — this extends it into two-way client/team communication routed through the hub.

## Dependencies
- TASK 26

## Current State
No provider integrations exist yet.

## Files To Inspect
- lib/inbox/ingest.ts

## Files To Create
- app/api/webhooks/slack/route.ts
- app/(dashboard)/settings/integrations/slack/page.tsx
- lib/providers/slack.ts

## Files To Modify


## Implementation Instructions
- Implement Slack OAuth so each organization connects their own workspace (stores tokens securely, see Task 45).
- Implement Slack Events API webhook receiving messages, calling `ingestMessage`.
- Implement outbound send via Slack Web API for replies composed in the unified inbox (Task 31).
- Keep the existing internal Slack *notification* use case (Tasks 33-36) architecturally separate from this two-way *conversation* channel — same Slack app, different concern.

## UI Requirements
- Integrations settings page: connect/disconnect Slack, show connection status.

## Backend Requirements
- Webhook route verifying Slack signing secret.
- Token storage via secure secrets pattern (Task 45).

## Database Requirements
- Writes to communication_channels (on connect) and messages (on inbound/outbound) — no new tables.

## API Requirements
- POST /api/webhooks/slack — Slack signature verified, responds within Slack's timeout window.

## Security Requirements
- Verify Slack request signatures on every webhook call.
- Store Slack tokens encrypted, never in plaintext, never logged.

## Testing Requirements
- Test OAuth connect/disconnect.
- Test inbound message appears in inbox.
- Test outbound reply is delivered to the correct Slack channel/DM.

## Acceptance Criteria
- [ ] An organization can connect Slack, receive messages into the unified inbox, and reply from the platform.

## Git Commit
Recommended commit:

`feat(inbox): add Slack channel integration`

## Verification
- Send a real test message in a connected Slack workspace and confirm it appears in the inbox within seconds.

## Next Task
`TASK 28`
