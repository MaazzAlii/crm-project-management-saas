'use server'

import { requirePortalSession } from '@/lib/portal/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Approve a deliverable as the portal client.
 * Validates client_id ownership on the server before writing.
 */
export async function approveDeliverable(
  deliverableId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const { clientId, organizationId } = await requirePortalSession()
  const supabase = await createClient()

  // Security: verify the project belongs to this client before acting
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, client_id, organization_id')
    .eq('id', projectId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!project) {
    return { success: false, error: 'Project not found or access denied.' }
  }

  // Verify deliverable belongs to this project
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, title, status, project_id')
    .eq('id', deliverableId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!deliverable) {
    return { success: false, error: 'Deliverable not found.' }
  }

  if (deliverable.status === 'approved') {
    return { success: false, error: 'This deliverable is already approved.' }
  }

  // Update deliverable status
  const { error: updateError } = await supabase
    .from('deliverables')
    .update({ status: 'approved', client_feedback: null, updated_at: new Date().toISOString() })
    .eq('id', deliverableId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Fire in-app notification to the org team (best effort)
  try {
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('user_id')
      .eq('client_id', clientId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    // Notify org members — insert notification for the assigned project member or org-wide
    await supabase.from('in_app_notifications').insert({
      organization_id: organizationId,
      type: 'deliverable_approved',
      title: 'Deliverable Approved by Client',
      body: `"${deliverable.title}" was approved by the client for project "${project.title}".`,
      link: `/projects/${projectId}`,
      metadata: {
        deliverable_id: deliverableId,
        project_id: projectId,
        client_id: clientId,
      },
    })
  } catch {
    // Non-blocking — don't fail the approval if notification fails
  }

  revalidatePath(`/client/projects/${projectId}`)
  revalidatePath('/client/dashboard')
  return { success: true }
}

/**
 * Request a revision on a deliverable.
 * Creates an internal task for the org team and notifies them.
 */
export async function requestRevision(
  deliverableId: string,
  projectId: string,
  feedback: string
): Promise<{ success: boolean; error?: string }> {
  if (!feedback.trim()) {
    return { success: false, error: 'Please describe what revisions are needed.' }
  }

  const { clientId, organizationId } = await requirePortalSession()
  const supabase = await createClient()

  // Security: verify project belongs to this client
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, client_id, organization_id, assigned_to')
    .eq('id', projectId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!project) {
    return { success: false, error: 'Project not found or access denied.' }
  }

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, title, project_id')
    .eq('id', deliverableId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!deliverable) {
    return { success: false, error: 'Deliverable not found.' }
  }

  // Update deliverable: set revision_required + store feedback
  const { error: deliverableError } = await supabase
    .from('deliverables')
    .update({
      status: 'revision_required',
      client_feedback: feedback.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliverableId)

  if (deliverableError) {
    return { success: false, error: deliverableError.message }
  }

  // Create an internal revision task for the team
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3) // Default: 3 days

  const { error: taskError } = await supabase.from('tasks').insert({
    organization_id: organizationId,
    project_id: projectId,
    title: `Revision: ${deliverable.title}`,
    description: `Client requested revisions:\n\n${feedback.trim()}`,
    status: 'todo',
    priority: 'high',
    due_date: dueDate.toISOString().split('T')[0],
    assigned_to: project.assigned_to ?? null,
  })

  if (taskError) {
    // Don't fail — deliverable status was already updated
    console.error('Failed to create revision task:', taskError.message)
  }

  // In-app notification to org
  try {
    await supabase.from('in_app_notifications').insert({
      organization_id: organizationId,
      type: 'deliverable_revision_requested',
      title: 'Client Requested Revisions',
      body: `Client requested revisions on "${deliverable.title}" for project "${project.title}".`,
      link: `/projects/${projectId}`,
      metadata: {
        deliverable_id: deliverableId,
        project_id: projectId,
        client_id: clientId,
        feedback: feedback.trim().substring(0, 200),
      },
    })
  } catch {
    // Non-blocking
  }

  revalidatePath(`/client/projects/${projectId}`)
  revalidatePath('/client/dashboard')
  return { success: true }
}
