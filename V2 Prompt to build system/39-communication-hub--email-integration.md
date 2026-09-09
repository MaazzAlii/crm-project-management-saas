# TASK 39 — Communication Hub — Email Integration

## Objective
Connect an inbound-parse email channel so email-based client communication is captured too.

## Why This Task Exists
Closes email into the same unified system as chat channels.

## Dependencies
- TASK 36

## Current State
No email channel integration exists.

## Files To Inspect
- lib/providers/whatsapp.ts

## Files To Create
- app/api/webhooks/email/route.ts
- app/(dashboard)/settings/integrations/email/page.tsx
- lib/providers/email.ts

## Files To Modify


## Implementation Instructions
- Org-specific inbound address forwarding to an inbound-parse webhook.
- Parse sender/subject/body, call ingestMessage, auto-match sender email to client.
- Outbound replies via transactional send API, threaded where possible.

## UI Requirements
- Integrations settings page showing the org's dedicated inbound address.

## Backend Requirements
- Webhook parsing provider-specific inbound format.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/webhooks/email.

## Security Requirements
- Validate inbound requests are genuinely from the configured provider.

## Testing Requirements
- Test inbound ingestion/matching and outbound threading.

## Acceptance Criteria
- [ ] Email conversations flow into the unified inbox alongside Slack/WhatsApp.

## Git Commit
Recommended commit:

`feat(inbox): add email channel integration`

## Verification
- Send a real test email to the org's inbound address and confirm correct ingestion and match.

## Next Task
`TASK 40`
