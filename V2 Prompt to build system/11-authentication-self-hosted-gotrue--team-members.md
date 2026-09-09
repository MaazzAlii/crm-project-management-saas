# TASK 11 — Authentication (Self-Hosted GoTrue) — Team Members

## Objective
Implement sign-up, login, and session handling against the self-hosted Auth service, resolving current org and role server-side.

## Why This Task Exists
No screen can be built before login and org-context resolution exist.

## Dependencies
- TASK 08

## Current State
Self-hosted GoTrue is live (TASK 02); no app-side auth flow implemented.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- lib/auth/session.ts

## Files To Modify
- middleware.ts

## Implementation Instructions
- Configure email/password + magic link against the self-hosted GoTrue endpoint.
- On signup: create profile, then either create-new-org or accept-invite path.
- Server-side session helper resolving user, active organization, and role.
- Middleware protecting authenticated routes.

## UI Requirements
- Login/signup pages with error and loading states.
- Basic org switcher stub (refined TASK 21).

## Backend Requirements
- Session resolution usable in Server Components and Route Handlers.

## Database Requirements
- No schema change.

## API Requirements
- N/A — Auth SDK, no custom REST here.

## Security Requirements
- Session cookies httpOnly/secure; no service-role key ever reaches the client.

## Testing Requirements
- Test full signup→org→login→logout cycle against the self-hosted instance.

## Acceptance Criteria
- [ ] Working auth against self-hosted GoTrue with correct org-context resolution.

## Git Commit
Recommended commit:

`feat(auth): implement authentication against self-hosted Supabase Auth`

## Verification
- Manually test both signup paths.
- Confirm middleware blocks unauthenticated dashboard access.

## Next Task
`TASK 12`
