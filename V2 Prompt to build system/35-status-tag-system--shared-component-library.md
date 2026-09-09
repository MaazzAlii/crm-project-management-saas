# TASK 35 — Status Tag System — Shared Component Library

## Objective
Extract status/priority tag styling into one reusable component used everywhere.

## Why This Task Exists
Prevents drift across kanban, list, detail, and client-portal screens.

## Dependencies
- TASK 29

## Current State
Status colors used ad-hoc in TASK 29's kanban only.

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
- Implement the exact 7-status table as a single source of truth constant.
- Build <StatusBadge/> consumed everywhere instead of per-screen color logic.

## UI Requirements
- Consistent badges app-wide, including the future client portal.

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Visually diff badges across kanban/list/detail for consistency.

## Acceptance Criteria
- [ ] Every status-rendering screen uses the shared component with zero visual drift.

## Git Commit
Recommended commit:

`refactor(ui): extract shared status badge component and constants`

## Verification
- Grep the codebase to confirm no duplicated status color/icon mapping remains.

## Next Task
`TASK 36`
