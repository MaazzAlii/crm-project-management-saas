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
 * Checks if a request identified by key is within allowable rate limits.
 *
 * @param key Unique identifier (e.g., client IP, organization ID, or user ID)
 * @param options maxRequests and windowMs duration
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { maxRequests: 60, windowMs: 60 * 1000 }
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
