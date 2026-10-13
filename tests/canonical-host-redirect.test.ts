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

  it('redirects to canonical apex host when X-Forwarded-Host contains allowlisted www domain behind reverse proxy', async () => {
    const req = new NextRequest('https://project-manager.calara.agency/login', {
      headers: {
        host: 'project-manager.calara.agency',
        'x-forwarded-host': 'www.project-manager.calara.agency',
        'x-forwarded-proto': 'https',
      },
    })

    const res = await middleware(req)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://project-manager.calara.agency/login')
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

  it('does not redirect and returns no Location header when X-Forwarded-Host is not allowlisted (e.g. www.evil.com)', async () => {
    const req = new NextRequest('https://project-manager.calara.agency/login', {
      headers: {
        host: 'project-manager.calara.agency',
        'x-forwarded-host': 'www.evil.com',
        'x-forwarded-proto': 'https',
      },
    })

    const res = await middleware(req)
    expect(res.status).not.toBe(301)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects local upstream request (127.0.0.1:3000) forwarding allowlisted X-Forwarded-Host with port 443 to canonical apex', async () => {
    const req = new NextRequest('https://127.0.0.1:3000/login', {
      headers: {
        host: '127.0.0.1:3000',
        'x-forwarded-host': 'www.project-manager.calara.agency:443',
        'x-forwarded-proto': 'https',
      },
    })

    const res = await middleware(req)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://project-manager.calara.agency/login')
  })
})
