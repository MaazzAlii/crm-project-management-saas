# TASK 63 — Audit Logging

## Objective
Add an audit trail for sensitive actions across the platform, including Super Admin actions.

## Why This Task Exists
Self-hosting your own client data and billing needs accountability — and Super Admin's cross-org/impersonation powers (TASKS 18-19) specifically depend on this existing.

## Dependencies
- TASK 62
- TASK 19

## Current State
No audit log exists; only project_activity_log covers project-specific events; TASKS 18-19 stubbed calls to this.

## Files To Inspect
- supabase/migrations/0008_rls_policies.sql
- app/super-admin/organizations/[id]/page.tsx
- app/api/super-admin/impersonate/route.ts

## Files To Create
- supabase/migrations/0015_audit_log.sql
- lib/audit/log.ts
- app/(dashboard)/settings/audit-log/page.tsx
- app/super-admin/audit-log/page.tsx

## Files To Modify


## Implementation Instructions
- audit_log table: organization_id (nullable for platform-level events), actor_user_id, actor_is_super_admin, action, entity_type, entity_id, metadata (jsonb), created_at.
- Log sensitive org-level actions (role changes, member removal, billing changes, deletions, exports) and all Super Admin actions (suspend/resume, plan override, impersonation start/end).
- Org-level audit log viewer restricted to owner/admin; separate platform-wide audit log viewer restricted to super admins.

## UI Requirements
- Two filterable table views: org-scoped and platform-wide, each restricted to the correct audience.

## Backend Requirements
- Shared logAuditEvent() helper called from relevant server actions across earlier tasks, wiring up TASK 18/19's stubs.

## Database Requirements
- audit_log table.

## API Requirements
- N/A

## Security Requirements
- Audit log itself RLS-protected and append-only (no update/delete for non-service roles).

## Testing Requirements
- Test sensitive org actions and Super Admin actions all generate correct entries; confirm non-admins/non-super-admins cannot view or tamper.

## Acceptance Criteria
- [ ] Sensitive actions reliably logged at both levels; log is append-only and correctly access-restricted.

## Git Commit
Recommended commit:

`feat(security): add audit logging for sensitive org and super-admin actions`

## Verification
- Perform a role change, a billing change, and an impersonation session, then confirm all three appear correctly in the right audit log.

## Next Task
`TASK 64`
