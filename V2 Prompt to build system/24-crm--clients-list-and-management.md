# TASK 24 — CRM — Clients List & Management

## Objective
Build the client list with search/filter/creation, including the new manual-vs-connected communication_mode selector.

## Why This Task Exists
Anchor CRM screen; now surfaces the manual/auto-sync choice per client explicitly.

## Dependencies
- TASK 21
- TASK 09

## Current State
clients table + RLS exist; no UI yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/clients/page.tsx
- app/(dashboard)/clients/new/page.tsx

## Files To Modify


## Implementation Instructions
- List: table/card toggle, columns include a Communication Mode badge (Manual/Connected).
- Search/filter by name, status, platform, country, communication_mode.
- New-client form: existing fields plus a Communication Mode choice — Manual (team logs conversations by hand, matches existing-client workflow) or Connected (auto-syncs from linked channels once set up in TASK 41).
- Enforce plan client-limit (TASK 14) before insert.

## UI Requirements
- Responsive list, filter bar, empty state, inline validation.

## Backend Requirements
- Server actions for create/list/filter.

## Database Requirements
- No schema change — uses TASK 09's communication_mode field.

## API Requirements
- N/A

## Security Requirements
- Validate/sanitize inputs server-side; enforce plan limit with clear upgrade messaging.

## Testing Requirements
- Test create/search/filter, including filtering by communication_mode.

## Acceptance Criteria
- [ ] Clients listed/searched/filtered/created correctly, including by communication mode; plan limits enforced.

## Git Commit
Recommended commit:

`feat(crm): build client list with communication-mode selection`

## Verification
- Create a Manual client and a Connected client and confirm both display correctly in the list.

## Next Task
`TASK 25`
