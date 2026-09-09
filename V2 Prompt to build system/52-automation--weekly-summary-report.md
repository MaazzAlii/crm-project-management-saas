# TASK 52 — Automation — Weekly Summary Report

## Objective
Implement N8N Flow 4: Monday-morning summary of active projects/tasks/deadlines per org, now including the AI narrative from TASK 47.

## Why This Task Exists
Completes the original automation requirements with the AI enhancement layered in.

## Dependencies
- TASK 49
- TASK 47

## Current State
No weekly aggregation exists yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (N8N Flow 4)
- lib/ai/features/report-narrative.ts

## Files To Create
- app/api/automation/cron/weekly-summary/route.ts

## Files To Modify


## Implementation Instructions
- Weekly job aggregating active project count, pending task count, 7-day deadlines per org.
- Pass figures through TASK 47's narrative generator (only if AI features are enabled for that org) before emitting weekly.summary.

## UI Requirements
- N/A

## Backend Requirements
- Cron-safe, protected route.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/weekly-summary — protected.

## Security Requirements
- Same cron-secret protection pattern as TASK 51.

## Testing Requirements
- Test aggregation numbers against manual queries for a seeded org; test with AI on and off.

## Acceptance Criteria
- [ ] Weekly summary contains accurate figures, with narrative attached only for AI-enabled orgs.

## Git Commit
Recommended commit:

`feat(automation): implement weekly summary report generation with optional AI narrative`

## Verification
- Manually trigger the endpoint and diff output against direct DB queries.

## Next Task
`TASK 53`
