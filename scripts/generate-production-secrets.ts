/**
 * TASK 67 — Production Secrets Generator
 *
 * Securely generates cryptographically strong random secrets for:
 * - PostgreSQL Password (32 chars)
 * - Supabase JWT Secret (64 chars)
 * - Supabase Anon JWT (HS256 signed with generated JWT Secret)
 * - Supabase Service Role JWT (HS256 signed with generated JWT Secret)
 * - Application Encryption Secret for AES-256-GCM (64 hex chars = 32 bytes)
 * - Automation Cron Secret (64 hex chars = 32 bytes)
 * - n8n Webhook Secret (64 hex chars = 32 bytes)
 *
 * USAGE:
 *   npx tsx scripts/generate-production-secrets.ts
 *
 * NOTE: Output should be copied directly to the Contabo VPS and NEVER committed to Git.
 */

import crypto from 'crypto'

function base64url(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signSupabaseJwt(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest()

  return `${signatureInput}.${base64url(signature)}`
}

function generateAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export function generateProductionSecrets() {
  // 1. Generate core cryptographic secrets
  const postgresPassword = generateAlphanumeric(32)
  const jwtSecret = crypto.randomBytes(32).toString('hex') // 64 hex characters
  const encryptionSecret = crypto.randomBytes(32).toString('hex') // 64 hex characters for AES-256-GCM
  const cronSecret = crypto.randomBytes(32).toString('hex') // 64 hex characters
  const n8nWebhookSecret = crypto.randomBytes(32).toString('hex') // 64 hex characters

  // 2. Generate Supabase JWT tokens valid for 10 years (from current timestamp)
  const nowUnix = Math.floor(Date.now() / 1000)
  const tenYearsSeconds = 10 * 365 * 24 * 60 * 60
  const expUnix = nowUnix + tenYearsSeconds

  const anonPayload = {
    iss: 'supabase',
    ref: 'production',
    role: 'anon',
    iat: nowUnix,
    exp: expUnix,
  }

  const servicePayload = {
    iss: 'supabase',
    ref: 'production',
    role: 'service_role',
    iat: nowUnix,
    exp: expUnix,
  }

  const anonKey = signSupabaseJwt(anonPayload, jwtSecret)
  const serviceRoleKey = signSupabaseJwt(servicePayload, jwtSecret)

  return {
    postgresPassword,
    jwtSecret,
    anonKey,
    serviceRoleKey,
    encryptionSecret,
    cronSecret,
    n8nWebhookSecret,
  }
}

if (require.main === module || process.argv[1]?.endsWith('generate-production-secrets.ts')) {
  const secrets = generateProductionSecrets()

  console.log('════════════════════════════════════════════════════════════════════')
  console.log('  INNOVENTIX PLATFORM V2 — PRODUCTION SECRETS GENERATOR')
  console.log('  Generated on: ' + new Date().toISOString())
  console.log('  CRITICAL: DO NOT COMMIT THESE VALUES TO GIT OR PUBLIC REPOSITORIES')
  console.log('════════════════════════════════════════════════════════════════════\n')

  console.log('1. FOR CONTABO VPS SUPABASE STACK (/opt/innoventix/supabase/.env.supabase):')
  console.log('────────────────────────────────────────────────────────────────────')
  console.log(`POSTGRES_PASSWORD=${secrets.postgresPassword}`)
  console.log(`JWT_SECRET=${secrets.jwtSecret}`)
  console.log(`ANON_KEY=${secrets.anonKey}`)
  console.log(`SERVICE_ROLE_KEY=${secrets.serviceRoleKey}`)
  console.log(`SITE_URL=https://app.innoventixhub.com`)
  console.log(`API_EXTERNAL_URL=https://api.innoventixhub.com/auth/v1`)

  console.log('\n2. FOR NEXT.JS APPLICATION CONTAINER (/opt/innoventix/app/.env.production):')
  console.log('────────────────────────────────────────────────────────────────────')
  console.log(`NODE_ENV=production`)
  console.log(`NEXT_PUBLIC_APP_URL=https://app.innoventixhub.com`)
  console.log(`NEXT_PUBLIC_SUPABASE_URL=https://api.innoventixhub.com`)
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${secrets.anonKey}`)
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${secrets.serviceRoleKey}`)
  console.log(`ENCRYPTION_SECRET=${secrets.encryptionSecret}`)
  console.log(`CRON_SECRET=${secrets.cronSecret}`)
  console.log(`N8N_WEBHOOK_SECRET=${secrets.n8nWebhookSecret}`)
  console.log(`N8N_WEBHOOK_URL=https://n8n.innoventixhub.com/webhook/events`)

  console.log('\n3. THIRD-PARTY KEYS TO FILL MANUALLY IN .env.production:')
  console.log('────────────────────────────────────────────────────────────────────')
  console.log('# Stripe (from https://dashboard.stripe.com/apikeys):')
  console.log('STRIPE_SECRET_KEY=sk_live_...')
  console.log('STRIPE_WEBHOOK_SECRET=whsec_...')
  console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...')
  console.log('')
  console.log('# AI Provider (OpenAI, Gemini, or Anthropic):')
  console.log('AI_PROVIDER=openai')
  console.log('AI_API_KEY=sk-proj-...')
  console.log('')
  console.log('# Optional Integrations (Slack, WhatsApp, SendGrid, Discord):')
  console.log('SLACK_SIGNING_SECRET=...')
  console.log('SLACK_BOT_TOKEN=xoxb-...')
  console.log('WHATSAPP_VERIFY_TOKEN=...')
  console.log('TWILIO_ACCOUNT_SID=...')
  console.log('TWILIO_AUTH_TOKEN=...')
  console.log('SENDGRID_API_KEY=...')
  console.log('════════════════════════════════════════════════════════════════════\n')
}
