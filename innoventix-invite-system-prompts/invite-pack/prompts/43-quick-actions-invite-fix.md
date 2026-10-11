# 43: Quick Actions: Invite Team button works

In the dashboard Quick Actions:
- Invite Team links to /settings/team and opens the invite dialog (use a query parameter like ?invite=1 that the Team page reads on load). No link may point to /team.
- New Client, New Project, Create Task each open the correct existing screen or dialog.

Add a unit test that scans the quick action definitions and fails if any href does not match a route file that exists under app/.

Playwright: click Invite Team from the dashboard, the dialog appears, no 404.
