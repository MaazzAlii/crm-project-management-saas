import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { handleRateLimiting } from '@/middleware/rate-limit'
import {
  checkLoginRateLimit,
  resetRateLimitStore,
  resetLoginRateLimit,
  RATE_LIMIT_TIERS,
} from '@/lib/security/rate-limit'

describe('ISSUE-S1.4: Sign-in Rate Limiting Scoped to API Only', () => {
  beforeEach(() => {
    resetRateLimitStore()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    resetRateLimitStore()
  })

  describe('1. HTML Page Navigation (GET /login and /sign-in) is Never Rate Limited', () => {
    it('allows repeated consecutive GET requests to /login without 429 rate limit lockout', async () => {
      const clientIp = '203.0.113.10'

      for (let i = 0; i < 75; i++) {
        const req = new NextRequest('http://localhost:3000/login', {
          method: 'GET',
          headers: { 'x-forwarded-for': clientIp },
        })

        const res = await middleware(req)
        expect(res.status).not.toBe(429)
        // Should return 200 or rewrite/passthrough
        expect(res.headers.get('Retry-After')).toBeNull()
      }
    })

    it('allows repeated consecutive GET requests to /sign-in without 429, rewriting to /login', async () => {
      const clientIp = '203.0.113.11'

      for (let i = 0; i < 75; i++) {
        const req = new NextRequest('http://localhost:3000/sign-in', {
          method: 'GET',
          headers: { 'x-forwarded-for': clientIp },
        })

        const res = await middleware(req)
        expect(res.status).not.toBe(429)
        expect(res.headers.get('x-middleware-rewrite')).toContain('/login')
      }
    })

    it('handleRateLimiting explicitly returns null for non-API routes', () => {
      const htmlRoutes = ['/login', '/sign-in', '/signup', '/client/login', '/forgot-password']

      for (const route of htmlRoutes) {
        const req = new NextRequest(`http://localhost:3000${route}`, {
          method: 'GET',
          headers: { 'x-forwarded-for': '198.51.100.99' },
        })

        const result = handleRateLimiting(req)
        expect(result).toBeNull()
      }
    })
  })

  describe('2. Brute Force Protection Remains Strictly Enforced on API Authentication', () => {
    it('enforces 10 attempts per 15 minutes limit on /api/auth/login for the same email', () => {
      const testEmail = 'target-user@example.com'
      const testIp = '198.51.100.1'

      // First 10 attempts allowed
      for (let i = 0; i < RATE_LIMIT_TIERS.LOGIN_BY_EMAIL.maxRequests; i++) {
        const result = checkLoginRateLimit(testEmail, testIp)
        expect(result.allowed).toBe(true)
      }

      // 11th attempt blocked with 429
      const blockedResult = checkLoginRateLimit(testEmail, testIp)
      expect(blockedResult.allowed).toBe(false)
      expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('enforces 50 attempts per 15 minutes limit on /api/auth/login for the same IP across different emails', () => {
      const testIp = '198.51.100.2'

      // 50 attempts allowed across 50 distinct emails
      for (let i = 0; i < RATE_LIMIT_TIERS.LOGIN_BY_IP.maxRequests; i++) {
        const result = checkLoginRateLimit(`user_${i}@example.com`, testIp)
        expect(result.allowed).toBe(true)
      }

      // 51st attempt from same IP blocked with 429
      const blockedResult = checkLoginRateLimit('another_user@example.com', testIp)
      expect(blockedResult.allowed).toBe(false)
      expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('resets the failed attempt counter for an email upon successful login', () => {
      const testEmail = 'user-reset@example.com'
      const testIp = '198.51.100.3'

      // Exhaust 9 attempts
      for (let i = 0; i < 9; i++) {
        checkLoginRateLimit(testEmail, testIp)
      }

      // Simulate successful login reset
      resetLoginRateLimit(testEmail)

      // Can make fresh attempts without immediate 429
      const freshResult = checkLoginRateLimit(testEmail, testIp)
      expect(freshResult.allowed).toBe(true)
      expect(freshResult.remaining).toBe(RATE_LIMIT_TIERS.LOGIN_BY_IP.maxRequests - 10)
    })
  })

  describe('3. Tenant Isolation & API Boundary', () => {
    it('isolates rate-limit keys per IP and email without leaking across users', () => {
      const ipA = '192.0.2.1'
      const ipB = '192.0.2.2'
      const emailA = 'org_a_user@example.com'
      const emailB = 'org_b_user@example.com'

      // Exhaust limit for User A on IP A
      for (let i = 0; i < 10; i++) {
        checkLoginRateLimit(emailA, ipA)
      }
      expect(checkLoginRateLimit(emailA, ipA).allowed).toBe(false)

      // User B on IP B is unaffected
      const resultB = checkLoginRateLimit(emailB, ipB)
      expect(resultB.allowed).toBe(true)
      expect(resultB.remaining).toBe(RATE_LIMIT_TIERS.LOGIN_BY_IP.maxRequests - 1)
    })
  })
})
