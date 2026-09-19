import crypto from 'crypto'
import { encryptSecret, decryptSecret, isEncryptedSecret, maskSecret } from '../lib/security/encrypt'
import { verifySlackSignature } from '../lib/providers/slack'
import { verifyTwilioSignature } from '../lib/providers/whatsapp'
import { verifyDiscordSignature } from '../lib/providers/discord'
import { verifyAutomationSignature } from '../lib/automation/emitter'
import { checkRateLimit, RATE_LIMIT_TIERS } from '../lib/security/rate-limit'
import { checkContentLength } from '../lib/security/payload'
import { getCorsHeaders } from '../lib/security/cors'
import { SECURITY_HEADERS } from '../lib/security/headers'
import { NextRequest } from 'next/server'

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passedTests++
  } else {
    console.error(`  ❌ FAIL: ${testName}`)
    failedTests++
  }
}

async function runSecurityAuditTests() {
  console.log('🔒 Starting TASK 62 Secrets Management & API Security Test Suite...\n')

  // ==========================================
  // 1. AES-256-GCM Encryption & Decryption
  // ==========================================
  console.log('--- Test Group 1: AES-256 Encryption & Secrets Management ---')
  const plainSecret = 'xoxb-1234567890-slack-super-secret-bot-token-2026'
  const encrypted = encryptSecret(plainSecret)
  assert(encrypted !== plainSecret, 'Secret is encrypted at rest (not plain text)')
  assert(isEncryptedSecret(encrypted), 'isEncryptedSecret returns true for valid cipher text')
  assert(encrypted.split(':').length === 3, 'Cipher text contains IV, AuthTag, and Encrypted Hex')

  const decrypted = decryptSecret(encrypted)
  assert(decrypted === plainSecret, 'Secret is decrypted accurately back to plain text')

  // Tampering detection
  const parts = encrypted.split(':')
  const tamperedCipher = `${parts[0]}:${parts[1]}:deadbeef${parts[2].slice(8)}`
  const tamperedResult = decryptSecret(tamperedCipher)
  assert(tamperedResult === tamperedCipher, 'Decryption gracefully handles tampered ciphertext without crashing')

  // Masking
  const masked = maskSecret(encrypted, 4, 4)
  assert(masked.startsWith('xoxb') && masked.endsWith('2026') && masked.includes('••••••••'), 'maskSecret safely masks token for UI')

  // Double encryption guard
  const doubleEnc = encryptSecret(encrypted)
  assert(doubleEnc === encrypted, 'encryptSecret prevents duplicate re-encryption of already encrypted tokens')

  // ==========================================
  // 2. Webhook Signature Verification Tests
  // ==========================================
  console.log('\n--- Test Group 2: Webhook Signature Verification ---')

  // A. Slack Signature Verification
  const slackSecret = 'slack_signing_secret_test_123456'
  const slackBody = JSON.stringify({ type: 'event_callback', event: { text: 'Hello Slack' } })
  const slackTs = Math.floor(Date.now() / 1000).toString()
  const slackBaseString = `v0:${slackTs}:${slackBody}`
  const slackHmac = crypto.createHmac('sha256', slackSecret).update(slackBaseString).digest('hex')
  const slackValidSig = `v0=${slackHmac}`

  assert(verifySlackSignature(slackValidSig, slackTs, slackBody, slackSecret), 'Slack valid signature verified')
  assert(!verifySlackSignature('v0=invalidsig123456', slackTs, slackBody, slackSecret), 'Slack invalid signature rejected')
  assert(!verifySlackSignature(slackValidSig, slackTs, 'tampered body', slackSecret), 'Slack tampered body rejected')

  // Replay attack prevention (>5 mins old)
  const oldTs = (Math.floor(Date.now() / 1000) - 600).toString()
  assert(!verifySlackSignature(slackValidSig, oldTs, slackBody, slackSecret), 'Slack replay attack (timestamp > 5m old) rejected')

  // B. WhatsApp / Twilio Signature Verification
  const twilioAuthToken = 'twilio_auth_token_987654321'
  const twilioUrl = 'https://app.innoventixhub.com/api/webhooks/whatsapp'
  const twilioParams: Record<string, string> = {
    Body: 'Hello WhatsApp',
    From: 'whatsapp:+15550192831',
    To: 'whatsapp:+15559998877',
  }

  let twilioData = twilioUrl
  Object.keys(twilioParams).sort().forEach((k) => {
    twilioData += k + twilioParams[k]
  })
  const twilioValidSig = crypto.createHmac('sha1', twilioAuthToken).update(Buffer.from(twilioData, 'utf-8')).digest('base64')

  assert(verifyTwilioSignature(twilioValidSig, twilioUrl, twilioParams, twilioAuthToken), 'Twilio WhatsApp valid signature verified')
  assert(!verifyTwilioSignature('invalidsig', twilioUrl, twilioParams, twilioAuthToken), 'Twilio invalid signature rejected')
  assert(!verifyTwilioSignature(twilioValidSig, twilioUrl, { ...twilioParams, Body: 'Tampered' }, twilioAuthToken), 'Twilio tampered params rejected')

  // C. Discord Ed25519 Signature Verification
  const { publicKey: dPub, privateKey: dPriv } = crypto.generateKeyPairSync('ed25519')
  const discordPubHex = dPub.export({ type: 'spki', format: 'der' }).subarray(12).toString('hex')
  const discordTs = Math.floor(Date.now() / 1000).toString()
  const discordBody = JSON.stringify({ type: 1 })
  const discordSig = crypto.sign(null, Buffer.from(discordTs + discordBody), dPriv).toString('hex')

  assert(verifyDiscordSignature(discordSig, discordTs, discordBody, discordPubHex), 'Discord Ed25519 valid signature verified')
  assert(!verifyDiscordSignature('00'.repeat(64), discordTs, discordBody, discordPubHex), 'Discord invalid signature rejected')
  assert(!verifyDiscordSignature(discordSig, discordTs, '{"type":2}', discordPubHex), 'Discord tampered payload rejected')

  // D. Automation / N8N HMAC Signature Verification
  const n8nSecret = 'n8n_automation_secret_key_abc123'
  const n8nBody = JSON.stringify({ event: 'project.delivered', organization_id: 'org-123' })
  const n8nHmac = crypto.createHmac('sha256', n8nSecret).update(n8nBody).digest('hex')

  assert(verifyAutomationSignature(n8nBody, n8nHmac, n8nSecret), 'Automation HMAC-SHA256 valid signature verified')
  assert(!verifyAutomationSignature(n8nBody, 'invalid-signature-hash', n8nSecret), 'Automation invalid signature rejected')
  assert(!verifyAutomationSignature('tampered', n8nHmac, n8nSecret), 'Automation tampered body rejected')

  // ==========================================
  // 3. Sliding Window Rate Limiting Tests
  // ==========================================
  console.log('\n--- Test Group 3: API & Webhook Rate Limiting ---')
  const testKey = `test_rate_limit_${Date.now()}`
  const tier = { maxRequests: 5, windowMs: 10000 }

  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testKey, tier)
    assert(res.allowed, `Rate limit request #${i} permitted (remaining: ${res.remaining})`)
  }

  const blockedRes = checkRateLimit(testKey, tier)
  assert(!blockedRes.allowed, 'Rate limit request #6 correctly blocked (HTTP 429 triggered)')
  assert(blockedRes.retryAfterSeconds !== undefined && blockedRes.retryAfterSeconds > 0, 'Retry-After header duration calculated')

  // ==========================================
  // 4. Request Payload Size Limits (DoS Mitigation)
  // ==========================================
  console.log('\n--- Test Group 4: Request Payload Size Limits ---')
  const smallReq = new NextRequest('http://localhost:3000/api/webhooks/slack', {
    method: 'POST',
    headers: { 'content-length': '500' },
  })
  const smallCheck = checkContentLength(smallReq, 1024 * 1024)
  assert(smallCheck.allowed, 'Standard payload (500 bytes) allowed')

  const oversizedReq = new NextRequest('http://localhost:3000/api/webhooks/slack', {
    method: 'POST',
    headers: { 'content-length': '5242880' }, // 5MB
  })
  const overCheck = checkContentLength(oversizedReq, 1024 * 1024) // 1MB limit
  assert(!overCheck.allowed, 'Oversized payload (5MB > 1MB limit) rejected with 413')

  // ==========================================
  // 5. CORS Policy Configuration
  // ==========================================
  console.log('\n--- Test Group 5: CORS Policy Configuration ---')
  const corsHeaders = getCorsHeaders()
  assert(corsHeaders['Access-Control-Allow-Origin'] !== undefined, 'CORS Access-Control-Allow-Origin configured')
  assert(corsHeaders['Access-Control-Allow-Methods'].includes('POST'), 'CORS Access-Control-Allow-Methods includes POST')
  assert(corsHeaders['Access-Control-Allow-Headers'].includes('X-Slack-Signature'), 'CORS Allowed Headers includes security webhook signatures')

  // ==========================================
  // 6. Security Headers Audit
  // ==========================================
  console.log('\n--- Test Group 6: Security Headers Audit ---')
  assert(SECURITY_HEADERS['X-Frame-Options'] === 'DENY', 'X-Frame-Options: DENY present')
  assert(SECURITY_HEADERS['X-Content-Type-Options'] === 'nosniff', 'X-Content-Type-Options: nosniff present')
  assert(SECURITY_HEADERS['Content-Security-Policy'].includes("default-src 'self'"), 'CSP header configured')
  assert(SECURITY_HEADERS['Strict-Transport-Security'].includes('max-age='), 'HSTS header configured')

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n========================================')
  console.log(`TASK 62 Security Audit: ${passedTests} passed, ${failedTests} failed.`)
  console.log('========================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
