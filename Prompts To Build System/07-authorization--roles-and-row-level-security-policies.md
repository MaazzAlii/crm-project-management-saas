# TASK 07 — Authorization — Roles & Row-Level Security Policies

## Objective
Implement Postgres RLS policies enforcing that every organization can only ever see its own data, and that roles gate sensitive actions.

## Why This Task Exists
This is the actual security boundary of the multi-tenant platform. Everything else (UI hiding, route guards) is UX convenience on top of this.

## Dependencies
- TASK 06

## Current State
Tables exist but currently have permissive/service-role-only placeholder policies from Task 03.

## Files To Inspect
- supabase/migrations/0001..0006

## Files To Create
- supabase/migrations/0007_rls_policies.sql

## Files To Modify


## Implementation Instructions
- Enable RLS on every tenant-scoped table (organizations excluded from tenant filter itself, but member-gated).
- Write a reusable Postgres function `is_org_member(org_id uuid) returns boolean` checking `auth.uid()` against organization_members.
- Write `has_role(org_id uuid, min_role text) returns boolean` for role-gated actions (e.g. only owner/admin can delete a client).
- Apply SELECT/INSERT/UPDATE/DELETE policies per table using these functions.
- Explicitly test that a user from Org A cannot read/write any row belonging to Org B, even via direct table query.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- Add RLS policies to: clients, projects, tasks, deliverables, communication_channels, messages, organization_subscriptions.
- Add RLS policies to organization_members restricting visibility to fellow members of the same organization only.

## API Requirements
- N/A

## Security Requirements
- This IS the security layer — treat every policy as a security control, not a convenience filter.
- Add automated tests (Task 47) specifically for cross-tenant access attempts.

## Testing Requirements
- Write SQL test queries impersonating two different users/orgs and confirm isolation.
- Confirm role-gated actions (e.g. delete client) fail for 'member' role and succeed for 'owner'/'admin'.

## Acceptance Criteria
- [ ] No query, from any role, can read another organization's rows.
- [ ] Role-gated mutations are enforced at the database level, not just in the UI.

## Git Commit
Recommended commit:

`feat(security): enforce row-level security for full tenant isolation`

## Verification
- Run cross-tenant isolation test suite from Task 47 stub manually before that task exists in full.

## Next Task
`TASK 08`
