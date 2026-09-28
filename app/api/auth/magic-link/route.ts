import { NextRequest, NextResponse } from 'next/server';
import { createMagicLinkToken } from '@/lib/auth/magic-link';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const magicLink = await createMagicLinkToken(email);

    // In development / testing environment, return the verification URL and token directly.
    // In production, dispatch email via SMTP / SendGrid / Postmark.
    return NextResponse.json({
      message: 'Magic link generated successfully',
      email: email.toLowerCase().trim(),
      expiresAt: magicLink.expiresAt.toISOString(),
      verificationUrl: magicLink.url,
      token: process.env.NODE_ENV === 'production' ? undefined : magicLink.token,
    });
  } catch (error: any) {
    console.error('Magic link generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate magic link' },
      { status: 500 }
    );
  }
}
