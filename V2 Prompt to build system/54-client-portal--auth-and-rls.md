# TASK 54 — Client Portal — Auth & RLS

## Objective
Implement a fully separate authentication/authorization boundary for external clients.

## Why This Task Exists
Each client must see only their own projects — a different RLS shape from organization-member access.

## Dependencies
- TASK 12
- TASK 24

## Current State
Only internal team auth exists; no client-facing auth exists.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (Client Portal)
- supabase/migrations/0008_rls_policies.sql

## Files To Create
- supabase/migrations/0014_client_portal_auth.sql
- app/(client-portal)/client/login/page.tsx

## Files To Modify


## Implementation Instructions
- client_users table linking a clients row to an auth identity, distinct from organization_members.
- RLS scoped by client_id for portal read paths, further constrained to that client's organization.
- Magic-link login per the original spec.
- Portal reachable only for orgs whose plan includes client_portal_enabled.

## UI Requirements
- Portal login page, separate route group/branding namespace.

## Backend Requirements
- Auth callback distinct from the internal one.

## Database Requirements
- client_users table.

## API Requirements
- N/A

## Security Requirements
- Second, independent security boundary — test as rigorously as org-level RLS, including cross-client and cross-org access attempts.

## Testing Requirements
- Test Client A cannot see Client B's data even within the same org; test plan-gating blocks portal access when not enabled.

## Acceptance Criteria
- [ ] Client portal auth is fully isolated per-client and correctly plan-gated.

## Git Commit
Recommended commit:

`feat(client-portal): implement client-scoped authentication and RLS`

## Verification
- Attempt cross-client and cross-org data access as an authenticated client_user and confirm both blocked.

## Next Task
`TASK 55`
