# TASK 69 — N8N Workflow Activation on Contabo VPS

## Objective
Activate all n8n automation workflows in production, now fully co-located with the app on the same VPS.

## Why This Task Exists
Matches the original spec's requirement — the automation layer (TASKS 49-53) is only live once these actually run in production.

## Dependencies
- TASK 68
- TASK 50
- TASK 51
- TASK 52

## Current State
N8N flows are designed/documented; not yet activated against the production app deployment.

## Files To Inspect
- n8n/workflows/*.json
- documentation/automation-contracts.md

## Files To Create
- documentation/infra/n8n-deployment.md

## Files To Modify


## Implementation Instructions
- Import all documented workflows (invoice trigger, deadline alert, overdue alert, weekly summary) into the production n8n instance on the VPS.
- Configure each organization's webhook secret in n8n's credential store, matching TASK 49's signing scheme.
- Set up cron/schedule triggers for TASKS 51/52 calling the platform's protected cron endpoints.
- Verify end-to-end for at least the Innoventix organization before considering this phase complete.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- N8n credentials stored securely on the VPS, never in exported workflow JSON committed to any repo.

## Testing Requirements
- Trigger each of the 4 workflows against the live production environment for the Innoventix org and confirm correct Slack + in-app delivery.

## Acceptance Criteria
- [ ] All 4 automation flows live and verified end-to-end in production for at least the first real organization.

## Git Commit
Recommended commit:

`chore(deploy): activate n8n automation workflows in production`

## Verification
- Manually walk one project through Delivered in production and confirm the full invoice-trigger chain fires correctly.

## Next Task
`TASK 70`
