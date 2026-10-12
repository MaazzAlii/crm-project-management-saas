# Stripe Test Checkout Verification Runbook

This document describes how to execute and verify Stripe Pro checkout in test mode.

---

## 1. Prerequisites
- `STRIPE_SECRET_KEY` configured with `sk_test_...`
- `STRIPE_PRO_PRICE_ID` configured with `price_...`
- Webhook endpoint reachable or forwarded via Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```

---

## 2. Test Verification Steps

1. Log in to Innoventix as the workspace owner of a free tier organization.
2. Navigate to **Settings > Billing** (`/settings/billing`).
3. Under the Plan Usage Card, click **Upgrade to Pro**.
4. You will be redirected to the secure Stripe Checkout hosted session.
5. In the payment card form, input:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any valid future month and year (e.g. `12/32`)
   - **CVC**: Any 3 digits (e.g. `123`)
   - **Name on Card**: Test Owner
   - **Country / Postal**: United States / `90210`
6. Click **Subscribe**.
7. You are redirected back to `/settings/billing?checkout=success`.
8. The page displays "Processing" until the Stripe webhook confirms the subscription event.
9. Upon webhook delivery:
   - Organization `plan_tier` updates to `pro`.
   - Seat capacity expands from 3 to 15.
   - Pending invitation limit increases to 10.
