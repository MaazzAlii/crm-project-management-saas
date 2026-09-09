# TASK 61 — Input Validation & Sanitization Layer

## Objective
Introduce a consistent, shared validation layer (e.g. Zod schemas) across every form and server action.

## Why This Task Exists
With 40+ prior tasks each defining ad-hoc forms/actions, this task audits and unifies validation before launch.

## Dependencies
- TASK 60

## Current State
Validation implemented ad-hoc per task; no shared schema library yet.

## Files To Inspect
- All app/(dashboard)/**/page.tsx and lib/**/actions.ts files

## Files To Create
- lib/validation/schemas.ts

## Files To Modify
- Every server action file across the codebase (systematic pass).

## Implementation Instructions
- Define schemas per entity: client, project, task, deliverable, message, organization, invite, AI-settings, etc.
- Refactor every server action to validate before touching the database.
- Sanitize free-text fields against stored-XSS before render.

## UI Requirements
- Consistent inline validation error display across all forms.

## Backend Requirements
- Centralized schema-based validation used everywhere.

## Database Requirements
- No DB schema change.

## API Requirements
- N/A

## Security Requirements
- Every server action rejects invalid payloads with safe error messages, no stack traces leaked.

## Testing Requirements
- Write validation tests for the 10 highest-traffic actions.

## Acceptance Criteria
- [ ] No server action accepts unvalidated input; no user text renders unsanitized anywhere.

## Git Commit
Recommended commit:

`fix(security): unify input validation and sanitization across all server actions`

## Verification
- Attempt a stored-XSS payload in a notes/feedback field and confirm it renders inert.

## Next Task
`TASK 62`
