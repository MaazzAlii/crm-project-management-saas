# TASK 70 — Monitoring, Logging & Uptime for Self-Hosted Infrastructure

## Objective
Set up monitoring, centralized logging, and uptime alerting for every self-hosted service.

## Why This Task Exists
A managed cloud platform normally provides this for free; self-hosting on Contabo means you must build it deliberately or you'll be blind to outages.

## Dependencies
- TASK 68

## Current State
No monitoring/alerting exists for the self-hosted stack.

## Files To Inspect
- docker-compose.supabase.yml
- nginx/conf.d/*.conf

## Files To Create
- documentation/infra/monitoring.md
- docker-compose.monitoring.yml

## Files To Modify


## Implementation Instructions
- Set up basic uptime monitoring (external ping/health-check service) for app, api, and n8n subdomains, alerting you (e.g. via Slack/email) on downtime.
- Centralize container logs (app, Postgres, Auth, Nginx) so they're queryable in one place, not scattered across `docker logs` on the VPS.
- Set up basic resource alerts (disk space, memory, CPU) on the VPS itself — critical since there's no managed auto-scaling.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Logs and monitoring dashboards themselves must not be publicly exposed.

## Testing Requirements
- Simulate a service outage (stop a container) and confirm the alert fires within an acceptable window.

## Acceptance Criteria
- [ ] Uptime, logs, and resource alerts all working and correctly notifying you on failure.

## Git Commit
Recommended commit:

`feat(infra): add monitoring, centralized logging, and uptime alerting`

## Verification
- Stop the app container briefly and confirm an alert is received.

## Next Task
`TASK 71`
