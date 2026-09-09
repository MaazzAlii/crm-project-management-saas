# TASK 19 — Super Admin — Impersonation & Support Access

## Objective
Allow a super admin to securely view an organization's data as read-only support access, without ever exposing raw credentials.

## Why This Task Exists
Necessary for support/debugging across external customer organizations without weakening the RLS boundary elsewhere.

## Dependencies
- TASK 18

## Current State
No impersonation mechanism exists.

## Files To Inspect
- lib/auth/super-admin.ts

## Files To Create
- app/api/super-admin/impersonate/route.ts
- lib/auth/impersonation.ts

## Files To Modify


## Implementation Instructions
- Implement a short-lived, read-only impersonation session (never a real login as the org's user — a scoped, time-boxed viewing context instead).
- Every impersonation session start/end is written to the audit log (TASK 63) with the super admin's identity and target org.
- Visible banner in the UI at all times during an impersonation session ('Viewing as [Org] — Support Mode') so it's never silently invisible to anyone reviewing screen recordings/logs.

## UI Requirements
- Persistent support-mode banner across all impersonated views.

## Backend Requirements
- Time-boxed session token scoped read-only, expiring automatically.

## Database Requirements
- No schema change beyond the audit log dependency.

## API Requirements
- POST /api/super-admin/impersonate — super-admin-gated, audit-logged.

## Security Requirements
- Read-only enforced at the RLS level during impersonation, not just hidden in the UI — a super admin in support mode must not be able to mutate tenant data through this path.

## Testing Requirements
- Test that write attempts during impersonation are rejected at the database level, not just hidden client-side.

## Acceptance Criteria
- [ ] Impersonation is read-only, time-boxed, always visibly bannered, and fully audit-logged.

## Git Commit
Recommended commit:

`feat(super-admin): add read-only, audited impersonation for support`

## Verification
- Attempt a write action while impersonating and confirm it is rejected server-side, not just absent from the UI.

## Next Task
`TASK 20`
