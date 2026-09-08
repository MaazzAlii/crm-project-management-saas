# TASK 29 — Communication Hub — Email Integration

## Objective
Connect a transactional/inbound email channel (e.g. Postmark or SendGrid inbound parse) so email-based client communication is captured too.

## Why This Task Exists
Original spec lists Email as a brief_source; this closes email into the same unified system as chat channels.

## Dependencies
- TASK 26

## Current State
No email channel integration exists.

## Files To Inspect
- lib/providers/slack.ts
- lib/providers/whatsapp.ts

## Files To Create
- app/api/webhooks/email/route.ts
- app/(dashboard)/settings/integrations/email/page.tsx
- lib/providers/email.ts

## Files To Modify


## Implementation Instructions
- Set up an org-specific inbound email address (e.g. org-slug@inbox.platform.com) forwarding into an inbound-parse webhook.
- Parse sender/subject/body, call `ingestMessage`, auto-match sender email to existing client.
- Outbound replies sent via the same provider's transactional send API, threaded by subject/message-id where possible.

## UI Requirements
- Integrations settings page showing the org's dedicated inbound address and connection status.

## Backend Requirements
- Webhook route parsing provider-specific inbound payload format.

## Database Requirements
- No new tables — writes into communication_channels/messages.

## API Requirements
- POST /api/webhooks/email — provider inbound-parse payload.

## Security Requirements
- Validate inbound webhook requests are genuinely from the configured provider (signature/IP allowlist per provider docs).

## Testing Requirements
- Test inbound email ingestion and client auto-match.
- Test outbound reply threading.

## Acceptance Criteria
- [ ] Email conversations flow into the unified inbox alongside Slack/WhatsApp.

## Git Commit
Recommended commit:

`feat(inbox): add email channel integration`

## Verification
- Send a real test email to the org's inbound address and confirm correct ingestion and client match.

## Next Task
`TASK 30`
