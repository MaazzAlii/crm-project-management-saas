# TASK 52 — N8N Workflow Activation on Contabo VPS

## Objective
Deploy and activate all n8n automation workflows on the Contabo VPS, per the original spec.

## Why This Task Exists
Matches Sub-task 9 (activate all N8N workflows on Contabo VPS) — the automation layer (Tasks 32-36) is only live once these are actually running in production.

## Dependencies
- TASK 50
- TASK 33
- TASK 34
- TASK 35

## Current State
N8N flows are designed/documented (Tasks 32-35) but not yet deployed to the production VPS.

## Files To Inspect
- n8n/workflows/*.json
- documentation/automation-contracts.md

## Files To Create
- documentation/n8n-deployment.md

## Files To Modify


## Implementation Instructions
- Import all documented workflows (invoice trigger, deadline alert, overdue alert, weekly summary) into the production n8n instance.
- Configure each organization's webhook secret in n8n's credential store, matching Task 32's signing scheme.
- Set up the cron/schedule triggers for Tasks 34/35 to call the platform's protected cron endpoints correctly.
- Verify end-to-end for at least one real organization (the Innoventix org) before considering the phase complete.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure n8n credentials/secrets are stored securely on the VPS, not in exported workflow JSON committed to any public repo.

## Testing Requirements
- Trigger each of the 4 workflows against the live production environment for the Innoventix org and confirm correct Slack + in-app notification delivery.

## Acceptance Criteria
- [ ] All 4 original automation flows are live and verified working end-to-end in production for at least the first real organization.

## Git Commit
Recommended commit:

`chore(deploy): activate n8n automation workflows in production`

## Verification
- Manually trigger one project through Delivered in production and confirm the full invoice-trigger chain fires correctly.

## Next Task
`TASK 53`
