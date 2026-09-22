# Innoventix Platform v2 — Multi-Tenant CRM, Project Management & AI SaaS

A production-ready multi-tenant SaaS platform combining **CRM, Project Management, a Unified Multi-Channel Communication Hub, and AI-Assisted Workflows**, fully self-hosted on a Contabo VPS with a dedicated Super Admin Platform Tier and isolated Client Portal.

---

## 📸 Visual Showcase & Platform Tour

### 1. Executive Dashboard
> **Route**: `/dashboard`  
> Central operational cockpit providing real-time KPI aggregations, active projects breakdown, task workload counters, recent activity streams, and 1-click AI executive summary briefings.

![Executive Dashboard](./public/screenshots/01-dashboard.png)

---

### 2. CRM & Client Management
> **Route**: `/clients`  
> Client directory tracking communication modes (`manual` vs `connected`), platform channel tags (Slack, WhatsApp, Email, Discord), currency, billing schedules, and direct detail views.

![CRM Clients](./public/screenshots/02-clients-crm.png)

---

### 3. CRM Sales & Leads Pipeline (Kanban)
> **Route**: `/leads`  
> Multi-stage Kanban sales pipeline with deal value aggregations and real-time **0–100 AI Lead Scoring** analyzing engagement, deal size, velocity, and delivery history.

![Leads Pipeline](./public/screenshots/03-leads-pipeline.png)

---

### 4. Project Management & Deliverables
> **Route**: `/projects`  
> Centralized projects workspace with budget tracking, status badges, automated scaffolding from reusable templates, and deliverable review workflows.

![Projects Board](./public/screenshots/04-projects-board.png)

---

### 5. Tasks Management & Team Workload
> **Route**: `/tasks`  
> Cross-project task management board with priority indicators, assignee indicators, status columns, and due date filters.

![Tasks Board](./public/screenshots/05-tasks-board.png)

---

### 6. Communication Hub — Unified Inbox
> **Route**: `/inbox`  
> Unified multi-channel communication hub aggregating Slack, WhatsApp (Twilio), Email (SendGrid), and Discord messages with **AI Reply Suggestions** and **Auto-Task Extraction**.

![Unified Inbox](./public/screenshots/06-unified-inbox.png)

---

### 7. Executive Analytics Dashboard
> **Route**: `/analytics`  
> Executive analytics overview featuring revenue pipeline values, interactive status distributions, delivery velocity metrics, and quota utilization cards.

![Analytics Overview](./public/screenshots/07-analytics-overview.png)

---

### 8. Financial & Revenue Analytics
> **Route**: `/analytics/revenue`  
> Granular revenue ledger broken down by client and project type, historical billings, payment schedules, and exportable CSV and print reports.

![Revenue Analytics](./public/screenshots/08-analytics-revenue.png)

---

### 9. Plan Resource & Quota Utilization
> **Route**: `/analytics/plan-usage`  
> Real-time monitoring of tenant resource utilization against plan limits (team members, clients, projects, storage, connected channels, monthly AI tokens) with 4-tier proximity warnings.

![Plan Usage](./public/screenshots/09-plan-usage.png)

---

### 10. AI Settings & Usage Controls
> **Route**: `/settings/ai`  
> 3-tier gated AI management: Platform Kill Switch + Plan Limits + Tenant Toggles. Configure individual capabilities (reply suggestions, lead scoring, auto-tasks, weekly narratives) and audit token consumption.

![AI Settings](./public/screenshots/10-ai-settings.png)

---

### 11. Security & Compliance Audit Log
> **Route**: `/settings/audit-log`  
> Immutable, append-only security audit trail recording 30+ action types with actor details, tenant scoping, IP addresses, timestamp filtering, and RFC-compliant CSV export.

![Audit Log](./public/screenshots/11-audit-log.png)

---

### 12. Billing & Subscription Management
> **Route**: `/settings/billing`  
> Active subscription management powered by Stripe, plan tier overviews, billing history, and self-serve upgrade/downgrade workflows.

![Billing Settings](./public/screenshots/12-billing-settings.png)

---

### 13. Isolated Client Portal
> **Route**: `/client/login`  
> Completely isolated second authentication boundary for external agency clients with passwordless magic-link authentication, strict client-scoped RLS, and deliverable approvals.

![Client Portal Login](./public/screenshots/13-client-portal-login.png)

---

### 14. Super Admin Platform Overview
> **Route**: `/super-admin/dashboard`  
> Master platform operator dashboard monitoring cross-tenant MRR, system health, aggregate volume, active organizations, and emergency kill switches.

![Super Admin Dashboard](./public/screenshots/14-super-admin-dashboard.png)

---

### 15. Super Admin Tenant Organizations
> **Route**: `/super-admin/organizations`  
> Multi-tenant fleet management allowing platform operators to inspect tenant details, manage subscription tiers, trigger support impersonation, or suspend accounts.

![Super Admin Organizations](./public/screenshots/15-super-admin-orgs.png)

---

## 🛠️ Technical Stack & Architecture

