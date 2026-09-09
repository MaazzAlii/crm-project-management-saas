# TASK 65 — End-to-End Testing — Critical User Flows

## Objective
Write E2E tests covering the platform's most critical journeys end-to-end, including the Super Admin and AI-assisted flows.

## Why This Task Exists
Unit tests cover logic in isolation; E2E confirms the full stack works together for what matters most.

## Dependencies
- TASK 64

## Current State
No E2E coverage exists yet.

## Files To Inspect
- app/(dashboard)/**
- app/(client-portal)/**
- app/super-admin/**

## Files To Create
- playwright.config.ts
- e2e/onboarding.spec.ts
- e2e/project-lifecycle.spec.ts
- e2e/client-portal.spec.ts
- e2e/billing.spec.ts
- e2e/super-admin.spec.ts

## Files To Modify


## Implementation Instructions
- E2E: full onboarding (signup→org→first client→first project).
- E2E: full project lifecycle (create→tasks→deliverable→delivered→invoice-trigger event→paid).
- E2E: client portal isolation (two clients, zero cross-visibility) and approval flow.
- E2E: Stripe test-mode subscription flow.
- E2E: Super Admin org-suspend/resume and impersonation (read-only enforcement).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Run against a staging environment, not production data.

## Testing Requirements
- This IS the E2E testing task.

## Acceptance Criteria
- [ ] All five critical flows pass reliably in CI; isolation is explicitly asserted, not assumed.

## Git Commit
Recommended commit:

`test: add end-to-end tests for onboarding, project lifecycle, client portal, billing, and super-admin flows`

## Verification
- Run the E2E suite twice in a row to confirm no flakiness on isolation-sensitive tests.

## Next Task
`TASK 66`
