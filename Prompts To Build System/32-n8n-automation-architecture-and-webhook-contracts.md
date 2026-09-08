# TASK 32 — N8N Automation Architecture & Webhook Contracts

## Objective
Define the exact webhook/event contracts between the platform and n8n before building individual flows.

## Why This Task Exists
The original assignment's automation flows (invoice trigger, deadline alerts, overdue alerts, weekly summary) all depend on a consistent, documented event contract.

## Dependencies
- TASK 20
- TASK 04

## Current State
No automation contracts documented yet; original spec describes flows conceptually only.

## Files To Inspect
- Original assignment: Sub-task 3 (all 4 N8N flows)

## Files To Create
- documentation/automation-contracts.md
- app/api/automation/events/route.ts

## Files To Modify


## Implementation Instructions
- Define a single outbound event-emitter pattern: on key state changes (project delivered, task overdue, project overdue), the app POSTs a signed event payload to a configurable per-organization n8n webhook URL.
- Define payload schema: event_type, organization_id, timestamp, entity data (project/task/client relevant fields).
- Document that n8n runs per-deployment on Contabo VPS as specified, receiving these events and orchestrating Slack notifications and the invoice trigger.
- Add an organization-level settings field for the n8n webhook URL + a shared secret for payload signing.

## UI Requirements
- N/A — backend/infra task.

## Backend Requirements
- Signed outbound webhook sender utility used by Tasks 33-35.

## Database Requirements
- Add `automation_webhook_url` and `automation_webhook_secret` to organizations (or a dedicated integrations table).

## API Requirements
- POST to the org's configured n8n webhook — outbound only, signed with HMAC using the shared secret.

## Security Requirements
- Sign every outbound payload; document how n8n should verify the signature.
- Never log the webhook secret.

## Testing Requirements
- Send a test event to a mock n8n endpoint (e.g. webhook.site) and confirm payload shape and signature verify correctly.

## Acceptance Criteria
- [ ] Event contract is documented and the signed-sender utility works against a test endpoint.

## Git Commit
Recommended commit:

`feat(automation): define n8n event contract and signed webhook sender`

## Verification
- Verify signature validation logic manually against a known secret/payload pair.

## Next Task
`TASK 33`
