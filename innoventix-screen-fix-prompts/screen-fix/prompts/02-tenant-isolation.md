# 02: Tenant isolation fix

Scope: every CRITICAL and HIGH item from docs/audit-tenancy-and-mock-data.md. Read that report first and fix what it lists. Do not start screen work.

Steps:
1. Fix each query so it filters by organization_id from the session. Parameterized SQL only.
2. Fix each route that takes organization_id from the request so it uses the session value instead. If the client sends an ID that doesn't match the session, return 404.
3. Confirm that the team members list used by Projects and Tasks comes only from the current organization.
4. Write an integration test with two organizations (A and B), each with a member, a project, a client, and a task. For each of these endpoints, log in as A and assert that no B data appears: team members, projects, clients, tasks, dashboard totals, analytics, pipeline.
5. Write a second test: user in A requests B's project ID directly. Expect 404.
6. Add a regression test that fails if any query under app/api lacks an organization filter. Use a static scan with an explicit allowlist for truly global queries (for example, login lookup by email), and document each allowlist entry.

Verify: npm run build, npm test. Report the test counts. Do not push.
