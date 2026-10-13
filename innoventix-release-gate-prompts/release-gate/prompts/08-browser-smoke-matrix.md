# 08: Browser smoke matrix

Use Playwright. Credentials come from environment variables. Test four users: owner, admin, member, viewer, plus a brand-new organization owner.

For each user, visit every sidebar link and these routes: /dashboard, /clients, /projects, /projects/kanban, /tasks, /leads, /inbox, /notifications, /analytics, /settings/team, /settings/billing, /settings/organization, /settings/integrations, /settings/audit-log, /team (should redirect), /invite/[bad-token] (should show a clear message).

For each page record: HTTP status, whether an error boundary or "Something went wrong" appears, console errors, and whether a 4xx or 5xx response is shown as raw JSON.

Pass rule: status 200 (or the expected redirect), zero error screens, zero console errors, zero raw JSON pages. Any failure is a blocker.

Output: matrix of user by page with pass or fail.
