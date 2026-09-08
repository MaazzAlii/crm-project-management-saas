# TASK 51 — Netlify Deployment Pipeline

## Objective
Set up the production deployment pipeline on Netlify, per the original assignment's hosting choice.

## Why This Task Exists
Matches Sub-task 9 of the original assignment (deploy frontend on Netlify) while accounting for the platform's growth into a full SaaS product.

## Dependencies
- TASK 50

## Current State
No deployment pipeline configured yet.

## Files To Inspect
- documentation/deployment-checklist.md
- package.json

## Files To Create
- netlify.toml

## Files To Modify


## Implementation Instructions
- Configure Netlify build settings (Next.js runtime, build command, environment variable injection).
- Set up preview deployments per PR/branch for safe review before merging to production.
- Configure custom domain(s), including support for the org-specific subdomains if white-labeling is planned (Task 38 note).
- Configure production Supabase project separate from any dev/staging project, with migrations applied via CI.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure preview deployments never point at the production database.
- Restrict who can trigger production deploys.

## Testing Requirements
- Deploy to a preview URL and run the E2E suite (Task 48) against it before promoting to production.

## Acceptance Criteria
- [ ] Production deployment succeeds and is reachable.
- [ ] Preview deployments work safely isolated from production data.

## Git Commit
Recommended commit:

`chore(deploy): configure Netlify production deployment pipeline`

## Verification
- Trigger a full deploy and verify the live site against the deployment checklist.

## Next Task
`TASK 52`
