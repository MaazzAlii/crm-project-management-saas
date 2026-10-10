# 02: Tenant isolation & mock data cleanup

Scope: every CRITICAL and HIGH item from `docs/audit-tenancy-and-mock-data.md`. Read that report first and fix what it lists. Do not start individual screen UI work yet.

Steps:
1. **Remove Fake Data & Dev Fallbacks First (CRITICAL)**:
   - Remove every `dev*`, `DEV_*`, `__DEV_*`, and `getDev*` fallback in `app/(dashboard)/projects/actions.ts`, `app/(dashboard)/tasks/actions.ts`, `app/(dashboard)/inbox/actions.ts`, `app/(dashboard)/notifications/actions.ts`, `app/(dashboard)/clients/actions.ts`, `app/(dashboard)/leads/actions.ts`, `app/(dashboard)/dashboard/page.tsx`, and related files.
   - Verify that `createProjectAction`, `createGlobalTaskAction`, `createClientAction`, and `createLeadAction` strictly persist directly to PostgreSQL. Never swallow SQL errors into in-memory arrays.
   - If an organization has 0 rows, return an empty array `[]` or 0 counts with an empty state. Never inject fake sample projects (`proj-1`..`proj-4`), tasks, or messages.
2. **Fix Tenant Scoping on Queries and Pages**:
   - Fix each query so it strictly filters by `organization_id` derived from session context. Parameterized SQL only.
   - Ensure `app/(dashboard)/projects/[id]/page.tsx` and `app/(dashboard)/projects/kanban/page.tsx` filter users and clients by `organization_id = $1`.
3. **Fix Routes & Actions Overriding Organization ID**:
   - Fix each route that takes `organization_id` from query string (`searchParams.get('orgId')`), request body, or URL params (`/organizations/[id]`) so it derives the organization strictly from the session. If the client sends an ID that doesn't match the session, return 404.
   - Fix `app/actions/org.ts` (`setActiveOrgAction`) to verify membership before setting active organization.
4. **Confirm Team Members & Dropdowns**:
   - Confirm that the team members list and clients list used by Projects, Tasks, and Kanban come only from the active organization.
5. **Integration & Regression Tests**:
   - Write an integration test with two organizations (A and B), each with a member, a project, a client, and a task. For each endpoint/action, log in as A and assert that no B data appears: team members, projects, clients, tasks, dashboard totals, analytics, pipeline.
   - Write a second test: user in A requests B's project ID directly. Expect 404.
   - Add a static regression test that scans `app/api` and `app/actions` for missing organization filters or query-string overrides, with an explicit documented allowlist for public routes.

Verify: `npm run build`, `npm test`. Report the test counts. Do not push. Pushing is done only by prompt 09 with user approval.
