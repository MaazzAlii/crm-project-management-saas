/**
 * Innoventix Platform — Stripe Configuration & Validation (Prompt 45 / BILL-2 Phase B & BILL-2C)
 * 
 * Rules:
 * - Read only: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID.
 * - Validation is deferred to request-time to avoid breaking Next.js build-time page collection.
 * - In production: All required Stripe env vars must be set when requested at runtime.
 * - In development: Safe fallback to test mode price ID with explicit console warning.
 * - sk_live_ outside production throws error.
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

function resolveProPriceId(): string {
  const id = process.env.STRIPE_PRO_PRICE_ID?.trim()
  if (id) return id
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[stripe] STRIPE_PRO_PRICE_ID is required in production. ' +
      'Set it in your deployment environment variables.'
    )
  }
  console.warn('[stripe] STRIPE_PRO_PRICE_ID not set — using test price (dev only)')
  return 'price_1UPcesKO8Y3ohhlUm5KdI8hO'
}

/**
 * Request-time resolver for the Stripe Pro price ID.
 * Throws in production if unconfigured; falls back to test price in development.
 */
export function getProPriceId(): string {
  return resolveProPriceId()
}

/**
 * Validate full Stripe configuration at runtime.
 * Should be invoked from request handlers or runtime operations, never at top-level module load.
 */
export function validateStripeConfig(): StripeConfig {
  const isProd = process.env.NODE_ENV === 'production'
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim()
  const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim()
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
  const proPriceId = getProPriceId()

  // Safety rule: Never allow sk_live_ outside production
  if (secretKey.startsWith('sk_live_') && !isProd) {
    throw new Error(
      'Security Exception: sk_live_ secret key cannot be used outside of production environment.'
    )
  }

  // Safety rule: Validation in production (refuse to proceed if required vars are missing)
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
  return (process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim()
}

export function getWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined
}
