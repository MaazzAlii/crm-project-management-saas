# Stripe Test Mode Setup & Configuration Runbook

This guide details how to configure Stripe in test mode for Innoventix Platform subscription billing.

---

## 1. Stripe Dashboard Test Mode Setup

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com/).
2. In the top right corner, toggle **Test mode** ON.
3. Navigate to **Developers > API keys**:
   - Copy the **Publishable key** (`pk_test_...`)
   - Copy the **Secret key** (`sk_test_...`)

---

## 2. Create the Pro Subscription Product & Price

1. In the Stripe Dashboard, navigate to **Product Catalog > Add Product**.
2. Fill in the product details:
   - **Name**: `Innoventix Pro`
   - **Description**: `Full SaaS Workspace with up to 15 seats, unlimited projects, and custom domain.`
3. Pricing model:
   - **Pricing model**: Standard pricing
   - **Price**: `$29.00 USD`
   - **Billing period**: Monthly recurring
4. Save the product.
5. In the product details view, locate the Price ID (format: `price_1...`). Copy this value.

---

## 3. Create Webhook Endpoint for Test Events

1. Navigate to **Developers > Webhooks > Add endpoint**.
2. Endpoint URL:
   - For local development with Stripe CLI: `http://localhost:3000/api/stripe/webhook`
   - For live staging/production: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Create the endpoint and click **Reveal signing secret** (`whsec_...`).

---

## 4. Paste Environment Variables

Open `.env.local` (local development) and your server environment variables in Coolify / production:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

### Safety Rules:
- Never commit secret keys or webhook signing secrets to git.
- Keys starting with `sk_live_` are strictly prohibited outside `NODE_ENV=production`.
