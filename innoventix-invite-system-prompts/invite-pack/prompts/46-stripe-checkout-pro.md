# 46: Stripe Checkout for Pro (test mode)

- Billing page button "Upgrade to Pro" creates a Checkout Session in subscription mode for STRIPE_PRO_PRICE_ID.
- The session stores organization_id in metadata. The organization comes from the session, never from the request body.
- Success URL returns to /settings/billing?checkout=success. Cancel URL returns to /settings/billing.
- The page shows "Processing" until the webhook marks the plan active (prompt 47). Do not grant Pro on the success redirect alone.

Test with Stripe test card 4242 4242 4242 4242 (any future date, any CVC). Document the steps in docs/stripe-test-checkout.md.
