# TASK 03 — Core Database Schema — Organizations, Users, Roles

## Objective
Create the foundational multi-tenant tables that every other table will reference.

## Why This Task Exists
Without organizations, memberships, and roles in place first, no other table can be correctly tenant-scoped.

## Dependencies
- TASK 02

## Current State
No database schema exists yet, or only the original single-tenant clients/projects tables from the internal assignment exist and must be migrated, not discarded blindly.

## Files To Inspect
- Any existing Supabase schema/migrations
- documentation/adr/001-multi-tenancy.md

## Files To Create
- supabase/migrations/0001_organizations.sql
- supabase/migrations/0002_memberships_roles.sql

## Files To Modify


## Implementation Instructions
- Create `organizations` table: id, name, slug, plan_tier, billing_status, created_at.
- Create `users` table (or rely on Supabase Auth `auth.users` + a `profiles` table): id, email, full_name, avatar_url.
- Create `organization_members` table: organization_id, user_id, role (owner/admin/member), invited_by, joined_at.
- Define role enum: owner, admin, member, billing_manager — internal-to-org roles, distinct from the later client-portal role.
- Add updated_at triggers on all tables (reused pattern for every future table).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- organizations: id (uuid pk), name, slug (unique), plan_tier, billing_status, created_at, updated_at
- profiles: id (fk auth.users), full_name, avatar_url, created_at
- organization_members: id, organization_id (fk), user_id (fk), role, created_at — unique(organization_id, user_id)

## API Requirements
- N/A — no API layer yet, schema only.

## Security Requirements
- No RLS yet (added in Task 07) — but do not open tables publicly; keep RLS enabled with a temporary service-role-only policy until Task 07.

## Testing Requirements
- Write a seed script inserting one test organization and one test owner membership.
- Verify migrations run cleanly on a fresh Supabase project.

## Acceptance Criteria
- [ ] Migrations apply cleanly.
- [ ] Seed script produces one working organization + owner.
- [ ] Schema matches the multi-tenancy ADR.

## Git Commit
Recommended commit:

`feat(db): add organizations, profiles, and membership/role schema`

## Verification
- Run migrations against a scratch Supabase project.
- Query organization_members joined to profiles and confirm correct relationships.

## Next Task
`TASK 04`
