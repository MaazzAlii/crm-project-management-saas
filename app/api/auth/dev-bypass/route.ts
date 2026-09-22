import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_DEV_AUTH_BYPASS !== 'true'
  ) {
    return NextResponse.json({ error: 'Dev bypass not allowed in this environment' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  response.cookies.set('dev_super_admin', 'true', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}
