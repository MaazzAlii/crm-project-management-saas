'use server'

import { requirePortalSession } from '@/lib/portal/auth'
import { query, queryOne } from '@/lib/db'
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

  // Security: verify the project belongs to this client before acting
  const project = await queryOne<{
    id: string
    title: string
    client_id: string
    organization_id: string
  }>(
    'SELECT id, title, client_id, organization_id FROM projects WHERE id = $1 AND client_id = $2',
    [projectId, clientId]
  )

  if (!project) {
    return { success: false, error: 'Project not found or access denied.' }
  }

  // Verify deliverable belongs to this project
  const deliverable = await queryOne<{
    id: string
    title: string
    status: string
    project_id: string
  }>(
    'SELECT id, title, status, project_id FROM deliverables WHERE id = $1 AND project_id = $2',
    [deliverableId, projectId]
  )

  if (!deliverable) {
    return { success: false, error: 'Deliverable not found.' }
  }

  if (deliverable.status === 'approved') {
    return { success: false, error: 'This deliverable is already approved.' }
  }

  // Update deliverable status
  try {
    await query(
      `UPDATE deliverables
       SET status = 'approved', client_feedback = NULL, updated_at = NOW()
       WHERE id = $1`,
      [deliverableId]
    )
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update deliverable' }
  }

  // Fire in-app notification to the org team (best effort)
  try {
    await query(
      `INSERT INTO in_app_notifications (organization_id, type, title, body, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId,
        'deliverable_approved',
        'Deliverable Approved by Client',
        `"${deliverable.title}" was approved by the client for project "${project.title}".`,
        `/projects/${projectId}`,
        JSON.stringify({
          deliverable_id: deliverableId,
          project_id: projectId,
          client_id: clientId,
        }),
      ]
    )
  } catch {
    // Non-blocking
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

  // Security: verify project belongs to this client
  const project = await queryOne<{
    id: string
    title: string
    client_id: string
    organization_id: string
    assigned_to: string | null
  }>(
    'SELECT id, title, client_id, organization_id, assigned_to FROM projects WHERE id = $1 AND client_id = $2',
    [projectId, clientId]
  )

  if (!project) {
    return { success: false, error: 'Project not found or access denied.' }
  }

  const deliverable = await queryOne<{
    id: string
    title: string
    project_id: string
  }>(
    'SELECT id, title, project_id FROM deliverables WHERE id = $1 AND project_id = $2',
    [deliverableId, projectId]
  )

  if (!deliverable) {
    return { success: false, error: 'Deliverable not found.' }
  }

  // Update deliverable: set revision_required + store feedback
  try {
    await query(
      `UPDATE deliverables
       SET status = 'revision_required', client_feedback = $1, updated_at = NOW()
       WHERE id = $2`,
      [feedback.trim(), deliverableId]
    )
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update deliverable' }
  }

  // Create an internal revision task for the team
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3) // Default: 3 days

  try {
    await query(
      `INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, 'todo', 'high', $5, $6)`,
      [
        organizationId,
        projectId,
        `Revision: ${deliverable.title}`,
        `Client requested revisions:\n\n${feedback.trim()}`,
        dueDate.toISOString().split('T')[0],
        project.assigned_to || null,
      ]
    )
  } catch (err) {
    console.error('Failed to create revision task:', err)
  }

  // In-app notification to org
  try {
    await query(
      `INSERT INTO in_app_notifications (organization_id, type, title, body, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId,
        'deliverable_revision_requested',
        'Client Requested Revisions',
        `Client requested revisions on "${deliverable.title}" for project "${project.title}".`,
        `/projects/${projectId}`,
        JSON.stringify({
          deliverable_id: deliverableId,
          project_id: projectId,
          client_id: clientId,
          feedback: feedback.trim().substring(0, 200),
        }),
      ]
    )
  } catch {
    // Non-blocking
  }

  revalidatePath(`/client/projects/${projectId}`)
  revalidatePath('/client/dashboard')
  return { success: true }
}
