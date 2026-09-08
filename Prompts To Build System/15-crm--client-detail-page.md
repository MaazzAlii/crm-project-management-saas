# TASK 15 — CRM — Client Detail Page

## Objective
Build the single-client view showing their full relationship: projects, communication history, and notes.

## Why This Task Exists
This is the CRM core — a 360-degree view of one client, which the original spec only implied via 'click client → see their projects.'

## Dependencies
- TASK 14

## Current State
Client list exists; no detail page yet.

## Files To Inspect
- components/clients/*.tsx

## Files To Create
- app/(dashboard)/clients/[id]/page.tsx
- components/clients/ClientTabs.tsx

## Files To Modify


## Implementation Instructions
- Header: client name, company, status badge, quick actions (new project, log communication, edit).
- Tabs: Overview (contact info, notes), Projects (list scoped to this client), Communication (Task 26+ inbox filtered to this client), Activity Log.
- Editable notes field with autosave.

## UI Requirements
- Tabbed detail layout.
- Loading and not-found states (invalid/foreign client id).
- Mobile: tabs collapse to a select dropdown.

## Backend Requirements
- Server Component fetching client + related projects + related messages, all RLS-scoped.

## Database Requirements
- No schema change — joins clients, projects, messages.

## API Requirements
- N/A

## Security Requirements
- Confirm a client id from another organization returns 404, not the record (RLS + explicit check).

## Testing Requirements
- Test detail page with a client that has many/zero projects and many/zero messages.

## Acceptance Criteria
- [ ] Client detail correctly aggregates related data.
- [ ] Cross-tenant client id access returns 404, never leaks data.

## Git Commit
Recommended commit:

`feat(crm): build client detail page with tabs`

## Verification
- Attempt to load another organization's client by id directly via URL and confirm access is denied.

## Next Task
`TASK 16`
