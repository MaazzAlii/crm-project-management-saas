# TASK 40 — Communication Hub — Discord & Upwork Channel Stubs

## Objective
Add Discord (full) and Upwork (manual-log) integrations following the same provider contract.

## Why This Task Exists
Keeps the provider architecture genuinely pluggable, covering every platform named in the original spec.

## Dependencies
- TASK 36
- TASK 37

## Current State
Provider pattern established; Discord/Upwork not yet implemented.

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
- Discord bot webhook following the ingestMessage contract, full send/receive.
- Upwork: manual message logging only (documented as a future full-API enhancement, not launch-blocking).
- Integrations list page reflecting accurate connected/manual-only states per channel.

## UI Requirements
- Integrations list page with accurate per-provider status.

## Backend Requirements
- Webhook route for Discord.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/webhooks/discord.

## Security Requirements
- Same webhook-verification discipline as prior provider tasks.

## Testing Requirements
- Test Discord inbound/outbound; confirm Upwork manual-log path works without live API access.

## Acceptance Criteria
- [ ] All 5 platforms from the original spec are represented, either fully live or clearly manual-log-only.

## Git Commit
Recommended commit:

`feat(inbox): add Discord integration and Upwork manual-log support`

## Verification
- Confirm the integrations page accurately reflects each channel's real capability level.

## Next Task
`TASK 41`
