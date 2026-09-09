# TASK 16 — Super Admin — Access Control Layer

## Objective
Implement the authorization layer distinguishing Super Admin (platform operator) access from all organization-level access.

## Why This Task Exists
Super Admin is new versus the original spec and must be built as a hard-isolated tier, not an org role with extra permissions.

## Dependencies
- TASK 12

## Current State
super_admins table exists (TASK 08); no access-control logic uses it yet.

## Files To Inspect
- supabase/migrations/0003_super_admins.sql

## Files To Create
- lib/auth/super-admin.ts
- supabase/migrations/0009_super_admin_rls.sql

## Files To Modify


## Implementation Instructions
- Write isSuperAdmin(userId) checked against the super_admins table only — never derived from any organization_members row.
- Add RLS policies allowing super admins read access across all organizations for platform-management purposes, while write access to tenant data stays restricted to the impersonation flow (TASK 19), not direct edits.
- Add a dedicated /super-admin route group with its own middleware guard, fully separate from the org dashboard's middleware.

## UI Requirements
- N/A

## Backend Requirements
- Middleware guard rejecting any non-super-admin request to /super-admin/*.

## Database Requirements
- RLS additions for cross-org SELECT limited to super admins.

## API Requirements
- N/A

## Security Requirements
- Treat this as the highest-privilege boundary in the system — audit every policy added here.

## Testing Requirements
- Test that an org owner (even of many orgs) cannot access /super-admin/* without an explicit super_admins row.

## Acceptance Criteria
- [ ] Only users in super_admins can reach /super-admin/* or read cross-org data.
- [ ] Org owner role alone never grants this.

## Git Commit
Recommended commit:

`feat(security): implement isolated super-admin access-control layer`

## Verification
- Attempt /super-admin access as a regular org owner and confirm rejection.

## Next Task
`TASK 17`
