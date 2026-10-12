import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

describe('Canonical Host 301 Redirect (Prompt 07)', () => {
  it('redirects www host to apex host with 301 status', async () => {
    const req = new NextRequest('https://www.project-manager.calara.agency/login', {
      headers: {
        host: 'www.project-manager.calara.agency',
        'x-forwarded-proto': 'https',
      },
    })

    const res = await middleware(req)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://project-manager.calara.agency/login')
  })

  it('preserves query parameters on 301 redirect', async () => {
    const req = new NextRequest('https://www.project-manager.calara.agency/login?redirectTo=%2Fdashboard', {
      headers: {
        host: 'www.project-manager.calara.agency',
        'x-forwarded-proto': 'https',
      },
    })

    const res = await middleware(req)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://project-manager.calara.agency/login?redirectTo=%2Fdashboard')
  })

  it('does not redirect requests on canonical apex host', async () => {
    const req = new NextRequest('https://project-manager.calara.agency/login', {
      headers: {
        host: 'project-manager.calara.agency',
        'x-forwarded-proto': 'https',
      },
    })

    const res = await middleware(req)
    expect(res.status).not.toBe(301)
  })
})
