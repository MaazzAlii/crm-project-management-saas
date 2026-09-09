# TASK 62 — Secrets Management & API Security

## Objective
Harden how provider tokens (Slack/WhatsApp/Stripe/n8n/AI-provider secrets), API routes, and rate limiting are handled platform-wide, on self-hosted infra.

## Why This Task Exists
Multiple earlier tasks store or use sensitive tokens on your own VPS now — this consolidated audit is even more important without a managed cloud's built-in protections.

## Dependencies
- TASK 61

## Current State
Tokens stored per-integration ad-hoc; no unified encryption-at-rest or rate-limiting strategy audited.

## Files To Inspect
- lib/providers/*.ts
- app/api/webhooks/*/route.ts
- app/api/automation/*/route.ts
- lib/ai/client.ts

## Files To Create
- lib/security/encrypt.ts
- middleware/rate-limit.ts

## Files To Modify
- All provider integration files and webhook routes (systematic pass).

## Implementation Instructions
- Encrypt provider tokens at rest (application-level, on top of Postgres) — decrypt only server-side at point of use.
- Rate-limit all public-facing webhook/API routes.
- Confirm every webhook route validates a signature/secret (audit TASKS 37-40, 49-52).
- Confirm no service-role key is ever used in a user-facing request path.
- Confirm the self-hosted Studio (TASK 02) and Postgres port remain non-public (re-verify TASK 03's proxy config).

## UI Requirements
- N/A

## Backend Requirements
- This IS the backend security task.

## Database Requirements
- No schema change unless a token column needs re-encrypting.

## API Requirements
- Rate-limit thresholds documented per route.

## Security Requirements
- This task's whole purpose is security — audit exhaustively against the checklist above.

## Testing Requirements
- Attempt each webhook route with an invalid/missing signature; load-test a public route to confirm rate limiting.

## Acceptance Criteria
- [ ] Every provider token encrypted at rest.
- [ ] Every public route signature-verified and rate-limited.
- [ ] No service-role key in user-facing code.
- [ ] Studio/Postgres confirmed non-public.

## Git Commit
Recommended commit:

`fix(security): harden secrets management, encryption, and API rate limiting`

## Verification
- Search the codebase for service_role usage and confirm every occurrence is server-only.
- Re-run TASK 03's SSL/exposure checks against Studio and the raw Postgres port.

## Next Task
`TASK 63`
