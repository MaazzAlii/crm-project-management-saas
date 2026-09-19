import { NextRequest, NextResponse } from 'next/server'

/**
 * In-Memory Sliding Window Rate Limiter
 * Guards public-facing webhooks, magic-link generators, and high-cost API endpoints.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up stale keys periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    })
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfterSeconds?: number
}

/**
 * Standard Rate Limiting Tier Thresholds (requests per window)
 */
export const RATE_LIMIT_TIERS = {
  // Webhooks: 120 requests / minute
  WEBHOOKS: { maxRequests: 120, windowMs: 60 * 1000 },
  // Automation / n8n endpoints: 120 requests / minute
  AUTOMATION: { maxRequests: 120, windowMs: 60 * 1000 },
  // Auth & Magic Links: 20 requests / minute
  AUTH: { maxRequests: 20, windowMs: 60 * 1000 },
  // Super Admin & Sensitive management APIs: 30 requests / minute
  ADMIN: { maxRequests: 30, windowMs: 60 * 1000 },
  // General API routes: 60 requests / minute
  DEFAULT_API: { maxRequests: 60, windowMs: 60 * 1000 },
}

/**
 * Extracts client IP identifier from Next.js request headers or socket.
 */
export function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }
  return '127.0.0.1'
}

/**
 * Checks if a request identified by key is within allowable rate limits.
 *
 * @param key Unique identifier (e.g., client IP, organization ID, or user ID)
 * @param options maxRequests and windowMs duration
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = RATE_LIMIT_TIERS.DEFAULT_API
): RateLimitResult {
  const now = Date.now()
  const { maxRequests, windowMs } = options

  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // New or expired window
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, newRecord)

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newRecord.resetTime,
    }
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Applies Rate Limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) to response.
 */
export function applyRateLimitHeaders(
  res: NextResponse,
  result: RateLimitResult,
  options: RateLimitOptions
): NextResponse {
  res.headers.set('X-RateLimit-Limit', options.maxRequests.toString())
  res.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  res.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())

  if (!result.allowed && result.retryAfterSeconds) {
    res.headers.set('Retry-After', result.retryAfterSeconds.toString())
  }
  return res
}

/**
 * Creates standard HTTP 429 Too Many Requests response.
 */
export function createRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfter = result.retryAfterSeconds || 60
  return NextResponse.json(
    {
      error: 'Too Many Requests: Rate limit exceeded. Please try again later.',
      retryAfterSeconds: retryAfter,
      statusCode: 429,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      },
    }
  )
}
