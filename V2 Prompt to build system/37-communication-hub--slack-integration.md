# TASK 37 — Communication Hub — Slack Integration

## Objective
Connect an organization's own Slack workspace for two-way conversation, distinct from the internal Slack automation alerts.

## Why This Task Exists
Extends existing internal Slack use into a client/team conversation channel routed through the hub.

## Dependencies
- TASK 36

## Current State
No provider integrations exist.

## Files To Inspect
- lib/inbox/ingest.ts

## Files To Create
- app/api/webhooks/slack/route.ts
- app/(dashboard)/settings/integrations/slack/page.tsx
- lib/providers/slack.ts

## Files To Modify


## Implementation Instructions
- Slack OAuth per organization, tokens stored via the secure pattern from TASK 62.
- Slack Events API webhook calling ingestMessage; outbound send via Slack Web API from the inbox compose box (TASK 41).
- Keep this two-way conversation channel architecturally separate from the automation notification flows (TASKS 50-52).

## UI Requirements
- Integrations settings page: connect/disconnect, status.

## Backend Requirements
- Webhook route verifying Slack signing secret.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/webhooks/slack — signature-verified, responds within Slack's timeout.

## Security Requirements
- Verify Slack signatures on every call; store tokens encrypted, never logged.

## Testing Requirements
- Test OAuth connect/disconnect; inbound and outbound message delivery.

## Acceptance Criteria
- [ ] Org can connect Slack, receive into unified inbox, and reply from the platform.

## Git Commit
Recommended commit:

`feat(inbox): add Slack channel integration`

## Verification
- Send a real test message in a connected workspace and confirm inbox ingestion within seconds.

## Next Task
`TASK 38`
