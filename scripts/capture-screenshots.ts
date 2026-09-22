import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'screenshots')

const SCREENS = [
  {
    name: '01-dashboard.png',
    path: '/dashboard',
    auth: true,
    description: 'Executive Dashboard — KPIs, active workload, project status distribution, and AI weekly executive briefing',
  },
  {
    name: '02-clients-crm.png',
    path: '/clients',
    auth: true,
    description: 'CRM Clients Management — Client directory, communication modes (manual vs connected), and platform channel indicators',
  },
  {
    name: '03-leads-pipeline.png',
    path: '/leads',
    auth: true,
    description: 'CRM Sales & Leads Pipeline — Kanban pipeline stages with 0–100 AI Lead Scoring and deal value analytics',
  },
  {
    name: '04-projects-board.png',
    path: '/projects',
    auth: true,
    description: 'Project Management — Active projects list, deliverable status tracking, budget health, and deliverable review flows',
  },
  {
    name: '05-tasks-board.png',
    path: '/tasks',
    auth: true,
    description: 'Tasks & Team Workload — Multi-status task board with priority badges, assignee avatars, and due date filters',
  },
  {
    name: '06-unified-inbox.png',
    path: '/inbox',
    auth: true,
    description: 'Communication Hub — Multi-channel unified inbox (Slack, WhatsApp, Email, Discord) with AI reply generator and auto-task extraction',
  },
  {
    name: '07-analytics-overview.png',
    path: '/analytics',
    auth: true,
    description: 'Executive Analytics — Revenue pipeline breakdown, status donut charts, delivery velocity, and AI briefing generation',
  },
  {
    name: '08-analytics-revenue.png',
    path: '/analytics/revenue',
    auth: true,
    description: 'Revenue & Financial Reporting — Revenue ledger, billable breakdown by client and project type, and exportable CSV reports',
  },
  {
    name: '09-plan-usage.png',
    path: '/analytics/plan-usage',
    auth: true,
    description: 'Resource & Quota Utilization — Plan limits monitoring across team seats, clients, projects, storage, and AI monthly tokens',
  },
  {
    name: '10-ai-settings.png',
    path: '/settings/ai',
    auth: true,
    description: 'AI Configuration & Usage Controls — 3-tier capability toggles (reply suggestions, lead scoring, task extraction, weekly reports) and live token metrics',
  },
  {
    name: '11-audit-log.png',
    path: '/settings/audit-log',
    auth: true,
    description: 'Audit & Compliance Logging — Immutable append-only activity trail with event filtering, actor details, and RFC-compliant CSV export',
  },
  {
    name: '12-billing-settings.png',
    path: '/settings/billing',
    auth: true,
    description: 'Subscription & Invoicing — Active plan details, Stripe customer portal access, invoice history, and quota proximity alerts',
  },
  {
    name: '13-client-portal-login.png',
    path: '/client/login',
    auth: false,
    description: 'Isolated Client Portal — Dedicated second authentication boundary for external agency clients with magic link verification',
  },
  {
    name: '14-super-admin-dashboard.png',
    path: '/super-admin/dashboard',
    auth: true,
    description: 'Super Admin Platform Control — Cross-tenant platform metrics, system health, revenue aggregations, and emergency kill switches',
  },
  {
    name: '15-super-admin-orgs.png',
    path: '/super-admin/organizations',
    auth: true,
    description: 'Multi-Tenant Organization Management — Organization directory, tenant suspension controls, and support impersonation',
  },
]

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  console.log(`Starting automated screenshot capture targeting ${BASE_URL}...`)
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High-res retina
  })

  const results: Array<{ name: string; path: string; status: string; description: string }> = []

  for (const screen of SCREENS) {
    console.log(`\nCapturing [${screen.name}] at ${screen.path}...`)
    const page = await context.newPage()

    try {
      if (screen.auth) {
        await context.addCookies([
          {
            name: 'dev_super_admin',
            value: 'true',
            domain: 'localhost',
            path: '/',
          },
        ])
      } else {
        await context.clearCookies()
      }

      await page.goto(`${BASE_URL}${screen.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })

      // Ensure content is loaded, styles rendered, and animations settle
      await page.waitForTimeout(2000)

      const filePath = path.join(OUTPUT_DIR, screen.name)
      await page.screenshot({
        path: filePath,
        fullPage: false, // Standard 1440x900 viewport hero view
      })

      console.log(`  ✓ Successfully saved: ${filePath}`)
      results.push({ ...screen, status: 'SUCCESS' })
    } catch (err: any) {
      console.error(`  ✗ Error capturing ${screen.path}:`, err.message)
      results.push({ ...screen, status: `ERROR: ${err.message}` })
    } finally {
      await page.close()
    }
  }

  await browser.close()

  console.log('\n=======================================')
  console.log('SCREENSHOT CAPTURE COMPLETED')
  console.log('=======================================')
  results.forEach((r) => {
    console.log(`${r.status === 'SUCCESS' ? '✅' : '❌'} ${r.name.padEnd(30)} -> ${r.path}`)
  })
}

run().catch((err) => {
  console.error('Fatal error running screenshot script:', err)
  process.exit(1)
})
