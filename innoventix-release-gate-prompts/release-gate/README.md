# Release Readiness Pack

Purpose: check the whole app before the owner demo, and find what breaks, before users do.

Run in order. Each prompt produces a report. The final prompt (10) gives go or no-go.
Do not skip steps. Do not push during this pack.

| # | Prompt | Output |
|---|---|---|
| 00 | CONTEXT (paste every session) | rules |
| 01 | freeze-and-push-audit | every commit on origin and deploy, and who approved it |
| 02 | capture-production-error | the real stack trace behind digest 2093197446 |
| 03 | framework-version-check | the Next.js version and the correct cookies()/headers() usage |
| 04 | route-inventory | every page and API route, with its auth and data scoping |
| 05 | server-action-audit | every 'use server' function and how it handles errors |
| 06 | env-and-startup-audit | variables required in production, fail-fast startup |
| 07 | migrations-and-schema | migrations run twice, schema matches the code |
| 08 | browser-smoke-matrix | every sidebar page for each role, zero error screens |
| 09 | security-recheck | redirects, cookies, cron, super admin, secrets |
| 10 | release-gate | go / no-go with the list of blockers |
