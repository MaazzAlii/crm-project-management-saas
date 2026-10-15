import { NextRequest, NextResponse } from 'next/server';
import { revokeSessionAndClearCookies } from '@/lib/auth/logout';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await revokeSessionAndClearCookies(request);
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
