# TASK 31 — Tasks Module

## Objective
Build standalone task list, creation, completion, and a global My Tasks / All Tasks view.

## Why This Task Exists
Matches the original /tasks requirement.

## Dependencies
- TASK 30

## Current State
Embedded task list exists on project detail; no standalone module.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/tasks/page.tsx
- components/tasks/TaskList.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- My Tasks / All Tasks toggle; filter by project/status/due-date range.
- Quick-complete with optimistic update; inline quick-add.

## UI Requirements
- List with checkbox-complete, overdue flagged red, empty state.

## Backend Requirements
- Server actions reused from project detail.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Reassignment restricted to org members, validated server-side.

## Testing Requirements
- Test My Tasks vs All Tasks scoping; overdue flagging.

## Acceptance Criteria
- [ ] Both views correct and consistent with the embedded project-detail task list.

## Git Commit
Recommended commit:

`feat(tasks): build standalone task module with My Tasks/All Tasks views`

## Verification
- Complete a task globally and confirm it reflects instantly on project detail.

## Next Task
`TASK 32`
