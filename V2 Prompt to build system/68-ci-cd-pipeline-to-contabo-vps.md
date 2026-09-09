# TASK 68 — CI/CD Pipeline to Contabo VPS

## Objective
Set up an automated deploy pipeline that builds the app and deploys it to the Contabo VPS, replacing any managed-platform deploy flow.

## Why This Task Exists
Since hosting is now fully self-managed, this replaces what a service like Netlify would otherwise handle automatically.

## Dependencies
- TASK 67
- TASK 03

## Current State
No deployment pipeline configured yet; app currently only runs locally/manually on the VPS if at all.

## Files To Inspect
- documentation/deployment-checklist.md
- package.json
- docker-compose.supabase.yml

## Files To Create
- .github/workflows/deploy.yml
- Dockerfile
- documentation/infra/deployment-pipeline.md

## Files To Modify


## Implementation Instructions
- Containerize the Next.js app (Dockerfile) so it deploys the same way in every environment.
- GitHub Actions (or equivalent) workflow: build → run tests (TASKS 64-65) → build/push Docker image → SSH deploy to the VPS → restart the app container behind the TASK 03 Nginx proxy.
- Set up a staging deploy path (separate container/port, same VPS or a scratch DB) for safe review before promoting to production.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Deploy credentials (SSH key, registry token) stored as CI secrets, never in the repo; production deploy trigger restricted (e.g. main branch only, or manual approval).

## Testing Requirements
- Deploy to staging and run the E2E suite (TASK 65) against it before promoting to production.

## Acceptance Criteria
- [ ] Production deployment succeeds and is reachable via the app subdomain; staging is safely isolated from production data.

## Git Commit
Recommended commit:

`chore(deploy): set up CI/CD pipeline deploying to the self-hosted Contabo VPS`

## Verification
- Trigger a full pipeline run and verify the live site against the deployment checklist.

## Next Task
`TASK 69`
