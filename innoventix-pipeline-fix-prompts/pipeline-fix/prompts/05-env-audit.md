# 05: Environment variable audit for Coolify

Produce a table of every environment variable the app reads.

Steps:
1. Search the codebase for `process.env.` and `NEXT_PUBLIC_`. Include `lib/`, `app/`, `components/`, `scripts/`, and any Dockerfile or next.config file.
2. For each variable, record: name, file that reads it, required or optional, what happens if it is missing, and the default value in code (if any).
3. Flag any variable that has a hardcoded fallback secret. Those must become required in production.
4. Flag any variable that is only used by scripts and should not be set in Coolify.
5. Write `docs/env-coolify.md` with the table. Use placeholders only, never real values.

Output a final Coolify list in this form:
- Required, set in Coolify: ...
- Required, generated per environment: JWT_SECRET, REFRESH_TOKEN_SECRET, DATABASE_URL
- Optional: ...
- Do not set in production: ...

Do not commit `.env.local` or any file containing real values.
