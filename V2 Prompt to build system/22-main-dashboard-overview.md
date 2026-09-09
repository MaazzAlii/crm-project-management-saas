# TASK 22 — Main Dashboard Overview

## Objective
Build the org-level landing dashboard.

## Why This Task Exists
First thing any team member sees after login.

## Dependencies
- TASK 21
- TASK 09

## Current State
Shell exists; no data widgets built.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (dashboard requirements)

## Files To Create
- app/(dashboard)/dashboard/page.tsx
- components/dashboard/*.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects, pending tasks, overdue projects (red), revenue this month, unread inbox count.
- Quick-add: New Client, New Project.
- Recent activity feed.

## UI Requirements
- Card grid, responsive, empty state for brand-new orgs, loading skeletons.

## Backend Requirements
- Server Components with RLS-scoped aggregate queries.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Test dashboard for orgs with data vs a brand-new empty org.

## Acceptance Criteria
- [ ] All widgets show accurate, org-scoped counts; empty state renders correctly.

## Git Commit
Recommended commit:

`feat(dashboard): build main overview dashboard with live widgets`

## Verification
- Compare widget counts against manual DB queries for the same org.

## Next Task
`TASK 23`
