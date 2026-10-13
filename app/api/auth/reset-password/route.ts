import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth/password-reset';
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit/log';
import { getClientIp } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json().catch(() => ({}));

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Email, reset token, and new password are required' },
        { status: 400 }
      );
    }

    const result = await resetPassword(email, token, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Password reset failed' },
        { status: 400 }
      );
    }

    // Log AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED
    if (result.user) {
      try {
        await logAuditEvent({
          action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
          actorId: result.user.id,
          actorEmail: result.user.email,
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent'),
        });
      } catch (auditErr) {
        console.warn('[ResetPassword] Audit logging warning:', auditErr);
      }
    }

    return NextResponse.json({
      message: 'Password has been reset successfully. Please log in with your new credentials.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

