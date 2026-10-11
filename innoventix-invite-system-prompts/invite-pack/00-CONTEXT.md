# Shared context: paste at the start of every session

Project: Innoventix Platform, multi-tenant CRM and project management. Next.js 14 App Router, TypeScript, Tailwind, direct PostgreSQL, custom JWT sessions in the innoventix_session cookie, Stripe for billing, @dnd-kit for boards.

Rules:
1. Every read and write is scoped by organization_id from the session. Never from the URL, query string, or request body. Another organization's IDs return 404.
2. Passwords, tokens, and keys are never written in code, docs, scripts, logs, or commit messages. Invite tokens and verification tokens are stored only as SHA-256 hashes. Raw tokens exist only in the email link.
3. No mock or sample data. Empty states must be real empty states.
4. Permission checks happen on the server. Hidden buttons are not security.
5. Keep changes inside the current prompt. Report out-of-scope bugs; do not fix them.
6. Add a test for every rule. Show it failing first, then passing.
7. Commit locally with a conventional message. Do not push.
8. Report: files changed, tests run with counts, anything not verified, and out-of-scope bugs found.
