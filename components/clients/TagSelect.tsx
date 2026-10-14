'use client'

import { useState, useEffect } from 'react'
import { fetchTagsAction, createTagAction } from '@/app/(dashboard)/clients/tags/actions'
import { TAG_COLORS, type TagRecord } from '@/app/(dashboard)/clients/tags/types'
import { TagBadge } from './TagBadge'
import { Plus, Tag as TagIcon, Check, Loader2 } from 'lucide-react'

interface TagSelectProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagSelect({ selectedTags, onChange }: TagSelectProps) {
  const [availableTags, setAvailableTags] = useState<TagRecord[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('sky')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function loadTags() {
      setFetching(true)
      const tags = await fetchTagsAction()
      setAvailableTags(tags)
      setFetching(false)
    }
    loadTags()
  }, [])

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName))
    } else {
      onChange([...selectedTags, tagName])
    }
  }

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return
    setLoading(true)

    const res = await createTagAction(newTagName, newTagColor)
    setLoading(false)

    if (res.success && res.tag) {
      setAvailableTags((prev) => [...prev, res.tag!])
      if (!selectedTags.includes(res.tag.name)) {
        onChange([...selectedTags, res.tag.name])
      }
      setNewTagName('')
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags Pills Display */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 rounded-xl border border-border bg-background">
        {selectedTags.length === 0 ? (
          <span className="text-xs text-muted-foreground italic px-1">No tags selected</span>
        ) : (
          selectedTags.map((tagName) => {
            const tagObj = availableTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase())
            return (
              <TagBadge
                key={tagName}
                name={tagName}
                color={tagObj?.color || 'sky'}
                onRemove={() => handleToggleTag(tagName)}
                size="md"
              />
            )
          })
        )}
      </div>

      {/* Available Tags Toggle List */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
          <span>Select from available tags:</span>
          {!isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition"
            >
              <Plus className="h-3 w-3" />
              Create Tag
            </button>
          )}
        </div>

        {fetching ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tags...
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name)
              const colorMeta = TAG_COLORS.find((c) => c.value === tag.color.toLowerCase()) || TAG_COLORS[0]
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.name)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                    isSelected
                      ? `${colorMeta.bg} ring-1 ring-primary`
                      : 'border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <TagIcon className="h-3 w-3 opacity-60" />
                  <span>{tag.name}</span>
                  {isSelected && <Check className="h-3 w-3 ml-0.5 text-primary" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* On-The-Fly Tag Creator Inline Form */}
      {isCreating && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-primary" />
            Create New Client Tag
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g., Enterprise, Follow Up)"
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-placeholder focus:border-primary focus:outline-none"
            />

            <select
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {TAG_COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !newTagName.trim()}
              onClick={handleCreateNewTag}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Save Tag
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
