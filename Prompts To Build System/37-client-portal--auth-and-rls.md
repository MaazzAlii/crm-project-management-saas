# TASK 37 — Client Portal — Auth & RLS

## Objective
Implement a completely separate authentication and authorization boundary for external clients, distinct from internal team-member auth.

## Why This Task Exists
The original spec requires per-client login where each client sees ONLY their own projects — a materially different RLS shape from organization-member access.

## Dependencies
- TASK 07
- TASK 14

## Current State
Only internal team-member auth exists (Task 06/07); no client-facing auth exists.

## Files To Inspect
- Original assignment: Sub-task 6 (Client Portal)
- supabase/migrations/0007_rls_policies.sql

## Files To Create
- supabase/migrations/0012_client_portal_auth.sql
- app/(client-portal)/client/login/page.tsx

## Files To Modify


## Implementation Instructions
- Add `client_users` table linking a clients row to an auth identity (magic-link or password), distinct from organization_members.
- Add RLS policies scoped by client_id (not organization_id) for the client-portal read paths: a client_user may only see rows where clients.id matches their own linked client_id, further constrained to that client's organization.
- Magic-link login flow per the original spec.
- Portal is only reachable for clients whose organization's plan includes client_portal_enabled (Task 09 feature gate).

## UI Requirements
- Portal login page, separate branding/layout namespace ((client-portal) route group).

## Backend Requirements
- Auth callback distinct from the internal /login callback.

## Database Requirements
- client_users: id, client_id, organization_id, email, created_at

## API Requirements
- N/A

## Security Requirements
- This is a second, independent security boundary — test it as rigorously as Task 07's organization RLS, including attempts to access another client's data or another organization's portal.

## Testing Requirements
- Test that Client A cannot see Client B's data even within the same organization.
- Test plan-gating blocks portal access for orgs without it enabled.

## Acceptance Criteria
- [ ] Client portal auth is fully isolated per-client, verified by direct negative testing, and correctly plan-gated.

## Git Commit
Recommended commit:

`feat(client-portal): implement client-scoped authentication and RLS`

## Verification
- Attempt cross-client and cross-org data access as an authenticated client_user and confirm both are blocked.

## Next Task
`TASK 38`
