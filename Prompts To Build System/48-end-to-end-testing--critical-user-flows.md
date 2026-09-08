# TASK 48 — End-to-End Testing — Critical User Flows

## Objective
Write E2E tests (e.g. Playwright) covering the platform's most critical user journeys end-to-end.

## Why This Task Exists
Unit tests (Task 47) cover logic in isolation; E2E tests confirm the full stack works together for the flows that matter most to the business.

## Dependencies
- TASK 47

## Current State
No E2E coverage exists yet.

## Files To Inspect
- app/(dashboard)/**
- app/(client-portal)/**

## Files To Create
- playwright.config.ts
- e2e/onboarding.spec.ts
- e2e/project-lifecycle.spec.ts
- e2e/client-portal.spec.ts
- e2e/billing.spec.ts

## Files To Modify


## Implementation Instructions
- E2E: full onboarding (signup → org creation → first client → first project).
- E2E: full project lifecycle (create → tasks → deliverable → delivered → invoice-trigger event fired → paid).
- E2E: client portal isolation (two clients, confirm zero cross-visibility) and approval flow.
- E2E: Stripe test-mode subscription flow.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Run E2E suite against a staging environment, not production data.

## Testing Requirements
- This IS the E2E testing task — see implementation instructions above.

## Acceptance Criteria
- [ ] All four critical flows pass reliably in CI.
- [ ] Client portal isolation is explicitly asserted, not assumed.

## Git Commit
Recommended commit:

`test: add end-to-end tests for onboarding, project lifecycle, client portal, and billing`

## Verification
- Run the E2E suite twice in a row to confirm no flakiness on the isolation-sensitive tests.

## Next Task
`TASK 49`
