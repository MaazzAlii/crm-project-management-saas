# TASK 42 — Client Communication Mode — Manual vs Connected Workflow

## Objective
Implement the explicit behavioral split: existing clients stay on manual logging, new clients get full auto-sync into the unified inbox by default.

## Why This Task Exists
This is the exact requirement: preserve the existing manual workflow for current clients while giving every new client full multi-channel automation from day one.

## Dependencies
- TASK 41
- TASK 24

## Current State
communication_mode field and inbox both exist independently; no explicit workflow ties them together yet.

## Files To Inspect
- app/(dashboard)/clients/new/page.tsx
- components/inbox/ConversationList.tsx

## Files To Create
- lib/clients/communication-mode.ts

## Files To Modify
- app/(dashboard)/clients/new/page.tsx
- app/(dashboard)/clients/[id]/page.tsx

## Implementation Instructions
- Default new-client creation to communication_mode = 'connected' when at least one channel is already configured for the org; otherwise default to 'manual' with a prompt to connect a channel.
- For 'manual' clients: hide auto-sync UI, keep the manual-log form (TASK 27) as the only communication entry point.
- For 'connected' clients: surface inbound/outbound messages automatically once matched by TASK 36's auto-matching logic; allow switching a client from manual→connected at any time (never force connected→manual, since that could hide already-synced history).
- Bulk-import existing clients from the original spreadsheet/CRM data (if provided) explicitly as 'manual' by default, per the requirement that existing clients are unaffected.

## UI Requirements
- Clear mode indicator and toggle on client detail; confirmation copy explaining what changes when switching to Connected.

## Backend Requirements
- Server action enforcing the one-way manual→connected transition rule.

## Database Requirements
- No schema change — uses TASK 09's field.

## API Requirements
- N/A

## Security Requirements
- Mode-switch action still respects organization RLS and role gating.

## Testing Requirements
- Test new-client default mode logic, manual→connected switch, and that connected clients correctly receive auto-synced messages.

## Acceptance Criteria
- [ ] Existing/manual clients behave exactly as before; new/connected clients receive full auto-sync; the one-way switch rule is enforced.

## Git Commit
Recommended commit:

`feat(crm): implement manual-vs-connected client communication workflow`

## Verification
- Create both a manual and connected client, message the connected one via WhatsApp, and confirm only the connected client's inbox updates automatically.

## Next Task
`TASK 43`
