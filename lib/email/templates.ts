/**
 * =============================================================================
 * Innoventix Platform — Transactional Email Templates
 * =============================================================================
 * 
 * TEMPLATE SPECIFICATIONS (Prompt 30 & Mailcow Patch P2):
 * 1. Plain functions returning { subject, html, text, from?, displayName?, replyTo? }.
 * 2. Every template MUST provide both HTML and plain-text versions.
 * 3. All user-supplied fields (names, organization names) MUST be HTML escaped.
 * 4. All URLs are built dynamically using APP_PUBLIC_URL.
 * =============================================================================
 */

import { getEmailConfig } from './config';

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
  from?: string;
  displayName?: string;
  replyTo?: string;
}

/**
 * Escapes unsafe HTML characters to prevent XSS injection in HTML emails
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getBaseUrl(): string {
  return (process.env.APP_PUBLIC_URL || getEmailConfig().appPublicUrl).replace(/\/$/, '');
}

/**
 * 1. Team Member Invitation Email
 */
export function renderInviteEmail(params: {
  inviterName: string;
  organizationName: string;
  role: string;
  rawToken: string;
  expiresAt: Date | string;
  inviterEmail?: string;
  inviterEmailVerified?: boolean;
}): EmailTemplateResult {
  const baseUrl = getBaseUrl();
  const acceptUrl = `${baseUrl}/invite/${params.rawToken}`;
  const safeInviter = escapeHtml(params.inviterName || 'A team member');
  const safeOrg = escapeHtml(params.organizationName);
  const safeRole = escapeHtml(params.role);
  const formattedExpiry = new Date(params.expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const subject = `${safeInviter} invited you to ${safeOrg} on Innoventix`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
    .footer { font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Join ${safeOrg} on Innoventix</h2>
    <p>${safeInviter} has invited you to join <strong>${safeOrg}</strong> as a <strong>${safeRole}</strong>.</p>
    <p>Innoventix Hub brings your client relationships, deliverables, projects, and unified communications into a single command center.</p>
    <div>
      <a href="${acceptUrl}" class="button">Accept Invitation</a>
    </div>
    <p style="font-size: 14px; color: #475569;">This invitation link will expire on <strong>${formattedExpiry}</strong>.</p>
    <div class="footer">
      <p>If you did not expect this, ignore this email.</p>
      <p>Innoventix Hub Platform</p>
    </div>
  </div>
</body>
</html>`;

  const text = `${params.inviterName} invited you to ${params.organizationName} on Innoventix

${params.inviterName} has invited you to join ${params.organizationName} as a ${params.role}.

Accept your invitation using the link below:
${acceptUrl}

This invitation link will expire on ${formattedExpiry}.

If you did not expect this, ignore this email.`;

  const fromName = process.env.EMAIL_FROM_NAME || 'Innoventix';
  const defaultReplyTo = process.env.EMAIL_REPLY_TO || 'support@innoventixhub.tech';
  const replyTo =
    params.inviterEmailVerified && params.inviterEmail ? params.inviterEmail : defaultReplyTo;

  return {
    subject,
    html,
    text,
    displayName: `${safeInviter} via ${fromName}`,
    replyTo,
  };
}

/**
 * Mailcow P2: Helper function matching prompt contract
 */
export function buildInviteEmail(
  inviter: { name: string; email: string; isVerified?: boolean },
  organization: { name: string },
  invitee: { email: string },
  rawToken: string
): EmailTemplateResult {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'invites@innoventixhub.tech';
  const result = renderInviteEmail({
    inviterName: inviter.name,
    organizationName: organization.name,
    role: 'member',
    rawToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    inviterEmail: inviter.email,
    inviterEmailVerified: inviter.isVerified ?? false,
  });

  return {
    ...result,
    from: fromAddress,
  };
}

/**
 * 2. User Email Verification Email
 */
export function renderVerifyEmail(params: {
  rawToken: string;
  userEmail: string;
  userName?: string;
}): EmailTemplateResult {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${params.rawToken}`;
  const subject = 'Confirm your email';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
    .footer { font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Confirm your email address</h2>
    <p>Please confirm your email address to complete your Innoventix account verification.</p>
    <div>
      <a href="${verifyUrl}" class="button">Confirm Email Address</a>
    </div>
    <p style="font-size: 14px; color: #475569;">This verification link will expire in <strong>24 hours</strong>.</p>
    <div class="footer">
      <p>If you did not request this email, no action is needed.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Confirm your email

Please confirm your email address to complete your Innoventix account verification:
${verifyUrl}

This verification link will expire in 24 hours.

If you did not request this email, no action is needed.`;

  return { subject, html, text };
}

/**
 * 3. Business Domain Verification Code Email
 */
export function renderDomainCodeEmail(params: {
  code: string;
  domain: string;
  rawToken?: string;
}): EmailTemplateResult {
  const baseUrl = getBaseUrl();
  const safeDomain = escapeHtml(params.domain);
  const safeCode = escapeHtml(params.code);
  const verifyUrl = params.rawToken
    ? `${baseUrl}/verify-domain?token=${params.rawToken}&code=${params.code}`
    : undefined;

  const subject = 'Your domain verification code';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; }
    .code-box { font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 16px 24px; border-radius: 6px; text-align: center; margin: 24px 0; font-family: monospace; }
    .footer { font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify Business Domain</h2>
    <p>Use the following 6-digit verification code to confirm ownership of <strong>${safeDomain}</strong> on Innoventix:</p>
    <div class="code-box">${safeCode}</div>
    <p style="font-size: 14px; color: #475569;">This code is valid for <strong>30 minutes</strong>.</p>
    ${verifyUrl ? `<p>Or click this link directly: <a href="${verifyUrl}">${verifyUrl}</a></p>` : ''}
    <div class="footer">
      <p>If you did not request domain verification for ${safeDomain}, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Your domain verification code

Use the following 6-digit verification code to confirm ownership of ${params.domain} on Innoventix:

${params.code}

This code is valid for 30 minutes.
${verifyUrl ? `Or verify directly: ${verifyUrl}` : ''}

If you did not request domain verification, please ignore this email.`;

  return { subject, html, text };
}

/**
 * 4. Invitation Accepted Notification (sent to inviter)
 */
export function renderInviteAcceptedEmail(params: {
  memberName: string;
  organizationName: string;
  role: string;
}): EmailTemplateResult {
  const safeName = escapeHtml(params.memberName);
  const safeOrg = escapeHtml(params.organizationName);
  const subject = `${safeName} joined ${safeOrg}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; padding: 24px; color: #1e293b;">
  <h2>${safeName} joined ${safeOrg}</h2>
  <p><strong>${safeName}</strong> has accepted your invitation and is now an active member of <strong>${safeOrg}</strong> with the <strong>${escapeHtml(params.role)}</strong> role.</p>
  <p>You can manage team members and project assignments in your workspace dashboard.</p>
</body>
</html>`;

  const text = `${params.memberName} joined ${params.organizationName}

${params.memberName} has accepted your invitation and is now an active member of ${params.organizationName} (${params.role}).`;

  return { subject, html, text };
}

/**
 * 5. Role Changed Notification (sent to member)
 */
export function renderRoleChangedEmail(params: {
  organizationName: string;
  newRole: string;
  memberName?: string;
}): EmailTemplateResult {
  const safeOrg = escapeHtml(params.organizationName);
  const safeRole = escapeHtml(params.newRole);
  const safeName = escapeHtml(params.memberName || 'Team Member');
  const subject = `Your role in ${safeOrg} was updated`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; padding: 24px; color: #1e293b;">
  <h2>Role Updated</h2>
  <p>Hello ${safeName},</p>
  <p>Your membership role in <strong>${safeOrg}</strong> has been updated to <strong>${safeRole}</strong>.</p>
</body>
</html>`;

  const text = `Your role in ${params.organizationName} was updated

Hello ${params.memberName || 'Team Member'},

Your membership role in ${params.organizationName} has been updated to ${params.newRole}.`;

  return { subject, html, text };
}

/**
 * 6. Password Reset Email (Item 1)
 */
export function renderPasswordResetEmail(params: {
  resetUrl: string;
  expiresAt?: Date | string;
}): EmailTemplateResult {
  const subject = 'Reset your password';
  const formattedExpiry = params.expiresAt
    ? new Date(params.expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '1 hour';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 32px 16px; margin: 0; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
    <tr>
      <td style="padding: 32px 32px 24px; text-align: left;">
        <div style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 10px; color: #ffffff; font-weight: 800; font-size: 14px; margin-bottom: 20px;">
          IX
        </div>
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px; letter-spacing: -0.02em;">
          Reset your Innoventix password
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
          We received a request to reset the password for your account. Click the button below to choose a new password:
        </p>
        <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="border-radius: 10px; background-color: #0284c7;">
              <a href="${params.resetUrl}" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; border-radius: 10px; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0 0 8px;">
          This link expires in <strong>${formattedExpiry}</strong>. If you did not request a password reset, you can safely ignore this email.
        </p>
        <p style="font-size: 11px; line-height: 1.4; color: #94a3b8; margin: 16px 0 0; word-break: break-all;">
          Button not working? Copy and paste this URL into your browser:<br>
          <a href="${params.resetUrl}" style="color: #0284c7; text-decoration: underline;">${params.resetUrl}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Reset your Innoventix password

We received a request to reset the password for your account. Open the link below to choose a new password:

${params.resetUrl}

This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.`;

  return { subject, html, text };
}

