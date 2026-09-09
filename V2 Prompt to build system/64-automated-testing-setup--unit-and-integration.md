# TASK 64 — Automated Testing Setup — Unit & Integration

## Objective
Establish the testing framework and write unit/integration tests for the highest-risk logic built across all prior tasks.

## Why This Task Exists
TEST before COMMIT is mandatory per the orchestrator loop — this retroactively covers RLS, billing, automation, and AI-gating with real automated tests.

## Dependencies
- TASK 63

## Current State
No automated test suite exists yet; verification so far has been manual per-task.

## Files To Inspect
- lib/**
- supabase/migrations/**

## Files To Create
- vitest.config.ts
- tests/rls-isolation.test.ts
- tests/super-admin-isolation.test.ts
- tests/billing.test.ts
- tests/automation-contracts.test.ts
- tests/ai-gating.test.ts

## Files To Modify


## Implementation Instructions
- Set up Vitest against the self-hosted Postgres test instance.
- Cross-tenant isolation tests, formalizing TASK 12's manual checks, across every table.
- Super-admin isolation tests: confirm no org role alone reaches super-admin data (formalizing TASK 16).
- Unit tests for plan-limits.ts, ingestMessage client-matching, automation payload builders, and AI feature plan/kill-switch gating.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Test suite is itself the security/quality gate for the rest of the platform.

## Testing Requirements
- This IS the testing task — see implementation instructions above.

## Acceptance Criteria
- [ ] CI-runnable suite passes; cross-tenant and super-admin isolation covered by automated tests, not just manual checks; billing/automation/AI-gating meaningfully covered.

## Git Commit
Recommended commit:

`test: add unit and integration test suite covering RLS, super-admin isolation, billing, automation, and AI gating`

## Verification
- Run the full suite locally and confirm all tests pass before proceeding.

## Next Task
`TASK 65`
