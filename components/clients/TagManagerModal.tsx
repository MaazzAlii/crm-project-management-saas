'use client'

import { useState, useEffect } from 'react'
import {
  fetchTagsAction,
  createTagAction,
  deleteTagAction,
} from '@/app/(dashboard)/clients/tags/actions'
import { TAG_COLORS, type TagRecord } from '@/app/(dashboard)/clients/tags/types'
import { TagBadge } from './TagBadge'
import { X, Tag as TagIcon, Plus, Trash2, Loader2 } from 'lucide-react'

interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onTagsUpdated?: () => void
}

export function TagManagerModal({ isOpen, onClose, onTagsUpdated }: TagManagerModalProps) {
  const [tags, setTags] = useState<TagRecord[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('sky')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    setFetching(true)
    const data = await fetchTagsAction()
    setTags(data)
    setFetching(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const res = await createTagAction(name, color)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setName('')
      loadTags()
      if (onTagsUpdated) onTagsUpdated()
    }
  }

  const handleDelete = async (tagId: string) => {
    const res = await deleteTagAction(tagId)
    if (res.success) {
      setTags((prev) => prev.filter((t) => t.id !== tagId))
      if (onTagsUpdated) onTagsUpdated()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Client Tag Manager</h2>
              <p className="text-xs text-muted-foreground">Manage organization tags and categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Create Tag Form */}
        <form onSubmit={handleCreate} className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
          <label className="block text-xs font-bold text-foreground">Create New Tag</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name (e.g. VIP, Retainer)"
              className="sm:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none"
            />
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {TAG_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Tag
            </button>
          </div>
        </form>

        {/* Existing Tags List */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-muted-foreground">Existing Tags ({tags.length})</label>
          {fetching ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading organization tags...
            </div>
          ) : tags.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-4 text-center">No tags created yet.</div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card/40 hover:border-border/80 transition"
                >
                  <TagBadge name={tag.name} color={tag.color} size="md" />
                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                    title="Delete Tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-border pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
