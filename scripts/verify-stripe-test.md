# Stripe Test Payment & Upgrade Verification Runbook (Prompt 49)

This runbook guides end-to-end verification of Stripe checkout and seat limit expansion.

---

## 1. Prerequisites Checklist
- [ ] `STRIPE_SECRET_KEY` starts with `sk_test_`
- [ ] `STRIPE_PRO_PRICE_ID` starts with `price_`
- [ ] Stripe CLI webhook forwarder active:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- [ ] Test owner account credentials configured in `.env.local` (`E2E_EMAIL`, `E2E_PASSWORD`).

---

## 2. Verification Steps

1. **Authentication**: Log into Innoventix Hub as a workspace owner on a free plan.
2. **Access Billing**: Navigate to `/settings/billing`.
3. **Verify Initial State**:
   - The Plan Usage Card shows **Free Plan ($0.00/mo)**.
   - Seat limit displays **3 seats max**.
   - An **Upgrade to Pro** button is visible.
4. **Initiate Checkout**:
   - Click **Upgrade to Pro**.
   - Confirm browser navigates to `checkout.stripe.com`.
5. **Simulate Card Payment**:
   - Card: `4242 4242 4242 4242`
   - Exp: `01/30`, CVC: `123`, Name: `Test Owner`
   - Submit checkout.
6. **Return & Webhook Sync**:
   - Browser redirects back to `/settings/billing?checkout=success`.
   - The processing banner displays while Stripe dispatches `checkout.session.completed`.
7. **Verify Pro Entitlements**:
   - Reload or wait for real-time refresh.
   - Plan card reflects **Pro Plan ($29.00/mo)**.
   - Seat capacity reflects **15 seats max**.
   - Open `/settings/team` and click **Invite Member**: capacity displays "x of 15 seats used".
