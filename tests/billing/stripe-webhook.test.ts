import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'
import { query, queryOne } from '@/lib/db'
import Stripe from 'stripe'
import fs from 'fs'

// Ensure .env.local variables are loaded for testing
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=')
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

describe('BILL-2 Phase B: Stripe Webhook Ingestion & Deduplication', () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_test'
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_for_suite_123456789'
  const stripeClient = new Stripe(secretKey)

  let testOrgId: string
  const createdEventIds: string[] = []

  beforeAll(async () => {
    // Find an existing organization to attach webhook events to
    const org = await queryOne<{ id: string }>('SELECT id FROM organizations LIMIT 1')
    if (org?.id) {
      testOrgId = org.id
    } else {
      // Fallback test org id if database is fresh
      testOrgId = '00000000-0000-0000-0000-000000000001'
    }
  })

  afterAll(async () => {
    // Clean up created test idempotency tokens
    if (createdEventIds.length > 0) {
      await query(
        'DELETE FROM stripe_processed_events WHERE id = ANY($1::text[])',
        [createdEventIds]
      )
    }
  })

  function createSignedRequest(payload: any, secret: string, customSig?: string) {
    const bodyStr = JSON.stringify(payload)
    const signature =
      customSig !== undefined
        ? customSig
        : stripeClient.webhooks.generateTestHeaderString({ payload: bodyStr, secret })

    return new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
      body: bodyStr,
    })
  }

  describe('1. Concurrent Duplicate Delivery (Matching AFTER for Phase A Race Condition)', () => {
    it('handles concurrent duplicate webhook events atomically: exactly 1 processed, 1 duplicate, audit log +1', async () => {
      const eventId = `evt_bill2_concurrent_${Date.now()}_${Math.random().toString(36).substring(7)}`
      createdEventIds.push(eventId)

      const payload = {
        id: eventId,
        object: 'event',
        api_version: '2025-01-27.acacia',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_test_${Date.now()}`,
            object: 'checkout.session',
            mode: 'subscription',
            customer: `cus_test_${Date.now()}`,
            subscription: null, // null avoids external network retrieval in retrieve()
            metadata: {
              organization_id: testOrgId,
            },
          },
        },
      }

      // Count existing audit logs for STRIPE_CHECKOUT_COMPLETED
      const beforeQuery = await query<{ count: string }>(
        "SELECT count(*) FROM audit_logs WHERE organization_id = $1 AND action = 'STRIPE_CHECKOUT_COMPLETED'",
        [testOrgId]
      )
      const auditBeforeCount = parseInt(beforeQuery.rows[0]?.count || '0', 10)

      // Build two identical requests using REAL STRIPE_WEBHOOK_SECRET
      const req1 = createSignedRequest(payload, webhookSecret)
      const req2 = createSignedRequest(payload, webhookSecret)

      // Fire both concurrently
      const [res1, res2] = await Promise.all([POST(req1), POST(req2)])
      const [json1, json2] = await Promise.all([res1.json(), res2.json()])

      // Both must return HTTP 200
      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)

      // Exactly one must be primary { received: true }, and one marked duplicate { received: true, duplicate: true }
      const responses = [json1, json2]
      expect(responses).toContainEqual({ received: true })
      expect(responses).toContainEqual({ received: true, duplicate: true })

      // Audit log must increase by EXACTLY 1 (race condition closed!)
      const afterQuery = await query<{ count: string }>(
        "SELECT count(*) FROM audit_logs WHERE organization_id = $1 AND action = 'STRIPE_CHECKOUT_COMPLETED'",
        [testOrgId]
      )
      const auditAfterCount = parseInt(afterQuery.rows[0]?.count || '0', 10)
      expect(auditAfterCount - auditBeforeCount).toBe(1)
    })

    it('subsequent sequential request with identical event ID returns duplicate without audit log increment', async () => {
      const eventId = `evt_bill2_seq_${Date.now()}`
      createdEventIds.push(eventId)

      const payload = {
        id: eventId,
        object: 'event',
        api_version: '2025-01-27.acacia',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_test_${Date.now()}`,
            object: 'checkout.session',
            mode: 'subscription',
            customer: `cus_test_${Date.now()}`,
            subscription: null,
            metadata: { organization_id: testOrgId },
          },
        },
      }

      // First call
      const req1 = createSignedRequest(payload, webhookSecret)
      const res1 = await POST(req1)
      const json1 = await res1.json()
      expect(res1.status).toBe(200)
      expect(json1).toEqual({ received: true })

      const midQuery = await query<{ count: string }>(
        "SELECT count(*) FROM audit_logs WHERE organization_id = $1 AND action = 'STRIPE_CHECKOUT_COMPLETED'",
        [testOrgId]
      )
      const auditMidCount = parseInt(midQuery.rows[0]?.count || '0', 10)

      // Second call (sequential duplicate)
      const req2 = createSignedRequest(payload, webhookSecret)
      const res2 = await POST(req2)
      const json2 = await res2.json()
      expect(res2.status).toBe(200)
      expect(json2).toEqual({ received: true, duplicate: true })

      // Audit log count stays constant
      const finalQuery = await query<{ count: string }>(
        "SELECT count(*) FROM audit_logs WHERE organization_id = $1 AND action = 'STRIPE_CHECKOUT_COMPLETED'",
        [testOrgId]
      )
      const auditFinalCount = parseInt(finalQuery.rows[0]?.count || '0', 10)
      expect(auditFinalCount).toBe(auditMidCount)
    })
  })

  describe('2. Cryptographic Signature Verification & Production Hardening', () => {
    it('rejects request with missing Stripe-Signature header with 400', async () => {
      const bodyStr = JSON.stringify({ id: 'evt_no_sig', type: 'test' })
      const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: bodyStr,
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('Missing Stripe-Signature header')
    })

    it('rejects request with invalid / forged signature header with 400', async () => {
      const payload = { id: 'evt_forged_sig', type: 'test' }
      const req = createSignedRequest(payload, webhookSecret, 't=123456789,v1=invalid_signature_hash')

      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('Webhook Error')
    })

    it('fails loudly with 500 when NODE_ENV is production and STRIPE_WEBHOOK_SECRET is unconfigured', async () => {
      const originalEnv = process.env.NODE_ENV
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET

      try {
        ;(process.env as any).NODE_ENV = 'production'
        delete process.env.STRIPE_WEBHOOK_SECRET

        const bodyStr = JSON.stringify({ id: 'evt_prod_missing_secret', type: 'test' })
        const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: bodyStr,
        })

        const res = await POST(req)
        expect(res.status).toBe(500)
        const json = await res.json()
        expect(json.error).toBe('Webhook secret unconfigured')
      } finally {
        ;(process.env as any).NODE_ENV = originalEnv
        if (originalSecret) {
          process.env.STRIPE_WEBHOOK_SECRET = originalSecret
        }
      }
    })
  })

  describe('3. Handler Failure Recovery (Option b: Delete Row on Error)', () => {
    it('deletes the idempotency record if the handler throws, allowing Stripe retries to succeed', async () => {
      const eventId = `evt_bill2_fail_recovery_${Date.now()}`
      createdEventIds.push(eventId)

      // Malformed subscription payload to force handler error (e.g. invalid date or DB conflict)
      const payload = {
        id: eventId,
        object: 'event',
        api_version: '2025-01-27.acacia',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_invalid',
            customer: 'cus_test_invalid',
            current_period_end: 'not-a-number-forces-invalid-date',
            status: 'active',
            metadata: {
              organization_id: 'non-existent-uuid-forces-query-error',
            },
          },
        },
      }

      const req = createSignedRequest(payload, webhookSecret)
      const res = await POST(req)

      // Handler fails with 500
      expect(res.status).toBe(500)

      // Verify that the row in stripe_processed_events was DELETED by Option (b) cleanup
      const row = await queryOne<{ id: string }>(
        'SELECT id FROM stripe_processed_events WHERE id = $1',
        [eventId]
      )
      expect(row).toBeNull()
    })
  })

  describe('4. Invoice Event Ingestion', () => {
    it('processes invoice.paid and writes audit log', async () => {
      const eventId = `evt_invoice_paid_${Date.now()}`
      createdEventIds.push(eventId)

      // Associate org with a test customer ID in organization_plans
      const testCustomerId = `cus_inv_${Date.now()}`
      await query(
        `UPDATE organization_plans 
         SET stripe_customer_id = $1 
         WHERE organization_id = $2`,
        [testCustomerId, testOrgId]
      )

      const payload = {
        id: eventId,
        object: 'event',
        api_version: '2025-01-27.acacia',
        type: 'invoice.paid',
        data: {
          object: {
            id: `in_test_${Date.now()}`,
            customer: testCustomerId,
            subscription: null,
            amount_paid: 3500,
            currency: 'usd',
          },
        },
      }

      const req = createSignedRequest(payload, webhookSecret)
      const res = await POST(req)
      expect(res.status).toBe(200)

      // Verify audit log row
      const audit = await queryOne<{ id: string }>(
        "SELECT id FROM audit_logs WHERE organization_id = $1 AND action = 'STRIPE_INVOICE_PAID' ORDER BY created_at DESC LIMIT 1",
        [testOrgId]
      )
      expect(audit).not.toBeNull()
    })
  })
})
