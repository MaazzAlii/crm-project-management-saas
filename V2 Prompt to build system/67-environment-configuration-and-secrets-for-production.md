# TASK 67 — Environment Configuration & Secrets for Production

## Objective
Finalize all environment variables and secrets for the self-hosted production deployment.

## Why This Task Exists
Consolidates every secret from TASKS 11-62 (self-hosted Supabase keys, Stripe, Slack, WhatsApp, Email, n8n, AI provider, encryption keys) into one audited, documented set.

## Dependencies
- TASK 62

## Current State
Secrets scattered across many .env references from individual tasks; no consolidated production checklist yet.

## Files To Inspect
- .env.example
- all lib/providers/*.ts, lib/stripe/*.ts, lib/ai/client.ts files

## Files To Create
- documentation/deployment-checklist.md

## Files To Modify
- .env.example (finalize)

## Implementation Instructions
- Audit every environment variable referenced anywhere in the codebase, documented with a description in .env.example.
- Separate secrets by environment (development/staging/production), all living on the VPS itself, not a third-party secrets manager unless explicitly decided otherwise.
- Document exact provisioning steps for deploying secrets to the Contabo VPS (TASK 68).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Confirm no secret is committed to the repository anywhere in git history.

## Testing Requirements
- Verify a fresh clone + .env.example-based setup can run the app against a scratch instance with zero missing variables.

## Acceptance Criteria
- [ ] .env.example complete and accurate; no secret in git history; a new developer/agent can configure the app from documentation alone.

## Git Commit
Recommended commit:

`chore(deploy): finalize environment configuration and secrets documentation`

## Verification
- Run a secret-scanning tool (e.g. gitleaks) against the full repository history.

## Next Task
`TASK 68`
