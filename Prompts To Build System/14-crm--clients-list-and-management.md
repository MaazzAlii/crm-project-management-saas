# TASK 14 — CRM — Clients List & Management

## Objective
Build the client list screen with search, filter, and creation, evolving the original 'Clients' sub-task into full CRM functionality.

## Why This Task Exists
Clients are the anchor entity connecting projects, communication, and billing — this screen is used constantly by every organization.

## Dependencies
- TASK 11
- TASK 04

## Current State
clients table and RLS exist; no UI yet.

## Files To Inspect
- Original assignment: Sub-task 4 /clients and /clients/new requirements

## Files To Create
- app/(dashboard)/clients/page.tsx
- app/(dashboard)/clients/new/page.tsx
- components/clients/*.tsx

## Files To Modify


## Implementation Instructions
- List view: table/card toggle, columns for name, company, status, platform, last activity.
- Search by name/company/email, filter by status/platform/country.
- New client form matching original fields: name, company, email, phone, platform, country, currency, payment_schedule, notes.
- Pagination for orgs with many clients (respect plan-based max_clients limit from Task 09).

## UI Requirements
- Responsive list/table.
- Filter bar (collapsible on mobile).
- Empty state ('Add your first client').
- Form validation with inline errors.

## Backend Requirements
- Server actions for create/list/filter, all scoped by organization_id via RLS.

## Database Requirements
- Uses clients table from Task 04 — no schema change here.

## API Requirements
- N/A — server actions, not a public REST API.

## Security Requirements
- Validate/sanitize all form inputs server-side.
- Enforce plan client-limit (Task 09) before insert, with a clear upgrade prompt if exceeded.

## Testing Requirements
- Test create/search/filter/pagination.
- Test limit enforcement at plan boundary.

## Acceptance Criteria
- [ ] Clients can be listed, searched, filtered, and created.
- [ ] Plan limits are enforced with a clear user-facing message, not a silent failure.

## Git Commit
Recommended commit:

`feat(crm): build client list, search, filter, and creation`

## Verification
- Create clients up to and past the plan limit and confirm correct blocking behavior.

## Next Task
`TASK 15`
