# 01: Audit the current invite flow and dashboard (no code changes)

Read-only. Write docs/audit-invites-dashboard.md.
1. Find every place that starts an invite: the Team page, Quick Actions on the dashboard, any other button. For each, record the exact href or action and whether the target exists.
2. List the existing invitation API routes and server actions. Say what each one does, whether it sends email, and what table it writes to.
3. Find whether any invitation email code exists. Name the provider, if any, and the environment variables it reads.
4. Find the dashboard data sources: which numbers are computed from the database and which are hardcoded or fallback.
5. Find where the sidebar and dashboard links point, and check each target route exists.
6. List every role check used on team and invite screens.

Output a table: item, file, line, status (works, broken, missing), and what it needs. Do not change code.
