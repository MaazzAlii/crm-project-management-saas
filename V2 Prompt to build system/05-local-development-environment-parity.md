# TASK 05 — Local Development Environment Parity

## Objective
Set up a local Docker Compose environment that mirrors the production self-hosted Supabase stack, so development never depends on a live connection to the production VPS.

## Why This Task Exists
Without a local mirror, every developer/agent session would need to develop directly against production infrastructure — risky and slow. This closes that gap before any application code is written.

## Dependencies
- TASK 02

## Current State
Production self-hosted Supabase stack exists on the VPS (TASK 02); no local equivalent exists yet.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- docker-compose.local.yml
- documentation/infra/local-dev-setup.md
- .env.local.example

## Files To Modify


## Implementation Instructions
- Adapt the production docker-compose.supabase.yml into a docker-compose.local.yml runnable on a developer machine (lighter resource settings, local-only ports, no public exposure).
- Document the one-command setup (`docker compose -f docker-compose.local.yml up`) and seed-data loading process.
- Confirm schema migrations (from TASK 08 onward) apply identically to local and production instances.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Local instance never shares credentials or data with production; .env.local.example contains only placeholder values.

## Testing Requirements
- Verify a fresh machine can run the one-command setup and reach a working local Supabase stack with zero manual steps beyond documented ones.

## Acceptance Criteria
- [ ] Local dev environment runs independently of production and stays schema-compatible with it.

## Git Commit
Recommended commit:

`chore(infra): add local development environment mirroring production Supabase stack`

## Verification
- Tear down and rebuild the local environment from scratch following only the documentation, confirming it works cleanly.

## Next Task
`TASK 06`
