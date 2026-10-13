# Coding Standards

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Naming Conventions

- **File Names**:
  - React components: `PascalCase.tsx` (e.g. `ClientEditModal.tsx`, `KanbanBoard.tsx`).
  - Utilities & Services: `kebab-case.ts` (e.g. `password-reset.ts`, `invitation-service.ts`).
  - Next.js route handlers: `route.ts`.
  - Next.js pages: `page.tsx`, `layout.tsx`.
- **Functions & Methods**: `camelCase` starting with action verbs (`createClient`, `verifySessionToken`, `getTenantMembers`).
- **Constants & Enums**: `SCREAMING_SNAKE_CASE` (e.g. `JWT_EXPIRES_IN`, `ROLE_HIERARCHY`).
- **Types & Interfaces**: `PascalCase` without `I` or `T` prefixes (e.g. `UserSessionContext`, `ClientRecord`).
- **Booleans**: Prefixed with `is`, `has`, `can`, or `should` (e.g. `isSuperAdmin`, `hasRole`, `canManage`).

---

## 2. Directory & Architecture Structure

```
app/                    Next.js App Router (routes, layouts, pages, actions)
  (auth)/               Authentication routes (login, signup, reset)
  (dashboard)/          Authenticated core workspace
  (client-portal)/      External client portal
  api/                  REST endpoints with Zod validation
components/             React components
  ui/                   Atomic shared design system primitives
  shell/                Global chrome (DashboardShell, Sidebar, Topbar)
  [domain]/             Feature components (clients, leads, projects, inbox)
lib/                    Domain logic, services, infrastructure
  auth/                 JWT, passwords, session helpers, RBAC
  db/                   PostgreSQL connection pool, repositories, migrations
  services/             Business logic services
  validation/           Zod schema contracts
  security/             Rate limiting, encryption
tests/                  Unit & integration tests (Vitest)
e2e/                    End-to-end tests (Playwright)
docs/                   Living technical documentation
```

---

## 3. Approved Engineering Patterns

1. **Strict Multi-Tenancy Scoping**:
   - Every database query without exception MUST scope by `organization_id` extracted from the server session:
     ```ts
     const session = await getCurrentSessionContext();
     if (!session?.organization) throw new UnauthorizedError();
     const { rows } = await pool.query(
       'SELECT * FROM clients WHERE id = $1 AND organization_id = $2',
       [clientId, session.organization.id]
     );
     ```
2. **Parameterized SQL Queries**:
   - String concatenation in SQL statements is strictly forbidden to prevent SQL injection.
3. **Server-Side Input Validation**:
   - Every Server Action and API Route parses inputs using Zod schemas before performing business logic.
4. **Typed Error Hierarchy**:
   - Errors must inherit from domain classes (`ValidationError`, `UnauthorizedError`, `NotFoundError`) and never leak internal stack traces to the browser.
5. **Atomic Transactions**:
   - Complex multi-table writes (e.g. accepting invitations, onboarding organizations) must use `transaction(async (client) => { ... })`.

---

## 4. Forbidden Anti-Patterns

- **No `any` Types**: Use TypeScript generics, strict interfaces, or `unknown` with runtime type narrowing.
- **No Direct Mutation of Session / Tenant IDs**: Never accept `organization_id` from client request bodies or query parameters.
- **No Inline Magic Numbers / Colors**: All UI values must use CSS Custom Properties or Tailwind semantic tokens.
- **No Unhandled Promises / Silent Catch Blocks**: Every error must be explicitly handled, logged, or rethrown.

---

## 5. Related Files

- `docs/engineering/COMPONENT-LIBRARY.md`
- `docs/engineering/AUTH-AND-RBAC.md`
- `docs/engineering/DATA-AND-API.md`
- `docs/engineering/TESTING-STRATEGY.md`
