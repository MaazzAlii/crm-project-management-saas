# TASK 49 — N8N Automation Architecture & Webhook Contracts

## Objective
Define the event contract between the app and the already-running n8n instance on the Contabo VPS.

## Why This Task Exists
The original automations (invoice trigger, deadline/overdue alerts, weekly summary) all depend on a consistent, documented, signed event contract.

## Dependencies
- TASK 30
- TASK 09

## Current State
n8n already runs on the VPS (proxied in TASK 03); no event contracts documented yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (all 4 N8N flows)
- nginx/conf.d/n8n.conf

## Files To Create
- documentation/automation-contracts.md
- app/api/automation/events/route.ts

## Files To Modify


## Implementation Instructions
- Signed outbound event-emitter: on key state changes, POST a signed payload to the org's configured n8n webhook URL (now n8n.yourdomain.com per TASK 03).
- Payload schema: event_type, organization_id, timestamp, relevant entity data.
- Add organization-level automation_webhook_url + automation_webhook_secret fields.

## UI Requirements
- N/A

## Backend Requirements
- Signed outbound webhook sender utility used by TASKS 50-52.

## Database Requirements
- Add automation_webhook_url, automation_webhook_secret to organizations.

## API Requirements
- Signed POST to the org's n8n webhook — outbound only, HMAC-signed.

## Security Requirements
- Sign every outbound payload; never log the secret.

## Testing Requirements
- Send a test event to a mock endpoint and confirm payload shape and signature verify correctly.

## Acceptance Criteria
- [ ] Event contract documented and signed-sender utility works against a test endpoint.

## Git Commit
Recommended commit:

`feat(automation): define n8n event contract and signed webhook sender`

## Verification
- Manually verify signature validation against a known secret/payload pair.

## Next Task
`TASK 50`
