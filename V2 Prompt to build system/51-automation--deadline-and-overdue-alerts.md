# TASK 51 — Automation — Deadline & Overdue Alerts

## Objective
Implement N8N Flows 2 and 3: task-due-tomorrow and project-overdue alerts.

## Why This Task Exists
Daily-cadence accountability automations from the original spec.

## Dependencies
- TASK 49

## Current State
Event contract exists; no scheduled checks implemented.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (N8N Flow 2, 3)

## Files To Create
- app/api/automation/cron/deadline-check/route.ts

## Files To Modify


## Implementation Instructions
- Daily cron-triggered route (invoked by n8n's schedule trigger) querying tasks due tomorrow and overdue projects per org.
- Emit task.due_soon and project.overdue events to the correct org's webhook.

## UI Requirements
- N/A

## Backend Requirements
- Cron-safe, idempotent, scoped per organization.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/deadline-check — protected by a cron secret.

## Security Requirements
- Protect the cron endpoint with a secret header, not publicly callable.

## Testing Requirements
- Test with synthetic due-tomorrow/overdue records; confirm no duplicate alerts on repeat runs.

## Acceptance Criteria
- [ ] Daily check correctly identifies matches per org without duplication.

## Git Commit
Recommended commit:

`feat(automation): implement deadline and overdue alert checks`

## Verification
- Run the check twice against the same data and confirm no duplicate alerts.

## Next Task
`TASK 52`
