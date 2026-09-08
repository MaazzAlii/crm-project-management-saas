# TASK 10 — Stripe Billing Integration

## Objective
Connect real subscription billing so external organizations can pay for the platform.

## Why This Task Exists
This is the task that turns the product from an internal tool into an actual SaaS business — organizations must be able to subscribe, upgrade, downgrade, and cancel.

## Dependencies
- TASK 09

## Current State
No payment provider integrated yet.

## Files To Inspect
- lib/billing/plan-limits.ts
- documentation/pricing-plans.md

## Files To Create
- app/api/stripe/webhook/route.ts
- app/(dashboard)/settings/billing/page.tsx
- lib/stripe/client.ts

## Files To Modify
- supabase/migrations/0006_billing_subscriptions.sql (add stripe_price_id columns)

## Implementation Instructions
- Create Stripe Products/Prices matching the 3 plan tiers (monthly + yearly).
- Implement Stripe Checkout for new subscriptions and Stripe Customer Portal for self-serve plan changes/cancellation.
- Implement a webhook handler for checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed — syncing organization_subscriptions.status.
- Gate feature access based on subscription status (past_due/canceled orgs get a restricted read-only view, not instant data loss).

## UI Requirements
- Billing settings page: current plan, usage vs limits, upgrade/downgrade CTA, invoice history link.

## Backend Requirements
- Webhook route with signature verification.
- Idempotent webhook handling (Stripe may retry).

## Database Requirements
- organization_subscriptions kept in sync with Stripe as source of truth for billing state.

## API Requirements
- POST /api/stripe/webhook — Stripe signature verified, 200 on success, 400 on invalid signature.
- Server action to create Checkout session, scoped to current org and authenticated owner/billing_manager only.

## Security Requirements
- Verify Stripe webhook signatures on every request.
- Never trust client-supplied subscription status — only webhook-driven updates.
- Restrict billing page/actions to owner/billing_manager role.

## Testing Requirements
- Test full flow in Stripe test mode: subscribe → webhook updates DB → downgrade → cancel → webhook updates DB.

## Acceptance Criteria
- [ ] An organization can subscribe, see correct plan/usage, and cancel — all reflected accurately in the database.
- [ ] Failed payments correctly restrict access without deleting data.

## Git Commit
Recommended commit:

`feat(billing): integrate Stripe subscriptions and webhook sync`

## Verification
- Run full Stripe test-mode subscription lifecycle and confirm DB state matches Stripe dashboard at every step.

## Next Task
`TASK 11`
