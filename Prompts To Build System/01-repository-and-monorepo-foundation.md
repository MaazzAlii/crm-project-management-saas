# TASK 01 — Repository & Monorepo Foundation

## Objective
Initialize the production repository, base tooling, and folder structure for a multi-tenant SaaS platform (not a single-tenant internal tool).

## Why This Task Exists
Every later task assumes a working repo, consistent linting/formatting, and a directory structure that separates the app, the internal agent-planning docs, and shared packages. Getting this right first avoids rework across 50+ later tasks.

## Dependencies
- None — this is the first task.

## Current State
No project exists yet, or an early scaffold may exist from the original Innoventix-internal assignment and must be inspected before assuming a blank slate.

## Files To Inspect
- Any existing repo root
- package.json if present
- .git history if present

## Files To Create
- package.json
- tsconfig.json
- .eslintrc
- .prettierrc
- .gitignore
- .env.example
- README.md
- documentation/architecture.md
- .agent-state.md

## Files To Modify


## Implementation Instructions
- Initialize Next.js 14+ (App Router) with TypeScript and Tailwind CSS.
- Set up a monorepo-friendly structure even if starting single-app: /app, /components, /lib, /server, /types, /documentation, /supabase (migrations).
- Configure ESLint + Prettier + strict TypeScript.
- Create documentation/architecture.md capturing the platform vision: multi-tenant CRM + Project Management + unified communication hub, sold as a subscription SaaS to Innoventix Hub internally AND to external client organizations.
- Create .agent-state.md per the orchestrator's continuity format.
- Do NOT hardcode Innoventix-specific data anywhere in code — Innoventix becomes just the first tenant (organization) in the system.

## UI Requirements
- N/A — no UI yet.

## Backend Requirements
- N/A — no backend logic yet.

## Database Requirements
- N/A — schema begins in Task 03.

## API Requirements
- N/A

## Security Requirements
- Ensure .env.example never contains real secrets.
- Add .gitignore rules for .env*, node_modules, .next, .agent-state.md is committed (internal state) but noted as internal-only in README.

## Testing Requirements
- Verify `npm run build` succeeds on a fresh clone.
- Verify lint passes with zero errors.

## Acceptance Criteria
- [ ] Repo builds and lints cleanly.
- [ ] Folder structure matches documented architecture.
- [ ] architecture.md explains the multi-tenant SaaS vision clearly.
- [ ] .agent-state.md exists and is populated.

## Git Commit
Recommended commit:

`chore(foundation): initialize multi-tenant SaaS platform scaffold`

## Verification
- Run build, run lint, confirm no errors.
- Open architecture.md and confirm it reflects the expanded (multi-org, CRM + PM + comms) scope, not just Innoventix-internal scope.

## Next Task
`TASK 02`
