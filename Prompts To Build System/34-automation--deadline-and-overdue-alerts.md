# TASK 34 — Automation — Deadline & Overdue Alerts

## Objective
Implement N8N Flows 2 and 3 from the original assignment: task-due-tomorrow alerts and project-overdue alerts.

## Why This Task Exists
These are the daily-cadence automations keeping teams accountable, as explicitly specified.

## Dependencies
- TASK 32

## Current State
Event contract exists; no scheduled checks implemented yet.

## Files To Inspect
- Original assignment: N8N Flow 2, N8N Flow 3

## Files To Create
- app/api/automation/cron/deadline-check/route.ts

## Files To Modify


## Implementation Instructions
- Implement a daily cron-triggered route (invoked by n8n's own schedule trigger, or a platform-side scheduled function) that queries: tasks due tomorrow (per org), and projects past deadline still not 'delivered'.
- Emit a `task.due_soon` event per matching task and a `project.overdue` event per matching project, addressed to the correct organization's n8n webhook for Slack delivery to the right person/owner exactly as specified.

## UI Requirements
- N/A — backend/automation only.

## Backend Requirements
- Cron-safe route (idempotent, safe to re-run, scoped per organization).

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/deadline-check — protected by a cron secret, not publicly callable.

## Security Requirements
- Protect the cron endpoint with a secret header so it cannot be triggered by arbitrary requests.

## Testing Requirements
- Test with synthetic due-tomorrow and overdue records and confirm correct, non-duplicate event emission.

## Acceptance Criteria
- [ ] Daily check correctly identifies due-soon tasks and overdue projects per organization and emits events without duplicates.

## Git Commit
Recommended commit:

`feat(automation): implement deadline and overdue alert checks`

## Verification
- Run the check twice in a row against the same data and confirm no duplicate alerts are emitted.

## Next Task
`TASK 35`
