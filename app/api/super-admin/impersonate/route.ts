import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import {
  setOriginCookie,
  clearOriginCookie,
  getImpersonationOriginContext,
  ORIGIN_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
} from '@/lib/auth/impersonation'
import { generateAccessToken } from '@/lib/auth/jwt'
import { getDefaultSessionConfig, getCookieSecure, getCookieDomain } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit/logger'
import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    // Support exit action via POST as well as DELETE
    if (body.action === 'exit') {
      return handleExitImpersonation()
    }

    await requireSuperAdmin()
    const { organizationId, organizationName, targetUserId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // Resolve caller's super admin identity
    const session = await getCurrentSessionContext()
    const superAdminId = session?.user?.id
    const superAdminEmail = session?.user?.email || 'super_admin@innoventix.internal'

    if (!superAdminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin session not found', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 1. Resolve Target User and Organization Membership
    let targetUser: any = null
    if (targetUserId) {
      targetUser = await queryOne<any>(
        `SELECT u.id, u.email, u.full_name, u.is_active, u.role as system_role, om.role as org_role
         FROM users u
         LEFT JOIN organization_members om ON om.user_id = u.id AND om.organization_id = $1
         WHERE u.id = $2`,
        [organizationId, targetUserId]
      )
    } else {
      // Find the primary owner or admin of the organization
      targetUser = await queryOne<any>(
        `SELECT u.id, u.email, u.full_name, u.is_active, u.role as system_role, om.role as org_role
         FROM organization_members om
         JOIN users u ON u.id = om.user_id
         WHERE om.organization_id = $1 AND u.is_active = true AND u.deleted_at IS NULL
         ORDER BY CASE WHEN om.role = 'owner' THEN 1 WHEN om.role = 'admin' THEN 2 ELSE 3 END
         LIMIT 1`,
        [organizationId]
      )
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No active user found to impersonate for this organization.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 2. Guardrail: Cannot impersonate another Super Admin
    const isTargetSuperAdmin =
      targetUser.system_role === 'super_admin' ||
      !!(await queryOne('SELECT id FROM super_admins WHERE user_id = $1', [targetUser.id]))

    if (isTargetSuperAdmin) {
      return NextResponse.json(
        { error: 'Security policy violation: Cannot impersonate another Super Admin.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. Guardrail: Cannot impersonate inactive or deactivated user
    if (targetUser.is_active === false) {
      return NextResponse.json(
        { error: 'Cannot impersonate an inactive or deactivated user account.', code: 'USER_INACTIVE' },
        { status: 400 }
      )
    }

    // 4. Resolve Organization details
    const orgRecord = await queryOne<any>(
      `SELECT id, name, is_suspended FROM organizations WHERE id = $1`,
      [organizationId]
    )

    if (!orgRecord) {
      return NextResponse.json(
        { error: 'Target organization not found.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const effectiveOrgName = orgRecord.name || organizationName || 'Target Organization'
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString()

    // 5. Origin Cookie and Swapped Session Generation
    const originPayload = {
      superAdminId,
      superAdminEmail,
      impersonatedUserId: targetUser.id,
      impersonatedUserEmail: targetUser.email,
      impersonatedUserName: targetUser.full_name || null,
      impersonatedOrgId: organizationId,
      impersonatedOrgName: effectiveOrgName,
      startedAt: now.toISOString(),
      expiresAt,
    }

    const swappedSessionToken = generateAccessToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: (targetUser.org_role || 'member') as any,
      orgId: organizationId,
    })

    // 6. Set Cookies with Atomicity & Rollback Safety
    const cookieStore = await cookies()
    const sessionConfig = getDefaultSessionConfig()

    try {
      await setOriginCookie(originPayload)

      cookieStore.set(sessionConfig.cookieName, swappedSessionToken, {
        httpOnly: true,
        secure: getCookieSecure(),
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
        domain: getCookieDomain(),
      })

      // Clean legacy cookie
      cookieStore.delete(LEGACY_COOKIE_NAME)
    } catch (cookieErr: any) {
      // Rollback both cookies on failure
      cookieStore.delete(ORIGIN_COOKIE_NAME)
      cookieStore.delete(sessionConfig.cookieName)
      cookieStore.delete(LEGACY_COOKIE_NAME)
      throw cookieErr
    }

    // 7. Audit Log
    await logAuditEvent({
      actorId: superAdminId,
      actorEmail: superAdminEmail,
      actorIsSuperAdmin: true,
      organizationId,
      action: 'IMPERSONATION_STARTED',
      entityType: 'user',
      entityId: targetUser.id,
      details: {
        impersonated_by: superAdminId,
        impersonated_as: targetUser.id,
        impersonated_user_email: targetUser.email,
        impersonated_org_id: organizationId,
        organizationName: effectiveOrgName,
        expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Impersonation session active as ${targetUser.email} in ${effectiveOrgName}`,
      impersonatedUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.full_name,
        role: targetUser.org_role,
      },
      organization: {
        id: organizationId,
        name: effectiveOrgName,
      },
      expiresAt,
    })
  } catch (err: any) {
    if (err.code === 'CONFIG_ERROR') {
      return NextResponse.json(
        { error: err.message, code: 'CONFIG_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Unauthorized impersonation request', code: 'IMPERSONATION_FAILED' },
      { status: err.status || 403 }
    )
  }
}

export async function DELETE() {
  return handleExitImpersonation()
}

/**
 * Exits impersonation mode, restores super admin session, and cleans up cookies.
 */
async function handleExitImpersonation() {
  const cookieStore = await cookies()
  const sessionConfig = getDefaultSessionConfig()

  try {
    const origin = await getImpersonationOriginContext()

    if (!origin) {
      // Not actively impersonating, clean up any residual cookies
      await clearOriginCookie()
      return NextResponse.json({
        success: true,
        message: 'No active impersonation session found.',
      })
    }

    const { superAdminId, superAdminEmail, impersonatedUserId, impersonatedOrgId } = origin

    // Restore super admin session
    try {
      const superAdminUser = await queryOne<any>(
        'SELECT id, email, full_name FROM users WHERE id = $1',
        [superAdminId]
      )

      if (superAdminUser) {
        const restoredToken = generateAccessToken({
          userId: superAdminUser.id,
          email: superAdminUser.email,
          role: 'super_admin' as any,
        })

        cookieStore.set(sessionConfig.cookieName, restoredToken, {
          httpOnly: true,
          secure: getCookieSecure(),
          sameSite: 'lax',
          path: '/',
          maxAge: 1800,
          domain: getCookieDomain(),
        })
      } else {
        // Super admin user no longer exists, force re-login
        cookieStore.delete(sessionConfig.cookieName)
      }
    } catch {
      // If restore fails, delete session cookie to require re-login
      cookieStore.delete(sessionConfig.cookieName)
    }

    // Always clear origin and legacy cookies
    await clearOriginCookie()

    // Audit Log Termination
    await logAuditEvent({
      actorId: superAdminId,
      actorEmail: superAdminEmail,
      actorIsSuperAdmin: true,
      organizationId: impersonatedOrgId,
      action: 'SUPER_ADMIN_IMPERSONATION_END',
      entityType: 'impersonation_session',
      entityId: impersonatedUserId,
      details: {
        terminatedAt: new Date().toISOString(),
        impersonated_by: superAdminId,
        impersonated_as: impersonatedUserId,
        impersonated_org_id: impersonatedOrgId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Impersonation ended successfully. Super Admin session restored.',
    })
  } catch (err: any) {
    // If exit encounters unhandled error, ensure cookies are wiped clean
    try {
      await clearOriginCookie()
      cookieStore.delete(sessionConfig.cookieName)
    } catch {}

    return NextResponse.json(
      { error: err.message || 'Failed to exit impersonation mode', code: 'EXIT_FAILED' },
      { status: 403 }
    )
  }
}
