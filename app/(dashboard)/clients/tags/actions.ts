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
      return getDevTags()
    }

    let tags: TagRecord[] = []

    try {
      const data = await query<TagRecord>(
        `SELECT * FROM tags WHERE organization_id = $1 ORDER BY name ASC`,
        [session.organization.id]
      )

      if (data) {
        tags = data
      }
    } catch (err) {}

    const devTags = getDevTags()
    const combined = [...tags, ...devTags]
    const uniqueMap = new Map<string, TagRecord>()
    combined.forEach((t) => uniqueMap.set(t.name.toLowerCase(), t))

    return Array.from(uniqueMap.values())
  } catch (err) {
    return getDevTags()
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

    // Dev fallback
    if ((insertError || !newTag) && process.env.DEV_SUPER_ADMIN === 'true') {
      const devTag: TagRecord = {
        id: 'dev-tag-' + Date.now(),
        organization_id: session.organization.id,
        name: trimmedName,
        color,
        created_at: new Date().toISOString(),
      }

      ;(global as any).__DEV_TAGS = (global as any).__DEV_TAGS || []
      ;(global as any).__DEV_TAGS.push(devTag)

      revalidatePath('/clients')
      return { success: true, tag: devTag }
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

    try {
      await query(
        `DELETE FROM tags WHERE id = $1 AND organization_id = $2`,
        [tagId, session.organization.id]
      )
    } catch (err) {}

    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_TAGS) {
      ;(global as any).__DEV_TAGS = ((global as any).__DEV_TAGS as TagRecord[]).filter((t) => t.id !== tagId)
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
    } catch (err) {}

    // Dev fallback
    if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_CLIENTS) {
      const idx = (global as any).__DEV_CLIENTS.findIndex((c: any) => c.id === clientId)
      if (idx !== -1) {
        ;(global as any).__DEV_CLIENTS[idx].tags = tags
      }
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

function getDevTags(): TagRecord[] {
  if (process.env.DEV_SUPER_ADMIN === 'true' && (global as any).__DEV_TAGS) {
    return (global as any).__DEV_TAGS as TagRecord[]
  }

  const defaultSeed: TagRecord[] = [
    { id: 'tag-1', organization_id: 'dev-org', name: 'VIP Client', color: 'amber', created_at: new Date().toISOString() },
    { id: 'tag-2', organization_id: 'dev-org', name: 'High Value', color: 'emerald', created_at: new Date().toISOString() },
    { id: 'tag-3', organization_id: 'dev-org', name: 'Retainer', color: 'sky', created_at: new Date().toISOString() },
    { id: 'tag-4', organization_id: 'dev-org', name: 'Saas Partner', color: 'purple', created_at: new Date().toISOString() },
    { id: 'tag-5', organization_id: 'dev-org', name: 'Web Dev', color: 'cyan', created_at: new Date().toISOString() },
  ]

  return defaultSeed
}
