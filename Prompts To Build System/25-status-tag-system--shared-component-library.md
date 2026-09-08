# TASK 25 — Status Tag System — Shared Component Library

## Objective
Extract the status/priority tag styling (colors, icons) from the original spec into a single reusable component used everywhere (kanban, list, detail, client portal).

## Why This Task Exists
The original assignment specifies an exact status color/icon table; centralizing it prevents drift across the many screens that render project status.

## Dependencies
- TASK 19

## Current State
Status colors currently only used ad-hoc inside Task 19's kanban.

## Files To Inspect
- components/projects/KanbanBoard.tsx

## Files To Create
- components/shared/StatusBadge.tsx
- lib/constants/status.ts

## Files To Modify
- components/projects/KanbanBoard.tsx
- components/projects/ProjectListView.tsx
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Implement the exact 7-status table from the original assignment (Brief Received/gray/📋 ... Paid/green/✅, plus On Hold/red/⏸️) as a single source-of-truth constant.
- Build <StatusBadge status=... /> component consumed everywhere instead of re-implementing color logic per screen.

## UI Requirements
- Consistent badge styling app-wide, including in the future client portal.

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Visually diff status badges across kanban, list, and detail pages to confirm consistency.

## Acceptance Criteria
- [ ] Every screen rendering project status uses the shared component with zero visual drift.

## Git Commit
Recommended commit:

`refactor(ui): extract shared status badge component and constants`

## Verification
- Grep the codebase to confirm no other file duplicates the status color/icon mapping.

## Next Task
`TASK 26`
