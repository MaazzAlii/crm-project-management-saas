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

export type EmailProviderType = 'resend' | 'smtp' | 'console'

export interface EmailConfig {
  provider: EmailProviderType
  from: string
  resendApiKey?: string
  smtp?: {
    host: string
    port: number
    user?: string
    password?: string
    secure?: boolean
  }
  appPublicUrl: string
}

/**
 * Retrieve current email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
  const isProd = process.env.NODE_ENV === 'production'
  const rawProvider = (process.env.EMAIL_PROVIDER || '').toLowerCase()
  
  let provider: EmailProviderType = 'console'
  if (rawProvider === 'resend') {
    provider = 'resend'
  } else if (rawProvider === 'smtp') {
    provider = 'smtp'
  } else if (rawProvider === 'console' || !rawProvider) {
    provider = 'console'
  }

  const from = process.env.EMAIL_FROM || 'Innoventix <invites@innoventixhub.tech>'
  const appPublicUrl = process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const config: EmailConfig = {
    provider,
    from,
    appPublicUrl: appPublicUrl.replace(/\/$/, ''),
  }

  if (provider === 'resend') {
    config.resendApiKey = process.env.RESEND_API_KEY
  }

  if (provider === 'smtp') {
    config.smtp = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      secure: process.env.SMTP_PORT === '465',
    }
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

  // Extract platform email inside angle brackets: e.g. "Innoventix <invites@innoventix.io>"
  const emailMatch = rawFrom.match(/<([^>]+)>/)
  const platformEmail = emailMatch ? emailMatch[1] : rawFrom
  const platformName = rawFrom.includes('<') ? rawFrom.split('<')[0].trim() : 'Innoventix'

  if (!organizationName || organizationName.trim() === '') {
    return `${platformName} <${platformEmail}>`
  }

  return `${organizationName.trim()} via ${platformName} <${platformEmail}>`
}

/**
 * Validates email configuration for production readiness.
 * Throws a descriptive error if environment variables are missing or unsafe.
 */
export function validateEmailConfig(): EmailConfig {
  const isProd = process.env.NODE_ENV === 'production'
  const config = getEmailConfig()

  if (isProd && config.provider === 'console') {
    throw new Error(
      '[EMAIL_CONFIG_ERROR] The "console" email provider is not allowed in production. ' +
      'Please configure EMAIL_PROVIDER=resend or EMAIL_PROVIDER=smtp with valid credentials.'
    )
  }

  if (config.provider === 'resend') {
    if (!config.resendApiKey || config.resendApiKey.trim() === '') {
      throw new Error(
        '[EMAIL_CONFIG_ERROR] RESEND_API_KEY is required when EMAIL_PROVIDER is resend. ' +
        'Please supply your Resend API key in environment variables.'
      )
    }
  }

  if (config.provider === 'smtp') {
    if (!config.smtp?.host || config.smtp.host.trim() === '') {
      throw new Error(
        '[EMAIL_CONFIG_ERROR] SMTP_HOST is required when EMAIL_PROVIDER is smtp. ' +
        'Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD.'
      )
    }
  }

  return config
}
