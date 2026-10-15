import { NextRequest, NextResponse } from 'next/server';
import { revokeSessionAndClearCookies } from '@/lib/auth/logout';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await revokeSessionAndClearCookies(request, '/client/login');
  } catch (error) {
    console.error('Client signout POST error:', error);
    return NextResponse.redirect(new URL('/client/login', request.url));
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return await revokeSessionAndClearCookies(request, '/client/login');
  } catch (error) {
    console.error('Client signout GET error:', error);
    return NextResponse.redirect(new URL('/client/login', request.url));
  }
}
