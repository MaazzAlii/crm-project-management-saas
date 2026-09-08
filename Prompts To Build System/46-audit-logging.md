# TASK 46 — Audit Logging

## Objective
Add an audit trail for sensitive actions across the platform.

## Why This Task Exists
A multi-tenant SaaS handling client data and billing needs an audit log for accountability and troubleshooting — expected by security-conscious external customers.

## Dependencies
- TASK 45

## Current State
No audit log exists; only project_activity_log (Task 20) covers project-specific events.

## Files To Inspect
- supabase/migrations/0007_rls_policies.sql
- app/(dashboard)/projects/[id]/page.tsx

## Files To Create
- supabase/migrations/0013_audit_log.sql
- lib/audit/log.ts
- app/(dashboard)/settings/audit-log/page.tsx

## Files To Modify


## Implementation Instructions
- Add `audit_log` table: organization_id, actor_user_id, action, entity_type, entity_id, metadata (jsonb), created_at.
- Log sensitive actions: role changes, member removal, billing changes, client/project deletion, data export.
- Audit log viewer page restricted to owner/admin roles.

## UI Requirements
- Simple filterable table view.
- Restricted access with a clear 'admins only' notice.

## Backend Requirements
- Shared `logAuditEvent()` helper called from the relevant server actions across earlier tasks.

## Database Requirements
- audit_log: id, organization_id, actor_user_id, action, entity_type, entity_id, metadata, created_at

## API Requirements
- N/A

## Security Requirements
- Audit log itself must be RLS-protected and, ideally, append-only (no update/delete policy for non-service roles).

## Testing Requirements
- Test that sensitive actions correctly generate audit entries and that non-admins cannot view or tamper with the log.

## Acceptance Criteria
- [ ] Sensitive actions are reliably logged.
- [ ] Audit log is append-only and admin-restricted.

## Git Commit
Recommended commit:

`feat(security): add audit logging for sensitive actions`

## Verification
- Perform a role change and a billing change, then confirm both appear correctly in the audit log.

## Next Task
`TASK 47`
