# TASK 06 — Authentication (Supabase Auth) — Team Members

## Objective
Implement sign-up, login, session handling, and organization-aware auth for internal team members of any organization.

## Why This Task Exists
No screen in the platform can be built safely before login and session context (which organization am I acting as) exist.

## Dependencies
- TASK 03

## Current State
No auth flow implemented.

## Files To Inspect
- supabase/migrations/0001_organizations.sql
- supabase/migrations/0002_memberships_roles.sql

## Files To Create
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- lib/supabase/client.ts
- lib/supabase/server.ts
- lib/auth/session.ts

## Files To Modify
- middleware.ts

## Implementation Instructions
- Configure Supabase Auth (email/password + magic link).
- On signup, create a profile row and either create a new organization (self-serve signup) or accept an invite into an existing one.
- Implement a server-side session helper that resolves: current user, current organization (from active membership), current role.
- Add Next.js middleware protecting all authenticated routes and redirecting unauthenticated users to /login.
- If a user belongs to multiple organizations, add an organization switcher (basic version here, refined in Task 11).

## UI Requirements
- Login page: email/password + magic link option, error states, loading state.
- Signup page: create-organization flow vs join-via-invite flow.
- Basic organization switcher dropdown in header (placeholder until Task 11).

## Backend Requirements
- Session resolution utility usable in both Server Components and Route Handlers.
- Auth callback route for magic link / OAuth.

## Database Requirements
- No new tables — uses auth.users, profiles, organization_members.

## API Requirements
- N/A — Auth handled by Supabase SDK, not custom REST endpoints.

## Security Requirements
- Enforce strong password policy via Supabase Auth settings.
- Ensure session cookies are httpOnly/secure.
- Never expose service-role key to the client.

## Testing Requirements
- Test signup → org creation → login → logout cycle.
- Test invite-based signup joins the correct organization only.

## Acceptance Criteria
- [ ] A user can sign up, land in a new organization as owner, log out, and log back in.
- [ ] An invited user joins only the organization they were invited to.

## Git Commit
Recommended commit:

`feat(auth): implement Supabase Auth with organization-aware sessions`

## Verification
- Manually test both signup paths in a browser.
- Confirm middleware blocks unauthenticated access to /dashboard.

## Next Task
`TASK 07`
