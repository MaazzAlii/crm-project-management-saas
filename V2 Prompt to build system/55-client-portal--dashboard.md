# TASK 55 — Client Portal — Dashboard

## Objective
Build the client-facing dashboard: active projects, deliverables awaiting review, invoices.

## Why This Task Exists
Matches the original /client/dashboard requirement.

## Dependencies
- TASK 54

## Current State
Client portal auth exists; no portal screens yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (/client/dashboard)

## Files To Create
- app/(client-portal)/client/dashboard/page.tsx
- app/(client-portal)/layout.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects+status, deliverables awaiting review, pending invoices, payment history summary.
- Simplified client-friendly nav distinct from the internal shell.

## UI Requirements
- Client-appropriate branding (org logo/colors if white-label enabled by plan); empty states for brand-new clients.

## Backend Requirements
- Server Component scoped by client_id via TASK 54's RLS.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Confirm every query on this path is client_id-scoped, never organization-wide.

## Testing Requirements
- Test dashboard renders correctly and only shows that one client's data.

## Acceptance Criteria
- [ ] Client dashboard accurately and exclusively reflects the logged-in client's own data.

## Git Commit
Recommended commit:

`feat(client-portal): build client dashboard`

## Verification
- Log in as two different clients in the same org and confirm zero data overlap.

## Next Task
`TASK 56`
