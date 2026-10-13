'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit/logger'
import { revalidatePath } from 'next/cache'
import type { TagRecord } from './types'

export type { TagRecord }

export async function fetchTagsAction(): Promise<TagRecord[]> {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.organization) {
      return []
    }

    const data = await query<TagRecord>(
      `SELECT * FROM tags WHERE organization_id = $1 ORDER BY name ASC`,
      [session.organization.id]
    )

    return data || []
  } catch (err) {
    console.error('fetchTagsAction error:', err)
    return []
  }
}

export async function createTagAction(name: string, color: string = 'sky') {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized session.' }
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      return { error: 'Tag name is required.' }
    }

    let newTag: TagRecord | null = null
    let insertError: any = null

    try {
      newTag = await queryOne<TagRecord>(
        `INSERT INTO tags (organization_id, name, color)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [session.organization.id, trimmedName, color]
      )
    } catch (err) {
      insertError = err
    }

    if (insertError || !newTag) {
      if (insertError?.code === '23505') {
        return { error: 'A tag with this name already exists.' }
      }
      return { error: insertError?.message || 'Database error while creating tag.' }
    }

    revalidatePath('/clients')
    return { success: true, tag: newTag }
  } catch (error: any) {
    console.error('createTagAction error:', error)
    return { error: error?.message || 'Internal server error.' }
  }
}

export async function deleteTagAction(tagId: string) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    const canDelete = session.role === 'owner' || session.role === 'admin' || session.isSuperAdmin
    if (!canDelete) {
      return { error: 'Forbidden. Only organization owners and admins can delete tags.' }
    }

    try {
      await query(
        `DELETE FROM tags WHERE id = $1 AND organization_id = $2`,
        [tagId, session.organization.id]
      )
    } catch (err: any) {
      return { error: err?.message || 'Failed to delete tag.' }
    }

    revalidatePath('/clients')
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to delete tag.' }
  }
}

export async function updateClientTagsAction(clientId: string, tags: string[]) {
  try {
    const session = await getCurrentSessionContext()

    if (!session || !session.user || !session.organization) {
      return { error: 'Unauthorized.' }
    }

    try {
      await query(
        `UPDATE clients SET tags = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
        [tags, clientId, session.organization.id]
      )
    } catch (err: any) {
      return { error: err?.message || 'Failed to update client tags.' }
    }

    try {
      await logAuditEvent({
        actorId: session.user.id,
        action: 'CLIENT_TAGS_UPDATED',
        targetType: 'client',
        targetId: clientId,
        details: { tags, organizationId: session.organization.id },
      })
    } catch (e) {}

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error?.message || 'Failed to update client tags.' }
  }
}
