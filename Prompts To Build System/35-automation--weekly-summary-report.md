# TASK 35 — Automation — Weekly Summary Report

## Objective
Implement N8N Flow 4: a Monday-morning summary of active projects, pending tasks, and upcoming deadlines per organization.

## Why This Task Exists
Completes the original assignment's automation requirements and gives every org owner a proactive weekly pulse.

## Dependencies
- TASK 32

## Current State
No weekly aggregation exists yet.

## Files To Inspect
- Original assignment: N8N Flow 4

## Files To Create
- app/api/automation/cron/weekly-summary/route.ts

## Files To Modify


## Implementation Instructions
- Weekly (Monday, org-local-time-aware where feasible) job aggregating: active project count, pending task count, deadlines in the next 7 days, per organization.
- Emit a `weekly.summary` event per organization to their configured n8n webhook for Slack delivery, exactly matching the original spec's intent.

## UI Requirements
- N/A

## Backend Requirements
- Cron-safe route, protected by secret.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/weekly-summary — protected.

## Security Requirements
- Same cron-secret protection pattern as Task 34.

## Testing Requirements
- Test aggregation numbers against manual queries for a seeded org.

## Acceptance Criteria
- [ ] Weekly summary event contains accurate, org-scoped figures.

## Git Commit
Recommended commit:

`feat(automation): implement weekly summary report generation`

## Verification
- Manually trigger the endpoint against test data and diff output against direct DB queries.

## Next Task
`TASK 36`
