# TASK 15 — Stripe Billing Integration

## Objective
Connect Stripe for real subscription billing — the one piece that necessarily stays external, since self-hosting payment processing is not advisable.

## Why This Task Exists
Turns the self-hosted platform into an actual billable SaaS product.

## Dependencies
- TASK 14

## Current State
No payment provider integrated.

## Files To Inspect
- lib/billing/plan-limits.ts

## Files To Create
- app/api/stripe/webhook/route.ts
- app/(dashboard)/settings/billing/page.tsx
- lib/stripe/client.ts

## Files To Modify
- supabase/migrations/0007_billing_subscriptions.sql (stripe_price_id columns)

## Implementation Instructions
- Create Stripe Products/Prices per tier (monthly/yearly).
- Stripe Checkout for new subscriptions, Customer Portal for self-serve changes.
- Webhook handler syncing organization_subscriptions.status from Stripe events, verified via signature, idempotent.
- Gate access on subscription status (past_due/canceled → restricted read-only, not data loss).

## UI Requirements
- Billing settings page: plan, usage vs limits, upgrade/downgrade CTA.

## Backend Requirements
- Signed webhook route reachable via the api/app subdomain configured in TASK 03.

## Database Requirements
- organization_subscriptions kept in sync with Stripe as source of truth.

## API Requirements
- POST /api/stripe/webhook — signature-verified.

## Security Requirements
- Verify Stripe signatures on every request.
- Restrict billing actions to owner/billing_manager.

## Testing Requirements
- Full Stripe test-mode lifecycle: subscribe→webhook→downgrade→cancel.

## Acceptance Criteria
- [ ] Org can subscribe/change/cancel, DB state matches Stripe at every step.

## Git Commit
Recommended commit:

`feat(billing): integrate Stripe subscriptions and webhook sync`

## Verification
- Run full Stripe test-mode lifecycle and confirm DB matches Stripe dashboard.

## Next Task
`TASK 16`
