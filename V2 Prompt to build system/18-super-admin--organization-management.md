# TASK 18 — Super Admin — Organization Management

## Objective
Build the screen for managing all tenant organizations: view, suspend/resume, override plan, view usage.

## Why This Task Exists
The operational tool for actually running the platform as a business.

## Dependencies
- TASK 17

## Current State
Platform dashboard exists; no per-org management screen yet.

## Files To Inspect
- app/super-admin/dashboard/page.tsx

## Files To Create
- app/super-admin/organizations/page.tsx
- app/super-admin/organizations/[id]/page.tsx

## Files To Modify


## Implementation Instructions
- List all organizations with plan, status, MRR, created date, searchable/filterable.
- Detail view per org: usage vs plan limits, billing status, team member list (read-only), suspend/resume action.
- Manual plan override (e.g. comping Innoventix's own account, or granting a trial extension) recorded with a reason, tied into the audit log (TASK 63).

## UI Requirements
- List + detail layout consistent with TASK 17's styling.

## Backend Requirements
- Server actions for suspend/resume/plan-override, super-admin-gated and audit-logged.

## Database Requirements
- No schema change — reads/writes organizations, organization_subscriptions.

## API Requirements
- N/A

## Security Requirements
- Every mutating action here must call the audit-log helper (TASK 63) once it exists — stub the call now, wire fully later.

## Testing Requirements
- Test suspend correctly restricts that org's users' access; resume restores it.

## Acceptance Criteria
- [ ] Any organization can be viewed, suspended, resumed, and plan-overridden by a super admin, with every action recorded.

## Git Commit
Recommended commit:

`feat(super-admin): build organization management screen`

## Verification
- Suspend a test org and confirm its users are correctly blocked from the app until resumed.

## Next Task
`TASK 19`
