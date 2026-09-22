'use client'

import { TAG_COLORS } from '@/app/(dashboard)/clients/tags/types'
import { Tag as TagIcon, X } from 'lucide-react'

interface TagBadgeProps {
  name: string
  color?: string
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export function TagBadge({ name, color = 'sky', onRemove, size = 'sm' }: TagBadgeProps) {
  const colorMeta = TAG_COLORS.find((c) => c.value === color.toLowerCase()) || TAG_COLORS[0]

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg border tracking-wide transition ${colorMeta.bg} ${sizeClasses}`}
    >
      <TagIcon className={size === 'sm' ? 'h-2.5 w-2.5 opacity-70' : 'h-3 w-3 opacity-70'} />
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 rounded p-0.5 hover:bg-black/20 text-current transition"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  )
}
