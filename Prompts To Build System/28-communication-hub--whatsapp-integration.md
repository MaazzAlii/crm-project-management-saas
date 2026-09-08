# TASK 28 — Communication Hub — WhatsApp Integration

## Objective
Connect WhatsApp Business (per client platform field in the original spec, many clients use WhatsApp) into the unified inbox.

## Why This Task Exists
WhatsApp is explicitly listed as a client platform in the original assignment — this closes the loop so those conversations don't stay siloed outside the platform.

## Dependencies
- TASK 26

## Current State
No WhatsApp integration exists.

## Files To Inspect
- lib/inbox/ingest.ts
- lib/providers/slack.ts (as a reference pattern)

## Files To Create
- app/api/webhooks/whatsapp/route.ts
- app/(dashboard)/settings/integrations/whatsapp/page.tsx
- lib/providers/whatsapp.ts

## Files To Modify


## Implementation Instructions
- Integrate WhatsApp Business Platform (Cloud API) per organization phone number.
- Implement webhook verification (hub.challenge handshake) and inbound message handling into `ingestMessage`.
- Implement outbound template/session message sending respecting WhatsApp's 24-hour session window and template-message rules.
- Auto-match inbound sender phone number to existing client records.

## UI Requirements
- Integrations settings page for WhatsApp number connection/status.

## Backend Requirements
- Webhook route with verification token check.
- Session-window enforcement logic before allowing free-form outbound replies.

## Database Requirements
- No new tables — writes into communication_channels/messages.

## API Requirements
- GET/POST /api/webhooks/whatsapp — verification challenge + message events.

## Security Requirements
- Verify WhatsApp webhook payloads (app secret proof).
- Never expose the WhatsApp access token client-side.

## Testing Requirements
- Test inbound message flow.
- Test outbound within and outside the 24h session window (template fallback).

## Acceptance Criteria
- [ ] WhatsApp conversations appear in the unified inbox and can be replied to within platform rules.

## Git Commit
Recommended commit:

`feat(inbox): add WhatsApp Business integration`

## Verification
- Send a test WhatsApp message to the connected number and confirm inbox ingestion and correct client auto-match.

## Next Task
`TASK 29`
