/**
 * Innoventix Platform — Stripe Configuration & Validation (Prompt 45 / BILL-2 Phase B)
 * 
 * Rules:
 * - Read only: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID.
 * - In production: All required Stripe env vars must be set, or the app refuses to boot.
 * - In development: Safe fallback to test mode price ID with explicit console warning.
 * - sk_live_ outside production throws error and refuses to start.
 * - sk_test_ in production logs a warning that test mode is active.
 * - Never log keys or leak secrets to the client.
 */

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  proPriceId: string
  isTestMode: boolean
}

export function validateStripeConfig(): StripeConfig {
  const isProd = process.env.NODE_ENV === 'production'
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim()
  const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || '').trim()
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()

  const proPriceId =
    (process.env.STRIPE_PRO_PRICE_ID || '').trim() ||
    (() => {
      if (isProd) {
        throw new Error('STRIPE_PRO_PRICE_ID required in production')
      }
      console.warn('[stripe] using test price — dev only')
      return 'price_1UPcesKO8Y3ohhlUm5KdI8hO'
    })()

  // Safety rule: Never allow sk_live_ outside production
  if (secretKey.startsWith('sk_live_') && !isProd) {
    throw new Error(
      'Security Exception: sk_live_ secret key cannot be used outside of production environment.'
    )
  }

  // Safety rule: Startup validation in production (refuse to boot if required vars are missing)
  if (isProd) {
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required in production. Refusing to start.')
    }
    if (!publishableKey) {
      throw new Error('STRIPE_PUBLISHABLE_KEY is required in production. Refusing to start.')
    }
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required in production. Refusing to start.')
    }
    if (!proPriceId) {
      throw new Error('STRIPE_PRO_PRICE_ID is required in production. Refusing to start.')
    }
  }

  // Safety rule: Warn if test keys are used in live production
  if (secretKey.startsWith('sk_test_') && isProd) {
    console.warn(
      '[STRIPE_CONFIG_WARNING] Stripe test mode key (sk_test_*) is currently active on the live site.'
    )
  }

  return {
    secretKey,
    publishableKey,
    webhookSecret,
    proPriceId,
    isTestMode: secretKey.startsWith('sk_test_'),
  }
}

export function getStripePublishableKey(): string {
  return (process.env.STRIPE_PUBLISHABLE_KEY || '').trim()
}
