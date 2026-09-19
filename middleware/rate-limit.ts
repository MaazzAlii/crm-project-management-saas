import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_TIERS,
  RateLimitOptions,
  createRateLimitExceededResponse,
  applyRateLimitHeaders,
} from '@/lib/security/rate-limit'

/**
 * Resolves the appropriate rate limiting options based on request pathname.
 */
export function resolveRateLimitTier(pathname: string): { tier: RateLimitOptions; prefix: string } {
  if (pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/stripe/webhook')) {
    return { tier: RATE_LIMIT_TIERS.WEBHOOKS, prefix: 'rl:webhook' }
  }
  if (pathname.startsWith('/api/automation')) {
    return { tier: RATE_LIMIT_TIERS.AUTOMATION, prefix: 'rl:automation' }
  }
  if (
    pathname.startsWith('/client/auth') ||
    pathname.startsWith('/client/login') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  ) {
    return { tier: RATE_LIMIT_TIERS.AUTH, prefix: 'rl:auth' }
  }
  if (pathname.startsWith('/api/super-admin')) {
    return { tier: RATE_LIMIT_TIERS.ADMIN, prefix: 'rl:admin' }
  }
  if (pathname.startsWith('/api/')) {
    return { tier: RATE_LIMIT_TIERS.DEFAULT_API, prefix: 'rl:api' }
  }

  return { tier: RATE_LIMIT_TIERS.DEFAULT_API, prefix: 'rl:default' }
}

/**
 * Middleware helper that checks and enforces rate limits on incoming requests.
 * Returns null if allowed, or a 429 Too Many Requests response if rate limit is exceeded.
 */
export function handleRateLimiting(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname

  // Apply rate limiting to all /api routes, auth routes, and client portal routes
  const isTargetRoute =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/client/auth') ||
    pathname.startsWith('/client/login') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  if (!isTargetRoute) {
    return null
  }

  const clientIp = getClientIp(request)
  const { tier, prefix } = resolveRateLimitTier(pathname)
  const rateLimitKey = `${prefix}:${clientIp}`

  const result = checkRateLimit(rateLimitKey, tier)

  if (!result.allowed) {
    console.warn(`[Security:RateLimit] Rate limit exceeded for IP ${clientIp} on path ${pathname}`)
    return createRateLimitExceededResponse(result)
  }

  return null
}
