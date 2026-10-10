import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { verifyMagicLinkToken } from '@/lib/auth/magic-link'
import { generateRefreshToken } from '@/lib/auth/jwt'
import { setRefreshTokenCookie } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'

/**
 * Client Portal Auth Callback
 * Handles magic-link verification for portal users.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  const token = url.searchParams.get('token') || url.searchParams.get('token_hash') || url.searchParams.get('code')
  const email = url.searchParams.get('email')

  if (!token || !email) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/client/login'
    loginUrl.search = '?error=auth_failed'
    return NextResponse.redirect(loginUrl)
  }

  try {
    const user = await verifyMagicLinkToken(email, token)
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/client/login'
      loginUrl.search = '?error=auth_failed'
      return NextResponse.redirect(loginUrl)
    }

    // Validate the user is an active portal user
    const clientUser = await queryOne<{ id: string; client_id: string; organization_id: string; is_active: boolean }>(
      'SELECT id, client_id, organization_id, is_active FROM client_users WHERE user_id = $1 AND is_active = true',
      [user.id]
    )

    if (!clientUser) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/client/login'
      loginUrl.search = '?error=no_portal_access'
      return NextResponse.redirect(loginUrl)
    }

    // Generate token family & session
    const tokenFamily = crypto.randomUUID()
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenFamily,
    })

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, token_family, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash, tokenFamily]
    )

    await setRefreshTokenCookie(refreshToken, {}, request.headers)

    // Update last login
    await query(
      'UPDATE client_users SET last_login_at = NOW() WHERE id = $1',
      [clientUser.id]
    )

    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/client/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  } catch (err) {
    console.error('[PORTAL_AUTH_CALLBACK_ERROR]', err)
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/client/login'
    loginUrl.search = '?error=auth_failed'
    return NextResponse.redirect(loginUrl)
  }
}
