'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { WeeklyReportFigures } from '@/lib/ai/features/report-narrative'
import { WeeklyReportModal } from './WeeklyReportModal'

interface WeeklyReportButtonProps {
  initialFigures: WeeklyReportFigures
  aiEnabled?: boolean
  className?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function WeeklyReportButton({
  initialFigures,
  aiEnabled = true,
  className = '',
  label = 'Generate Weekly Report',
  size = 'md',
}: WeeklyReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Zero-Button Rule: Completely omitted if AI features are disabled
  if (!aiEnabled) {
    return null
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-5 py-3 text-sm'
      : 'px-4 py-2 text-xs'

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition shrink-0 ${sizeClasses} ${className}`}
        title="Synthesize weekly progress report with AI narrative"
      >
        <Sparkles className="w-4 h-4" />
        <span>{label}</span>
      </button>

      <WeeklyReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialFigures={initialFigures}
        aiEnabled={aiEnabled}
      />
    </>
  )
}
