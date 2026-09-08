# TASK 44 — Input Validation & Sanitization Layer

## Objective
Introduce a consistent, shared validation layer (e.g. Zod schemas) across every form and server action in the platform.

## Why This Task Exists
With 40+ prior tasks each defining their own forms/actions, this task audits and unifies validation before the platform is considered production-ready.

## Dependencies
- TASK 43

## Current State
Validation has been implemented ad-hoc per task; no shared schema library yet.

## Files To Inspect
- All app/(dashboard)/**/page.tsx and lib/**/actions.ts files

## Files To Create
- lib/validation/schemas.ts

## Files To Modify
- Every server action file across the codebase (systematic pass).

## Implementation Instructions
- Define Zod (or equivalent) schemas per entity: client, project, task, deliverable, message, organization, invite, etc.
- Refactor every server action to validate input against its schema before touching the database.
- Sanitize free-text fields (notes, feedback, message bodies) against stored-XSS risk before render, in addition to input validation.

## UI Requirements
- Consistent inline validation error display across all forms.

## Backend Requirements
- Centralized schema-based validation used everywhere.

## Database Requirements
- No schema (DB) change — this is application-layer validation.

## API Requirements
- Every server action rejects invalid payloads with clear, safe error messages (no stack traces leaked to the client).

## Security Requirements
- This task exists specifically to close gaps from earlier fast-moving tasks — treat it as a security task, not a polish task.

## Testing Requirements
- Write validation tests for boundary/invalid inputs across at least the 10 highest-traffic actions (client/project/task create, message send, invite, billing actions).

## Acceptance Criteria
- [ ] No server action accepts unvalidated input.
- [ ] No user-supplied text renders unsanitized anywhere in the UI.

## Git Commit
Recommended commit:

`fix(security): unify input validation and sanitization across all server actions`

## Verification
- Attempt a stored-XSS payload in a notes/feedback field and confirm it renders inert.

## Next Task
`TASK 45`
