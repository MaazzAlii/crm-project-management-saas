import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit/logger'

/**
 * Validates the current session is an active portal user with plan access.
 * Call at the top of every server component in the (client-portal) group.
 *
 * Returns { clientUser, clientId, organizationId } on success.
 * Redirects to /client/login on any failure (no session, no portal record, plan not enabled).
 */
export async function requirePortalSession() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/client/login')
  }

  const { data: clientUser } = await supabase
    .from('client_users')
    .select('id, client_id, organization_id, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!clientUser) {
    // Sign out and redirect — the user has a Supabase session but no portal record
    await supabase.auth.signOut()
    redirect('/client/login?error=no_portal_access')
  }

  // Check plan gate: client_portal_enabled must be true on the org's plan
  const { data: planRow } = await supabase
    .from('organization_subscriptions')
    .select('subscription_plans!inner(feature_limits)')
    .eq('organization_id', clientUser.organization_id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const featureLimits = (planRow as any)?.subscription_plans?.feature_limits ?? {}
  if (!featureLimits.client_portal_enabled) {
    redirect('/client/login?error=portal_not_available')
  }

  return {
    clientUser,
    clientId: clientUser.client_id,
    organizationId: clientUser.organization_id,
  }
}

/**
 * Server action: invite a client to the portal by sending a magic link.
 * Only org owners/admins may call this.
 */
export async function inviteClientToPortal(
  clientId: string,
  email: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Authorization: must be org owner or admin
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { success: false, error: 'Only org owners and admins can invite clients.' }
  }

  // Plan gate check
  const { data: planRow } = await supabase
    .from('organization_subscriptions')
    .select('subscription_plans!inner(feature_limits)')
    .eq('organization_id', organizationId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const featureLimits = (planRow as any)?.subscription_plans?.feature_limits ?? {}
  if (!featureLimits.client_portal_enabled) {
    return { success: false, error: 'Client Portal is not available on your current plan. Please upgrade.' }
  }

  // Verify client belongs to this org
  const { data: client } = await supabase
    .from('clients')
    .select('id, organization_id')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!client) {
    return { success: false, error: 'Client not found.' }
  }

  // Check if a portal user already exists for this email/org (active)
  const { data: existingAuth } = await supabase
    .from('client_users')
    .select('id, is_active')
    .eq('client_id', clientId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existingAuth?.is_active) {
    // Re-send the magic link for an existing portal user
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const { error: otpError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${origin}/client/auth/callback`,
      },
    })
    if (otpError) return { success: false, error: otpError.message }
    return { success: true }
  }

  // Create the Supabase auth user if they don't exist, then upsert client_users
  // In production this is done via admin API. Here we generate the invite link directly.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${origin}/client/auth/callback`,
    },
  })

  if (linkError || !linkData.user) {
    return { success: false, error: linkError?.message ?? 'Failed to generate invite link.' }
  }

  // Upsert the client_users row to associate this auth user with the client
  const { error: cuError } = await supabase
    .from('client_users')
    .upsert(
      {
        client_id: clientId,
        user_id: linkData.user.id,
        organization_id: organizationId,
        is_active: true,
        invited_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,organization_id', ignoreDuplicates: false }
    )

  if (cuError) {
    return { success: false, error: cuError.message }
  }

  // Audit trail
  await supabase.from('portal_magic_links').insert({
    client_id: clientId,
    email,
    sent_at: new Date().toISOString(),
    created_by: user.id,
  })

  try {
    await logAuditEvent({
      actorId: user.id,
      organizationId,
      action: 'PORTAL_USER_INVITED',
      targetType: 'client_portal',
      targetId: clientId,
      details: { invitedEmail: email, clientId },
    })
  } catch (e) {}

  return { success: true }
}

/**
 * Server action: revoke a client's portal access.
 */
export async function revokePortalAccess(
  clientUserId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { success: false, error: 'Only org owners and admins can revoke portal access.' }
  }

  const { error } = await supabase
    .from('client_users')
    .update({ is_active: false })
    .eq('id', clientUserId)
    .eq('organization_id', organizationId)

  if (error) return { success: false, error: error.message }

  try {
    await logAuditEvent({
      actorId: user.id,
      organizationId,
      action: 'PORTAL_USER_REVOKED',
      targetType: 'client_portal',
      targetId: clientUserId,
      details: { clientUserId, organizationId },
    })
  } catch (e) {}

  return { success: true }
}
