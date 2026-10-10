# 01: Read-only audit (no code changes)

Do not edit any file in this prompt. Write one report file: `docs/audit-tenancy-and-mock-data.md`.

Part A: Tenant isolation
1. List every route handler under `app/api` and every server action under `app/actions`. For each, record: path, method, what table(s) it reads or writes, and whether the query filters by organization_id derived from the session.
2. List every server component or page that queries the database directly. Same fields.
3. Flag any query that reads users, team members, projects, clients, tasks, invoices, analytics, or dashboard totals without an organization filter. Mark it CRITICAL.
4. Flag any query where organization_id comes from request body, query string, or URL params. Mark it HIGH.

Part B: Mock and sample data
5. Search for hardcoded sample values: strings like "proj-", "sample", "demo", "Maaz", "Platform Administrator", "Connected", fixed dollar amounts, and fixed counts. List file and line.
6. Find where the Analytics "Starter Plan", "Team Members 1/5", "Projects 0/50", and "Connected Channels 0/1" values come from. Say whether each is computed from the database or hardcoded.
7. Find where the client card "Connected" badge comes from.

Part C: Routes and deployment
8. Find the route behind the "Invite Member" button. Check whether the link target exists in the codebase. Report the exact href and whether a matching route file exists.
9. Compare the deployed commit with local HEAD. Run `git fetch deploy` and `git log --oneline deploy/main -1` and `git log --oneline -1`. Report both hashes and whether they match.

Part D: Tests
10. List which existing tests (unit, integration, Playwright) would have caught each CRITICAL item. If none would, say so.

Output a summary table at the top of the report: item, severity, file, screen affected. Then send me the summary in chat. Do not fix anything yet.
