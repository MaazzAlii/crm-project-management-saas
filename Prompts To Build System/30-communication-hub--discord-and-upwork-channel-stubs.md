# TASK 30 — Communication Hub — Discord & Upwork Channel Stubs

## Objective
Add lightweight integration stubs for Discord and Upwork (both named as client platforms in the original spec) so they follow the same provider contract even before full build-out.

## Why This Task Exists
Keeps the provider architecture genuinely pluggable/extensible rather than hardcoded to 3 channels, satisfying the 'different app connectivity' requirement.

## Dependencies
- TASK 26
- TASK 27

## Current State
Provider pattern established by Slack/WhatsApp/Email; Discord/Upwork not yet implemented.

## Files To Inspect
- lib/providers/slack.ts
- lib/providers/whatsapp.ts
- lib/providers/email.ts

## Files To Create
- lib/providers/discord.ts
- lib/providers/upwork.ts
- app/api/webhooks/discord/route.ts

## Files To Modify
- app/(dashboard)/settings/integrations/page.tsx

## Implementation Instructions
- Implement Discord bot webhook following the established `ingestMessage` contract (full send/receive).
- For Upwork, implement at minimum manual message logging (Upwork's API access is more restricted) with a documented note that full API integration is a future enhancement, not blocking launch.
- Update the Integrations settings page to list all 5 channels with accurate 'connected / not available yet' states.

## UI Requirements
- Integrations list page showing all providers with correct status per org.

## Backend Requirements
- Webhook route for Discord.

## Database Requirements
- No new tables.

## API Requirements
- POST /api/webhooks/discord

## Security Requirements
- Same webhook-verification discipline as prior provider tasks.

## Testing Requirements
- Test Discord inbound/outbound.
- Confirm Upwork manual-log path works even without live API access.

## Acceptance Criteria
- [ ] All 5 platforms named in the original spec (WhatsApp/Slack/Upwork/Discord/Other) are represented in the hub, either fully live or clearly documented as manual-log-only.

## Git Commit
Recommended commit:

`feat(inbox): add Discord integration and Upwork manual-log support`

## Verification
- Confirm the integrations settings page accurately reflects each channel's real capability level.

## Next Task
`TASK 31`
