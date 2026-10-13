import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { renderPasswordResetEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/sender';
import {
  getClientIp,
  checkPasswordResetRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/security/rate-limit';
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit/log';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(request);

    // 1. Rate Limiting: 3 requests per hour per email + per IP
    const rateLimitResult = checkPasswordResetRateLimit(normalizedEmail, clientIp);
    if (!rateLimitResult.allowed) {
      return createRateLimitExceededResponse(
        rateLimitResult,
        `Too many password reset requests. Please wait ${rateLimitResult.retryAfterSeconds || 60} seconds before trying again.`
      );
    }

    // 2. Audit Event: Log PASSWORD_RESET_REQUESTED with hashed email (never raw email for privacy)
    const emailHash = crypto
      .createHash('sha256')
      .update(normalizedEmail)
      .digest('hex')
      .substring(0, 16);

    try {
      await logAuditEvent({
        action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
        details: { emailHash },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
      });
    } catch (auditErr) {
      console.warn('[ForgotPassword] Audit logging warning:', auditErr);
    }

    // 3. Token Generation: Creates single-use 64-char token, stored as SHA-256 hash in DB, 1-hour expiry
    const resetInfo = await createPasswordResetToken(normalizedEmail);

    // 4. Email Dispatch: Only if account exists (resetInfo is non-null)
    if (resetInfo) {
      try {
        const emailContent = renderPasswordResetEmail({
          resetUrl: resetInfo.url,
          expiresAt: resetInfo.expiresAt,
        });

        await sendEmail({
          to: normalizedEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } catch (sendErr) {
        // Log delivery error securely but do NOT expose to the client
        console.error('[ForgotPassword] Email dispatch error:', sendErr);
      }
    }

    // 5. Response: Always return HTTP 200 with generic message to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      token: process.env.NODE_ENV === 'production' ? undefined : resetInfo?.token,
      url: process.env.NODE_ENV === 'production' ? undefined : resetInfo?.url,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

