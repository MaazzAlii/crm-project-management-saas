import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { setImpersonationCookie, clearImpersonationCookie } from '@/lib/auth/impersonation'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()
    const body = await request.json()
    const { organizationId, organizationName } = body

    if (!organizationId || !organizationName) {
      return NextResponse.json(
        { error: 'organizationId and organizationName are required' },
        { status: 400 }
      )
    }

    const expiresAt = await setImpersonationCookie(organizationId, organizationName)

    // Audit Log Entry
    console.log(
      `[AUDIT_LOG] Super Admin started support impersonation session for organization ${organizationId} (${organizationName}). Expires at: ${expiresAt}`
    )

    try {
      const adminClient = createAdminClient()
      await adminClient.from('audit_logs').insert({
        action: 'SUPER_ADMIN_IMPERSONATION_START',
        target_resource: `organization:${organizationId}`,
        metadata: { organizationName, expiresAt },
      })
    } catch (auditErr) {
      console.warn('[AUDIT_LOG_DB_WARN] Could not persist audit log to DB:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: `Support access active for ${organizationName}`,
      expiresAt,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unauthorized impersonation request' },
      { status: 403 }
    )
  }
}

export async function DELETE() {
  try {
    await requireSuperAdmin()
    await clearImpersonationCookie()

    console.log('[AUDIT_LOG] Super Admin ended support impersonation session.')

    try {
      const adminClient = createAdminClient()
      await adminClient.from('audit_logs').insert({
        action: 'SUPER_ADMIN_IMPERSONATION_END',
        target_resource: 'impersonation_session',
      })
    } catch (auditErr) {
      console.warn('[AUDIT_LOG_DB_WARN] Could not persist audit log to DB:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Support access ended successfully',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to exit support mode' },
      { status: 403 }
    )
  }
}
