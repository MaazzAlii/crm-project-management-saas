/**
 * =============================================================================
 * Innoventix Platform — Mailcow Deliverability & SMTP Verification Script
 * =============================================================================
 * 
 * Usage:
 *   npx tsx scripts/send-test-email.ts <recipient@domain.com>
 * 
 * Reads SMTP configuration from environment variables and dispatches a single
 * test message. Guarantees:
 * 1. Typed error returns without leaking passwords or sensitive environment keys.
 * 2. Plain-text and HTML counterparts included.
 * 3. Strict TLS certificate validation (rejectUnauthorized: true).
 * =============================================================================
 */

import nodemailer from 'nodemailer';
import { getEmailConfig, formatSenderAddress } from '../lib/email/config';
import { isValidEmail } from '../lib/validation/email';

export interface SendTestEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Dispatches a test email to the specified address using configured SMTP settings.
 * Returns typed results; never throws unhandled exceptions to the caller.
 */
export async function sendTestEmail(
  targetEmail?: string,
  options?: {
    customTransporter?: { sendMail: (opts: any) => Promise<any> };
    timeoutMs?: number;
  }
): Promise<SendTestEmailResult> {
  if (!targetEmail || !targetEmail.trim()) {
    return {
      success: false,
      error: 'Recipient email address is required',
      code: 'MISSING_RECIPIENT',
    };
  }

  const normalized = targetEmail.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    return {
      success: false,
      error: `Invalid recipient email format: "${targetEmail}"`,
      code: 'INVALID_RECIPIENT',
    };
  }

  const config = getEmailConfig();
  if (!config.smtp || !config.smtp.host) {
    return {
      success: false,
      error: 'SMTP host is not configured (missing SMTP_HOST environment variable)',
      code: 'MISSING_SMTP_CONFIG',
    };
  }

  try {
    const transporter =
      options?.customTransporter ||
      nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure ?? false,
        auth: config.smtp.user
          ? {
              user: config.smtp.user,
              pass: config.smtp.password,
            }
          : undefined,
        tls: {
          rejectUnauthorized: true, // Strict per Mailcow P1
        },
        connectionTimeout: options?.timeoutMs || 5000,
      });

    const fromAddress = formatSenderAddress('Innoventix Deliverability Test');
    const info = await transporter.sendMail({
      from: fromAddress,
      to: normalized,
      subject: 'Innoventix Mailcow Deliverability Test Message',
      text: [
        'Innoventix Platform Deliverability Test',
        '========================================',
        'This is an automated test message dispatched to verify:',
        '1. Outbound SMTP connectivity from server (port 587)',
        '2. TLS certificate handshake and cipher validation',
        '3. SPF / DKIM alignment and DMARC compliance',
        '',
        `Sent to: ${normalized}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n'),
      html: [
        '<h2>Innoventix Platform Deliverability Test</h2>',
        '<p>This is an automated test message dispatched to verify:</p>',
        '<ul>',
        '  <li>Outbound SMTP connectivity from server (port 587)</li>',
        '  <li>TLS certificate handshake and cipher validation</li>',
        '  <li>SPF / DKIM alignment and DMARC compliance</li>',
        '</ul>',
        `<p><strong>Recipient:</strong> ${normalized}<br/>`,
        `<strong>Timestamp:</strong> ${new Date().toISOString()}</p>`,
      ].join(''),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    // Redact any accidental credential echo
    let rawError = err.message || 'Unknown SMTP error';
    if (config.smtp?.password) {
      rawError = rawError.replaceAll(config.smtp.password, '***REDACTED***');
    }
    rawError = rawError.replace(/pass(word)?\s*[:=]\s*[^\s,]+/gi, 'password=***');

    return {
      success: false,
      error: `SMTP delivery failed: ${rawError}`,
      code: err.code || 'SMTP_DELIVERY_ERROR',
    };
  }
}

// Direct CLI invocation
if (
  process.argv[1] &&
  (process.argv[1].endsWith('send-test-email.ts') || process.argv[1].endsWith('send-test-email.js'))
) {
  const recipient = process.argv[2];
  if (!recipient) {
    console.log('\n❌ Usage: npx tsx scripts/send-test-email.ts <recipient@domain.com>');
    console.log('Example: npx tsx scripts/send-test-email.ts test@example.com\n');
    process.exit(1);
  }

  console.log(`\n📤 Sending test message to ${recipient}...`);
  sendTestEmail(recipient)
    .then((result) => {
      if (result.success) {
        console.log(`\n✅ Email dispatched successfully!`);
        console.log(`Message ID: ${result.messageId}\n`);
        process.exit(0);
      } else {
        console.error(`\n❌ Delivery Failed [${result.code}]:`);
        console.error(`${result.error}\n`);
        process.exit(1);
      }
    })
    .catch((unexpected) => {
      console.error(`\n❌ Unexpected execution error:`, unexpected.message || unexpected);
      process.exit(1);
    });
}
