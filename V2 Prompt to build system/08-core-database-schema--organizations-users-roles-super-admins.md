# TASK 08 — Core Database Schema — Organizations, Users, Roles, Super Admins

## Objective
Create the foundational tables: organizations, profiles, org memberships/roles, and a separate super_admins table.

## Why This Task Exists
Every other table references these; the super_admins table is new versus the internal-only version and must be isolated from org-level roles.

## Dependencies
- TASK 07

## Current State
No schema exists yet on the fresh self-hosted Postgres instance.

## Files To Inspect
- documentation/adr/001-multi-tenancy.md

## Files To Create
- supabase/migrations/0001_organizations.sql
- supabase/migrations/0002_memberships_roles.sql
- supabase/migrations/0003_super_admins.sql

## Files To Modify


## Implementation Instructions
- organizations: id, name, slug, plan_tier, billing_status, created_at.
- profiles: id (fk auth.users), full_name, avatar_url.
- organization_members: organization_id, user_id, role (owner/admin/member/billing_manager).
- super_admins: id, user_id (fk auth.users), granted_by, granted_at — completely separate table, never joined through organization_members, so a compromised org role can never escalate to platform access.
- Add updated_at triggers reused by every future table.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- No RLS yet (TASK 11) — keep tables service-role-only until then.
- super_admins table itself must only ever be writable by an existing super admin or a one-time manual bootstrap (documented, not automated).

## Testing Requirements
- Seed one test organization, one owner, and one bootstrap super admin.

## Acceptance Criteria
- [ ] Migrations apply cleanly.
- [ ] super_admins is structurally isolated from organization_members.
- [ ] Seed data verifies both tiers work.

## Git Commit
Recommended commit:

`feat(db): add organizations, roles, and isolated super-admin schema`

## Verification
- Query super_admins and confirm it has no foreign-key path through organization_members.

## Next Task
`TASK 09`
