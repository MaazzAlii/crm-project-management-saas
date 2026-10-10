# Shared context: paste at the start of every session

Project: Innoventix Platform, multi-tenant CRM and project management.
Stack: Next.js 14 App Router, TypeScript, Tailwind, direct PostgreSQL, custom JWT in the `innoventix_session` cookie, @dnd-kit for boards.
Live: https://project-manager.calara.agency (Coolify, built from the `deploy` remote).

Non-negotiable rules:
1. Tenant isolation: every read and write uses organization_id from the session, never from the request body or URL. A user must never see or change another organization's data. Return 404 for another organization's IDs.
2. Mock and sample data: remove hardcoded or sample values from any screen. Every number and label must come from the database. If there is no data, show an empty state.
3. Secrets: never write passwords, tokens, emails of real people, or database URLs into code, docs, scripts, or commit messages. Read from environment variables.
4. Local is not proof. A feature is done only when its Playwright test passes and the live checklist passes after deploy.
5. Scope: change only what the current prompt covers. If you find a bug outside scope, list it in your report; do not fix it.
6. Commit locally with `fix(<screen>): ...`. Do not push. Pushing is done by prompt 09 with my approval.
7. Report: files changed, tests run with counts, anything you could not verify, and any out-of-scope bugs found.
