# 04: Projects

Screen: /projects. Checklist: checklists/04-projects.md

Fix:
1. Project list and count come only from the current organization. The sidebar and Analytics counts must match this list.
2. Create Project: the form saves to the database and the new project appears at the top immediately, and after reload.
3. Assigned Team Member dropdown: lists only current organization members. Remove any user from another organization.
4. Project Budget and Currency: budget saves as a number; the list shows the formatted amount. Empty budget is allowed and shows "—".
5. Dates: Start Date defaults to today. Target Deadline must be after Start Date; show an inline error otherwise.
6. Edit and delete project: works for owner and admin. Members can view only (or follow the existing permission model; state which).
7. Error handling: if save fails, show the server message in the form. Never show raw database errors such as "invalid input syntax".

Test (Playwright): create project with assignee, reload, see it once; edit budget; delete it; second org cannot see it.

Verify: npm run build, npm test, npm run test:e2e -- projects. Report counts. Do not push.
