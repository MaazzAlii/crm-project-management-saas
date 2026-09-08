# TASK 21 — Tasks Module

## Objective
Build the task list, creation, and completion flows, including a global 'My Tasks' view.

## Why This Task Exists
Matches the original assignment's /tasks requirement (My tasks / All tasks toggle).

## Dependencies
- TASK 20

## Current State
tasks table exists; embedded task list exists on project detail from Task 20 but no standalone module.

## Files To Inspect
- Original assignment: Sub-task 4 (/tasks)

## Files To Create
- app/(dashboard)/tasks/page.tsx
- components/tasks/TaskList.tsx
- components/tasks/TaskQuickAdd.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Global tasks page: 'My Tasks' (assigned_to = current user) / 'All Tasks' toggle.
- Filter by project, status, due date range.
- Quick-complete checkbox with optimistic update.
- Quick-add task inline (title + project + due date) without leaving the list.

## UI Requirements
- List with checkbox-complete.
- Overdue tasks visually flagged (red).
- Empty state for zero assigned tasks.

## Backend Requirements
- Server actions for create/complete/reassign task, reused from project detail page.

## Database Requirements
- No schema change — reads/writes tasks table from Task 04.

## API Requirements
- N/A

## Security Requirements
- Assignment reassignment restricted to org members only (validated server-side).

## Testing Requirements
- Test My Tasks vs All Tasks scoping.
- Test overdue flagging logic against due_date.

## Acceptance Criteria
- [ ] Both task views work correctly and consistently with the embedded task list on project detail.

## Git Commit
Recommended commit:

`feat(tasks): build standalone task module with My Tasks/All Tasks views`

## Verification
- Complete a task from the global list and confirm it also reflects instantly on the project detail page.

## Next Task
`TASK 22`
