# 47: Stripe webhook: keep the plan in sync

Endpoint: POST /api/stripe/webhook (verifies the signature with STRIPE_WEBHOOK_SECRET; reject if invalid).

Handle:
- checkout.session.completed: set organization_plans to pro, save customer and subscription IDs.
- customer.subscription.updated: update status and current_period_end; past_due and canceled map as in prompt 11.
- customer.subscription.deleted: set canceled, plan falls back to free. Do not delete members. If the org is over the free seat limit, existing members stay, but new invites are refused until seats are free. Show this in the usage card.

Make handlers idempotent: store processed Stripe event IDs in a table and skip repeats.

Tests: the same event twice changes nothing the second time; a bad signature is rejected.
