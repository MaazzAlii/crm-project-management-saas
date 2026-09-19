/**
 * Input Sanitization Utility
 * Mitigates Stored & Reflected XSS attacks by sanitizing user-generated text
 * before database persistence and UI rendering.
 */

// Escape HTML special characters
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
}

const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
]

/**
 * Escapes raw HTML special characters in strings to render HTML/script tags inert.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return ''
  return str.replace(/[&<>"'`/]/g, (match) => HTML_ESCAPE_MAP[match] || match)
}

/**
 * Strips script tags, event handlers, and dangerous protocols from a string while preserving safe plain text.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''

  let sanitized = input

  // Strip explicit <script>...</script> tags and contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Strip <iframe>, <object>, <embed>, <style>
  sanitized = sanitized.replace(/<(iframe|object|embed|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')

  // Strip inline event handlers (e.g. onerror=..., onclick=..., onload=...)
  sanitized = sanitized.replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')

  // Strip dangerous URL schemes in attributes or text
  for (const protocol of DANGEROUS_PROTOCOLS) {
    const regex = new RegExp(`${protocol}\\s*`, 'gi')
    sanitized = sanitized.replace(regex, '')
  }

  // Trim extraneous whitespace
  return sanitized.trim()
}

/**
 * Sanitizes URLs to ensure only http/https/mailto/tel schemes are accepted.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()
  if (!trimmed) return null

  // Check against dangerous protocol patterns
  const lower = trimmed.toLowerCase()
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return null
    }
  }

  // Allow relative paths starting with /
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // Allow standard protocols
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed
  }

  return null
}

/**
 * Recursively sanitizes all string properties in a payload object.
 */
export function sanitizeObject<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      // If the field is known to be a URL, apply sanitizeUrl
      if (key.toLowerCase().endsWith('url') || key.toLowerCase().endsWith('link')) {
        result[key] = typeof value === 'string' ? sanitizeUrl(value) : value
      } else {
        result[key] = sanitizeObject(value)
      }
    }
    return result as T
  }

  return data
}
