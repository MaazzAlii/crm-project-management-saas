'use server'

import { getCurrentSessionContext } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    let tags: TagRecord[] = []

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('organization_id', session.organization.id)
        .order('name', { ascending: true })

      if (!error && data) {
        tags = data as TagRecord[]
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

    const supabase = await createClient()

    let newTag: TagRecord | null = null
    let insertError: any = null

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          organization_id: session.organization.id,
          name: trimmedName,
          color,
        })
        .select('*')
        .single()

      newTag = data as TagRecord
      insertError = error
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

    const supabase = await createClient()

    try {
      await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
        .eq('organization_id', session.organization.id)
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

    const supabase = await createClient()

    try {
      await supabase
        .from('clients')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', clientId)
        .eq('organization_id', session.organization.id)
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
