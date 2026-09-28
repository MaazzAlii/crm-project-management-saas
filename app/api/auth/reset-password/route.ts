import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth/password-reset';

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json();

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