- **Frontend & App Framework**: [Next.js 14 (App Router)](https://nextjs.org/) + React 18 + TypeScript + Tailwind CSS
- **Database & Authentication**: Self-Hosted [Supabase Stack](https://supabase.com/) (PostgreSQL 15, GoTrue Auth, PostgREST, Realtime) via Docker Compose
- **Multi-Tenancy & Authorization**: Shared DB schema with foreign-key tenant scoping (`organization_id`) backed by Row-Level Security (RLS) policies
- **Workflow Automation**: Self-hosted [n8n](https://n8n.io/) automation instance on Contabo VPS with HMAC-SHA256 signed event webhooks
- **AI Architecture**: Provider-agnostic orchestration layer supporting OpenAI, Anthropic Claude, Google Gemini, and Mock provider with 3-tier gating
- **Reverse Proxy & TLS**: Nginx with Let's Encrypt automated SSL certificate rotation
- **Testing & Quality Assurance**: Vitest (unit & integration) + Playwright (end-to-end user flows)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/MaazzAlii/crm-project-management-saas.git
cd crm-project-management-saas

cp .env.local.example .env.local
```

### 2. Launch Local Backend Services
```bash
# Launch Supabase PostgreSQL, Auth, PostgREST, Kong, and Studio
docker compose -f docker-compose.local.yml up -d
```

### 3. Install Dependencies & Start Dev Server
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification Suite

```bash
# Run TypeScript type-checking
npm run type-check

# Run Vitest unit & integration test suites (80 tests)
npm test

# Run input validation & XSS sanitization security suite
npx tsx scripts/test-validation.ts

# Run Playwright End-to-End browser test suite
npm run test:e2e

# Run FULL SYSTEM Automated E2E Sub-Menu & Workflow Suite (30 views + form data + weekly report + Slack)
npm run test:e2e:full

# Capture fresh retina screenshots of core screens
npx tsx scripts/capture-screenshots.ts
```

---

## 📢 Automated Slack & Weekly Performance Reporting

The platform features an automated system test runner and weekly executive digest dispatcher (`scripts/run-e2e-full-system.ts` and `lib/notifications/slack-reporter.ts`):

- **Automated Sub-Menu Traversal**: Interacts with and tests all 30 sub-menus, forms, and workflows (Dashboard, Clients CRM, Sales Pipeline, Projects Kanban, Tasks Board, Unified Inbox, Analytics Suite, Settings, Super Admin, Client Portal, Reports, Notifications).
- **Form Data Injection**: Automatically generates and submits test client, lead, project, and inbox data.
- **Weekly Executive Digest**: Emits `weekly.summary_ready` events, calculates rolling metrics (tasks completed, active projects, revenue, communication volume), and attaches an AI-generated executive narrative.
- **Slack Block Kit Integration**: Formats a rich, visual report payload (`reports/slack-message-blocks.json`) with pass/fail badges, performance KPIs, and screenshot catalogs.
- **Live Dispatch**: Set `SLACK_WEBHOOK_URL` in `.env.local` to send test results and weekly digests directly to your agency's Slack channels (`#leadership`, `#agency-announcements`, `#project-alerts`).
- **On-Demand API**: Trigger reports via `POST /api/automation/slack-report` or run cron audits via `POST /api/automation/cron/weekly-summary`.

### Sub-Menu Screenshot Directory
All 29 retina screenshots captured during full system execution are stored in [`public/screenshots/e2e/`](public/screenshots/e2e/):
- `01-dashboard.png` — Executive Dashboard
- `02-clients-table.png` / `03-client-create-form.png` / `04-clients-after-create.png` — Clients CRM & Creation
- `05-client-details-overview.png` / `06-client-communications.png` / `07-client-tags.png` — Client 360 View & Sub-Menus
- `08-leads-pipeline.png` — Sales Pipeline Kanban
- `09-projects-list.png` / `10-projects-kanban.png` / `11-project-details-overview.png` — Projects Suite
- `12-tasks-board.png` — Tasks Board & Milestones
- `13-unified-inbox.png` — Multi-Channel Unified Inbox
- `14-analytics-overview.png` / `15-analytics-revenue.png` / `16-analytics-plan-usage.png` — Analytics Suite
- `17-settings-organization.png` / `18-settings-team.png` / `19-settings-billing.png` / `20-settings-ai.png` / `21-settings-audit-log.png` / `22-settings-integrations.png` — Org Settings
- `23-superadmin-dashboard.png` / `24-superadmin-orgs.png` / `25-superadmin-settings.png` / `26-superadmin-audit-log.png` — Super Admin Platform
- `27-portal-login.png` — White-Label Client Portal
- `28-reports-hub.png` / `29-notifications-center.png` — Reports & Notifications Center


---

## 📚 Documentation & Infrastructure Guides

- [Server Hardening & Setup](documentation/infra/server-setup.md)
- [Self-Hosted Supabase Stack Guide](documentation/infra/self-hosted-supabase.md)
- [DNS & Let's Encrypt SSL Configuration](documentation/infra/dns-ssl.md)
- [Backup & Disaster Recovery Strategy](documentation/infra/backup-restore.md)
- [Local Development Environment Parity](documentation/infra/local-dev-setup.md)
- [N8N Workflow Activation on VPS](documentation/infra/n8n-deployment.md)
- [Multi-Tenant Architecture Blueprint](documentation/architecture.md)
- [Production Deployment Checklist](documentation/deployment-checklist.md)
