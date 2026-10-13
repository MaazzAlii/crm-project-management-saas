'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/components/providers/theme-provider'

interface ThemeToggleProps {
  className?: string
  variant?: 'segmented' | 'icon'
}

export function ThemeToggle({ className = '', variant = 'segmented' }: ThemeToggleProps) {
  const { mode, theme, setTheme, toggle } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render static placeholder before mount to eliminate layout shifts
    return (
      <div
        className={`inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5 dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
        aria-hidden="true"
      >
        <div className="h-7 w-7 rounded-md" />
      </div>
    )
  }

  if (variant === 'icon') {
    const isDark = theme === 'dark'
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch theme (currently ${theme})`}
        onClick={toggle}
        className={`relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition-all hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 transition-transform rotate-0 text-slate-300" />
        ) : (
          <Sun className="h-4 w-4 transition-transform rotate-0 text-amber-500" />
        )}
      </button>
    )
  }

  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="h-3.5 w-3.5" />,
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className="h-3.5 w-3.5" />,
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className="h-3.5 w-3.5" />,
    },
  ]

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
    >
      {options.map((opt) => {
        const isActive = mode === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={isActive}
            aria-label={`${opt.label} theme`}
            title={`${opt.label} mode`}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-sky-300 dark:shadow-inner'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {opt.icon}
          </button>
        )
      })}
    </div>
  )
}
