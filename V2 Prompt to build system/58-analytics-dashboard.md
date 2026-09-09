# TASK 58 — Analytics Dashboard

## Objective
Build the org-level analytics view from the original spec's Sub-task 7.

## Why This Task Exists
Owners need aggregate visibility beyond the main dashboard's basic counts.

## Dependencies
- TASK 29
- TASK 09

## Current State
Only basic counts exist on the main dashboard; no dedicated analytics page yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (Dashboard Analytics)

## Files To Create
- app/(dashboard)/analytics/page.tsx
- components/analytics/*.tsx

## Files To Modify


## Implementation Instructions
- Charts: projects by status, revenue pipeline, team workload (reuse TASK 34 data), upcoming deadlines (7 days), overdue highlighted, monthly completion rate.
- Date-range selector where feasible; optional AI narrative summary at the top (reuse TASK 47's generator).

## UI Requirements
- Chart components (bar/pie/line), responsive for mobile.

## Backend Requirements
- Server Components running RLS-scoped aggregate queries.

## Database Requirements
- No schema change; consider a materialized view for expensive aggregates at scale.

## API Requirements
- N/A

## Security Requirements
- Aggregate queries never leak cross-org data even in edge-case group-bys.

## Testing Requirements
- Test analytics accuracy against manual calculations for a seeded org.

## Acceptance Criteria
- [ ] All analytics widgets implemented and accurate.

## Git Commit
Recommended commit:

`feat(analytics): build organization analytics dashboard`

## Verification
- Validate revenue pipeline figure against a manual sum of active project amounts.

## Next Task
`TASK 59`
