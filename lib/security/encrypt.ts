import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY =
  process.env.ENCRYPTION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'crm-saas-communication-hub-encryption-key-32b!'

function getDerivedKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Checks if a string has the format of an AES-256-GCM encrypted secret (`iv:authTag:cipherText`)
 */
export function isEncryptedSecret(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  const [ivHex, authTagHex, cipherHex] = parts
  // 12-byte IV = 24 hex chars, 16-byte AuthTag = 32 hex chars, cipherHex > 0
  return (
    ivHex.length === 24 &&
    authTagHex.length === 32 &&
    cipherHex.length > 0 &&
    /^[0-9a-fA-F]+$/.test(ivHex) &&
    /^[0-9a-fA-F]+$/.test(authTagHex) &&
    /^[0-9a-fA-F]+$/.test(cipherHex)
  )
}

/**
 * Encrypt sensitive provider tokens and API keys at rest (AES-256-GCM)
 */
export function encryptSecret(plainText: string, customSecret?: string): string {
  if (!plainText) return ''
  // If already encrypted, avoid double-encrypting
  if (isEncryptedSecret(plainText)) return plainText

  try {
    const iv = crypto.randomBytes(12)
    const key = getDerivedKey(customSecret || SECRET_KEY)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
  } catch (err) {
    console.error('[Security:Encrypt] Error encrypting secret:', err)
    return plainText
  }
}

/**
 * Decrypt sensitive provider tokens and API keys at point of use server-side
 */
export function decryptSecret(cipherText: string, customSecret?: string): string {
  if (!cipherText) return ''
  if (!cipherText.includes(':')) return cipherText // Fallback for unencrypted legacy tokens
  try {
    const parts = cipherText.split(':')
    if (parts.length !== 3) return cipherText
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const key = getDerivedKey(customSecret || SECRET_KEY)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('[Security:Decrypt] Error decrypting secret:', err)
    return cipherText
  }
}

/**
 * Utility to securely mask API keys and bot tokens for UI display.
 * Decrypts if encrypted, then masks middle characters.
 */
export function maskSecret(value?: string | null, prefixLen = 4, suffixLen = 4): string {
  if (!value) return ''
  const decrypted = isEncryptedSecret(value) ? decryptSecret(value) : value
  if (decrypted.length <= prefixLen + suffixLen) {
    return '••••••••'
  }
  return `${decrypted.slice(0, prefixLen)}••••••••${decrypted.slice(-suffixLen)}`
}
