# TASK 38 — Client Portal — Dashboard

## Objective
Build the client-facing dashboard summarizing their active projects, deliverables ready for review, and invoices.

## Why This Task Exists
Matches the original assignment's /client/dashboard requirement.

## Dependencies
- TASK 37

## Current State
Client portal auth exists; no portal screens yet.

## Files To Inspect
- Original assignment: Sub-task 6 (/client/dashboard)

## Files To Create
- app/(client-portal)/client/dashboard/page.tsx
- app/(client-portal)/layout.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects + status, deliverables awaiting review, pending invoices, payment history summary.
- Simplified, client-friendly navigation distinct from the internal team shell (Task 11).

## UI Requirements
- Client-appropriate branding (org's own logo/colors if white-label is enabled per plan).
- Empty states for a brand-new client with no data yet.

## Backend Requirements
- Server Component scoped by client_id via Task 37's RLS.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Confirm every query on this page path is client_id-scoped, never organization-wide.

## Testing Requirements
- Test dashboard renders correctly and only shows that one client's data.

## Acceptance Criteria
- [ ] Client dashboard accurately and exclusively reflects the logged-in client's own data.

## Git Commit
Recommended commit:

`feat(client-portal): build client dashboard`

## Verification
- Log in as two different clients in the same organization and confirm zero data overlap.

## Next Task
`TASK 39`
