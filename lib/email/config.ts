/**
 * =============================================================================
 * Innoventix Platform — Transactional Email Configuration
 * =============================================================================
 * 
 * SENDER ALIGNMENT RULE:
 * When sending team invitations, the From display name indicates the inviting
 * organization (e.g. "Acme Corp via Innoventix"), but the actual email address
 * MUST remain the platform's configured domain (e.g. <invites@innoventix.io>).
 * This ensures strict SPF (Sender Policy Framework) and DKIM (DomainKeys
 * Identified Mail) domain alignment so emails are authenticated and delivered
 * directly to inboxes rather than spam folders.
 * =============================================================================
 */

export type EmailProviderType = 'smtp' | 'console'

export interface EmailConfig {
  provider: EmailProviderType
  fromAddress: string
  fromName: string
  replyTo: string
  from: string
  smtp?: {
    host: string
    port: number
    user?: string
    password?: string
    secure?: boolean
    requireTls?: boolean
  }
  appPublicUrl: string
}

/**
 * Retrieve current email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
  const rawProvider = (process.env.EMAIL_PROVIDER || '').toLowerCase()
  
  let provider: EmailProviderType = 'console'
  if (rawProvider === 'smtp') {
    provider = 'smtp'
  } else if (rawProvider === 'console' || !rawProvider) {
    provider = 'console'
  }

  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'invites@innoventixhub.tech'
  const fromName = process.env.EMAIL_FROM_NAME || 'Innoventix'
  const replyTo = process.env.EMAIL_REPLY_TO || 'support@innoventixhub.tech'
  const rawFrom = process.env.EMAIL_FROM || `${fromName} <${fromAddress}>`
  const appPublicUrl = process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const requireTls = process.env.SMTP_REQUIRE_TLS !== 'false'

  const config: EmailConfig = {
    provider,
    fromAddress,
    fromName,
    replyTo,
    from: rawFrom,
    appPublicUrl: appPublicUrl.replace(/\/$/, ''),
    smtp: {
      host: process.env.SMTP_HOST || '',
      port,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
      secure,
      requireTls,
    },
  }

  return config
}

/**
 * Format email sender address.
 * Uses the inviting organization name in the display name while strictly
 * preserving the platform's authenticated domain address.
 */
export function formatSenderAddress(organizationName?: string): string {
  const config = getEmailConfig()
  const rawFrom = config.from.trim()

  const emailMatch = rawFrom.match(/<([^>]+)>/)
  const platformEmail = emailMatch ? emailMatch[1] : (config.fromAddress || rawFrom)
  const platformName = rawFrom.includes('<') ? rawFrom.split('<')[0].trim() : config.fromName

  if (!organizationName || organizationName.trim() === '') {
    return `${platformName} <${platformEmail}>`
  }

  return `${organizationName.trim()} via ${platformName} <${platformEmail}>`
}

/**
 * Validates email configuration for production readiness.
 * Strict Mailcow P1 rules: In production, EMAIL_PROVIDER must be 'smtp'
 * and all required SMTP variables must be set.
 */
export function validateEmailConfig(): EmailConfig {
  const isProd = process.env.NODE_ENV === 'production'
  const config = getEmailConfig()

  if (isProd) {
    if (config.provider !== 'smtp') {
      throw new Error(
        '[EMAIL_CONFIG_ERROR] The console email provider is not allowed in production. ' +
        'In production, EMAIL_PROVIDER must be set to "smtp". Console provider is strictly forbidden in production.'
      )
    }

    const missingVars: string[] = []
    if (!config.smtp?.host || config.smtp.host.trim() === '') missingVars.push('SMTP_HOST')
    if (!config.smtp?.user || config.smtp.user.trim() === '') missingVars.push('SMTP_USER')
    if (!config.smtp?.password || config.smtp.password.trim() === '') missingVars.push('SMTP_PASSWORD')

    if (missingVars.length > 0) {
      throw new Error(
        `[EMAIL_CONFIG_ERROR] Missing required SMTP environment variables in production: ${missingVars.join(', ')}.`
      )
    }
  }

  return config
}

/**
 * Safe status check that prints whether email variables are set without leaking values.
 */
export function printEmailConfigStatus(): Record<string, boolean> {
  return {
    EMAIL_PROVIDER: !!process.env.EMAIL_PROVIDER,
    EMAIL_FROM_ADDRESS: !!process.env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: !!process.env.EMAIL_FROM_NAME,
    EMAIL_REPLY_TO: !!process.env.EMAIL_REPLY_TO,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
    APP_PUBLIC_URL: !!process.env.APP_PUBLIC_URL,
  }
}
