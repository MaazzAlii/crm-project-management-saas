import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/auth/password-reset';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const resetInfo = await createPasswordResetToken(email);

    // Return success response (avoid revealing whether email exists in DB for production security)
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
