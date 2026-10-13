'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ResolvedTheme
  mode: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or document on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
      const initialMode =
        stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
      setModeState(initialMode)

      const initialResolved = initialMode === 'system' ? getSystemTheme() : initialMode
      setResolvedTheme(initialResolved)
      applyThemeToDOM(initialResolved)
    } catch {
      const fallback = getSystemTheme()
      setResolvedTheme(fallback)
      applyThemeToDOM(fallback)
    } finally {
      setMounted(true)
    }
  }, [])

  // Listen to system changes when mode === 'system'
  useEffect(() => {
    if (!mounted || mode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const nextResolved = e.matches ? 'dark' : 'light'
      setResolvedTheme(nextResolved)
      applyThemeToDOM(nextResolved)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [mounted, mode])

  const setTheme = (nextMode: ThemeMode) => {
    setModeState(nextMode)
    const nextResolved = nextMode === 'system' ? getSystemTheme() : nextMode
    setResolvedTheme(nextResolved)
    applyThemeToDOM(nextResolved)

    try {
      if (nextMode === 'system') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, nextMode)
      }
    } catch (e) {
      console.warn('Failed to persist theme to localStorage', e)
    }
  }

  const toggle = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      mode,
      setTheme,
      toggle,
    }),
    [resolvedTheme, mode]
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
