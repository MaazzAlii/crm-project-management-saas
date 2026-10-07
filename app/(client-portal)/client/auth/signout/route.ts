import { NextRequest, NextResponse } from 'next/server'
import { deleteRefreshTokenCookie } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  await deleteRefreshTokenCookie()
  return NextResponse.redirect(new URL('/client/login', request.url))
}

export async function GET(request: NextRequest) {
  await deleteRefreshTokenCookie()
  return NextResponse.redirect(new URL('/client/login', request.url))
}
