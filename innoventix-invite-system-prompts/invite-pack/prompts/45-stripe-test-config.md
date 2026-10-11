# 45: Stripe test configuration

Read these variables only:
- STRIPE_SECRET_KEY (must start with sk_test_ outside production)
- STRIPE_PUBLISHABLE_KEY (pk_test_)
- STRIPE_WEBHOOK_SECRET (whsec_)
- STRIPE_PRO_PRICE_ID (price_...)

Rules:
- Startup check: if the secret key starts with sk_live_ and NODE_ENV is not production, refuse to start. If the key starts with sk_test_ in production, log a warning that test mode is active on the live site.
- Never log keys. Never send the secret key to the browser.
- Add docs/stripe-setup.md with the steps to create the test product and price in the Stripe dashboard, and where to paste the IDs.

Tests: key prefix checks.
