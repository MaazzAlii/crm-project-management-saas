import Stripe from 'stripe'

// Note: Stripe client is instantiated with the secret key if available, or a fallback dummy key during build-time page data collection.
// Strict runtime validation happens inside request handlers (e.g. getProPriceId, validateStripeConfig).
const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim() || 'sk_test_dummy_key_for_build'

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  appInfo: {
    name: 'Innoventix Platform',
    version: '2.0.0',
  },
})

