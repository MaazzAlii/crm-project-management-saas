# TASK 41 — Analytics Dashboard

## Objective
Build the org-level analytics view specified in the original assignment's Sub-task 7.

## Why This Task Exists
Owners need aggregate visibility beyond the day-to-day dashboard built in Task 12.

## Dependencies
- TASK 19
- TASK 04

## Current State
Only basic counts exist on the main dashboard (Task 12); no dedicated analytics page yet.

## Files To Inspect
- Original assignment: Sub-task 7 (Dashboard Analytics)

## Files To Create
- app/(dashboard)/analytics/page.tsx
- components/analytics/*.tsx

## Files To Modify


## Implementation Instructions
- Charts: projects by status (pie/bar), revenue pipeline (total value of active projects), team workload (tasks per member, reusing Task 24 data), upcoming deadlines (next 7 days), overdue items highlighted, monthly completion rate.
- Date-range selector for historical trend views where feasible.

## UI Requirements
- Chart components (bar/pie/line as appropriate).
- Responsive chart layout for mobile.

## Backend Requirements
- Server Components running aggregate queries, RLS-scoped.

## Database Requirements
- No schema change — aggregates existing tables; consider a materialized view for expensive aggregates at scale.

## API Requirements
- N/A

## Security Requirements
- Ensure aggregate queries never leak cross-org data even in edge-case group-by queries.

## Testing Requirements
- Test analytics accuracy against manual calculations for a seeded org.

## Acceptance Criteria
- [ ] All six analytics widgets from the original spec are implemented and accurate.

## Git Commit
Recommended commit:

`feat(analytics): build organization analytics dashboard`

## Verification
- Validate revenue pipeline figure against a manual sum of active project amounts.

## Next Task
`TASK 42`
