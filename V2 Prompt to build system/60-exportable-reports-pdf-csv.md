# TASK 60 — Exportable Reports (PDF/CSV)

## Objective
Add export functionality for clients list, projects list, revenue breakdown, and a formatted monthly summary.

## Why This Task Exists
Agencies need to report activity/revenue to their own stakeholders offline.

## Dependencies
- TASK 58

## Current State
Analytics is view-only; no export capability.

## Files To Inspect
- app/(dashboard)/analytics/page.tsx

## Files To Create
- lib/reports/csv-export.ts
- lib/reports/pdf-export.ts
- app/api/reports/export/route.ts

## Files To Modify


## Implementation Instructions
- CSV export for clients/projects/revenue.
- PDF export for a formatted monthly summary (reusing TASK 52's data shape as base, with the AI narrative included if enabled).

## UI Requirements
- Export buttons on relevant list/analytics pages, format choice.

## Backend Requirements
- Export route generating files server-side, streamed as download.

## Database Requirements
- No schema change.

## API Requirements
- GET /api/reports/export?type=...&format=... — authenticated, org-scoped.

## Security Requirements
- Export endpoint respects the same RLS/org-scoping as underlying data — no export-based shortcut.

## Testing Requirements
- Test CSV/PDF export content matches on-screen data exactly.

## Acceptance Criteria
- [ ] Exports accurate, correctly formatted, strictly org-scoped.

## Git Commit
Recommended commit:

`feat(reports): add CSV and PDF export for key reports`

## Verification
- Diff exported CSV row counts against the underlying list view's row count.

## Next Task
`TASK 61`
