# TASK 19 — Projects — List & Kanban Board

## Objective
Build the projects list with both kanban and list views, matching and extending the original assignment's /projects requirements.

## Why This Task Exists
This is the core project-tracking screen from the original spec, now organization-scoped and reusable by any tenant.

## Dependencies
- TASK 11
- TASK 04

## Current State
projects table + RLS exist; no UI yet.

## Files To Inspect
- Original assignment: Sub-task 4 (/projects), Sub-task 5 (status tags/colors)

## Files To Create
- app/(dashboard)/projects/page.tsx
- components/projects/KanbanBoard.tsx
- components/projects/ProjectListView.tsx

## Files To Modify


## Implementation Instructions
- Kanban columns matching the 7-stage status flow with the exact colors/icons from the original spec (gray/blue/yellow/orange/purple/green/red).
- List view with filters: status, client, type, assigned_to, priority.
- Drag-and-drop status change, calling the same server action used by the detail page's manual status button (Task 20) to keep automation triggers (Task 33) consistent.
- Color-coding by priority as specified in the original assignment.

## UI Requirements
- Kanban and list view toggle.
- Drag-and-drop with optimistic update + rollback on failure.
- Filter bar collapsible on mobile.

## Backend Requirements
- Server action `updateProjectStatus` shared by kanban drag, detail page, and (later) client-portal approval flow.

## Database Requirements
- No schema change — reads/writes projects table from Task 04.

## API Requirements
- N/A

## Security Requirements
- Status-change action re-validates organization/client ownership server-side even though drag only shows in-org data.

## Testing Requirements
- Test drag across every status.
- Test filters in combination.

## Acceptance Criteria
- [ ] Kanban and list views both fully functional and consistent with each other.
- [ ] Status colors match spec exactly.

## Git Commit
Recommended commit:

`feat(projects): build kanban and list views with drag-and-drop status flow`

## Verification
- Drag a project through the full status flow and confirm delivered_at / invoice_triggered fields populate correctly at the right stages.

## Next Task
`TASK 20`
