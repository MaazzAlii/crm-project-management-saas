# TASK 30 — Projects — Detail Page

## Objective
Build the single-project view: info, tasks, deliverables, timeline, status control.

## Why This Task Exists
Operational hub of a project.

## Dependencies
- TASK 29

## Current State
Kanban/list exist; no detail page.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/projects/[id]/page.tsx
- components/projects/ProjectTimeline.tsx

## Files To Modify


## Implementation Instructions
- Header with status change + deadline countdown.
- Embedded task list and deliverables sections.
- Activity/timeline log recording every status change and task completion.
- Notes field.

## UI Requirements
- Sectioned layout, Delivered-transition confirmation modal (automation trigger warning), 404 handling.

## Backend Requirements
- Server Component aggregating project+tasks+deliverables+activity log.

## Database Requirements
- Add project_activity_log table.

## API Requirements
- N/A

## Security Requirements
- Cross-tenant project id access returns 404.

## Testing Requirements
- Test full render with a project having tasks/deliverables/history.

## Acceptance Criteria
- [ ] Detail page accurate and complete; Delivered transition shows the automation confirmation.

## Git Commit
Recommended commit:

`feat(projects): build project detail page with tasks, deliverables, and activity log`

## Verification
- Change status to Delivered and confirm an activity_log row is created.

## Next Task
`TASK 31`
