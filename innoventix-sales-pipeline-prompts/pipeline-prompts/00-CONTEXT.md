# Shared Context: paste this at the start of every Antigravity session

## Project
Innoventix Platform: a multi-tenant CRM, project management, and communication hub.
- Stack: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- Database: direct PostgreSQL (no Supabase). Repository layer and services exist; do not add Supabase code.
- Auth: custom JWT sessions in an `innoventix_session` cookie. Use the existing session helpers. Do not write new auth logic.
- Multi-tenancy: every query must be scoped by the organization of the logged-in user. Never return data across organizations.
- Migrations run through the existing auto-migrate system (`lib/db/auto-migrate.ts`). Follow the existing pattern.

## Rules for every change
1. Inspect the existing code first (routes, repositories, services, components, styles) and follow its patterns and naming.
2. Keep changes scoped to the current prompt. Do not refactor unrelated code.
3. Never hardcode secrets, passwords, emails, or test credentials in source, scripts, docs, or logs.
4. Validate all input on the server (zod or the existing validator). Never trust client-supplied org_id, user_id, or role.
5. Use parameterized SQL only.
6. Respect the design system already in the app: colors, spacing, dark theme, and typography.
7. After implementing, run `npm run build` and fix any errors. Run `npm test` if tests exist.
8. At the end, reply with: files changed, what was verified, and anything left open. Keep it short.
9. Commit with a message in the form `feat(pipeline): <what>` or `fix(pipeline): <what>`.
10. Do not push to any remote unless the prompt says so.

## Drag and drop
Use `@dnd-kit/core` and `@dnd-kit/sortable` (and `@dnd-kit/utilities`). Do not use native HTML5 drag-and-drop for the board.
