# TASK 12 — Authorization — Roles & Row-Level Security Policies

## Objective
Implement RLS policies on the self-hosted Postgres enforcing organization isolation and role-gated actions.

## Why This Task Exists
This is the actual security boundary of the platform.

## Dependencies
- TASK 11

## Current State
Tables exist without RLS beyond service-role-only placeholders.

## Files To Inspect
- supabase/migrations/0001..0007

## Files To Create
- supabase/migrations/0008_rls_policies.sql

## Files To Modify


## Implementation Instructions
- Enable RLS on every tenant-scoped table.
- Function is_org_member(org_id) and has_role(org_id, min_role) checking auth.uid() against organization_members.
- Apply SELECT/INSERT/UPDATE/DELETE policies per table.
- Explicitly test cross-org access is blocked for every table.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- This IS the security layer — every policy is a control, not a convenience filter.

## Testing Requirements
- Write SQL tests impersonating two orgs' users and confirm isolation.

## Acceptance Criteria
- [ ] No query from any non-super-admin role can read another org's rows.

## Git Commit
Recommended commit:

`feat(security): enforce row-level security for full tenant isolation`

## Verification
- Manually attempt cross-org SELECT via direct query and confirm rejection.

## Next Task
`TASK 13`
