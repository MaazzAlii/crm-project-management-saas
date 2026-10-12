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
    displayName: `${params.inviterName} via ${fromName}`,
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
