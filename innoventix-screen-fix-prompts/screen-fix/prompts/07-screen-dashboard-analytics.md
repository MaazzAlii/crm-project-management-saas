# 07: Dashboard and Analytics

Screens: /dashboard and /analytics. Checklist: checklists/07-dashboard-analytics.md

Fix:
1. Every number comes from the database for the current organization, computed on the server: clients, projects, tasks, revenue pipeline, invoiced, average project value, team members, channels, AI requests.
2. Plan usage: "Team Members 1 / 5", "Active Clients 1 / 25", "Projects 0 / 50", "Connected Channels 0 / 1". Each value is a live count. Plan limits come from the plan record, not hardcoded in the component.
3. Remove any sample or seeded values from the production dashboard. Empty organizations must show zero, with an empty-state message.
4. Revenue cards: Active Pipeline sums open project budgets; Invoiced sums invoices (or shows 0 with a note if invoicing is not built); Average Project Value uses projects with a budget. Currency is stated.
5. "Projects by Status" total matches the Projects screen count.
6. Notification counter (the bell badge) counts unread notifications for this user only.
7. Cache: after creating a project or client, the dashboard updates on the next load (no stale totals beyond a few seconds).

Test (Playwright): new org shows all zeros and empty states; create one project with budget 5000, dashboard shows 1 project, active pipeline 5000, and Projects by Status 1; second org still shows zeros.

Verify: npm run build, npm test, npm run test:e2e -- dashboard. Report counts. Do not push.
