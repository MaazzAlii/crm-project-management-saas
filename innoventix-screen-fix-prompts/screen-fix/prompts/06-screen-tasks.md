# 06: Tasks

Screen: /tasks. Checklist: checklists/06-tasks.md

Fix:
1. Project dropdown lists the current organization's projects by their real IDs. The error `invalid input syntax for type uuid: "proj-2"` must not be possible. Find where "proj-2" comes from and remove it. Validate IDs as UUIDs on the server and return a 400 with a clear message if invalid.
2. Assigned Team Member lists only current organization members.
3. Create Task: saves and appears in the list once. Due date, priority, and status save correctly.
4. Edit task (pencil icon) and delete task (trash icon) both work and persist after reload. Confirm before delete.
5. Task summary counters at the top (for example "Active" and "Overdue") are computed from the database for this organization.
6. Sample tasks currently shown in the list (rows with no real data) must not come from seed or demo code in production. If they come from the database, mark them; if they come from code, remove them.

Test (Playwright): create a task with a project and assignee; edit its title; delete it; second org cannot see it; invalid project ID gets a 400 and a visible message.

Verify: npm run build, npm test, npm run test:e2e -- tasks. Report counts. Do not push.
