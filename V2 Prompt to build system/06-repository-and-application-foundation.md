# TASK 06 — Repository & Application Foundation

## Objective
Initialize the Next.js application, base tooling, and directory structure, wired to the self-hosted Supabase instance.

## Why This Task Exists
First application-layer task — everything from here builds on this scaffold.

## Dependencies
- TASK 03
- TASK 05

## Current State
Infra is live; no application code exists yet, or an early single-tenant scaffold from the original internal assignment may exist and must be inspected first.

## Files To Inspect
- Any existing repo root

## Files To Create
- package.json
- tsconfig.json
- .eslintrc
- .env.example
- README.md
- documentation/architecture.md
- .agent-state.md

## Files To Modify


## Implementation Instructions
- Initialize Next.js (App Router) + TypeScript + Tailwind CSS.
- Configure the Supabase client libraries to point at the self-hosted api.yourdomain.com endpoints from TASK 03, not supabase.co.
- Write documentation/architecture.md capturing the full platform vision: multi-tenant CRM + Project Management + unified communication hub + AI features + Super Admin tier, fully self-hosted on Contabo.
- Create .agent-state.md per the orchestrator's continuity format.
- Do not hardcode Innoventix-specific data anywhere — it is tenant #1, not a special case.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure Supabase client keys are read from environment, never hardcoded.

## Testing Requirements
- Verify `npm run build` succeeds and the app can reach the self-hosted Supabase health endpoint.

## Acceptance Criteria
- [ ] App builds and connects successfully to the self-hosted Supabase API.
- [ ] architecture.md reflects the full expanded scope.

## Git Commit
Recommended commit:

`chore(foundation): initialize application connected to self-hosted Supabase`

## Verification
- Run build and lint.
- Confirm a basic Supabase query round-trips against the self-hosted instance.

## Next Task
`TASK 07`
