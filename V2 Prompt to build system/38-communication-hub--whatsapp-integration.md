# TASK 38 — Communication Hub — WhatsApp Integration

## Objective
Connect WhatsApp Business Cloud API per organization phone number into the unified inbox.

## Why This Task Exists
WhatsApp is an explicit client platform in the original spec — closes the loop for those conversations.

## Dependencies
- TASK 36

## Current State
No WhatsApp integration exists.

## Files To Inspect
- lib/providers/slack.ts

## Files To Create
- app/api/webhooks/whatsapp/route.ts
- app/(dashboard)/settings/integrations/whatsapp/page.tsx
- lib/providers/whatsapp.ts

## Files To Modify


## Implementation Instructions
- Webhook verification handshake and inbound handling into ingestMessage.
- Outbound respecting the 24-hour session window and template-message rules.
- Auto-match sender phone number to existing client.

## UI Requirements
- Integrations settings page for number connection/status.

## Backend Requirements
- Webhook with verification token check; session-window enforcement.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/webhooks/whatsapp.

## Security Requirements
- Verify webhook payload authenticity; never expose the access token client-side.

## Testing Requirements
- Test inbound flow and outbound within/outside the session window.

## Acceptance Criteria
- [ ] WhatsApp conversations appear in the unified inbox and can be replied to within platform rules.

## Git Commit
Recommended commit:

`feat(inbox): add WhatsApp Business integration`

## Verification
- Send a test WhatsApp message to the connected number and confirm ingestion and correct client match.

## Next Task
`TASK 39`
