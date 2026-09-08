# TASK 20 — Projects — Detail Page

## Objective
Build the single-project view: full info, task list, deliverables, timeline, and status control.

## Why This Task Exists
Matches the original assignment's /projects/[id] requirement, now the operational hub of a project.

## Dependencies
- TASK 19

## Current State
Project list/kanban exists; no detail page yet.

## Files To Inspect
- Original assignment: Sub-task 4 (/projects/[id])

## Files To Create
- app/(dashboard)/projects/[id]/page.tsx
- components/projects/ProjectTimeline.tsx

## Files To Modify


## Implementation Instructions
- Header: title, client link, status badge + change control, priority, deadline countdown.
- Task list with checkboxes (reuses Task 21's task components).
- Deliverables section (reuses Task 22's components).
- Activity/timeline log: every status change and task completion recorded chronologically.
- Notes field.

## UI Requirements
- Sectioned single-page layout.
- Status change confirmation modal when moving to Delivered (since it triggers automation in Task 33).
- Not-found/cross-tenant 404 handling.

## Backend Requirements
- Server Component aggregating project + tasks + deliverables + activity log, RLS-scoped.

## Database Requirements
- Add `project_activity_log` table: project_id, organization_id, event_type, description, created_at, created_by.

## API Requirements
- N/A

## Security Requirements
- Cross-tenant project id access returns 404.

## Testing Requirements
- Test full page render with a project that has tasks, deliverables, and activity history.

## Acceptance Criteria
- [ ] Detail page shows accurate, complete project state.
- [ ] Status change to Delivered shows the automation-trigger confirmation.

## Git Commit
Recommended commit:

`feat(projects): build project detail page with tasks, deliverables, and activity log`

## Verification
- Change status to Delivered and confirm an activity_log row is created.

## Next Task
`TASK 21`
