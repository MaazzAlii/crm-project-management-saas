# TASK 45 — Secrets Management & API Security

## Objective
Harden how provider tokens (Slack/WhatsApp/Stripe/n8n secrets), API routes, and rate limiting are handled platform-wide.

## Why This Task Exists
Multiple earlier tasks (27-29, 32, 10) store or use sensitive tokens — this task performs the consolidated, audited hardening pass the orchestrator template requires before production.

## Dependencies
- TASK 44

## Current State
Tokens are stored per-integration ad-hoc; no unified encryption-at-rest or rate-limiting strategy audited yet.

## Files To Inspect
- lib/providers/*.ts
- app/api/webhooks/*/route.ts
- app/api/automation/*/route.ts

## Files To Create
- lib/security/encrypt.ts
- middleware/rate-limit.ts

## Files To Modify
- All provider integration files and webhook routes (systematic pass).

## Implementation Instructions
- Encrypt provider tokens at rest (application-level encryption in addition to Supabase's own encryption-at-rest), decrypt only server-side at point of use.
- Add rate limiting to all public-facing webhook and API routes to prevent abuse.
- Confirm every webhook route validates a signature/secret before processing (audit Tasks 27-30, 32-35 against this).
- Confirm no service-role Supabase key is ever used in a user-facing request path.

## UI Requirements
- N/A

## Backend Requirements
- This IS the backend security task.

## Database Requirements
- No schema change unless a token column needs re-encrypting; if so, write a migration.

## API Requirements
- Rate-limit thresholds documented per route.

## Security Requirements
- This task's entire purpose is security — audit exhaustively against the checklist above.

## Testing Requirements
- Attempt to call each webhook route with an invalid/missing signature and confirm rejection.
- Load-test a public route to confirm rate limiting engages.

## Acceptance Criteria
- [ ] Every provider token is encrypted at rest.
- [ ] Every public webhook/API route is signature-verified and rate-limited.
- [ ] No service-role key usage in user-facing code paths (verified by codebase search).

## Git Commit
Recommended commit:

`fix(security): harden secrets management, encryption, and API rate limiting`

## Verification
- Search the entire codebase for `service_role` usage and confirm every occurrence is server-only/admin-context.

## Next Task
`TASK 46`
