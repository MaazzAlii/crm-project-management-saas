import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'crm-saas-communication-hub-encryption-key-32b!'

function getDerivedKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypt sensitive provider tokens at rest (AES-256-GCM)
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return ''
  try {
    const iv = crypto.randomBytes(12)
    const key = getDerivedKey(SECRET_KEY)
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
 * Decrypt sensitive provider tokens at point of use
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return ''
  if (!cipherText.includes(':')) return cipherText // Fallback for unencrypted legacy tokens
  try {
    const parts = cipherText.split(':')
    if (parts.length !== 3) return cipherText
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const key = getDerivedKey(SECRET_KEY)
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
