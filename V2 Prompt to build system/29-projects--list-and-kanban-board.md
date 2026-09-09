# TASK 29 — Projects — List & Kanban Board

## Objective
Build kanban and list views for projects, matching the original spec's 7-stage flow and color coding.

## Why This Task Exists
Core project-tracking screen.

## Dependencies
- TASK 21
- TASK 09

## Current State
projects table + RLS exist; no UI yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/projects/page.tsx
- components/projects/KanbanBoard.tsx
- components/projects/ProjectListView.tsx

## Files To Modify


## Implementation Instructions
- Kanban columns matching the exact 7-stage colors/icons.
- List view with status/client/type/assigned_to/priority filters.
- Drag-and-drop status change via a shared server action reused by the detail page and automation triggers.

## UI Requirements
- Kanban/list toggle, optimistic drag with rollback, mobile-collapsible filters.

## Backend Requirements
- Shared updateProjectStatus server action.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Status-change action re-validates org/client ownership server-side.

## Testing Requirements
- Test drag across every status; test filter combinations.

## Acceptance Criteria
- [ ] Both views fully functional; colors match spec exactly.

## Git Commit
Recommended commit:

`feat(projects): build kanban and list views with drag-and-drop status flow`

## Verification
- Drag a project through the full flow and confirm delivered_at/invoice_triggered populate correctly.

## Next Task
`TASK 30`
