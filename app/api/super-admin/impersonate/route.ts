import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { setImpersonationCookie, clearImpersonationCookie } from '@/lib/auth/impersonation'
import { logAuditEvent } from '@/lib/audit/logger'
import { createClient } from '@/lib/supabase/server'

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

    let actorId: string | undefined
    let actorEmail: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      actorId = user?.id
      actorEmail = user?.email
    } catch {}

    await logAuditEvent({
      actorId,
      actorEmail,
      actorIsSuperAdmin: true,
      organizationId,
      action: 'SUPER_ADMIN_IMPERSONATION_START',
      entityType: 'organization',
      entityId: organizationId,
      details: { organizationName, expiresAt },
    })

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

    let actorId: string | undefined
    let actorEmail: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      actorId = user?.id
      actorEmail = user?.email
    } catch {}

    await logAuditEvent({
      actorId,
      actorEmail,
      actorIsSuperAdmin: true,
      action: 'SUPER_ADMIN_IMPERSONATION_END',
      entityType: 'impersonation_session',
      entityId: 'support_mode',
      details: { terminatedAt: new Date().toISOString() },
    })

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
