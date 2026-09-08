# TASK 47 — Automated Testing Setup — Unit & Integration

## Objective
Establish the testing framework and write unit/integration tests for the core business logic built across all prior tasks.

## Why This Task Exists
The orchestrator's execution loop mandates TEST before COMMIT — this task retroactively covers the highest-risk logic (RLS, billing, automation) with real automated tests.

## Dependencies
- TASK 46

## Current State
No automated test suite exists yet; verification so far has been manual per-task.

## Files To Inspect
- lib/**
- supabase/migrations/**

## Files To Create
- vitest.config.ts
- tests/rls-isolation.test.ts
- tests/billing.test.ts
- tests/automation-contracts.test.ts

## Files To Modify


## Implementation Instructions
- Set up Vitest (or equivalent) with a test Supabase project/local instance.
- Write cross-tenant isolation tests (formalizing Task 07's manual checks): attempt every table's SELECT/INSERT/UPDATE/DELETE across two different organizations' users.
- Write unit tests for plan-limits.ts, ingestMessage client-matching, and the automation event payload builders.
- Write integration tests for the Stripe webhook handler using Stripe's test-event fixtures.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Test suite itself is the security/quality gate for the rest of the platform.

## Testing Requirements
- This IS the testing task — see implementation instructions above.

## Acceptance Criteria
- [ ] CI-runnable test suite exists and passes.
- [ ] Cross-tenant isolation is covered by automated tests, not just manual checks.
- [ ] Billing and automation logic has meaningful test coverage.

## Git Commit
Recommended commit:

`test: add unit and integration test suite covering RLS, billing, and automation logic`

## Verification
- Run the full suite locally and confirm all tests pass before proceeding.

## Next Task
`TASK 48`
