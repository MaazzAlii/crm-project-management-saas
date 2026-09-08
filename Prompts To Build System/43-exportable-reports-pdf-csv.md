# TASK 43 — Exportable Reports (PDF/CSV)

## Objective
Add export functionality so org owners can pull data out of the platform for offline reporting or client-facing summaries.

## Why This Task Exists
A professional platform of this scope needs export, especially for agencies reporting revenue/activity to their own stakeholders.

## Dependencies
- TASK 41

## Current State
Analytics exists but is view-only; no export capability.

## Files To Inspect
- app/(dashboard)/analytics/page.tsx

## Files To Create
- lib/reports/csv-export.ts
- lib/reports/pdf-export.ts
- app/api/reports/export/route.ts

## Files To Modify


## Implementation Instructions
- CSV export for clients list, projects list, and revenue breakdown.
- PDF export for a formatted monthly summary report (reusing the weekly-summary data shape from Task 35 as a base).

## UI Requirements
- Export buttons on relevant list/analytics pages with format choice (CSV/PDF).

## Backend Requirements
- Export route generating files server-side, streamed as a download, never persisted with client data beyond the request lifecycle unless explicitly requested.

## Database Requirements
- No schema change.

## API Requirements
- GET /api/reports/export?type=...&format=... — authenticated, org-scoped.

## Security Requirements
- Ensure export endpoint respects the same RLS/org-scoping as the underlying data — no export-based data leak shortcut.

## Testing Requirements
- Test CSV/PDF export content matches on-screen data exactly.

## Acceptance Criteria
- [ ] Exports are accurate, correctly formatted, and strictly org-scoped.

## Git Commit
Recommended commit:

`feat(reports): add CSV and PDF export for key reports`

## Verification
- Diff exported CSV row counts against the underlying list view's row count.

## Next Task
`TASK 44`
