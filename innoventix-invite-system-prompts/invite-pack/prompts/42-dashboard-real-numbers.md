# 42: Dashboard shows real numbers

Fix /dashboard so every card reads from the database for the session organization:
- Active projects, pending tasks, overdue projects, active clients.
- Team: members used of max, pending invitations.
- Recent activity: real audit or activity rows, newest first, with an empty state.

Remove any hardcoded or fallback number still present (the earlier audit found dashboard overrides for the dev org; confirm they are gone).

Test: a new organization shows zeros and empty states; after creating one client and one project, the counts show 1 each.
