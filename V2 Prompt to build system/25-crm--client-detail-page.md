# TASK 25 — CRM — Client Detail Page

## Objective
Build the single-client 360-degree view: projects, communication history, notes.

## Why This Task Exists
The CRM core view.

## Dependencies
- TASK 24

## Current State
Client list exists; no detail page.

## Files To Inspect
- components/clients/*.tsx

## Files To Create
- app/(dashboard)/clients/[id]/page.tsx

## Files To Modify


## Implementation Instructions
- Header: name, company, status, communication_mode badge, quick actions.
- Tabs: Overview, Projects, Communication (TASK 27), Activity Log.
- Editable notes with autosave.

## UI Requirements
- Tabbed layout, mobile tabs collapse to select.
- Not-found/cross-tenant 404 handling.

## Backend Requirements
- Server Component aggregating client + projects + messages, RLS-scoped.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Cross-org client id access returns 404, never leaks data.

## Testing Requirements
- Test detail page with clients having many/zero projects and messages.

## Acceptance Criteria
- [ ] Client detail aggregates correctly; cross-tenant access denied.

## Git Commit
Recommended commit:

`feat(crm): build client detail page with tabs`

## Verification
- Attempt to load another org's client by id directly and confirm access denied.

## Next Task
`TASK 26`
