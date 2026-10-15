# Stripe Production Go-Live Checklist & Runbook

This document outlines the strict operational protocol for transitioning the Innoventix platform billing system from Stripe Test Mode (`sk_test_*` / `pk_test_*`) to Stripe Live Production (`sk_live_*` / `pk_live_*`).

---

## 🎯 Pre-Flight Checklist

Before modifying any environment variables or switching dashboard modes:

- [ ] **Stripe Business Verification Complete**: Ensure Stripe account identity, business details, bank account, and payout verification are approved.
- [ ] **Customer Portal Configured**: In the Stripe Dashboard under *Settings > Billing > Customer Portal*:
  - Allow customers to update payment methods.
  - Allow customers to cancel subscriptions (set to: *At the end of the current billing period*).
  - Add terms of service and privacy policy links.
  - Set default return URL: `https://app.innoventixhub.tech/settings/billing`.
- [ ] **Database Migration 0048 Applied**: Ensure migration `0048_stripe_processed_events_payload.sql` is executed on the production PostgreSQL cluster:
  ```sql
  ALTER TABLE public.stripe_processed_events 
  ADD COLUMN IF NOT EXISTS payload JSONB;
  ```
- [ ] **SSL / TLS Active**: Production domain (`https://app.innoventixhub.tech`) has valid HTTPS certificate. Webhooks will be rejected by Stripe if HTTPS is invalid.

---

## 🔑 Production Environment Variables Setup

Configure the following environment variables in your production environment manager (e.g. Coolify on Contabo VPS):

| Environment Variable | Description | Example / Format |
|---|---|---|
| `STRIPE_SECRET_KEY` | Live secret API key | `sk_live_51...` |
| `STRIPE_PUBLISHABLE_KEY` | Live publishable API key | `pk_live_51...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live client-side publishable key | `pk_live_51...` |
| `STRIPE_WEBHOOK_SECRET` | Live webhook endpoint signing secret | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | Live recurring Pro subscription price ID | `price_...` |
| `APP_PUBLIC_URL` | Canonical app URL | `https://app.innoventixhub.tech` |
| `NODE_ENV` | Must be strictly `production` | `production` |

> [!CAUTION]
> The platform validates Stripe configuration at boot. If `NODE_ENV=production` and any of the above variables are missing, the application will refuse to start to prevent unauthenticated or broken checkouts.

---

## 📡 Webhook Setup & Signing Secret Verification

1. In the Stripe Dashboard, switch from **Test mode** to **Live mode** using the toggle.
2. Navigate to **Developers > Webhooks > Add endpoint**.
3. **Endpoint URL**: `https://app.innoventixhub.tech/api/stripe/webhook`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**.
6. Reveal the **Signing secret** (`whsec_...`).
7. Immediately set `STRIPE_WEBHOOK_SECRET` in Coolify / production `.env`.

---

## 🔄 Webhook Secret Rotation Procedure

If the webhook signing secret is ever exposed or compromised, follow this zero-downtime rotation procedure:

1. Navigate to **Developers > Webhooks** in the Stripe Dashboard and click on the endpoint.
2. Click **Rotate secret** (under *Signing secret*).
3. Stripe will display a new signing secret while keeping the old secret valid for a grace period (e.g., 24 hours).
4. Update `STRIPE_WEBHOOK_SECRET` in your production environment manager.
5. Trigger a zero-downtime rolling restart / deployment.
6. Verify incoming live webhooks succeed (HTTP 200).
7. Return to the Stripe Dashboard and click **Expire old secret now**.

---

## 🧪 Live Verification: $0 / Minimum Authorization Test

Before announcing live payments to real customers, verify the end-to-end live flow:

1. **Option A: 100% Off Coupon Test ($0 Charge)**
   - In Stripe Dashboard (Live Mode), create a 100% off coupon: *Coupons > Create coupon* (`name: "PROD_VERIFICATION_TEST"`, 100% off once, max 1 redemption).
   - Use a live testing card to complete checkout using the coupon.
   - Confirm Stripe creates a $0 transaction.
   - Confirm the webhook receives `checkout.session.completed` with HTTP 200.
   - Verify the organization plan updates to Pro in `organization_plans`.
2. **Option B: Small Charge ($1.00 Refundable)**
   - Temporarily create a $1 test price or use the live Pro price with a real credit card.
   - Immediately verify subscription activation and invoice creation in the dashboard.
   - Cancel the subscription and issue a full refund via the Stripe Dashboard (*Payments > Refund*).

---

## 🚨 Rollback & Emergency Contingency Plan

If an issue occurs immediately after flipping to live keys (e.g., rate limits, invalid plan tier sync, unexpected webhook errors):

### Step 1: Immediate Checkout Freeze
- In Stripe Dashboard, archive or deactivate the live price ID (`STRIPE_PRO_PRICE_ID`). This immediately prevents any new customers from purchasing.
- Alternatively, temporarily set a maintenance notice on `/settings/billing`.

### Step 2: Cancel Active Live Subscriptions (If Erroneously Billed)
If subscriptions were created with incorrect terms or prices during a failed rollout:
```bash
# Using Stripe CLI with Live Key:
stripe subscriptions list --status active --limit 100 --api-key sk_live_... | \
  jq -r '.data[].id' | \
  xargs -I {} stripe subscriptions cancel {} --prorate=false --api-key sk_live_...
```
Or cancel individually via the Stripe Dashboard under *Billing > Subscriptions > Cancel subscription > Immediately*.

### Step 3: Database Plan Tier Reversion
Revert affected organization records back to `free`:
```sql
UPDATE public.organization_plans
SET plan_id = 'free',
    status = 'canceled',
    updated_at = NOW()
WHERE stripe_customer_id IN ('<customer_id_1>', '<customer_id_2>');

UPDATE public.organizations
SET plan_tier = 'free',
    billing_status = 'canceled',
    updated_at = NOW()
WHERE stripe_customer_id IN ('<customer_id_1>', '<customer_id_2>');
```

### Step 4: Revert Environment Variables
- Revert `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_PRO_PRICE_ID` back to test mode keys (`sk_test_*`, `pk_test_*`).
- Re-deploy the application.

---

## 📞 Stripe Support Contacts & Escalation

- **Stripe Support Portal**: [https://support.stripe.com/](https://support.stripe.com/)
- **Stripe Dashboard Status**: [https://status.stripe.com/](https://status.stripe.com/)
- **Stripe Developer Discord**: [https://discord.gg/stripe](https://discord.gg/stripe)
- **Urgent Account / Billing Support**: Submit an urgent inquiry via the Stripe Dashboard (*Help > Contact Support > Chat or Phone callback*). Priority phone support is available for 24/7 critical billing outages.
