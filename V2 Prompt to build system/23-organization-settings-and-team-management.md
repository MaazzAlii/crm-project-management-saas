# TASK 23 — Organization Settings & Team Management

## Objective
Build settings for org profile, team members, roles, and invitations.

## Why This Task Exists
Self-serve team management for any organization, not just Ubaid manually managed via SQL.

## Dependencies
- TASK 21
- TASK 12

## Current State
No settings UI exists.

## Files To Inspect
- supabase/migrations/0002_memberships_roles.sql

## Files To Create
- app/(dashboard)/settings/organization/page.tsx
- app/(dashboard)/settings/team/page.tsx

## Files To Modify


## Implementation Instructions
- Org profile form: name, industry_type, logo, timezone.
- Team list with role/status; invite flow (email+role); role change/removal restricted to owner/admin.

## UI Requirements
- Tabs: Organization, Team, Billing, Integrations (later tasks).

## Backend Requirements
- Server actions, all role-gated server-side.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Only owner/admin can invite/change-roles/remove; last owner cannot be removed.

## Testing Requirements
- Test invite→accept→role-change→removal lifecycle.

## Acceptance Criteria
- [ ] Team management works end-to-end; non-admins blocked both in UI and server-side.

## Git Commit
Recommended commit:

`feat(settings): add organization profile and team management`

## Verification
- Attempt a role-change as a 'member' role and confirm server-side rejection.

## Next Task
`TASK 24`
