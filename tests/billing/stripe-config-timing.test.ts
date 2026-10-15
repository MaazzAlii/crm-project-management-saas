import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { execSync } from 'child_process'
import { getProPriceId, getWebhookSecret } from '@/lib/stripe/config'

describe('BILL-2C: Stripe Config Request-Time Validation', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('1. Import test: importing config and client in a fresh production process without STRIPE_PRO_PRICE_ID does not throw', () => {
    const script = `
      process.env.NODE_ENV = 'production';
      delete process.env.STRIPE_PRO_PRICE_ID;
      delete process.env.STRIPE_SECRET_KEY;
      Promise.all([
        import('./lib/stripe/config.ts'),
        import('./lib/stripe/client.ts'),
        import('./app/api/stripe/checkout/route.ts'),
        import('./app/api/stripe/webhook/route.ts'),
      ]).then(() => {
        process.stdout.write('MODULE_LOAD_CLEAN');
      }).catch((err) => {
        process.stderr.write(err.message || String(err));
        process.exit(1);
      });
    `
    const output = execSync(`npx tsx -e "${script.replace(/\n/g, ' ')}"`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
    expect(output).toContain('MODULE_LOAD_CLEAN')
  })

  it('2. Getter test: calling getProPriceId() with NODE_ENV=production and no env var DOES throw with clear message', () => {
    ;(process.env as any).NODE_ENV = 'production'
    delete process.env.STRIPE_PRO_PRICE_ID

    expect(() => getProPriceId()).toThrowError(
      /STRIPE_PRO_PRICE_ID is required in production/
    )
  })

  it('3. Dev fallback: calling getProPriceId() with NODE_ENV=development and no env var returns test price with warning', () => {
    ;(process.env as any).NODE_ENV = 'development'
    delete process.env.STRIPE_PRO_PRICE_ID

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const priceId = getProPriceId()

    expect(priceId).toBe('price_1UPcesKO8Y3ohhlUm5KdI8hO')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('using test price (dev only)')
    )
  })

  it('4. Prod valid: calling getProPriceId() with NODE_ENV=production and env var set returns value', () => {
    ;(process.env as any).NODE_ENV = 'production'
    process.env.STRIPE_PRO_PRICE_ID = 'price_custom_live_pro_plan_123'

    const priceId = getProPriceId()
    expect(priceId).toBe('price_custom_live_pro_plan_123')
  })

  it('5. Webhook secret getter returns undefined if unset, or trimmed secret when provided', () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    expect(getWebhookSecret()).toBeUndefined()

    process.env.STRIPE_WEBHOOK_SECRET = '  whsec_test_secret_12345  '
    expect(getWebhookSecret()).toBe('whsec_test_secret_12345')
  })
})
