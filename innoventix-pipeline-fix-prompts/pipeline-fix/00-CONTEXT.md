# Shared context: paste at the start of every session

Project: Innoventix Platform, a multi-tenant CRM on Next.js 14 (App Router), TypeScript, Tailwind, direct PostgreSQL (no Supabase), custom JWT auth in the `innoventix_session` cookie, drag-and-drop with @dnd-kit.

Rules:
1. Inspect existing code before changing it. Follow its patterns.
2. Keep changes within the current prompt's scope.
3. Never write passwords, emails, tokens, or secrets into source, scripts, docs, or commit messages. Read them from environment variables only.
4. Every query stays scoped by organization_id. Never trust org_id from the request body.
5. Parameterized SQL only.
6. After changes, run `npm run build` and `npm test`. Fix failures before reporting.
7. Commit locally with `fix(pipeline): ...` or `test(pipeline): ...`.
8. Do not push to any remote unless the prompt says so.
9. Report: files changed, what you verified, what you could not verify. Be honest about anything not tested in a real browser.
