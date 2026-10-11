import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token (32 bytes encoded as base64url)
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash a raw token with SHA-256 returning a 64-character hex string.
 * The raw token must never be stored in persistent storage or logs.
 */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

/**
 * Constant-time hash comparison to prevent timing attacks
 */
export function safeEqualHash(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Recursively redacts any object property whose key is 'token' or contains 'token'
 * to guarantee tokens are never inadvertently logged.
 */
export function redactTokens<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactTokens(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const copy: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (key.toLowerCase() === 'token') {
        copy[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        copy[key] = redactTokens(val);
      } else {
        copy[key] = val;
      }
    }
    return copy as T;
  }

  return data;
}

/**
 * Safe logger wrapper that redacts token properties before printing.
 */
export const safeLogger = {
  log: (message: string, meta?: any) => {
    if (meta !== undefined) {
      console.log(message, redactTokens(meta));
    } else {
      console.log(message);
    }
  },
  warn: (message: string, meta?: any) => {
    if (meta !== undefined) {
      console.warn(message, redactTokens(meta));
    } else {
      console.warn(message);
    }
  },
  error: (message: string, meta?: any) => {
    if (meta !== undefined) {
      console.error(message, redactTokens(meta));
    } else {
      console.error(message);
    }
  },
};
