# TASK 13 — Organization Settings & Team Management

## Objective
Build the settings area for managing organization profile, team members, roles, and invitations.

## Why This Task Exists
Team management was implicit in the original 'team_members' table; here it becomes a full self-serve screen since external organizations won't have Ubaid manually managing their team via SQL.

## Dependencies
- TASK 11
- TASK 07

## Current State
No settings UI exists.

## Files To Inspect
- supabase/migrations/0002_memberships_roles.sql

## Files To Create
- app/(dashboard)/settings/organization/page.tsx
- app/(dashboard)/settings/team/page.tsx
- lib/team/actions.ts

## Files To Modify


## Implementation Instructions
- Organization profile form: name, industry_type, logo (optional), timezone.
- Team list: members with role, invited/active status, last active.
- Invite flow: email + role, sends invite email, pending-invite state until accepted.
- Role change and member removal actions, restricted to owner/admin.

## UI Requirements
- Settings page with tabs: Organization, Team, Billing (Task 10), Integrations (Task 26+).
- Invite modal with role selector.
- Confirmation modal for member removal.

## Backend Requirements
- Server actions for invite/update-role/remove-member, all role-gated server-side.

## Database Requirements
- N/A — uses organizations, organization_members.

## API Requirements
- N/A

## Security Requirements
- Only owner/admin can invite, change roles, or remove members.
- Prevent removing the last owner of an organization.

## Testing Requirements
- Test invite → accept → role change → removal lifecycle.

## Acceptance Criteria
- [ ] Team management works end-to-end.
- [ ] Non-admin roles cannot access restricted actions (verified both in UI and via direct server-action call).

## Git Commit
Recommended commit:

`feat(settings): add organization profile and team management`

## Verification
- Attempt a role-change API call as a 'member' role and confirm it is rejected server-side.

## Next Task
`TASK 14`
