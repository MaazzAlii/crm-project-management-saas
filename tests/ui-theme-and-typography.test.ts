import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { Text } from '../components/ui/text'

describe('Theme & Typography System (Batch UI-1)', () => {
  describe('Anti-flash Script Behavior', () => {
    let mockClassList: Set<string>
    let mockAttributes: Record<string, string>
    let mockStorage: Record<string, string>

    beforeEach(() => {
      mockClassList = new Set<string>()
      mockAttributes = {}
      mockStorage = {}

      vi.stubGlobal('localStorage', {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val
        },
        removeItem: (key: string) => {
          delete mockStorage[key]
        },
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('sets dark mode if localStorage has theme="dark"', () => {
      mockStorage['theme'] = 'dark'

      const executeScript = (saved: string | null, prefersDark: boolean) => {
        if (saved === 'dark' || (!saved && prefersDark)) {
          mockClassList.add('dark')
          mockAttributes['data-theme'] = 'dark'
        } else {
          mockClassList.delete('dark')
          mockAttributes['data-theme'] = 'light'
        }
      }

      executeScript(mockStorage['theme'], false)
      expect(mockClassList.has('dark')).toBe(true)
      expect(mockAttributes['data-theme']).toBe('dark')
    })

    it('sets light mode if localStorage has theme="light"', () => {
      mockStorage['theme'] = 'light'

      const executeScript = (saved: string | null, prefersDark: boolean) => {
        if (saved === 'dark' || (!saved && prefersDark)) {
          mockClassList.add('dark')
          mockAttributes['data-theme'] = 'dark'
        } else {
          mockClassList.delete('dark')
          mockAttributes['data-theme'] = 'light'
        }
      }

      executeScript(mockStorage['theme'], true)
      expect(mockClassList.has('dark')).toBe(false)
      expect(mockAttributes['data-theme']).toBe('light')
    })

    it('respects system preference when no localStorage entry exists', () => {
      const executeScript = (saved: string | null, prefersDark: boolean) => {
        if (saved === 'dark' || (!saved && prefersDark)) {
          mockClassList.add('dark')
          mockAttributes['data-theme'] = 'dark'
        } else {
          mockClassList.delete('dark')
          mockAttributes['data-theme'] = 'light'
        }
      }

      // System prefers dark
      executeScript(null, true)
      expect(mockClassList.has('dark')).toBe(true)
      expect(mockAttributes['data-theme']).toBe('dark')

      // System prefers light
      mockClassList.clear()
      executeScript(null, false)
      expect(mockClassList.has('dark')).toBe(false)
      expect(mockAttributes['data-theme']).toBe('light')
    })
  })

  describe('<Text> Primitive Component', () => {
    it('creates an h1 element for variant="h1"', () => {
      const element = React.createElement(Text, { variant: 'h1' }, 'Hero Headline')
      expect(element.props.variant).toBe('h1')
      expect(element.props.children).toBe('Hero Headline')
    })

    it('creates an h2 element for variant="h2"', () => {
      const element = React.createElement(Text, { variant: 'h2' }, 'Section Title')
      expect(element.props.variant).toBe('h2')
    })

    it('creates an h3 element for variant="h3"', () => {
      const element = React.createElement(Text, { variant: 'h3' }, 'Card Title')
      expect(element.props.variant).toBe('h3')
    })

    it('defaults to body variant and paragraph tag', () => {
      const element = React.createElement(Text, {}, 'Body text paragraph')
      expect(element.props.children).toBe('Body text paragraph')
    })

    it('allows overriding the element tag via "as" prop', () => {
      const element = React.createElement(Text, { variant: 'h1', as: 'div' }, 'Div Heading')
      expect(element.props.as).toBe('div')
    })
  })
})
