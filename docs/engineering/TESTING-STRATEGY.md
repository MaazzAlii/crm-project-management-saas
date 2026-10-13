# Testing Strategy

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Testing Pyramid

Innoventix employs a three-tier testing strategy to ensure security, tenant isolation, and UI stability:

```
          / \
         /   \
        / E2E \       Playwright (Critical user journeys)
       /-------\
      / Integr. \     Vitest + Real PostgreSQL test DB (Services & APIs)
     /-----------\
    /    Unit     \   Vitest (Pure logic, validation schemas, JWT, crypto)
   /---------------\
```

1. **Unit Tests (Vitest)**:
   - Target: `lib/` modules (validation schemas, password strength scoring, rate limiters, token hashing).
   - Execution speed: sub-second execution across 200+ unit assertions.
2. **Integration Tests (Vitest + DB)**:
   - Target: Database repositories, invitation services, cross-tenant RLS checks, audit logging immutability.
   - Current health: **67 test files, 449 tests passing**.
3. **End-to-End Tests (Playwright)**:
   - Target: Multi-step browser workflows: signup with invitation, login rate-limiting lockout, deal drag-and-drop, theme toggle persistence.

---

## 2. Coverage & Quality Targets

- **`lib/` Core Services & Security**: ≥ 80% coverage.
- **Server Actions & Route Handlers**: 100% of happy paths and error handling branches covered.
- **Components**: High coverage on interactive stateful primitives (Forms, Modals, Sliders).

---

## 3. Mandatory Testing Rules

1. **Regression First**: Every defect remediation or security fix MUST include a dedicated regression test asserting both the failure condition and the fix.
2. **Never Mock Cross-Tenant Checks**: Multi-tenancy isolation tests must execute real SQL queries against isolated PostgreSQL schemas to ensure no data leaks cross-org.
3. **Zero Test Regressions in CI**: Pull requests and commits must pass `npm test`, `npm run lint`, and `npm run type-check`.

---

## 4. Related Files

- `docs/operations/DEPLOYMENT.md`
- `vitest.config.mts`
- `playwright.config.ts`
- `tests/`
