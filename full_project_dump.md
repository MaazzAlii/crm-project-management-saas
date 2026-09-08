--- FILE: package.json ---
{
  "name": "crm-project-management-saas",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "^14.2.24",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.17.19",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.24",
    "postcss": "^8.5.2",
    "prettier": "^3.5.1",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3"
  }
}


--- FILE: tsconfig.json ---
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}


--- FILE: .eslintrc.json ---
{
  "extends": ["next/core-web-vitals"]
}


--- FILE: .prettierrc ---
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}


--- FILE: .env.example ---
# Next.js App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...


--- FILE: tailwind.config.ts ---
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};

export default config;


--- FILE: postcss.config.js ---
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};


--- FILE: .gitignore ---
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js build output
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local environment variables
.env*.local
.env.development.local
.env.test.local
.env.production.local

# Vercel / Netlify
.vercel
.netlify

# TypeScript
*.tsbuildinfo
next-env.d.ts


--- FILE: README.md ---
# Multi-Tenant CRM & Project Management SaaS Platform

A multi-tenant SaaS platform combining **CRM + Project Management + Unified Multi-Channel Communication Hub**, built for Innoventix Hub internally and designed from day one as a subscription product for external client organizations.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL), Supabase Auth, Row-Level Security (RLS)
- **Billing**: Stripe Checkout, Subscription Management & Webhooks
- **Automations**: n8n Webhooks & Automation Architecture
- **Hosting & Deployment**: Netlify

## Folder Structure
```
├── app/                  # Next.js App Router routes & pages
├── components/           # Reusable UI components & layouts
├── lib/                  # Shared utilities, Supabase client, helpers
├── server/               # Server actions & API handlers
├── types/                # TypeScript type definitions
├── documentation/        # Architecture docs & ADRs
│   └── adr/              # Architecture Decision Records
├── supabase/             # Database migrations & seeds
│   └── migrations/       # SQL migration scripts
└── Prompts To Build System/ # Master build prompt system (53 tasks)
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```


--- FILE: .agent-state.md ---
# Agent State — Project Build Continuity Log

## Current Status
- **Current Task**: TASK 04 — Core Database Schema (CRM & Project Management Tables) [COMPLETED]
- **Next Task**: TASK 05 — Core Database Schema (Communication Hub & Billing Tables)
- **Last Updated**: 2026-09-08

## Completed Tasks Log
- [x] **TASK 01**: Repository & Monorepo Foundation initialized (Next.js App Router, TS, Tailwind, package.json, architecture.md, build setup).
- [x] **TASK 02**: Multi-Tenant Architecture Decision Record created (`documentation/adr/001-multi-tenancy.md`).
- [x] **TASK 03**: Core Database Schema created (`supabase/migrations/0001_organizations.sql`, `0002_memberships_roles.sql`, `seed.sql`).
- [x] **TASK 04**: Tenant-Scoped CRM & Project Management Schema created (`0003_crm_clients.sql`, `0004_projects_tasks_deliverables.sql` with cross-tenant isolation triggers and seed data for 2 orgs).

## Critical Decisions & Context
- Multi-tenancy model: Shared DB + Schema with `organization_id` foreign keys + Supabase RLS.
- Cross-tenant FK validation triggers prevent linking clients, projects, tasks, or deliverables across different organization IDs.


--- FILE: app/layout.tsx ---
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM & Project Management SaaS Platform',
  description: 'Multi-tenant SaaS platform combining CRM, Project Management, and Unified Communication Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


--- FILE: app/page.tsx ---
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-3xl text-center space-y-6">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
          Multi-Tenant SaaS Scaffold
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          CRM & Project Management SaaS Platform
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Combining Sales Pipelines, Client Management, Kanban Project Workflows, and a Unified Multi-Channel Communication Hub for Agencies & SMBs.
        </p>
      </div>
    </main>
  );
}


--- FILE: documentation/architecture.md ---
# Platform Architecture — Multi-Tenant CRM & Project Management SaaS

## Vision & Scope
The platform combines **CRM, Project Management, and Unified Communication** into a single multi-tenant SaaS application.
- **Tenant Scope**: Every database record, API route, and UI view belongs to an `organization`.
- **First Tenant**: Innoventix Hub is the inaugural organization in the production database with zero special-case code logic.
- **External Customers**: Agencies and SMBs can sign up, select subscription tiers, onboard team members, and manage their clients and projects.

## Architecture Blueprint

### 1. Tenancy Model
- **Model**: Shared Database, Shared Schema with Row-Level Isolation.
- **Key Discriminator**: `organization_id` (UUID) present on all tenant-owned tables.
- **Enforcement**: Supabase Row-Level Security (RLS) policies validate `auth.uid()` membership in `organization_members`.

### 2. Core Functional Modules
1. **Auth & Organization Management**: Multi-tenant onboarding, role-based access control (Owner, Admin, Member, Billing Manager).
2. **CRM Module**: Clients, Sales Pipeline / Kanban (Leads, Proposals, Negotiation, Won, Lost), Segmentation Tags, Client Communication History.
3. **Project Management Module**: Projects, Tasks, Deliverables, Project Templates, Status Tag System, Team Workload View.
4. **Unified Communication Hub**: Central inbox aggregating Slack, WhatsApp Cloud API, Email (Inbound Parse), Discord, and Upwork channel stubs.
5. **Automation & Triggers (n8n)**: Webhook contracts triggering automatic invoicing upon project delivery, deadline alerts, weekly summary reports.
6. **Client Portal**: External client access with restricted RLS for project approvals, deliverable viewing, and invoice status.
7. **Billing & Subscriptions (Stripe)**: Tiered subscriptions, plan feature gating, self-serve customer portal.

### 3. Folder & Package Structure
- `/app`: Next.js App Router (Public routes, Auth, Dashboard, Client Portal)
- `/components`: UI Component Library (Design System, Kanban, Tables, Communication Inbox)
- `/lib`: Shared utilities, Supabase client initialization, Stripe helpers
- `/server`: Server Actions, Webhook Handlers
- `/types`: TypeScript interfaces & Supabase Database types
- `/supabase`: SQL Migrations, RLS definitions, Seeds
- `/documentation`: Architectural Decision Records (ADRs) & System Docs


--- FILE: documentation/adr/001-multi-tenancy.md ---
# ADR 001: Multi-Tenant Architecture & Data Isolation

## Status
Accepted

## Context
The platform originated as an internal tool for Innoventix Hub but has been expanded into a commercial multi-tenant SaaS product sold to external agencies and SMBs. We need a clear, scalable, and secure multi-tenancy model before building the database schema, auth policies, or application features.

## Options Considered

### 1. Database-Per-Tenant
- **Pros**: Complete physical isolation, easy backup/restore per tenant.
- **Cons**: High operational complexity, high cost at scale, difficult schema migrations across hundreds of databases.

### 2. Schema-Per-Tenant (PostgreSQL Schemas)
- **Pros**: Strong logical isolation, shared DB instance.
- **Cons**: Schema migration overhead, connection pool challenges with hundreds of schemas.

### 3. Shared Database, Shared Schema (Row-Level Tenancy) — SELECTED
- **Pros**: Simple operational overhead, cost-effective, seamless schema migrations, highly scalable.
- **Cons**: Requires strict row-level security (RLS) on every table to prevent data leaks across tenants.

## Decision
We adopt **Shared Database, Shared Schema with Row-Level Isolation**.

1. **Organization as Tenant Root**:
   - An `organizations` table represents each tenant (paying company / agency).
   - Innoventix Hub is tenant #1 in the database (no special code branches).

2. **Foreign Key Enforcement**:
   - Every tenant-scoped table MUST include `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.

3. **Supabase Row-Level Security (RLS)**:
   - RLS is ENABLED on every tenant table.
   - Access is granted by evaluating whether `auth.uid()` belongs to `organization_members` for the given `organization_id`.

4. **Tenant Hierarchy**:
   ```
   Organization (e.g. Innoventix Hub or Agency X)
     ├── Members (Owners, Admins, Members, Billing Managers)
     ├── Clients (Agency's customers)
     │     └── Projects
     │           ├── Tasks
     │           └── Deliverables
     ├── Communication Hub (Org-connected Slack, Email, WhatsApp)
     └── Subscriptions & Billing (Stripe Customer per Org)
   ```

5. **Feature Gating**:
   - Feature gating and limits are checked at the `organizations.plan_tier` level.

## Consequences
- Every database migration must include `organization_id` on new tenant tables.
- RLS policies must be thoroughly tested for tenant isolation.
- No developer should write queries omitting `organization_id` filtering or bypassing RLS.


--- FILE: supabase/migrations/0001_organizations.sql ---
-- TASK 03 Migration 1: Organizations Table & Updated-At Trigger Helper

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations table (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
    billing_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (billing_status IN ('active', 'past_due', 'canceled', 'trialing')),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Temporary RLS safety (Task 07 will implement full tenant policies)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;


--- FILE: supabase/migrations/0002_memberships_roles.sql ---
-- TASK 03 Migration 2: Profiles, User Roles & Organization Memberships

-- Profiles Table linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Role Enum Type
CREATE TYPE public.org_member_role AS ENUM (
    'owner',
    'admin',
    'member',
    'billing_manager'
);

-- Organization Members Table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.org_member_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

CREATE TRIGGER update_org_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Service role access enabled, user RLS policies applied in Task 07)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;


--- FILE: supabase/seed.sql ---
-- TASK 04 Seed: Multi-Tenant Test Data & Isolation Verification

-- 1. Insert Test Organizations
INSERT INTO public.organizations (id, name, slug, plan_tier, billing_status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Innoventix Hub', 'innoventix-hub', 'enterprise', 'active'),
    ('00000000-0000-0000-0000-000000000002', 'Apex Digital Agency', 'apex-digital', 'pro', 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, plan_tier = EXCLUDED.plan_tier;

-- 2. Insert Test Users / Profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'owner@innoventix.com', 'Innoventix Owner', 'https://avatar.vercel.sh/innoventix'),
    ('22222222-2222-2222-2222-222222222222', 'owner@apexdigital.com', 'Apex Owner', 'https://avatar.vercel.sh/apex')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Organization Memberships
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
    ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Insert Clients for Organization 1 (Innoventix Hub)
INSERT INTO public.clients (id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Acme Corp Client', 'Acme Corporation', 'contact@acme.com', '+1-555-0199', 'Upwork', 'USA', 'USD', 'Milestone', 'active', 'Primary enterprise account'),
    ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TechStart Inc', 'TechStart', 'info@techstart.io', '+1-555-0244', 'Direct', 'Canada', 'USD', 'Monthly Retainer', 'active', 'SaaS client retainer')
ON CONFLICT (id) DO NOTHING;

-- Insert Clients for Organization 2 (Apex Digital Agency)
INSERT INTO public.clients (id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes)
VALUES 
    ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Apex Local Client', 'Local Retail Co', 'hello@localretail.com', '+44-20-7946-0912', 'Website', 'UK', 'GBP', 'Fixed', 'active', 'Apex local client')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Projects for Organization 1 (Innoventix Hub)
INSERT INTO public.projects (id, organization_id, client_id, title, description, type, brief_source, amount, currency, status, priority, start_date, deadline, assigned_to)
VALUES 
    ('p0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'E-Commerce Platform Redesign', 'Complete redesign of store UI and backend', 'Web Development', 'Upwork', 15000.00, 'USD', 'in_progress', 'high', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert Projects for Organization 2 (Apex Digital Agency)
INSERT INTO public.projects (id, organization_id, client_id, title, description, type, brief_source, amount, currency, status, priority, start_date, deadline, assigned_to)
VALUES 
    ('p0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Local SEO & Brand Identity', 'SEO optimization and branding assets', 'Marketing', 'Website', 3500.00, 'GBP', 'brief_received', 'medium', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Tasks
INSERT INTO public.tasks (id, organization_id, project_id, title, description, assigned_to, status, priority, due_date)
VALUES 
    ('t0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Design Figma Wireframes', 'High fidelity wireframes for checkout flow', '11111111-1111-1111-1111-111111111111', 'in_progress', 'high', CURRENT_DATE + INTERVAL '7 days'),
    ('t0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Keyword Audit Report', 'Comprehensive competitor keyword audit', '22222222-2222-2222-2222-222222222222', 'todo', 'medium', CURRENT_DATE + INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Deliverables
INSERT INTO public.deliverables (id, organization_id, project_id, title, file_url, drive_link, status)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Checkout Flow UI Prototype', 'https://figma.com/file/sample', 'https://drive.google.com/sample', 'pending'),
    ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Initial Keyword Matrix PDF', 'https://assets.apex.com/matrix.pdf', 'https://drive.google.com/apex', 'pending')
ON CONFLICT (id) DO NOTHING;


--- FILE: app/globals.css ---
@tailwindcss base;
@tailwindcss components;
@tailwindcss utilities;

:root {
  --foreground-rgb: 15, 23, 42;
  --background-rgb: 248, 250, 252;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}


--- FILE: Prompts To Build System/.agent-state.md ---
# Agent State

## Project
Innoventix Platform — multi-tenant CRM + Project Management + Communication
Hub SaaS (originated from the internal "SMB Project Management Tool"
assignment for Innoventix Hub, expanded to a sellable multi-org platform).

## Status
NOT STARTED — task files generated, no implementation begun.

## Completed
- (none yet)

## In Progress
- (none — next up is TASK 01)

## Deferred
- (none yet)

## Architecture Decisions Made
- Row-level multi-tenancy via `organization_id` on every tenant-scoped
  table (see documentation/adr/001-multi-tenancy.md, to be created in
  TASK 02).
- Innoventix Hub is treated as the first organization row, not a
  special-cased tenant.

## Blockers
- (none yet)

## Last Completed Task
- None.

## Last Successful Commit
- None — repository not yet initialized.

## Deployment Status
- Not deployed.

## Known Bugs
- (none yet)

## Next Recommended Task
`TASK 01 — Repository & Monorepo Foundation`
(see `01-repository-and-monorepo-foundation.md`)


--- FILE: Prompts To Build System/00-MASTER-PROMPT-project-orchestrator.md ---
# MASTER PROMPT — Innoventix Platform Build Orchestrator

Paste this whole file as your first message to Antigravity / Claude Code / Cursor
at the start of the build. It combines your Universal AI Project Build
Orchestrator rules with this project's specific requirements, so the agent
has both the *how* and the *what* in one place.

---

# 1. ROLE

You are the lead software architect, senior full-stack engineer, DevOps
engineer, QA engineer, Git/GitHub manager, and technical project manager for
this project. Follow the full engineering workflow: **Understand → Plan →
Document → Build → Test → Commit → Push → Verify → Continue.** Never skip
TEST, COMMIT, or UPDATE STATE. Full detailed rules for this workflow are in
`ORCHESTRATOR-FULL-RULES.md` in this same folder — read it in full before
starting TASK 01.

# 2. PROJECT REQUIREMENTS (SOURCE OF TRUTH)

## What this is
A multi-tenant SaaS platform combining **CRM + Project Management + a
unified multi-channel communication hub**, built first for internal use at
Innoventix Hub and designed from day one to be sold as a paid subscription
to other organizations/agencies too.

## Origin
This started as an internal-only assignment: *"SMB Project Management Tool
for Innoventix Hub"* (Phase A of a bigger business system, meant to connect
with a teammate's Invoice Generator and a paused Finance Tracker project).
The full original assignment text is preserved in
`ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md` in this folder — treat every
requirement in it as still binding, but generalized so it works for **any**
organization, not hardcoded to Innoventix.

## Scope expansion (what changed from the original assignment)
1. **Multi-tenant from the ground up.** Every table, screen, and API is
   scoped to an `organization`. Innoventix Hub is simply the first
   organization row — no special-cased code.
2. **Real CRM, not just a client list.** Sales pipeline / lead stages,
   tagging, segmentation, and a full communication history per client.
3. **Unified communication hub.** Slack, WhatsApp, Email, Discord, and
   Upwork (all platforms named in the original spec) feed into one inbox,
   with replies sendable from the platform itself — not just Slack
   *notifications*, but full two-way conversation handling.
4. **Real subscription billing (Stripe).** Plan tiers, feature gating, and
   self-serve upgrade/downgrade/cancel — because external organizations pay
   for this.
5. Everything else from the original assignment — the exact project status
   flow (Brief Received → In Progress → Review → Delivered → Invoiced →
   Paid, plus On Hold), the n8n automations, the client portal, the
   Supabase + Next.js + Tailwind + n8n + Slack + Netlify stack — is
   preserved and generalized, not replaced.

## Tech stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Database/Auth: Supabase (Postgres), Supabase Auth, Row-Level Security
- Automation: n8n on a Contabo VPS
- Billing: Stripe (Checkout + Customer Portal + Webhooks)
- Notifications: Slack + in-app notification center
- Hosting: Netlify
- Communication providers: Slack, WhatsApp Business Cloud API, Email
  (inbound-parse), Discord, Upwork (manual-log)

# 3. TASK SEQUENCE

53 implementation tasks are provided as separate `.md` files in this folder,
numbered `01` through `53`, each fully self-contained per the orchestrator's
task format (Objective, Dependencies, Files to Create/Modify, Implementation
Instructions, UI/Backend/Database/API/Security/Testing requirements,
Acceptance Criteria, Git Commit, Next Task).

Work through them **strictly in order** — later tasks assume earlier ones
are complete. Do not skip ahead. Do not start coding before reading a task
file in full.

Phase map (for orientation — the task files themselves are authoritative):

| Phase | Tasks | Covers |
|---|---|---|
| 0 — Foundation | 01–05 | Repo setup, multi-tenancy ADR, core + CRM/PM + comms/billing schema |
| 1 — Auth & Tenancy | 06–10 | Auth, RLS, onboarding, plans, Stripe |
| 2 — Shell & Dashboard | 11–13 | App shell, main dashboard, org settings/team |
| 3 — CRM | 14–18 | Clients, detail, pipeline, comms log, tags |
| 4 — Project Management | 19–24 | Kanban/list, detail, tasks, deliverables, templates, workload |
| 5 — Communication Hub | 25–31 | Status badges, inbox architecture, Slack/WhatsApp/Email/Discord/Upwork, inbox UI |
| 6 — Automation (n8n) | 32–36 | Event contracts, invoice trigger, deadline/overdue alerts, weekly summary, in-app notifications |
| 7 — Client Portal | 37–40 | Client auth/RLS, dashboard, project approval, invoices |
| 8 — Analytics | 41–43 | Analytics dashboard, plan-usage reporting, exports |
| 9 — Security Hardening | 44–46 | Validation, secrets/API security, audit logging |
| 10 — Testing | 47–49 | Unit/integration, E2E, load/scale testing |
| 11 — Deployment | 50–53 | Env/secrets, Netlify, n8n activation, final QA & demo |

# 4. FIRST ACTIONS

1. Read `ORCHESTRATOR-FULL-RULES.md` in full.
2. Read `ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md` in full.
3. Read this file in full (you're doing that now).
4. Inspect any existing project directory per the orchestrator's Section 3
   (never assume it's empty).
5. Open `01-repository-and-monorepo-foundation.md` and begin.

Do not improvise beyond what these documents specify without recording the
decision in `documentation/adr/`. When requirements conflict, follow the
Priority Order defined in the full orchestrator rules (explicit requirements
> security > data integrity > functional correctness > production
reliability > maintainability > deployment reliability > testing > UX >
performance > convenience).


--- FILE: Prompts To Build System/01-repository-and-monorepo-foundation.md ---
# TASK 01 — Repository & Monorepo Foundation

## Objective
Initialize the production repository, base tooling, and folder structure for a multi-tenant SaaS platform (not a single-tenant internal tool).

## Why This Task Exists
Every later task assumes a working repo, consistent linting/formatting, and a directory structure that separates the app, the internal agent-planning docs, and shared packages. Getting this right first avoids rework across 50+ later tasks.

## Dependencies
- None — this is the first task.

## Current State
No project exists yet, or an early scaffold may exist from the original Innoventix-internal assignment and must be inspected before assuming a blank slate.

## Files To Inspect
- Any existing repo root
- package.json if present
- .git history if present

## Files To Create
- package.json
- tsconfig.json
- .eslintrc
- .prettierrc
- .gitignore
- .env.example
- README.md
- documentation/architecture.md
- .agent-state.md

## Files To Modify


## Implementation Instructions
- Initialize Next.js 14+ (App Router) with TypeScript and Tailwind CSS.
- Set up a monorepo-friendly structure even if starting single-app: /app, /components, /lib, /server, /types, /documentation, /supabase (migrations).
- Configure ESLint + Prettier + strict TypeScript.
- Create documentation/architecture.md capturing the platform vision: multi-tenant CRM + Project Management + unified communication hub, sold as a subscription SaaS to Innoventix Hub internally AND to external client organizations.
- Create .agent-state.md per the orchestrator's continuity format.
- Do NOT hardcode Innoventix-specific data anywhere in code — Innoventix becomes just the first tenant (organization) in the system.

## UI Requirements
- N/A — no UI yet.

## Backend Requirements
- N/A — no backend logic yet.

## Database Requirements
- N/A — schema begins in Task 03.

## API Requirements
- N/A

## Security Requirements
- Ensure .env.example never contains real secrets.
- Add .gitignore rules for .env*, node_modules, .next, .agent-state.md is committed (internal state) but noted as internal-only in README.

## Testing Requirements
- Verify `npm run build` succeeds on a fresh clone.
- Verify lint passes with zero errors.

## Acceptance Criteria
- [ ] Repo builds and lints cleanly.
- [ ] Folder structure matches documented architecture.
- [ ] architecture.md explains the multi-tenant SaaS vision clearly.
- [ ] .agent-state.md exists and is populated.

## Git Commit
Recommended commit:

`chore(foundation): initialize multi-tenant SaaS platform scaffold`

## Verification
- Run build, run lint, confirm no errors.
- Open architecture.md and confirm it reflects the expanded (multi-org, CRM + PM + comms) scope, not just Innoventix-internal scope.

## Next Task
`TASK 02`


--- FILE: Prompts To Build System/02-multi-tenant-architecture-decision-record.md ---
# TASK 02 — Multi-Tenant Architecture Decision Record

## Objective
Formally define how tenancy works across the whole platform before any schema or code is written.

## Why This Task Exists
This is the single most important architectural decision in the pivot from 'internal Innoventix tool' to 'sellable SaaS platform.' Every table, RLS policy, API route, and UI screen in every later task depends on this decision being made once, correctly, and consistently.

## Dependencies
- TASK 01

## Current State
No tenancy model defined yet.

## Files To Inspect
- documentation/architecture.md

## Files To Create
- documentation/adr/001-multi-tenancy.md

## Files To Modify
- documentation/architecture.md

## Implementation Instructions
- Decide and document: shared database, shared schema, row-level tenancy via an `organizations` table and `organization_id` foreign key on every tenant-scoped table (recommended for this scale — simpler ops, still fully isolable via RLS).
- Define the tenant hierarchy: Organization (the paying customer, e.g. Innoventix Hub or an external agency) → Team Members (internal users of that org) → Clients (that org's own customers, e.g. Ubaid's clients) → Projects/Tasks/Deliverables belonging to a Client within an Organization.
- Define that Innoventix Hub is simply the first Organization row, with no special-cased code path.
- Document plan-based feature gating (see Task 09) as an organization-level attribute, not a code branch.
- Document that the Communication Hub (Phase 6) is also organization-scoped: each org connects its own Slack/WhatsApp/Email accounts.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Record this as the canonical isolation boundary that all RLS policies (Task 07) must enforce.

## Testing Requirements
- N/A — this is a documentation task.

## Acceptance Criteria
- [ ] ADR is written and unambiguous.
- [ ] Tenant hierarchy diagram/description included.
- [ ] No implementation code contradicts this ADR in later tasks.

## Git Commit
Recommended commit:

`docs(architecture): record multi-tenancy decision (org-scoped row-level isolation)`

## Verification
- Re-read the ADR and confirm every later task in this task set references organization_id consistently.

## Next Task
`TASK 03`


--- FILE: Prompts To Build System/03-core-database-schema--organizations-users-roles.md ---
# TASK 03 — Core Database Schema — Organizations, Users, Roles

## Objective
Create the foundational multi-tenant tables that every other table will reference.

## Why This Task Exists
Without organizations, memberships, and roles in place first, no other table can be correctly tenant-scoped.

## Dependencies
- TASK 02

## Current State
No database schema exists yet, or only the original single-tenant clients/projects tables from the internal assignment exist and must be migrated, not discarded blindly.

## Files To Inspect
- Any existing Supabase schema/migrations
- documentation/adr/001-multi-tenancy.md

## Files To Create
- supabase/migrations/0001_organizations.sql
- supabase/migrations/0002_memberships_roles.sql

## Files To Modify


## Implementation Instructions
- Create `organizations` table: id, name, slug, plan_tier, billing_status, created_at.
- Create `users` table (or rely on Supabase Auth `auth.users` + a `profiles` table): id, email, full_name, avatar_url.
- Create `organization_members` table: organization_id, user_id, role (owner/admin/member), invited_by, joined_at.
- Define role enum: owner, admin, member, billing_manager — internal-to-org roles, distinct from the later client-portal role.
- Add updated_at triggers on all tables (reused pattern for every future table).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- organizations: id (uuid pk), name, slug (unique), plan_tier, billing_status, created_at, updated_at
- profiles: id (fk auth.users), full_name, avatar_url, created_at
- organization_members: id, organization_id (fk), user_id (fk), role, created_at — unique(organization_id, user_id)

## API Requirements
- N/A — no API layer yet, schema only.

## Security Requirements
- No RLS yet (added in Task 07) — but do not open tables publicly; keep RLS enabled with a temporary service-role-only policy until Task 07.

## Testing Requirements
- Write a seed script inserting one test organization and one test owner membership.
- Verify migrations run cleanly on a fresh Supabase project.

## Acceptance Criteria
- [ ] Migrations apply cleanly.
- [ ] Seed script produces one working organization + owner.
- [ ] Schema matches the multi-tenancy ADR.

## Git Commit
Recommended commit:

`feat(db): add organizations, profiles, and membership/role schema`

## Verification
- Run migrations against a scratch Supabase project.
- Query organization_members joined to profiles and confirm correct relationships.

## Next Task
`TASK 04`


--- FILE: Prompts To Build System/04-core-database-schema--crm-and-project-management-tables.md ---
# TASK 04 — Core Database Schema — CRM & Project Management Tables

## Objective
Create the CRM and project-management domain tables (clients, projects, tasks, deliverables), each scoped to an organization.

## Why This Task Exists
This is the direct evolution of the original assignment's clients/projects/tasks/deliverables tables, now made tenant-aware so any organization — not just Innoventix — can use them.

## Dependencies
- TASK 03

## Current State
Original assignment defines clients, projects, tasks, deliverables, team_members without organization_id. These must be re-designed as tenant-scoped.

## Files To Inspect
- Original assignment doc (clients/projects/tasks/deliverables SQL)
- supabase/migrations/0001_organizations.sql

## Files To Create
- supabase/migrations/0003_crm_clients.sql
- supabase/migrations/0004_projects_tasks_deliverables.sql

## Files To Modify


## Implementation Instructions
- Re-implement `clients` table from the original spec, adding organization_id (fk, not null).
- Re-implement `projects` table, adding organization_id and keeping the status flow: brief_received → in_progress → review → delivered → invoiced → paid, plus on_hold.
- Re-implement `tasks` table (project sub-tasks), adding organization_id (denormalized for RLS simplicity) alongside project_id.
- Re-implement `deliverables` table, adding organization_id.
- Add `team_members` as a view or extension of organization_members rather than a separate disconnected table, so team membership and task-assignment share one source of truth.
- Add indexes on organization_id for every table (mandatory for RLS performance at multi-tenant scale).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- clients: id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes, created_at
- projects: id, organization_id, client_id, title, description, type, brief_source, amount, currency, status, priority, start_date, deadline, delivered_at, invoice_triggered, assigned_to (fk user), notes, created_at
- tasks: id, organization_id, project_id, title, description, assigned_to, status, priority, due_date, completed_at, created_at
- deliverables: id, organization_id, project_id, title, file_url, drive_link, status, client_feedback, submitted_at
- Foreign key + index on organization_id for all four tables

## API Requirements
- N/A

## Security Requirements
- No cross-organization foreign keys permitted anywhere (e.g. a project must never reference a client from a different organization) — add a check via trigger or application-layer validation.

## Testing Requirements
- Seed 2 test organizations, each with its own clients/projects/tasks, and verify no accidental cross-org linkage is possible.

## Acceptance Criteria
- [ ] All four tables created with organization_id.
- [ ] Trigger or constraint prevents cross-org client/project linkage.
- [ ] Seed data for 2 orgs is isolated correctly.

## Git Commit
Recommended commit:

`feat(db): add tenant-scoped CRM and project management schema`

## Verification
- Attempt to create a project referencing a client from a different org and confirm it is rejected.

## Next Task
`TASK 05`


--- FILE: Prompts To Build System/05-core-database-schema--communication-hub-and-billing.md ---
# TASK 05 — Core Database Schema — Communication Hub & Billing

## Objective
Create the schema for the unified communication inbox and the subscription/billing tables that turn this into a sellable SaaS product.

## Why This Task Exists
These two additions are what distinguish the expanded platform from the original internal-only tool: (1) a multi-channel communication log per client, and (2) the billing model needed to charge external organizations a subscription.

## Dependencies
- TASK 04

## Current State
No communication or billing tables exist yet.

## Files To Inspect
- supabase/migrations/0001..0004

## Files To Create
- supabase/migrations/0005_communication_hub.sql
- supabase/migrations/0006_billing_subscriptions.sql

## Files To Modify


## Implementation Instructions
- Create `communication_channels` table: which external accounts (Slack workspace, WhatsApp Business number, email inbox) an organization has connected.
- Create `messages` table: unified inbox row per inbound/outbound message, linked to a channel, optionally to a client_id, with direction, sender, body, external_message_id, status.
- Create `subscription_plans` table: name (Starter/Pro/Agency), price, billing_interval, feature_limits (json: max_clients, max_team_members, communication channels included, etc).
- Create `organization_subscriptions` table: organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end.
- Design feature_limits as data, not code, so plans can change without redeploying.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- communication_channels: id, organization_id, provider (slack/whatsapp/email/discord/upwork), external_account_id, status, connected_at
- messages: id, organization_id, channel_id, client_id (nullable), direction (in/out), sender, body, external_message_id, sent_at, read_at
- subscription_plans: id, name, price_monthly, price_yearly, feature_limits (jsonb)
- organization_subscriptions: id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end

## API Requirements
- N/A

## Security Requirements
- Never store raw provider credentials (Slack/WhatsApp tokens) in plaintext — reference Task 44/45 for secrets handling.
- Stripe IDs only, never card data, touch this schema (PCI scope stays with Stripe).

## Testing Requirements
- Seed 3 subscription plans and one active organization_subscription for the test org.

## Acceptance Criteria
- [ ] All communication and billing tables exist and are organization-scoped.
- [ ] feature_limits json shape documented in architecture.md.

## Git Commit
Recommended commit:

`feat(db): add communication hub and subscription billing schema`

## Verification
- Confirm messages table can link to a client but also supports client_id null (general org inbox).

## Next Task
`TASK 06`


--- FILE: Prompts To Build System/06-authentication-supabase-auth--team-members.md ---
# TASK 06 — Authentication (Supabase Auth) — Team Members

## Objective
Implement sign-up, login, session handling, and organization-aware auth for internal team members of any organization.

## Why This Task Exists
No screen in the platform can be built safely before login and session context (which organization am I acting as) exist.

## Dependencies
- TASK 03

## Current State
No auth flow implemented.

## Files To Inspect
- supabase/migrations/0001_organizations.sql
- supabase/migrations/0002_memberships_roles.sql

## Files To Create
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- lib/supabase/client.ts
- lib/supabase/server.ts
- lib/auth/session.ts

## Files To Modify
- middleware.ts

## Implementation Instructions
- Configure Supabase Auth (email/password + magic link).
- On signup, create a profile row and either create a new organization (self-serve signup) or accept an invite into an existing one.
- Implement a server-side session helper that resolves: current user, current organization (from active membership), current role.
- Add Next.js middleware protecting all authenticated routes and redirecting unauthenticated users to /login.
- If a user belongs to multiple organizations, add an organization switcher (basic version here, refined in Task 11).

## UI Requirements
- Login page: email/password + magic link option, error states, loading state.
- Signup page: create-organization flow vs join-via-invite flow.
- Basic organization switcher dropdown in header (placeholder until Task 11).

## Backend Requirements
- Session resolution utility usable in both Server Components and Route Handlers.
- Auth callback route for magic link / OAuth.

## Database Requirements
- No new tables — uses auth.users, profiles, organization_members.

## API Requirements
- N/A — Auth handled by Supabase SDK, not custom REST endpoints.

## Security Requirements
- Enforce strong password policy via Supabase Auth settings.
- Ensure session cookies are httpOnly/secure.
- Never expose service-role key to the client.

## Testing Requirements
- Test signup → org creation → login → logout cycle.
- Test invite-based signup joins the correct organization only.

## Acceptance Criteria
- [ ] A user can sign up, land in a new organization as owner, log out, and log back in.
- [ ] An invited user joins only the organization they were invited to.

## Git Commit
Recommended commit:

`feat(auth): implement Supabase Auth with organization-aware sessions`

## Verification
- Manually test both signup paths in a browser.
- Confirm middleware blocks unauthenticated access to /dashboard.

## Next Task
`TASK 07`


--- FILE: Prompts To Build System/07-authorization--roles-and-row-level-security-policies.md ---
# TASK 07 — Authorization — Roles & Row-Level Security Policies

## Objective
Implement Postgres RLS policies enforcing that every organization can only ever see its own data, and that roles gate sensitive actions.

## Why This Task Exists
This is the actual security boundary of the multi-tenant platform. Everything else (UI hiding, route guards) is UX convenience on top of this.

## Dependencies
- TASK 06

## Current State
Tables exist but currently have permissive/service-role-only placeholder policies from Task 03.

## Files To Inspect
- supabase/migrations/0001..0006

## Files To Create
- supabase/migrations/0007_rls_policies.sql

## Files To Modify


## Implementation Instructions
- Enable RLS on every tenant-scoped table (organizations excluded from tenant filter itself, but member-gated).
- Write a reusable Postgres function `is_org_member(org_id uuid) returns boolean` checking `auth.uid()` against organization_members.
- Write `has_role(org_id uuid, min_role text) returns boolean` for role-gated actions (e.g. only owner/admin can delete a client).
- Apply SELECT/INSERT/UPDATE/DELETE policies per table using these functions.
- Explicitly test that a user from Org A cannot read/write any row belonging to Org B, even via direct table query.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- Add RLS policies to: clients, projects, tasks, deliverables, communication_channels, messages, organization_subscriptions.
- Add RLS policies to organization_members restricting visibility to fellow members of the same organization only.

## API Requirements
- N/A

## Security Requirements
- This IS the security layer — treat every policy as a security control, not a convenience filter.
- Add automated tests (Task 47) specifically for cross-tenant access attempts.

## Testing Requirements
- Write SQL test queries impersonating two different users/orgs and confirm isolation.
- Confirm role-gated actions (e.g. delete client) fail for 'member' role and succeed for 'owner'/'admin'.

## Acceptance Criteria
- [ ] No query, from any role, can read another organization's rows.
- [ ] Role-gated mutations are enforced at the database level, not just in the UI.

## Git Commit
Recommended commit:

`feat(security): enforce row-level security for full tenant isolation`

## Verification
- Run cross-tenant isolation test suite from Task 47 stub manually before that task exists in full.

## Next Task
`TASK 08`


--- FILE: Prompts To Build System/08-organization-onboarding-and-tenant-provisioning.md ---
# TASK 08 — Organization Onboarding & Tenant Provisioning

## Objective
Build the guided flow a brand-new organization goes through the first time they sign up for the platform.

## Why This Task Exists
Since this platform is now sold to organizations beyond Innoventix, first-run onboarding must work for any generic agency, not assume Innoventix's specifics.

## Dependencies
- TASK 07

## Current State
Auth exists; no onboarding flow exists yet.

## Files To Inspect
- app/(auth)/signup/page.tsx

## Files To Create
- app/onboarding/page.tsx
- app/onboarding/steps/*.tsx
- lib/onboarding/actions.ts

## Files To Modify


## Implementation Instructions
- Step 1: organization details (name, industry/type of work e.g. UGC/Voice Agents/Automation/Combined — configurable list, not hardcoded).
- Step 2: invite team members (optional, skippable).
- Step 3: choose a subscription plan (links to Task 09/10) or start a trial.
- Step 4: land on empty-state dashboard with a 'add your first client' call to action.
- Persist onboarding_completed flag on organizations table (migration addition).

## UI Requirements
- Multi-step wizard with progress indicator.
- Skip/back navigation.
- Empty states designed intentionally, not left blank.

## Backend Requirements
- Server actions creating organization, memberships, invites, and initializing default subscription (trial) status.

## Database Requirements
- Add `onboarding_completed boolean default false` and `industry_type text` to organizations.

## API Requirements
- N/A

## Security Requirements
- Validate organization name/slug uniqueness server-side.
- Rate-limit invite sending to prevent abuse.

## Testing Requirements
- Test full onboarding as a brand-new, non-Innoventix organization to confirm no hardcoded assumptions leak in.

## Acceptance Criteria
- [ ] A completely new organization can onboard end-to-end with no Innoventix-specific text or logic appearing.
- [ ] Invites are sent and honored correctly.

## Git Commit
Recommended commit:

`feat(onboarding): add multi-step tenant onboarding flow`

## Verification
- Walk through onboarding as a fictitious second organization and confirm total isolation from the Innoventix org.

## Next Task
`TASK 09`


--- FILE: Prompts To Build System/09-subscription-plans-definition.md ---
# TASK 09 — Subscription Plans Definition

## Objective
Define the concrete plan tiers, pricing, and feature gates that make this a real subscription product.

## Why This Task Exists
Without explicit plans, billing (Task 10) and feature-gating throughout the UI have nothing to reference.

## Dependencies
- TASK 05
- TASK 08

## Current State
subscription_plans table exists but is unseeded/undefined in business terms.

## Files To Inspect
- supabase/migrations/0006_billing_subscriptions.sql
- documentation/architecture.md

## Files To Create
- documentation/pricing-plans.md
- supabase/seed/plans.sql
- lib/billing/plan-limits.ts

## Files To Modify


## Implementation Instructions
- Define 3 tiers as a starting point: Starter (small team, limited clients/channels), Pro (full CRM + PM + 2 comms channels), Agency (unlimited clients, all comms channels, client portal, white-label option).
- Define feature_limits json shape precisely: max_team_members, max_clients, max_active_projects, communication_channels_included (list), client_portal_enabled (bool), analytics_level.
- Write a `lib/billing/plan-limits.ts` helper used everywhere a limit must be enforced (e.g. block adding an 11th client on Starter).
- Document that Innoventix Hub itself is assigned a specific internal plan (e.g. Agency, possibly at an internal discounted/free rate) — recorded as data, not special-cased code.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A — internal/business logic, no external API yet.

## Security Requirements
- Ensure plan-limit checks happen server-side, never trust client-side gating alone.

## Testing Requirements
- Unit test plan-limits.ts against each tier's boundaries.

## Acceptance Criteria
- [ ] 3 plans seeded with clear feature_limits.
- [ ] plan-limits.ts correctly reports whether a given org is within/over limits for each gated feature.

## Git Commit
Recommended commit:

`feat(billing): define subscription tiers and feature-limit enforcement`

## Verification
- Simulate an org at its client limit and confirm plan-limits.ts blocks the next creation before it reaches the UI.

## Next Task
`TASK 10`


--- FILE: Prompts To Build System/10-stripe-billing-integration.md ---
# TASK 10 — Stripe Billing Integration

## Objective
Connect real subscription billing so external organizations can pay for the platform.

## Why This Task Exists
This is the task that turns the product from an internal tool into an actual SaaS business — organizations must be able to subscribe, upgrade, downgrade, and cancel.

## Dependencies
- TASK 09

## Current State
No payment provider integrated yet.

## Files To Inspect
- lib/billing/plan-limits.ts
- documentation/pricing-plans.md

## Files To Create
- app/api/stripe/webhook/route.ts
- app/(dashboard)/settings/billing/page.tsx
- lib/stripe/client.ts

## Files To Modify
- supabase/migrations/0006_billing_subscriptions.sql (add stripe_price_id columns)

## Implementation Instructions
- Create Stripe Products/Prices matching the 3 plan tiers (monthly + yearly).
- Implement Stripe Checkout for new subscriptions and Stripe Customer Portal for self-serve plan changes/cancellation.
- Implement a webhook handler for checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed — syncing organization_subscriptions.status.
- Gate feature access based on subscription status (past_due/canceled orgs get a restricted read-only view, not instant data loss).

## UI Requirements
- Billing settings page: current plan, usage vs limits, upgrade/downgrade CTA, invoice history link.

## Backend Requirements
- Webhook route with signature verification.
- Idempotent webhook handling (Stripe may retry).

## Database Requirements
- organization_subscriptions kept in sync with Stripe as source of truth for billing state.

## API Requirements
- POST /api/stripe/webhook — Stripe signature verified, 200 on success, 400 on invalid signature.
- Server action to create Checkout session, scoped to current org and authenticated owner/billing_manager only.

## Security Requirements
- Verify Stripe webhook signatures on every request.
- Never trust client-supplied subscription status — only webhook-driven updates.
- Restrict billing page/actions to owner/billing_manager role.

## Testing Requirements
- Test full flow in Stripe test mode: subscribe → webhook updates DB → downgrade → cancel → webhook updates DB.

## Acceptance Criteria
- [ ] An organization can subscribe, see correct plan/usage, and cancel — all reflected accurately in the database.
- [ ] Failed payments correctly restrict access without deleting data.

## Git Commit
Recommended commit:

`feat(billing): integrate Stripe subscriptions and webhook sync`

## Verification
- Run full Stripe test-mode subscription lifecycle and confirm DB state matches Stripe dashboard at every step.

## Next Task
`TASK 11`


--- FILE: Prompts To Build System/11-application-shell-navigation-and-organization-switcher.md ---
# TASK 11 — Application Shell, Navigation & Organization Switcher

## Objective
Build the persistent app shell (sidebar/topbar), navigation, and a proper multi-organization switcher.

## Why This Task Exists
Every screen from here forward lives inside this shell; building it once, correctly, avoids inconsistent layouts later.

## Dependencies
- TASK 06
- TASK 08

## Current State
Only bare auth pages exist; no shared dashboard layout.

## Files To Inspect
- app/(auth)/login/page.tsx
- lib/auth/session.ts

## Files To Create
- app/(dashboard)/layout.tsx
- components/shell/Sidebar.tsx
- components/shell/Topbar.tsx
- components/shell/OrgSwitcher.tsx

## Files To Modify


## Implementation Instructions
- Build responsive sidebar with sections: Dashboard, Clients (CRM), Projects, Tasks, Inbox (Communication Hub), Team, Analytics, Settings.
- Build topbar with organization switcher (for users in multiple orgs), user menu, notification bell (stub, wired in Task 36).
- Persist last-active organization in a cookie so refreshes keep context.
- Collapse sidebar into a bottom/hamburger nav on mobile.

## UI Requirements
- Sidebar with active-route highlighting.
- Org switcher dropdown with search if user belongs to many orgs.
- Mobile: hamburger + drawer nav.
- Loading skeleton for the shell while session resolves.

## Backend Requirements
- Server-side org-context resolution reused from Task 06 session helper.

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure switching organizations fully re-scopes all subsequent queries (no stale org_id in client state).

## Testing Requirements
- Test navigation across every top-level route.
- Test org switch updates all subsequently loaded data.

## Acceptance Criteria
- [ ] Shell renders consistently across all dashboard routes.
- [ ] Org switch correctly changes visible data everywhere.
- [ ] Mobile nav is usable one-handed.

## Git Commit
Recommended commit:

`feat(ui): build application shell, navigation, and organization switcher`

## Verification
- Click through every sidebar link.
- Switch organizations and confirm the dashboard reloads with the new org's data.

## Next Task
`TASK 12`


--- FILE: Prompts To Build System/12-main-dashboard-overview.md ---
# TASK 12 — Main Dashboard Overview

## Objective
Build the landing dashboard summarizing what matters for the currently active organization.

## Why This Task Exists
This is the first thing any user sees after login — it must feel purpose-built per the original assignment's dashboard requirements, generalized for any org.

## Dependencies
- TASK 11
- TASK 04

## Current State
Shell exists; no data widgets built yet.

## Files To Inspect
- Original assignment: Sub-task 4 dashboard requirements

## Files To Create
- app/(dashboard)/dashboard/page.tsx
- components/dashboard/*.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects count, pending tasks count, overdue projects (red alert), revenue-this-month (from paid projects), unread inbox messages count.
- Quick-add buttons: New Client, New Project.
- Recent activity feed (latest status changes across projects/tasks).

## UI Requirements
- Card-based widget grid, responsive to 1 column on mobile.
- Empty state for brand-new orgs with no clients yet (CTA to add first client).
- Loading skeletons per widget.

## Backend Requirements
- Server Components fetching aggregate counts scoped to organization_id via RLS-respecting queries.

## Database Requirements
- No new tables — reads from existing clients/projects/tasks/organization_subscriptions.

## API Requirements
- N/A

## Security Requirements
- Ensure all counts are RLS-scoped (never query with service role from a user-facing page).

## Testing Requirements
- Test dashboard for an org with data vs a brand-new empty org.

## Acceptance Criteria
- [ ] All widgets show accurate, org-scoped counts.
- [ ] Empty state renders correctly for new organizations.
- [ ] Quick-add buttons route to the correct forms.

## Git Commit
Recommended commit:

`feat(dashboard): build main overview dashboard with live widgets`

## Verification
- Compare widget counts against manual DB queries for the same org.

## Next Task
`TASK 13`


--- FILE: Prompts To Build System/13-organization-settings-and-team-management.md ---
# TASK 13 — Organization Settings & Team Management

## Objective
Build the settings area for managing organization profile, team members, roles, and invitations.

## Why This Task Exists
Team management was implicit in the original 'team_members' table; here it becomes a full self-serve screen since external organizations won't have Ubaid manually managing their team via SQL.

## Dependencies
- TASK 11
- TASK 07

## Current State
No settings UI exists.

## Files To Inspect
- supabase/migrations/0002_memberships_roles.sql

## Files To Create
- app/(dashboard)/settings/organization/page.tsx
- app/(dashboard)/settings/team/page.tsx
- lib/team/actions.ts

## Files To Modify


## Implementation Instructions
- Organization profile form: name, industry_type, logo (optional), timezone.
- Team list: members with role, invited/active status, last active.
- Invite flow: email + role, sends invite email, pending-invite state until accepted.
- Role change and member removal actions, restricted to owner/admin.

## UI Requirements
- Settings page with tabs: Organization, Team, Billing (Task 10), Integrations (Task 26+).
- Invite modal with role selector.
- Confirmation modal for member removal.

## Backend Requirements
- Server actions for invite/update-role/remove-member, all role-gated server-side.

## Database Requirements
- N/A — uses organizations, organization_members.

## API Requirements
- N/A

## Security Requirements
- Only owner/admin can invite, change roles, or remove members.
- Prevent removing the last owner of an organization.

## Testing Requirements
- Test invite → accept → role change → removal lifecycle.

## Acceptance Criteria
- [ ] Team management works end-to-end.
- [ ] Non-admin roles cannot access restricted actions (verified both in UI and via direct server-action call).

## Git Commit
Recommended commit:

`feat(settings): add organization profile and team management`

## Verification
- Attempt a role-change API call as a 'member' role and confirm it is rejected server-side.

## Next Task
`TASK 14`


--- FILE: Prompts To Build System/14-crm--clients-list-and-management.md ---
# TASK 14 — CRM — Clients List & Management

## Objective
Build the client list screen with search, filter, and creation, evolving the original 'Clients' sub-task into full CRM functionality.

## Why This Task Exists
Clients are the anchor entity connecting projects, communication, and billing — this screen is used constantly by every organization.

## Dependencies
- TASK 11
- TASK 04

## Current State
clients table and RLS exist; no UI yet.

## Files To Inspect
- Original assignment: Sub-task 4 /clients and /clients/new requirements

## Files To Create
- app/(dashboard)/clients/page.tsx
- app/(dashboard)/clients/new/page.tsx
- components/clients/*.tsx

## Files To Modify


## Implementation Instructions
- List view: table/card toggle, columns for name, company, status, platform, last activity.
- Search by name/company/email, filter by status/platform/country.
- New client form matching original fields: name, company, email, phone, platform, country, currency, payment_schedule, notes.
- Pagination for orgs with many clients (respect plan-based max_clients limit from Task 09).

## UI Requirements
- Responsive list/table.
- Filter bar (collapsible on mobile).
- Empty state ('Add your first client').
- Form validation with inline errors.

## Backend Requirements
- Server actions for create/list/filter, all scoped by organization_id via RLS.

## Database Requirements
- Uses clients table from Task 04 — no schema change here.

## API Requirements
- N/A — server actions, not a public REST API.

## Security Requirements
- Validate/sanitize all form inputs server-side.
- Enforce plan client-limit (Task 09) before insert, with a clear upgrade prompt if exceeded.

## Testing Requirements
- Test create/search/filter/pagination.
- Test limit enforcement at plan boundary.

## Acceptance Criteria
- [ ] Clients can be listed, searched, filtered, and created.
- [ ] Plan limits are enforced with a clear user-facing message, not a silent failure.

## Git Commit
Recommended commit:

`feat(crm): build client list, search, filter, and creation`

## Verification
- Create clients up to and past the plan limit and confirm correct blocking behavior.

## Next Task
`TASK 15`


--- FILE: Prompts To Build System/15-crm--client-detail-page.md ---
# TASK 15 — CRM — Client Detail Page

## Objective
Build the single-client view showing their full relationship: projects, communication history, and notes.

## Why This Task Exists
This is the CRM core — a 360-degree view of one client, which the original spec only implied via 'click client → see their projects.'

## Dependencies
- TASK 14

## Current State
Client list exists; no detail page yet.

## Files To Inspect
- components/clients/*.tsx

## Files To Create
- app/(dashboard)/clients/[id]/page.tsx
- components/clients/ClientTabs.tsx

## Files To Modify


## Implementation Instructions
- Header: client name, company, status badge, quick actions (new project, log communication, edit).
- Tabs: Overview (contact info, notes), Projects (list scoped to this client), Communication (Task 26+ inbox filtered to this client), Activity Log.
- Editable notes field with autosave.

## UI Requirements
- Tabbed detail layout.
- Loading and not-found states (invalid/foreign client id).
- Mobile: tabs collapse to a select dropdown.

## Backend Requirements
- Server Component fetching client + related projects + related messages, all RLS-scoped.

## Database Requirements
- No schema change — joins clients, projects, messages.

## API Requirements
- N/A

## Security Requirements
- Confirm a client id from another organization returns 404, not the record (RLS + explicit check).

## Testing Requirements
- Test detail page with a client that has many/zero projects and many/zero messages.

## Acceptance Criteria
- [ ] Client detail correctly aggregates related data.
- [ ] Cross-tenant client id access returns 404, never leaks data.

## Git Commit
Recommended commit:

`feat(crm): build client detail page with tabs`

## Verification
- Attempt to load another organization's client by id directly via URL and confirm access is denied.

## Next Task
`TASK 16`


--- FILE: Prompts To Build System/16-crm--leads--sales-pipeline-kanban.md ---
# TASK 16 — CRM — Leads / Sales Pipeline (Kanban)

## Objective
Add a lightweight sales-pipeline kanban for tracking prospective clients before they become active clients — the genuinely new CRM capability beyond the original PM-only spec.

## Why This Task Exists
The user explicitly wants a 'CRM type platform,' not just project tracking — a pipeline view is the defining CRM feature the original assignment lacked.

## Dependencies
- TASK 14

## Current State
clients table only tracks active/paused/completed — no lead/prospect stage.

## Files To Inspect
- supabase/migrations/0003_crm_clients.sql

## Files To Create
- supabase/migrations/0008_leads_pipeline.sql
- app/(dashboard)/leads/page.tsx
- components/leads/KanbanBoard.tsx

## Files To Modify


## Implementation Instructions
- Add `pipeline_stage` to clients (or a separate `leads` table if a stricter distinction from active clients is wanted): new, contacted, qualified, proposal_sent, won, lost.
- Kanban board with drag-and-drop between stages (reuse the drag interaction pattern planned for Task 19's project kanban).
- Converting a lead to 'won' flips it into an active client automatically.
- Track lost-reason on the 'lost' stage for basic reporting.

## UI Requirements
- Kanban columns per stage, card shows client name/company/value estimate.
- Drag-and-drop with optimistic UI update.
- Lost-reason modal.

## Backend Requirements
- Server action for stage transitions, validating allowed transitions server-side (not purely a UI drag).

## Database Requirements
- pipeline_stage enum column + lost_reason text column on clients (or dedicated leads table + FK on conversion).

## API Requirements
- N/A

## Security Requirements
- Stage transitions still respect organization RLS.

## Testing Requirements
- Test drag between every stage.
- Test won-conversion correctly flips client status.

## Acceptance Criteria
- [ ] Pipeline kanban works with persisted stage on drag.
- [ ] Winning a lead correctly activates the client record.

## Git Commit
Recommended commit:

`feat(crm): add sales pipeline kanban for lead tracking`

## Verification
- Drag a card through all stages and confirm persistence after page reload.

## Next Task
`TASK 17`


--- FILE: Prompts To Build System/17-crm--client-communication-log.md ---
# TASK 17 — CRM — Client Communication Log

## Objective
Surface a chronological, filterable communication history per client, pulling from the unified Communication Hub.

## Why This Task Exists
This ties the CRM module to the Communication Hub (Phase 6) — without it, 'CRM' just means a client database, not the all-in-one platform requested.

## Dependencies
- TASK 15
- TASK 05

## Current State
messages table exists (Task 05); client detail page exists (Task 15) but without a real communication tab yet.

## Files To Inspect
- supabase/migrations/0005_communication_hub.sql
- app/(dashboard)/clients/[id]/page.tsx

## Files To Create
- components/clients/CommunicationTimeline.tsx

## Files To Modify
- app/(dashboard)/clients/[id]/page.tsx

## Implementation Instructions
- Query messages filtered by client_id, ordered chronologically, grouped by day.
- Show channel icon (Slack/WhatsApp/Email/etc) per message.
- Allow manually logging a communication that happened outside connected channels (e.g. a phone call) as a manual message row.

## UI Requirements
- Chat-style timeline UI.
- Channel filter chips.
- Manual-log quick-add form.

## Backend Requirements
- Server action for manual message logging; read path reuses inbox query layer from Task 31.

## Database Requirements
- No schema change — reads/writes messages table.

## API Requirements
- N/A

## Security Requirements
- Manual log entries still respect organization_id/client_id scoping.

## Testing Requirements
- Test timeline with mixed-channel messages.
- Test manual log entry appears correctly interleaved by time.

## Acceptance Criteria
- [ ] Communication history renders correctly per client across all channels plus manual entries.

## Git Commit
Recommended commit:

`feat(crm): add per-client communication timeline`

## Verification
- Log a manual entry and confirm it appears in correct chronological position.

## Next Task
`TASK 18`


--- FILE: Prompts To Build System/18-crm--tags-segmentation-and-advanced-search.md ---
# TASK 18 — CRM — Tags, Segmentation & Advanced Search

## Objective
Add tagging and segment-based filtering so organizations can organize clients beyond the fixed status field.

## Why This Task Exists
Rounds out the CRM module with the flexible organization power users expect (e.g. tag by industry, deal size, source).

## Dependencies
- TASK 14

## Current State
Clients only filterable by fixed fields (status/platform/country).

## Files To Inspect
- app/(dashboard)/clients/page.tsx

## Files To Create
- supabase/migrations/0009_client_tags.sql
- components/clients/TagPicker.tsx

## Files To Modify
- app/(dashboard)/clients/page.tsx

## Implementation Instructions
- Add `tags` table (org-scoped) and `client_tags` join table.
- Tag picker with create-on-the-fly capability.
- Extend client list filter bar to support multi-tag AND/OR filtering.
- Saved segments (named filter combinations) stored per user or per org.

## UI Requirements
- Tag chips on client cards/rows.
- Tag management UI in settings (rename/delete/merge tags).

## Backend Requirements
- Server actions for tag CRUD and client-tag association.

## Database Requirements
- tags: id, organization_id, name, color
- client_tags: client_id, tag_id

## API Requirements
- N/A

## Security Requirements
- Tag CRUD respects organization RLS.

## Testing Requirements
- Test tag creation, assignment, filter by single and multiple tags.

## Acceptance Criteria
- [ ] Clients can be tagged and filtered by tag combinations reliably.

## Git Commit
Recommended commit:

`feat(crm): add client tagging and segmentation`

## Verification
- Create overlapping tag filters and confirm AND/OR logic returns expected result sets.

## Next Task
`TASK 19`


--- FILE: Prompts To Build System/19-projects--list-and-kanban-board.md ---
# TASK 19 — Projects — List & Kanban Board

## Objective
Build the projects list with both kanban and list views, matching and extending the original assignment's /projects requirements.

## Why This Task Exists
This is the core project-tracking screen from the original spec, now organization-scoped and reusable by any tenant.

## Dependencies
- TASK 11
- TASK 04

## Current State
projects table + RLS exist; no UI yet.

## Files To Inspect
- Original assignment: Sub-task 4 (/projects), Sub-task 5 (status tags/colors)

## Files To Create
- app/(dashboard)/projects/page.tsx
- components/projects/KanbanBoard.tsx
- components/projects/ProjectListView.tsx

## Files To Modify


## Implementation Instructions
- Kanban columns matching the 7-stage status flow with the exact colors/icons from the original spec (gray/blue/yellow/orange/purple/green/red).
- List view with filters: status, client, type, assigned_to, priority.
- Drag-and-drop status change, calling the same server action used by the detail page's manual status button (Task 20) to keep automation triggers (Task 33) consistent.
- Color-coding by priority as specified in the original assignment.

## UI Requirements
- Kanban and list view toggle.
- Drag-and-drop with optimistic update + rollback on failure.
- Filter bar collapsible on mobile.

## Backend Requirements
- Server action `updateProjectStatus` shared by kanban drag, detail page, and (later) client-portal approval flow.

## Database Requirements
- No schema change — reads/writes projects table from Task 04.

## API Requirements
- N/A

## Security Requirements
- Status-change action re-validates organization/client ownership server-side even though drag only shows in-org data.

## Testing Requirements
- Test drag across every status.
- Test filters in combination.

## Acceptance Criteria
- [ ] Kanban and list views both fully functional and consistent with each other.
- [ ] Status colors match spec exactly.

## Git Commit
Recommended commit:

`feat(projects): build kanban and list views with drag-and-drop status flow`

## Verification
- Drag a project through the full status flow and confirm delivered_at / invoice_triggered fields populate correctly at the right stages.

## Next Task
`TASK 20`


--- FILE: Prompts To Build System/20-projects--detail-page.md ---
# TASK 20 — Projects — Detail Page

## Objective
Build the single-project view: full info, task list, deliverables, timeline, and status control.

## Why This Task Exists
Matches the original assignment's /projects/[id] requirement, now the operational hub of a project.

## Dependencies
- TASK 19

## Current State
Project list/kanban exists; no detail page yet.

## Files To Inspect
- Original assignment: Sub-task 4 (/projects/[id])

## Files To Create
- app/(dashboard)/projects/[id]/page.tsx
- components/projects/ProjectTimeline.tsx

## Files To Modify


## Implementation Instructions
- Header: title, client link, status badge + change control, priority, deadline countdown.
- Task list with checkboxes (reuses Task 21's task components).
- Deliverables section (reuses Task 22's components).
- Activity/timeline log: every status change and task completion recorded chronologically.
- Notes field.

## UI Requirements
- Sectioned single-page layout.
- Status change confirmation modal when moving to Delivered (since it triggers automation in Task 33).
- Not-found/cross-tenant 404 handling.

## Backend Requirements
- Server Component aggregating project + tasks + deliverables + activity log, RLS-scoped.

## Database Requirements
- Add `project_activity_log` table: project_id, organization_id, event_type, description, created_at, created_by.

## API Requirements
- N/A

## Security Requirements
- Cross-tenant project id access returns 404.

## Testing Requirements
- Test full page render with a project that has tasks, deliverables, and activity history.

## Acceptance Criteria
- [ ] Detail page shows accurate, complete project state.
- [ ] Status change to Delivered shows the automation-trigger confirmation.

## Git Commit
Recommended commit:

`feat(projects): build project detail page with tasks, deliverables, and activity log`

## Verification
- Change status to Delivered and confirm an activity_log row is created.

## Next Task
`TASK 21`


--- FILE: Prompts To Build System/21-tasks-module.md ---
# TASK 21 — Tasks Module

## Objective
Build the task list, creation, and completion flows, including a global 'My Tasks' view.

## Why This Task Exists
Matches the original assignment's /tasks requirement (My tasks / All tasks toggle).

## Dependencies
- TASK 20

## Current State
tasks table exists; embedded task list exists on project detail from Task 20 but no standalone module.

## Files To Inspect
- Original assignment: Sub-task 4 (/tasks)

## Files To Create
- app/(dashboard)/tasks/page.tsx
- components/tasks/TaskList.tsx
- components/tasks/TaskQuickAdd.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Global tasks page: 'My Tasks' (assigned_to = current user) / 'All Tasks' toggle.
- Filter by project, status, due date range.
- Quick-complete checkbox with optimistic update.
- Quick-add task inline (title + project + due date) without leaving the list.

## UI Requirements
- List with checkbox-complete.
- Overdue tasks visually flagged (red).
- Empty state for zero assigned tasks.

## Backend Requirements
- Server actions for create/complete/reassign task, reused from project detail page.

## Database Requirements
- No schema change — reads/writes tasks table from Task 04.

## API Requirements
- N/A

## Security Requirements
- Assignment reassignment restricted to org members only (validated server-side).

## Testing Requirements
- Test My Tasks vs All Tasks scoping.
- Test overdue flagging logic against due_date.

## Acceptance Criteria
- [ ] Both task views work correctly and consistently with the embedded task list on project detail.

## Git Commit
Recommended commit:

`feat(tasks): build standalone task module with My Tasks/All Tasks views`

## Verification
- Complete a task from the global list and confirm it also reflects instantly on the project detail page.

## Next Task
`TASK 22`


--- FILE: Prompts To Build System/22-deliverables-module.md ---
# TASK 22 — Deliverables Module

## Objective
Build deliverable upload/linking, review status, and client feedback capture.

## Why This Task Exists
Matches the original assignment's deliverables requirement and directly feeds the client-portal approval flow (Task 39).

## Dependencies
- TASK 20

## Current State
deliverables table exists; only referenced inline on project detail so far.

## Files To Inspect
- Original assignment: deliverables table definition

## Files To Create
- components/deliverables/DeliverableCard.tsx
- components/deliverables/UploadForm.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Support either a direct file upload (Supabase Storage) or an external drive_link, per the original spec.
- Status: pending/approved/revision_required, with client_feedback text populated once a client responds via the portal (Task 39).
- Internal team can also manually mark a deliverable's status if feedback was received off-platform.

## UI Requirements
- Upload widget with progress state.
- Status badges.
- Feedback display box.

## Backend Requirements
- Server action for upload (Supabase Storage) + record creation, and for status update.

## Database Requirements
- No schema change — uses deliverables table from Task 04.

## API Requirements
- N/A

## Security Requirements
- Restrict file upload size/type.
- Ensure Storage bucket RLS matches organization scoping (files not publicly listable across orgs).

## Testing Requirements
- Test upload flow and link-only flow.
- Test status transitions.

## Acceptance Criteria
- [ ] Deliverables can be uploaded or linked, and their status accurately reflects review outcome.

## Git Commit
Recommended commit:

`feat(projects): build deliverables upload and review status tracking`

## Verification
- Attempt to access another organization's uploaded file URL directly and confirm it is not publicly reachable.

## Next Task
`TASK 23`


--- FILE: Prompts To Build System/23-project-templates.md ---
# TASK 23 — Project Templates

## Objective
Allow organizations to save a project structure (default tasks) as a reusable template for their common project types.

## Why This Task Exists
Innoventix's own project types (UGC Media, AI Voice Agents, Automation) recur constantly — templates save real time and are a natural SaaS differentiator for other agencies too.

## Dependencies
- TASK 21

## Current State
No template concept exists; every project starts blank.

## Files To Inspect
- app/(dashboard)/projects/new/page.tsx

## Files To Create
- supabase/migrations/0010_project_templates.sql
- app/(dashboard)/settings/templates/page.tsx

## Files To Modify
- app/(dashboard)/projects/new/page.tsx

## Implementation Instructions
- Add `project_templates` and `project_template_tasks` tables, organization-scoped.
- Allow saving an existing project's task list as a new template.
- On new-project creation, optionally select a template to pre-populate default tasks.

## UI Requirements
- Template management page under settings.
- Template picker on new-project form.

## Backend Requirements
- Server actions for template CRUD and template-based project creation.

## Database Requirements
- project_templates: id, organization_id, name, project_type
- project_template_tasks: id, template_id, title, default_due_offset_days

## API Requirements
- N/A

## Security Requirements
- Template CRUD respects organization RLS.

## Testing Requirements
- Test saving a template and creating a new project from it, confirming tasks are correctly pre-populated.

## Acceptance Criteria
- [ ] Templates can be created, edited, and applied, correctly generating pre-set tasks on new projects.

## Git Commit
Recommended commit:

`feat(projects): add reusable project templates`

## Verification
- Create a project from a template and confirm all default tasks appear with correct due-date offsets.

## Next Task
`TASK 24`


--- FILE: Prompts To Build System/24-team-workload-view.md ---
# TASK 24 — Team Workload View

## Objective
Build a per-team-member workload view showing active task/project load.

## Why This Task Exists
Matches the original assignment's /team requirement and gives org owners visibility into balance across their team.

## Dependencies
- TASK 21
- TASK 13

## Current State
Team management (membership) exists (Task 13); no workload visualization yet.

## Files To Inspect
- Original assignment: Sub-task 4 (/team)

## Files To Create
- app/(dashboard)/team/page.tsx
- components/team/WorkloadCard.tsx

## Files To Modify


## Implementation Instructions
- List all active organization members with: active task count, active project count, overdue task count.
- Simple bar/heat visualization of relative workload.
- Click a member to see their filtered task list (reuses Task 21's task list component).

## UI Requirements
- Grid of member cards with workload indicator.
- Empty state for solo-founder orgs (only 1 member).

## Backend Requirements
- Server Component aggregating counts per member, RLS-scoped.

## Database Requirements
- No schema change — aggregates tasks/projects/organization_members.

## API Requirements
- N/A

## Security Requirements
- N/A beyond standard RLS.

## Testing Requirements
- Test with an org with 1 member and an org with several, confirming counts are accurate.

## Acceptance Criteria
- [ ] Workload view accurately reflects each member's current load.

## Git Commit
Recommended commit:

`feat(team): build team workload overview`

## Verification
- Compare displayed counts against manual queries per member.

## Next Task
`TASK 25`


--- FILE: Prompts To Build System/25-status-tag-system--shared-component-library.md ---
# TASK 25 — Status Tag System — Shared Component Library

## Objective
Extract the status/priority tag styling (colors, icons) from the original spec into a single reusable component used everywhere (kanban, list, detail, client portal).

## Why This Task Exists
The original assignment specifies an exact status color/icon table; centralizing it prevents drift across the many screens that render project status.

## Dependencies
- TASK 19

## Current State
Status colors currently only used ad-hoc inside Task 19's kanban.

## Files To Inspect
- components/projects/KanbanBoard.tsx

## Files To Create
- components/shared/StatusBadge.tsx
- lib/constants/status.ts

## Files To Modify
- components/projects/KanbanBoard.tsx
- components/projects/ProjectListView.tsx
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Implement the exact 7-status table from the original assignment (Brief Received/gray/📋 ... Paid/green/✅, plus On Hold/red/⏸️) as a single source-of-truth constant.
- Build <StatusBadge status=... /> component consumed everywhere instead of re-implementing color logic per screen.

## UI Requirements
- Consistent badge styling app-wide, including in the future client portal.

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Visually diff status badges across kanban, list, and detail pages to confirm consistency.

## Acceptance Criteria
- [ ] Every screen rendering project status uses the shared component with zero visual drift.

## Git Commit
Recommended commit:

`refactor(ui): extract shared status badge component and constants`

## Verification
- Grep the codebase to confirm no other file duplicates the status color/icon mapping.

## Next Task
`TASK 26`


--- FILE: Prompts To Build System/26-communication-hub--architecture-and-unified-inbox-data-layer.md ---
# TASK 26 — Communication Hub — Architecture & Unified Inbox Data Layer

## Objective
Design and implement the data-access layer that all channel integrations (Slack/WhatsApp/Email/etc) will write into and the UI will read from.

## Why This Task Exists
This is the backbone of the 'all communication handled from this platform' requirement — every channel integration from here on plugs into one consistent contract.

## Dependencies
- TASK 05
- TASK 13

## Current State
messages/communication_channels tables exist (Task 05); no ingestion or read layer built yet.

## Files To Inspect
- supabase/migrations/0005_communication_hub.sql
- documentation/architecture.md

## Files To Create
- documentation/adr/002-communication-hub.md
- lib/inbox/ingest.ts
- lib/inbox/query.ts

## Files To Modify


## Implementation Instructions
- Define a single ingestion function `ingestMessage(orgId, channelId, payload)` that every provider webhook (Tasks 27-30) calls, normalizing provider-specific payloads into the `messages` schema.
- Define matching logic: attempt to auto-link an inbound message to an existing client by phone/email; if no match, leave client_id null for manual triage.
- Define `lib/inbox/query.ts` with filters: by channel, by client, by read/unread, by organization, used by both the global inbox (Task 31) and the client-scoped timeline (Task 17).

## UI Requirements
- N/A — data layer only, UI in Task 31.

## Backend Requirements
- This is the core backend module of the hub — no HTTP routes yet, just the shared library.

## Database Requirements
- No schema change — uses Task 05 tables.

## API Requirements
- N/A yet — provider webhook routes are added per-channel in Tasks 27-30.

## Security Requirements
- Ensure ingestion always resolves organization_id from the channel record, never trusts a client-supplied org id.

## Testing Requirements
- Unit test ingestMessage with mock payloads for each future provider shape.
- Unit test client-matching logic against ambiguous/no-match cases.

## Acceptance Criteria
- [ ] ingestMessage normalizes and stores messages correctly.
- [ ] Client auto-matching works for clear matches and safely no-ops for ambiguous ones.

## Git Commit
Recommended commit:

`feat(inbox): build unified communication hub data layer`

## Verification
- Feed synthetic payloads for 3 different providers through ingestMessage and confirm consistent row shape in messages table.

## Next Task
`TASK 27`


--- FILE: Prompts To Build System/27-communication-hub--slack-integration.md ---
# TASK 27 — Communication Hub — Slack Integration

## Objective
Connect an organization's own Slack workspace so messages flow into the unified inbox and outbound replies can be sent from the platform.

## Why This Task Exists
Slack is already used internally at Innoventix for notifications (per the original spec) — this extends it into two-way client/team communication routed through the hub.

## Dependencies
- TASK 26

## Current State
No provider integrations exist yet.

## Files To Inspect
- lib/inbox/ingest.ts

## Files To Create
- app/api/webhooks/slack/route.ts
- app/(dashboard)/settings/integrations/slack/page.tsx
- lib/providers/slack.ts

## Files To Modify


## Implementation Instructions
- Implement Slack OAuth so each organization connects their own workspace (stores tokens securely, see Task 45).
- Implement Slack Events API webhook receiving messages, calling `ingestMessage`.
- Implement outbound send via Slack Web API for replies composed in the unified inbox (Task 31).
- Keep the existing internal Slack *notification* use case (Tasks 33-36) architecturally separate from this two-way *conversation* channel — same Slack app, different concern.

## UI Requirements
- Integrations settings page: connect/disconnect Slack, show connection status.

## Backend Requirements
- Webhook route verifying Slack signing secret.
- Token storage via secure secrets pattern (Task 45).

## Database Requirements
- Writes to communication_channels (on connect) and messages (on inbound/outbound) — no new tables.

## API Requirements
- POST /api/webhooks/slack — Slack signature verified, responds within Slack's timeout window.

## Security Requirements
- Verify Slack request signatures on every webhook call.
- Store Slack tokens encrypted, never in plaintext, never logged.

## Testing Requirements
- Test OAuth connect/disconnect.
- Test inbound message appears in inbox.
- Test outbound reply is delivered to the correct Slack channel/DM.

## Acceptance Criteria
- [ ] An organization can connect Slack, receive messages into the unified inbox, and reply from the platform.

## Git Commit
Recommended commit:

`feat(inbox): add Slack channel integration`

## Verification
- Send a real test message in a connected Slack workspace and confirm it appears in the inbox within seconds.

## Next Task
`TASK 28`


--- FILE: Prompts To Build System/28-communication-hub--whatsapp-integration.md ---
# TASK 28 — Communication Hub — WhatsApp Integration

## Objective
Connect WhatsApp Business (per client platform field in the original spec, many clients use WhatsApp) into the unified inbox.

## Why This Task Exists
WhatsApp is explicitly listed as a client platform in the original assignment — this closes the loop so those conversations don't stay siloed outside the platform.

## Dependencies
- TASK 26

## Current State
No WhatsApp integration exists.

## Files To Inspect
- lib/inbox/ingest.ts
- lib/providers/slack.ts (as a reference pattern)

## Files To Create
- app/api/webhooks/whatsapp/route.ts
- app/(dashboard)/settings/integrations/whatsapp/page.tsx
- lib/providers/whatsapp.ts

## Files To Modify


## Implementation Instructions
- Integrate WhatsApp Business Platform (Cloud API) per organization phone number.
- Implement webhook verification (hub.challenge handshake) and inbound message handling into `ingestMessage`.
- Implement outbound template/session message sending respecting WhatsApp's 24-hour session window and template-message rules.
- Auto-match inbound sender phone number to existing client records.

## UI Requirements
- Integrations settings page for WhatsApp number connection/status.

## Backend Requirements
- Webhook route with verification token check.
- Session-window enforcement logic before allowing free-form outbound replies.

## Database Requirements
- No new tables — writes into communication_channels/messages.

## API Requirements
- GET/POST /api/webhooks/whatsapp — verification challenge + message events.

## Security Requirements
- Verify WhatsApp webhook payloads (app secret proof).
- Never expose the WhatsApp access token client-side.

## Testing Requirements
- Test inbound message flow.
- Test outbound within and outside the 24h session window (template fallback).

## Acceptance Criteria
- [ ] WhatsApp conversations appear in the unified inbox and can be replied to within platform rules.

## Git Commit
Recommended commit:

`feat(inbox): add WhatsApp Business integration`

## Verification
- Send a test WhatsApp message to the connected number and confirm inbox ingestion and correct client auto-match.

## Next Task
`TASK 29`


--- FILE: Prompts To Build System/29-communication-hub--email-integration.md ---
# TASK 29 — Communication Hub — Email Integration

## Objective
Connect a transactional/inbound email channel (e.g. Postmark or SendGrid inbound parse) so email-based client communication is captured too.

## Why This Task Exists
Original spec lists Email as a brief_source; this closes email into the same unified system as chat channels.

## Dependencies
- TASK 26

## Current State
No email channel integration exists.

## Files To Inspect
- lib/providers/slack.ts
- lib/providers/whatsapp.ts

## Files To Create
- app/api/webhooks/email/route.ts
- app/(dashboard)/settings/integrations/email/page.tsx
- lib/providers/email.ts

## Files To Modify


## Implementation Instructions
- Set up an org-specific inbound email address (e.g. org-slug@inbox.platform.com) forwarding into an inbound-parse webhook.
- Parse sender/subject/body, call `ingestMessage`, auto-match sender email to existing client.
- Outbound replies sent via the same provider's transactional send API, threaded by subject/message-id where possible.

## UI Requirements
- Integrations settings page showing the org's dedicated inbound address and connection status.

## Backend Requirements
- Webhook route parsing provider-specific inbound payload format.

## Database Requirements
- No new tables — writes into communication_channels/messages.

## API Requirements
- POST /api/webhooks/email — provider inbound-parse payload.

## Security Requirements
- Validate inbound webhook requests are genuinely from the configured provider (signature/IP allowlist per provider docs).

## Testing Requirements
- Test inbound email ingestion and client auto-match.
- Test outbound reply threading.

## Acceptance Criteria
- [ ] Email conversations flow into the unified inbox alongside Slack/WhatsApp.

## Git Commit
Recommended commit:

`feat(inbox): add email channel integration`

## Verification
- Send a real test email to the org's inbound address and confirm correct ingestion and client match.

## Next Task
`TASK 30`


--- FILE: Prompts To Build System/30-communication-hub--discord-and-upwork-channel-stubs.md ---
# TASK 30 — Communication Hub — Discord & Upwork Channel Stubs

## Objective
Add lightweight integration stubs for Discord and Upwork (both named as client platforms in the original spec) so they follow the same provider contract even before full build-out.

## Why This Task Exists
Keeps the provider architecture genuinely pluggable/extensible rather than hardcoded to 3 channels, satisfying the 'different app connectivity' requirement.

## Dependencies
- TASK 26
- TASK 27

## Current State
Provider pattern established by Slack/WhatsApp/Email; Discord/Upwork not yet implemented.

## Files To Inspect
- lib/providers/slack.ts
- lib/providers/whatsapp.ts
- lib/providers/email.ts

## Files To Create
- lib/providers/discord.ts
- lib/providers/upwork.ts
- app/api/webhooks/discord/route.ts

## Files To Modify
- app/(dashboard)/settings/integrations/page.tsx

## Implementation Instructions
- Implement Discord bot webhook following the established `ingestMessage` contract (full send/receive).
- For Upwork, implement at minimum manual message logging (Upwork's API access is more restricted) with a documented note that full API integration is a future enhancement, not blocking launch.
- Update the Integrations settings page to list all 5 channels with accurate 'connected / not available yet' states.

## UI Requirements
- Integrations list page showing all providers with correct status per org.

## Backend Requirements
- Webhook route for Discord.

## Database Requirements
- No new tables.

## API Requirements
- POST /api/webhooks/discord

## Security Requirements
- Same webhook-verification discipline as prior provider tasks.

## Testing Requirements
- Test Discord inbound/outbound.
- Confirm Upwork manual-log path works even without live API access.

## Acceptance Criteria
- [ ] All 5 platforms named in the original spec (WhatsApp/Slack/Upwork/Discord/Other) are represented in the hub, either fully live or clearly documented as manual-log-only.

## Git Commit
Recommended commit:

`feat(inbox): add Discord integration and Upwork manual-log support`

## Verification
- Confirm the integrations settings page accurately reflects each channel's real capability level.

## Next Task
`TASK 31`


--- FILE: Prompts To Build System/31-communication-hub--unified-inbox-ui.md ---
# TASK 31 — Communication Hub — Unified Inbox UI

## Objective
Build the actual inbox screen where team members read and respond to messages across every connected channel.

## Why This Task Exists
This is the user-facing payoff of Phase 6 — 'every communication handled from this platform' becomes real here.

## Dependencies
- TASK 26
- TASK 27
- TASK 28
- TASK 29

## Current State
Ingestion/data layer and provider connections exist; no inbox UI yet.

## Files To Inspect
- lib/inbox/query.ts

## Files To Create
- app/(dashboard)/inbox/page.tsx
- components/inbox/ConversationList.tsx
- components/inbox/MessageThread.tsx
- components/inbox/ComposeBox.tsx

## Files To Modify


## Implementation Instructions
- Two-pane layout: conversation list (grouped by client or by raw sender if unmatched) + active thread view.
- Filter by channel, read/unread, assigned-to-me.
- Compose box routes outbound send through the correct provider (`lib/providers/*`) based on the conversation's channel.
- Manual triage action: link an unmatched conversation to an existing client record.

## UI Requirements
- Two-pane responsive layout (stacked on mobile).
- Unread badge/counter feeding the topbar notification bell.
- Empty state for orgs with no channels connected yet, pointing to Integrations settings.

## Backend Requirements
- Server actions for send/mark-read/link-to-client, using the shared inbox query/ingest layer.

## Database Requirements
- No schema change.

## API Requirements
- N/A — server actions.

## Security Requirements
- Ensure a user can only send from channels their organization owns; validate channel-org ownership server-side on every send.

## Testing Requirements
- Test cross-channel inbox rendering.
- Test manual client-linking updates future auto-matching for that sender.

## Acceptance Criteria
- [ ] Inbox correctly aggregates all channels, supports reply, and unread state is accurate.

## Git Commit
Recommended commit:

`feat(inbox): build unified multi-channel inbox UI`

## Verification
- Send messages via 3 different channels and confirm they all render correctly in one inbox with correct channel icons.

## Next Task
`TASK 32`


--- FILE: Prompts To Build System/32-n8n-automation-architecture-and-webhook-contracts.md ---
# TASK 32 — N8N Automation Architecture & Webhook Contracts

## Objective
Define the exact webhook/event contracts between the platform and n8n before building individual flows.

## Why This Task Exists
The original assignment's automation flows (invoice trigger, deadline alerts, overdue alerts, weekly summary) all depend on a consistent, documented event contract.

## Dependencies
- TASK 20
- TASK 04

## Current State
No automation contracts documented yet; original spec describes flows conceptually only.

## Files To Inspect
- Original assignment: Sub-task 3 (all 4 N8N flows)

## Files To Create
- documentation/automation-contracts.md
- app/api/automation/events/route.ts

## Files To Modify


## Implementation Instructions
- Define a single outbound event-emitter pattern: on key state changes (project delivered, task overdue, project overdue), the app POSTs a signed event payload to a configurable per-organization n8n webhook URL.
- Define payload schema: event_type, organization_id, timestamp, entity data (project/task/client relevant fields).
- Document that n8n runs per-deployment on Contabo VPS as specified, receiving these events and orchestrating Slack notifications and the invoice trigger.
- Add an organization-level settings field for the n8n webhook URL + a shared secret for payload signing.

## UI Requirements
- N/A — backend/infra task.

## Backend Requirements
- Signed outbound webhook sender utility used by Tasks 33-35.

## Database Requirements
- Add `automation_webhook_url` and `automation_webhook_secret` to organizations (or a dedicated integrations table).

## API Requirements
- POST to the org's configured n8n webhook — outbound only, signed with HMAC using the shared secret.

## Security Requirements
- Sign every outbound payload; document how n8n should verify the signature.
- Never log the webhook secret.

## Testing Requirements
- Send a test event to a mock n8n endpoint (e.g. webhook.site) and confirm payload shape and signature verify correctly.

## Acceptance Criteria
- [ ] Event contract is documented and the signed-sender utility works against a test endpoint.

## Git Commit
Recommended commit:

`feat(automation): define n8n event contract and signed webhook sender`

## Verification
- Verify signature validation logic manually against a known secret/payload pair.

## Next Task
`TASK 33`


--- FILE: Prompts To Build System/33-automation--project-delivered-ÔåÆ-invoice-trigger.md ---
# TASK 33 — Automation — Project Delivered → Invoice Trigger

## Objective
Implement the exact N8N Flow 1 from the original assignment: Delivered status change fires the invoice generation trigger.

## Why This Task Exists
This is the most business-critical automation in the original spec, connecting Project Management to Rehmat's Invoice Generator.

## Dependencies
- TASK 32
- TASK 20

## Current State
Status-change action exists (Task 19/20); no automation firing on it yet.

## Files To Inspect
- Original assignment: N8N Flow 1
- lib/inbox/... (not used here)
- app/api/automation/events/route.ts

## Files To Create
- n8n/workflows/project-delivered-invoice.json (exported flow, documentation only, not executed by the app itself)

## Files To Modify
- Server action `updateProjectStatus` (Task 19)

## Implementation Instructions
- On transition to 'delivered' status, check organization payment_schedule config (per_project vs monthly/weekly) exactly as the original spec's decision branch describes.
- If per-project billing applies, emit an `invoice.trigger` event via the Task 32 sender containing client_id, project_id, amount, currency.
- On successful downstream invoice creation (confirmed via a callback webhook from n8n/Invoice Generator), update project status to 'invoiced' and invoice_triggered = true.
- Trigger the Slack notification to the org owner as specified in the original flow.

## UI Requirements
- Confirmation modal on Delivered transition, as noted in Task 20, showing what will be triggered.

## Backend Requirements
- Callback webhook route accepting the invoice-created confirmation from n8n.

## Database Requirements
- No schema change — uses invoice_triggered/status fields from Task 04.

## API Requirements
- POST /api/automation/callback/invoice-created — updates project status to invoiced.

## Security Requirements
- Verify callback authenticity (shared secret) before trusting an 'invoice created' confirmation.

## Testing Requirements
- Test the full loop against a mock n8n workflow: delivered → event emitted → mock callback → status becomes invoiced.

## Acceptance Criteria
- [ ] Delivering a per-project-billed project reliably emits the trigger and correctly updates to Invoiced on confirmed callback.

## Git Commit
Recommended commit:

`feat(automation): implement delivered-to-invoice trigger flow`

## Verification
- Walk a test project through Delivered with a mocked n8n callback and confirm status/flags update exactly as specified.

## Next Task
`TASK 34`


--- FILE: Prompts To Build System/34-automation--deadline-and-overdue-alerts.md ---
# TASK 34 — Automation — Deadline & Overdue Alerts

## Objective
Implement N8N Flows 2 and 3 from the original assignment: task-due-tomorrow alerts and project-overdue alerts.

## Why This Task Exists
These are the daily-cadence automations keeping teams accountable, as explicitly specified.

## Dependencies
- TASK 32

## Current State
Event contract exists; no scheduled checks implemented yet.

## Files To Inspect
- Original assignment: N8N Flow 2, N8N Flow 3

## Files To Create
- app/api/automation/cron/deadline-check/route.ts

## Files To Modify


## Implementation Instructions
- Implement a daily cron-triggered route (invoked by n8n's own schedule trigger, or a platform-side scheduled function) that queries: tasks due tomorrow (per org), and projects past deadline still not 'delivered'.
- Emit a `task.due_soon` event per matching task and a `project.overdue` event per matching project, addressed to the correct organization's n8n webhook for Slack delivery to the right person/owner exactly as specified.

## UI Requirements
- N/A — backend/automation only.

## Backend Requirements
- Cron-safe route (idempotent, safe to re-run, scoped per organization).

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/deadline-check — protected by a cron secret, not publicly callable.

## Security Requirements
- Protect the cron endpoint with a secret header so it cannot be triggered by arbitrary requests.

## Testing Requirements
- Test with synthetic due-tomorrow and overdue records and confirm correct, non-duplicate event emission.

## Acceptance Criteria
- [ ] Daily check correctly identifies due-soon tasks and overdue projects per organization and emits events without duplicates.

## Git Commit
Recommended commit:

`feat(automation): implement deadline and overdue alert checks`

## Verification
- Run the check twice in a row against the same data and confirm no duplicate alerts are emitted.

## Next Task
`TASK 35`


--- FILE: Prompts To Build System/35-automation--weekly-summary-report.md ---
# TASK 35 — Automation — Weekly Summary Report

## Objective
Implement N8N Flow 4: a Monday-morning summary of active projects, pending tasks, and upcoming deadlines per organization.

## Why This Task Exists
Completes the original assignment's automation requirements and gives every org owner a proactive weekly pulse.

## Dependencies
- TASK 32

## Current State
No weekly aggregation exists yet.

## Files To Inspect
- Original assignment: N8N Flow 4

## Files To Create
- app/api/automation/cron/weekly-summary/route.ts

## Files To Modify


## Implementation Instructions
- Weekly (Monday, org-local-time-aware where feasible) job aggregating: active project count, pending task count, deadlines in the next 7 days, per organization.
- Emit a `weekly.summary` event per organization to their configured n8n webhook for Slack delivery, exactly matching the original spec's intent.

## UI Requirements
- N/A

## Backend Requirements
- Cron-safe route, protected by secret.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/weekly-summary — protected.

## Security Requirements
- Same cron-secret protection pattern as Task 34.

## Testing Requirements
- Test aggregation numbers against manual queries for a seeded org.

## Acceptance Criteria
- [ ] Weekly summary event contains accurate, org-scoped figures.

## Git Commit
Recommended commit:

`feat(automation): implement weekly summary report generation`

## Verification
- Manually trigger the endpoint against test data and diff output against direct DB queries.

## Next Task
`TASK 36`


--- FILE: Prompts To Build System/36-in-app-notification-center.md ---
# TASK 36 — In-App Notification Center

## Objective
Add an in-app notification system so the platform doesn't rely on Slack alone, since external organizations may not all use Slack.

## Why This Task Exists
The original spec assumes Slack is available to Ubaid's org; other tenant organizations may prefer in-app or email — this generalizes alerting beyond one channel.

## Dependencies
- TASK 32
- TASK 11

## Current State
Notification bell exists as a UI stub from Task 11; no backing data/logic yet.

## Files To Inspect
- components/shell/Topbar.tsx

## Files To Create
- supabase/migrations/0011_notifications.sql
- components/shell/NotificationPanel.tsx
- lib/notifications/create.ts

## Files To Modify
- components/shell/Topbar.tsx

## Implementation Instructions
- Add `notifications` table: organization_id, user_id, type, title, body, read_at, created_at, related_entity link.
- Hook the same automation events from Tasks 33-35 to also create in-app notifications (not only outbound Slack), giving orgs channel choice.
- Notification panel dropdown with mark-read/mark-all-read.

## UI Requirements
- Dropdown panel from the topbar bell, unread count badge.
- Empty state.

## Backend Requirements
- Server action to create/mark-read notifications, reused by the automation event handlers.

## Database Requirements
- notifications: id, organization_id, user_id, type, title, body, related_entity_type, related_entity_id, read_at, created_at

## API Requirements
- N/A

## Security Requirements
- Notifications strictly scoped per-user within the organization via RLS.

## Testing Requirements
- Test notification creation from each automation trigger type and correct per-user delivery.

## Acceptance Criteria
- [ ] Every automation event (Tasks 33-35) can optionally also generate an in-app notification, correctly scoped and readable/markable.

## Git Commit
Recommended commit:

`feat(notifications): add in-app notification center`

## Verification
- Trigger a deadline alert and confirm both the Slack message and the in-app notification appear consistently.

## Next Task
`TASK 37`


--- FILE: Prompts To Build System/37-client-portal--auth-and-rls.md ---
# TASK 37 — Client Portal — Auth & RLS

## Objective
Implement a completely separate authentication and authorization boundary for external clients, distinct from internal team-member auth.

## Why This Task Exists
The original spec requires per-client login where each client sees ONLY their own projects — a materially different RLS shape from organization-member access.

## Dependencies
- TASK 07
- TASK 14

## Current State
Only internal team-member auth exists (Task 06/07); no client-facing auth exists.

## Files To Inspect
- Original assignment: Sub-task 6 (Client Portal)
- supabase/migrations/0007_rls_policies.sql

## Files To Create
- supabase/migrations/0012_client_portal_auth.sql
- app/(client-portal)/client/login/page.tsx

## Files To Modify


## Implementation Instructions
- Add `client_users` table linking a clients row to an auth identity (magic-link or password), distinct from organization_members.
- Add RLS policies scoped by client_id (not organization_id) for the client-portal read paths: a client_user may only see rows where clients.id matches their own linked client_id, further constrained to that client's organization.
- Magic-link login flow per the original spec.
- Portal is only reachable for clients whose organization's plan includes client_portal_enabled (Task 09 feature gate).

## UI Requirements
- Portal login page, separate branding/layout namespace ((client-portal) route group).

## Backend Requirements
- Auth callback distinct from the internal /login callback.

## Database Requirements
- client_users: id, client_id, organization_id, email, created_at

## API Requirements
- N/A

## Security Requirements
- This is a second, independent security boundary — test it as rigorously as Task 07's organization RLS, including attempts to access another client's data or another organization's portal.

## Testing Requirements
- Test that Client A cannot see Client B's data even within the same organization.
- Test plan-gating blocks portal access for orgs without it enabled.

## Acceptance Criteria
- [ ] Client portal auth is fully isolated per-client, verified by direct negative testing, and correctly plan-gated.

## Git Commit
Recommended commit:

`feat(client-portal): implement client-scoped authentication and RLS`

## Verification
- Attempt cross-client and cross-org data access as an authenticated client_user and confirm both are blocked.

## Next Task
`TASK 38`


--- FILE: Prompts To Build System/38-client-portal--dashboard.md ---
# TASK 38 — Client Portal — Dashboard

## Objective
Build the client-facing dashboard summarizing their active projects, deliverables ready for review, and invoices.

## Why This Task Exists
Matches the original assignment's /client/dashboard requirement.

## Dependencies
- TASK 37

## Current State
Client portal auth exists; no portal screens yet.

## Files To Inspect
- Original assignment: Sub-task 6 (/client/dashboard)

## Files To Create
- app/(client-portal)/client/dashboard/page.tsx
- app/(client-portal)/layout.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects + status, deliverables awaiting review, pending invoices, payment history summary.
- Simplified, client-friendly navigation distinct from the internal team shell (Task 11).

## UI Requirements
- Client-appropriate branding (org's own logo/colors if white-label is enabled per plan).
- Empty states for a brand-new client with no data yet.

## Backend Requirements
- Server Component scoped by client_id via Task 37's RLS.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Confirm every query on this page path is client_id-scoped, never organization-wide.

## Testing Requirements
- Test dashboard renders correctly and only shows that one client's data.

## Acceptance Criteria
- [ ] Client dashboard accurately and exclusively reflects the logged-in client's own data.

## Git Commit
Recommended commit:

`feat(client-portal): build client dashboard`

## Verification
- Log in as two different clients in the same organization and confirm zero data overlap.

## Next Task
`TASK 39`


--- FILE: Prompts To Build System/39-client-portal--project-detail-and-approval-flow.md ---
# TASK 39 — Client Portal — Project Detail & Approval Flow

## Objective
Build the client-facing project detail page with deliverable download/view and the approve/request-revision feedback loop.

## Why This Task Exists
Matches the original spec's /client/projects/[id] and directly wires into internal deliverables (Task 22) and notifications.

## Dependencies
- TASK 38
- TASK 22

## Current State
Client dashboard exists; no per-project client view yet.

## Files To Inspect
- Original assignment: Sub-task 6 (client actions auto-update Ubaid's system)

## Files To Create
- app/(client-portal)/client/projects/[id]/page.tsx
- components/client-portal/ApprovalForm.tsx

## Files To Modify


## Implementation Instructions
- Show status, deliverables (download/view), and an approve/request-revision form exactly as specified.
- On approve: update deliverable status to approved, update project status if applicable, trigger a notification (in-app + Slack) to the internal org exactly as the original 'AUTO' flows describe.
- On revision request: create a new internal task for the revision (per spec) and notify the org.

## UI Requirements
- Deliverable viewer/downloader.
- Approve/Revision-request form with feedback text field.

## Backend Requirements
- Server actions for approve/request-revision, restricted to the deliverable's own linked client_id.

## Database Requirements
- No schema change — uses deliverables/tasks/notifications from earlier tasks.

## API Requirements
- N/A

## Security Requirements
- Re-verify client_id ownership server-side on every approval action, not just via page-level RLS.

## Testing Requirements
- Test both approve and revision-request paths end-to-end, confirming internal notification and task creation.

## Acceptance Criteria
- [ ] Client approval/revision actions correctly and exclusively affect their own project, with accurate downstream automation.

## Git Commit
Recommended commit:

`feat(client-portal): build project detail with approval and revision-request flow`

## Verification
- Approve a deliverable as a client and confirm the internal team sees the status change and notification within seconds.

## Next Task
`TASK 40`


--- FILE: Prompts To Build System/40-client-portal--invoice-and-payment-status-view.md ---
# TASK 40 — Client Portal — Invoice & Payment Status View

## Objective
Build the client-facing invoice list and payment status view.

## Why This Task Exists
Matches the original spec's /client/projects/[id] invoice+payment-status requirement, and is the natural client-facing counterpart to the internal invoice automation (Task 33).

## Dependencies
- TASK 38
- TASK 33

## Current State
No client-facing billing view exists yet; internal invoice trigger exists.

## Files To Inspect
- Original assignment: Sub-task 6 (invoice + payment status)

## Files To Create
- app/(client-portal)/client/invoices/page.tsx

## Files To Modify


## Implementation Instructions
- List invoices linked to the client's projects (sourced from the shared Supabase tables used by Rehmat's Invoice Generator, per the original spec's shared-database design).
- Show status (sent/paid/overdue) and payment history.
- Note: full payment collection UI is out of scope here — Rehmat's Invoice Generator owns invoice PDF generation; this view only reads shared invoice-status data, exactly per the original integration boundary.

## UI Requirements
- Simple list/table of invoices with status badges.

## Backend Requirements
- Read-only server component, RLS-scoped by client_id.

## Database Requirements
- Depends on the shared `invoices` table structure agreed with Rehmat's system (document the exact expected shape in documentation/adr/003-invoice-integration.md if not already defined).

## API Requirements
- N/A

## Security Requirements
- Read-only — no write path here reduces risk; confirm RLS still restricts to the client's own invoices only.

## Testing Requirements
- Test with a client that has multiple invoices in different statuses.

## Acceptance Criteria
- [ ] Client can see accurate invoice/payment status without being able to view any other client's invoices.

## Git Commit
Recommended commit:

`feat(client-portal): build invoice and payment status view`

## Verification
- Cross-check displayed invoice statuses against the shared invoices table for accuracy.

## Next Task
`TASK 41`


--- FILE: Prompts To Build System/41-analytics-dashboard.md ---
# TASK 41 — Analytics Dashboard

## Objective
Build the org-level analytics view specified in the original assignment's Sub-task 7.

## Why This Task Exists
Owners need aggregate visibility beyond the day-to-day dashboard built in Task 12.

## Dependencies
- TASK 19
- TASK 04

## Current State
Only basic counts exist on the main dashboard (Task 12); no dedicated analytics page yet.

## Files To Inspect
- Original assignment: Sub-task 7 (Dashboard Analytics)

## Files To Create
- app/(dashboard)/analytics/page.tsx
- components/analytics/*.tsx

## Files To Modify


## Implementation Instructions
- Charts: projects by status (pie/bar), revenue pipeline (total value of active projects), team workload (tasks per member, reusing Task 24 data), upcoming deadlines (next 7 days), overdue items highlighted, monthly completion rate.
- Date-range selector for historical trend views where feasible.

## UI Requirements
- Chart components (bar/pie/line as appropriate).
- Responsive chart layout for mobile.

## Backend Requirements
- Server Components running aggregate queries, RLS-scoped.

## Database Requirements
- No schema change — aggregates existing tables; consider a materialized view for expensive aggregates at scale.

## API Requirements
- N/A

## Security Requirements
- Ensure aggregate queries never leak cross-org data even in edge-case group-by queries.

## Testing Requirements
- Test analytics accuracy against manual calculations for a seeded org.

## Acceptance Criteria
- [ ] All six analytics widgets from the original spec are implemented and accurate.

## Git Commit
Recommended commit:

`feat(analytics): build organization analytics dashboard`

## Verification
- Validate revenue pipeline figure against a manual sum of active project amounts.

## Next Task
`TASK 42`


--- FILE: Prompts To Build System/42-revenue-and-plan-usage-reporting.md ---
# TASK 42 — Revenue & Plan-Usage Reporting

## Objective
Extend analytics with SaaS-specific reporting: plan usage vs limits, and (for Innoventix's own internal use) cross-client revenue breakdown.

## Why This Task Exists
Because the platform is now billed per-organization, owners need visibility into their own subscription usage, not just their clients' project revenue.

## Dependencies
- TASK 41
- TASK 09

## Current State
Analytics dashboard exists but doesn't yet show plan-limit usage.

## Files To Inspect
- lib/billing/plan-limits.ts
- app/(dashboard)/analytics/page.tsx

## Files To Create
- components/analytics/PlanUsageCard.tsx

## Files To Modify
- app/(dashboard)/analytics/page.tsx
- app/(dashboard)/settings/billing/page.tsx

## Implementation Instructions
- Show current usage vs plan limits (clients, team members, channels) with clear visual proximity-to-limit indicators.
- Revenue breakdown by client and by project type, sortable/filterable.

## UI Requirements
- Usage bars/progress indicators.
- Upsell prompt when nearing a limit (links to billing settings).

## Backend Requirements
- Reuses plan-limits.ts from Task 09.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- No new security surface beyond existing RLS.

## Testing Requirements
- Test usage indicators at various proximities to plan limits.

## Acceptance Criteria
- [ ] Usage reporting accurately reflects real counts against plan limits, with correct upsell prompting.

## Git Commit
Recommended commit:

`feat(analytics): add plan-usage and revenue breakdown reporting`

## Verification
- Push a test org to 90% of a limit and confirm the correct visual warning and upsell CTA appear.

## Next Task
`TASK 43`


--- FILE: Prompts To Build System/43-exportable-reports-pdf-csv.md ---
# TASK 43 — Exportable Reports (PDF/CSV)

## Objective
Add export functionality so org owners can pull data out of the platform for offline reporting or client-facing summaries.

## Why This Task Exists
A professional platform of this scope needs export, especially for agencies reporting revenue/activity to their own stakeholders.

## Dependencies
- TASK 41

## Current State
Analytics exists but is view-only; no export capability.

## Files To Inspect
- app/(dashboard)/analytics/page.tsx

## Files To Create
- lib/reports/csv-export.ts
- lib/reports/pdf-export.ts
- app/api/reports/export/route.ts

## Files To Modify


## Implementation Instructions
- CSV export for clients list, projects list, and revenue breakdown.
- PDF export for a formatted monthly summary report (reusing the weekly-summary data shape from Task 35 as a base).

## UI Requirements
- Export buttons on relevant list/analytics pages with format choice (CSV/PDF).

## Backend Requirements
- Export route generating files server-side, streamed as a download, never persisted with client data beyond the request lifecycle unless explicitly requested.

## Database Requirements
- No schema change.

## API Requirements
- GET /api/reports/export?type=...&format=... — authenticated, org-scoped.

## Security Requirements
- Ensure export endpoint respects the same RLS/org-scoping as the underlying data — no export-based data leak shortcut.

## Testing Requirements
- Test CSV/PDF export content matches on-screen data exactly.

## Acceptance Criteria
- [ ] Exports are accurate, correctly formatted, and strictly org-scoped.

## Git Commit
Recommended commit:

`feat(reports): add CSV and PDF export for key reports`

## Verification
- Diff exported CSV row counts against the underlying list view's row count.

## Next Task
`TASK 44`


--- FILE: Prompts To Build System/44-input-validation-and-sanitization-layer.md ---
# TASK 44 — Input Validation & Sanitization Layer

## Objective
Introduce a consistent, shared validation layer (e.g. Zod schemas) across every form and server action in the platform.

## Why This Task Exists
With 40+ prior tasks each defining their own forms/actions, this task audits and unifies validation before the platform is considered production-ready.

## Dependencies
- TASK 43

## Current State
Validation has been implemented ad-hoc per task; no shared schema library yet.

## Files To Inspect
- All app/(dashboard)/**/page.tsx and lib/**/actions.ts files

## Files To Create
- lib/validation/schemas.ts

## Files To Modify
- Every server action file across the codebase (systematic pass).

## Implementation Instructions
- Define Zod (or equivalent) schemas per entity: client, project, task, deliverable, message, organization, invite, etc.
- Refactor every server action to validate input against its schema before touching the database.
- Sanitize free-text fields (notes, feedback, message bodies) against stored-XSS risk before render, in addition to input validation.

## UI Requirements
- Consistent inline validation error display across all forms.

## Backend Requirements
- Centralized schema-based validation used everywhere.

## Database Requirements
- No schema (DB) change — this is application-layer validation.

## API Requirements
- Every server action rejects invalid payloads with clear, safe error messages (no stack traces leaked to the client).

## Security Requirements
- This task exists specifically to close gaps from earlier fast-moving tasks — treat it as a security task, not a polish task.

## Testing Requirements
- Write validation tests for boundary/invalid inputs across at least the 10 highest-traffic actions (client/project/task create, message send, invite, billing actions).

## Acceptance Criteria
- [ ] No server action accepts unvalidated input.
- [ ] No user-supplied text renders unsanitized anywhere in the UI.

## Git Commit
Recommended commit:

`fix(security): unify input validation and sanitization across all server actions`

## Verification
- Attempt a stored-XSS payload in a notes/feedback field and confirm it renders inert.

## Next Task
`TASK 45`


--- FILE: Prompts To Build System/45-secrets-management-and-api-security.md ---
# TASK 45 — Secrets Management & API Security

## Objective
Harden how provider tokens (Slack/WhatsApp/Stripe/n8n secrets), API routes, and rate limiting are handled platform-wide.

## Why This Task Exists
Multiple earlier tasks (27-29, 32, 10) store or use sensitive tokens — this task performs the consolidated, audited hardening pass the orchestrator template requires before production.

## Dependencies
- TASK 44

## Current State
Tokens are stored per-integration ad-hoc; no unified encryption-at-rest or rate-limiting strategy audited yet.

## Files To Inspect
- lib/providers/*.ts
- app/api/webhooks/*/route.ts
- app/api/automation/*/route.ts

## Files To Create
- lib/security/encrypt.ts
- middleware/rate-limit.ts

## Files To Modify
- All provider integration files and webhook routes (systematic pass).

## Implementation Instructions
- Encrypt provider tokens at rest (application-level encryption in addition to Supabase's own encryption-at-rest), decrypt only server-side at point of use.
- Add rate limiting to all public-facing webhook and API routes to prevent abuse.
- Confirm every webhook route validates a signature/secret before processing (audit Tasks 27-30, 32-35 against this).
- Confirm no service-role Supabase key is ever used in a user-facing request path.

## UI Requirements
- N/A

## Backend Requirements
- This IS the backend security task.

## Database Requirements
- No schema change unless a token column needs re-encrypting; if so, write a migration.

## API Requirements
- Rate-limit thresholds documented per route.

## Security Requirements
- This task's entire purpose is security — audit exhaustively against the checklist above.

## Testing Requirements
- Attempt to call each webhook route with an invalid/missing signature and confirm rejection.
- Load-test a public route to confirm rate limiting engages.

## Acceptance Criteria
- [ ] Every provider token is encrypted at rest.
- [ ] Every public webhook/API route is signature-verified and rate-limited.
- [ ] No service-role key usage in user-facing code paths (verified by codebase search).

## Git Commit
Recommended commit:

`fix(security): harden secrets management, encryption, and API rate limiting`

## Verification
- Search the entire codebase for `service_role` usage and confirm every occurrence is server-only/admin-context.

## Next Task
`TASK 46`


--- FILE: Prompts To Build System/46-audit-logging.md ---
# TASK 46 — Audit Logging

## Objective
Add an audit trail for sensitive actions across the platform.

## Why This Task Exists
A multi-tenant SaaS handling client data and billing needs an audit log for accountability and troubleshooting — expected by security-conscious external customers.

## Dependencies
- TASK 45

## Current State
No audit log exists; only project_activity_log (Task 20) covers project-specific events.

## Files To Inspect
- supabase/migrations/0007_rls_policies.sql
- app/(dashboard)/projects/[id]/page.tsx

## Files To Create
- supabase/migrations/0013_audit_log.sql
- lib/audit/log.ts
- app/(dashboard)/settings/audit-log/page.tsx

## Files To Modify


## Implementation Instructions
- Add `audit_log` table: organization_id, actor_user_id, action, entity_type, entity_id, metadata (jsonb), created_at.
- Log sensitive actions: role changes, member removal, billing changes, client/project deletion, data export.
- Audit log viewer page restricted to owner/admin roles.

## UI Requirements
- Simple filterable table view.
- Restricted access with a clear 'admins only' notice.

## Backend Requirements
- Shared `logAuditEvent()` helper called from the relevant server actions across earlier tasks.

## Database Requirements
- audit_log: id, organization_id, actor_user_id, action, entity_type, entity_id, metadata, created_at

## API Requirements
- N/A

## Security Requirements
- Audit log itself must be RLS-protected and, ideally, append-only (no update/delete policy for non-service roles).

## Testing Requirements
- Test that sensitive actions correctly generate audit entries and that non-admins cannot view or tamper with the log.

## Acceptance Criteria
- [ ] Sensitive actions are reliably logged.
- [ ] Audit log is append-only and admin-restricted.

## Git Commit
Recommended commit:

`feat(security): add audit logging for sensitive actions`

## Verification
- Perform a role change and a billing change, then confirm both appear correctly in the audit log.

## Next Task
`TASK 47`


--- FILE: Prompts To Build System/47-automated-testing-setup--unit-and-integration.md ---
# TASK 47 — Automated Testing Setup — Unit & Integration

## Objective
Establish the testing framework and write unit/integration tests for the core business logic built across all prior tasks.

## Why This Task Exists
The orchestrator's execution loop mandates TEST before COMMIT — this task retroactively covers the highest-risk logic (RLS, billing, automation) with real automated tests.

## Dependencies
- TASK 46

## Current State
No automated test suite exists yet; verification so far has been manual per-task.

## Files To Inspect
- lib/**
- supabase/migrations/**

## Files To Create
- vitest.config.ts
- tests/rls-isolation.test.ts
- tests/billing.test.ts
- tests/automation-contracts.test.ts

## Files To Modify


## Implementation Instructions
- Set up Vitest (or equivalent) with a test Supabase project/local instance.
- Write cross-tenant isolation tests (formalizing Task 07's manual checks): attempt every table's SELECT/INSERT/UPDATE/DELETE across two different organizations' users.
- Write unit tests for plan-limits.ts, ingestMessage client-matching, and the automation event payload builders.
- Write integration tests for the Stripe webhook handler using Stripe's test-event fixtures.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Test suite itself is the security/quality gate for the rest of the platform.

## Testing Requirements
- This IS the testing task — see implementation instructions above.

## Acceptance Criteria
- [ ] CI-runnable test suite exists and passes.
- [ ] Cross-tenant isolation is covered by automated tests, not just manual checks.
- [ ] Billing and automation logic has meaningful test coverage.

## Git Commit
Recommended commit:

`test: add unit and integration test suite covering RLS, billing, and automation logic`

## Verification
- Run the full suite locally and confirm all tests pass before proceeding.

## Next Task
`TASK 48`


--- FILE: Prompts To Build System/48-end-to-end-testing--critical-user-flows.md ---
# TASK 48 — End-to-End Testing — Critical User Flows

## Objective
Write E2E tests (e.g. Playwright) covering the platform's most critical user journeys end-to-end.

## Why This Task Exists
Unit tests (Task 47) cover logic in isolation; E2E tests confirm the full stack works together for the flows that matter most to the business.

## Dependencies
- TASK 47

## Current State
No E2E coverage exists yet.

## Files To Inspect
- app/(dashboard)/**
- app/(client-portal)/**

## Files To Create
- playwright.config.ts
- e2e/onboarding.spec.ts
- e2e/project-lifecycle.spec.ts
- e2e/client-portal.spec.ts
- e2e/billing.spec.ts

## Files To Modify


## Implementation Instructions
- E2E: full onboarding (signup → org creation → first client → first project).
- E2E: full project lifecycle (create → tasks → deliverable → delivered → invoice-trigger event fired → paid).
- E2E: client portal isolation (two clients, confirm zero cross-visibility) and approval flow.
- E2E: Stripe test-mode subscription flow.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Run E2E suite against a staging environment, not production data.

## Testing Requirements
- This IS the E2E testing task — see implementation instructions above.

## Acceptance Criteria
- [ ] All four critical flows pass reliably in CI.
- [ ] Client portal isolation is explicitly asserted, not assumed.

## Git Commit
Recommended commit:

`test: add end-to-end tests for onboarding, project lifecycle, client portal, and billing`

## Verification
- Run the E2E suite twice in a row to confirm no flakiness on the isolation-sensitive tests.

## Next Task
`TASK 49`


--- FILE: Prompts To Build System/49-load-and-multi-tenant-scale-testing.md ---
# TASK 49 — Load & Multi-Tenant Scale Testing

## Objective
Verify the platform performs acceptably as organizations, clients, and message volume grow, per the original spec's 'design for 50+ clients from day one' requirement.

## Why This Task Exists
Multi-tenant RLS queries can degrade at scale if indexes are missing — this task validates the platform actually meets its stated scale target.

## Dependencies
- TASK 47

## Current State
No load testing performed yet.

## Files To Inspect
- supabase/migrations/** (index review)

## Files To Create
- scripts/seed-load-test.ts
- documentation/performance-notes.md

## Files To Modify


## Implementation Instructions
- Seed a synthetic organization with 50+ clients, 200+ projects, 1000+ messages.
- Measure list/kanban/inbox page load times against this dataset; identify and add any missing indexes.
- Load-test the deadline-check and weekly-summary cron routes against many organizations simultaneously.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- Add any indexes identified as missing during this pass.

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Record before/after query times for any optimization made.

## Acceptance Criteria
- [ ] Platform meets acceptable load times at the original spec's stated 50+ client scale.
- [ ] Any missing indexes are identified and added.

## Git Commit
Recommended commit:

`perf: validate and optimize multi-tenant performance at target scale`

## Verification
- Re-run the seeded load test after optimizations and confirm measurable improvement.

## Next Task
`TASK 50`


--- FILE: Prompts To Build System/50-environment-configuration-and-secrets-for-production.md ---
# TASK 50 — Environment Configuration & Secrets for Production

## Objective
Finalize all environment variables, secrets, and configuration needed for a real production deployment.

## Why This Task Exists
Consolidates every secret introduced across Tasks 06-45 (Supabase, Stripe, Slack, WhatsApp, Email, n8n, encryption keys) into one audited, documented set.

## Dependencies
- TASK 45

## Current State
Secrets exist scattered across many .env references from individual tasks; no consolidated production checklist yet.

## Files To Inspect
- .env.example
- all lib/providers/*.ts and lib/stripe/*.ts files

## Files To Create
- documentation/deployment-checklist.md

## Files To Modify
- .env.example (finalize)

## Implementation Instructions
- Audit every environment variable referenced anywhere in the codebase and ensure it's documented in .env.example with a description.
- Separate secrets by environment (development/staging/production).
- Document the exact secret-provisioning steps for Netlify (per original spec) including build-time vs runtime variables.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Confirm no secret is committed to the repository anywhere in git history for this reason specifically.

## Testing Requirements
- Verify a fresh clone + .env.example-based setup can run the app locally with zero missing variables.

## Acceptance Criteria
- [ ] .env.example is complete and accurate.
- [ ] No secret exists in git history.
- [ ] A new developer/agent can configure the app from documentation alone.

## Git Commit
Recommended commit:

`chore(deploy): finalize environment configuration and secrets documentation`

## Verification
- Run a secret-scanning tool (e.g. gitleaks) against the full repository history.

## Next Task
`TASK 51`


--- FILE: Prompts To Build System/51-netlify-deployment-pipeline.md ---
# TASK 51 — Netlify Deployment Pipeline

## Objective
Set up the production deployment pipeline on Netlify, per the original assignment's hosting choice.

## Why This Task Exists
Matches Sub-task 9 of the original assignment (deploy frontend on Netlify) while accounting for the platform's growth into a full SaaS product.

## Dependencies
- TASK 50

## Current State
No deployment pipeline configured yet.

## Files To Inspect
- documentation/deployment-checklist.md
- package.json

## Files To Create
- netlify.toml

## Files To Modify


## Implementation Instructions
- Configure Netlify build settings (Next.js runtime, build command, environment variable injection).
- Set up preview deployments per PR/branch for safe review before merging to production.
- Configure custom domain(s), including support for the org-specific subdomains if white-labeling is planned (Task 38 note).
- Configure production Supabase project separate from any dev/staging project, with migrations applied via CI.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure preview deployments never point at the production database.
- Restrict who can trigger production deploys.

## Testing Requirements
- Deploy to a preview URL and run the E2E suite (Task 48) against it before promoting to production.

## Acceptance Criteria
- [ ] Production deployment succeeds and is reachable.
- [ ] Preview deployments work safely isolated from production data.

## Git Commit
Recommended commit:

`chore(deploy): configure Netlify production deployment pipeline`

## Verification
- Trigger a full deploy and verify the live site against the deployment checklist.

## Next Task
`TASK 52`


--- FILE: Prompts To Build System/52-n8n-workflow-activation-on-contabo-vps.md ---
# TASK 52 — N8N Workflow Activation on Contabo VPS

## Objective
Deploy and activate all n8n automation workflows on the Contabo VPS, per the original spec.

## Why This Task Exists
Matches Sub-task 9 (activate all N8N workflows on Contabo VPS) — the automation layer (Tasks 32-36) is only live once these are actually running in production.

## Dependencies
- TASK 50
- TASK 33
- TASK 34
- TASK 35

## Current State
N8N flows are designed/documented (Tasks 32-35) but not yet deployed to the production VPS.

## Files To Inspect
- n8n/workflows/*.json
- documentation/automation-contracts.md

## Files To Create
- documentation/n8n-deployment.md

## Files To Modify


## Implementation Instructions
- Import all documented workflows (invoice trigger, deadline alert, overdue alert, weekly summary) into the production n8n instance.
- Configure each organization's webhook secret in n8n's credential store, matching Task 32's signing scheme.
- Set up the cron/schedule triggers for Tasks 34/35 to call the platform's protected cron endpoints correctly.
- Verify end-to-end for at least one real organization (the Innoventix org) before considering the phase complete.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure n8n credentials/secrets are stored securely on the VPS, not in exported workflow JSON committed to any public repo.

## Testing Requirements
- Trigger each of the 4 workflows against the live production environment for the Innoventix org and confirm correct Slack + in-app notification delivery.

## Acceptance Criteria
- [ ] All 4 original automation flows are live and verified working end-to-end in production for at least the first real organization.

## Git Commit
Recommended commit:

`chore(deploy): activate n8n automation workflows in production`

## Verification
- Manually trigger one project through Delivered in production and confirm the full invoice-trigger chain fires correctly.

## Next Task
`TASK 53`


--- FILE: Prompts To Build System/53-final-qa-security-audit-and-demo-preparation.md ---
# TASK 53 — Final QA, Security Audit & Demo Preparation

## Objective
Perform the final full-platform audit per the orchestrator's Section 50 checklist, and prepare the live demo walkthrough specified in the original assignment's Sub-task 11.

## Why This Task Exists
This is the closing task: verifies the entire platform (all 52 prior tasks) together, and delivers the demo Ubaid (and any future external customer) will actually see.

## Dependencies
- TASK 49
- TASK 51
- TASK 52

## Current State
All individual features are built and deployed; no final cross-cutting audit performed yet.

## Files To Inspect
- Entire codebase and documentation/ directory

## Files To Create
- documentation/final-completion-report.md

## Files To Modify


## Implementation Instructions
- Run the full Final Project Audit checklist from the orchestrator template (Functionality, Code, Security, GitHub, Deployment, Documentation, Agent Continuity).
- Prepare and rehearse the live demo per the original assignment: add client → add project → assign tasks → move through all statuses → trigger invoice automatically → show client portal → show Slack + in-app notifications → show analytics.
- Write the Final Completion Report per the orchestrator's Section 51 format.
- Update .agent-state.md to reflect full Phase A completion and hand back to the Finance Tracker assignment per the original spec's note that it resumes after this project.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Final security pass: re-confirm no secrets committed, RLS fully verified, audit log functioning.

## Testing Requirements
- Run the full unit, integration, and E2E suites one final time before sign-off.

## Acceptance Criteria
- [ ] Every item in the orchestrator's Final Project Audit checklist passes.
- [ ] The full demo script runs successfully live.
- [ ] Final completion report and .agent-state.md are accurate and complete.

## Git Commit
Recommended commit:

`chore(release): final QA pass and v1.0 completion report`

## Verification
- Walk through the entire demo script live, end to end, without errors.

## Next Task
`None — Phase A (Core Build) is complete. Resume the Finance Tracker assignment (Phase B) next, now that it can integrate with this platform's shared schema.`


--- FILE: Prompts To Build System/ORCHESTRATOR-FULL-RULES.md ---
# UNIVERSAL AI PROJECT BUILD ORCHESTRATOR

## ROLE

You are the lead software architect, senior full-stack engineer, DevOps engineer, QA engineer, Git/GitHub manager, and technical project manager for this project.

You are working inside a real software project that must be developed professionally, systematically, and in a way that another engineer or AI coding agent can continue later.

The project may be developed using tools such as:

- Antigravity
- Claude Code
- Cursor
- VS Code
- Codex
- Other AI coding agents

The specific coding tool does NOT change the engineering standards defined in this document.

Your job is not simply to generate code.

Your job is to:

**Understand → Plan → Document → Build → Test → Commit → Push → Verify → Continue**

Do not skip stages.

---

# 1. PROJECT INPUT

I will provide the project-specific requirements after this master instruction.

Treat the project description I provide as the primary source of truth.

PROJECT REQUIREMENTS:

[PASTE PROJECT DESCRIPTION HERE]

Additional requirements, constraints, references, screenshots, existing code, documentation, or files:

[PASTE / ATTACH ADDITIONAL INFORMATION HERE]

---

# 2. FIRST OBJECTIVE — UNDERSTAND THE PROJECT

Before writing implementation code, analyze the entire project requirement.

Determine:

- What problem the project solves
- Target users
- Core user journeys
- Functional requirements
- Non-functional requirements
- Frontend requirements
- Backend requirements
- Database requirements
- Authentication requirements
- Authorization requirements
- API requirements
- AI/ML requirements, if applicable
- Third-party integrations
- File/storage requirements
- Notification requirements
- Admin requirements
- Dashboard requirements
- Security requirements
- Testing requirements
- Deployment requirements
- Vercel requirements, if applicable
- Environment variables
- Production configuration
- Error handling
- Logging
- Performance considerations
- Accessibility
- Responsive behavior
- SEO, where applicable
- Git/GitHub requirements
- Documentation requirements

Do not start coding until the architecture and implementation plan are sufficiently understood.

---

# 3. INSPECT EXISTING PROJECT FIRST

If an existing project/folder is provided, NEVER assume it is empty.

Before modifying anything:

1. Inspect the directory structure.
2. Inspect package/configuration files.
3. Inspect the existing source code.
4. Inspect database/schema files.
5. Inspect environment examples.
6. Inspect existing documentation.
7. Inspect Git status.
8. Inspect Git branches.
9. Inspect existing commits when useful.
10. Identify what is already implemented.
11. Identify incomplete features.
12. Identify broken features.
13. Identify technical debt.
14. Identify reusable components.
15. Identify architecture that must be preserved.
16. Identify architecture that should be refactored.

Do not overwrite working functionality merely because you would implement it differently.

Preserve valuable existing work.

---

# 4. EXISTING PROGRESS / RESUME SUPPORT

If an existing progress file, project state file, handoff document, changelog, or implementation plan exists, read it before making changes.

Possible files include:

- progress.md
- project-progress.md
- implementation-status.md
- handoff.md
- .agent-state.md
- architecture.md
- README.md
- task files
- implementation instruction files

If an `.agent-state.md` exists, treat it as the current AI-agent handoff state.

Use it to determine:

- What has been completed
- What is currently in progress
- What was intentionally deferred
- What remains
- Current architecture
- Current blockers
- Last completed task
- Last successful commit
- Deployment status
- Known bugs
- Next recommended task

Do not repeat completed work unless verification shows it is actually incomplete or broken.

---

# 5. CREATE A COMPLETE IMPLEMENTATION PLAN BEFORE BUILDING

Convert the project requirements into a complete sequence of implementation tasks.

Create as many task documents as genuinely necessary.

Do NOT arbitrarily limit the project to 20 files.

Depending on project complexity, the implementation may require:

- 10 tasks
- 20 tasks
- 30 tasks
- 50 tasks
- 100+ tasks

Choose the number based on actual project complexity.

Every task must represent a meaningful implementation unit.

---

# 6. IMPLEMENTATION DOCUMENTATION SYSTEM

Create a dedicated local planning/documentation directory outside the production source code when possible.

Recommended structure:

project-root/
├── application-source/
├── documentation/
├── ...
└── [internal agent planning directory]

The exact structure may be adapted to the project.

The implementation instruction files should contain detailed instructions for the AI coding agent.

Example:

01-project-foundation.md
02-project-architecture.md
03-database-schema.md
04-authentication.md
05-user-management.md
06-core-dashboard.md
07-main-feature.md
08-secondary-feature.md
09-api-layer.md
10-admin-panel.md
11-validation.md
12-error-handling.md
13-testing.md
14-security.md
15-performance.md
16-responsive-ui.md
17-seo.md
18-production-hardening.md
19-vercel-deployment.md
20-final-qa.md

The actual number and names must be determined by the project.

---

# 7. EACH MD FILE MUST BE SELF-CONTAINED

Every implementation `.md` file must clearly specify:

## Task title

A concise professional name.

## Objective

Explain exactly what this task accomplishes.

## Context

Explain why this task exists and how it connects to the rest of the project.

## Dependencies

List previous tasks that must already be completed.

## Files to inspect

List existing files that should be reviewed before implementation.

## Files to create

List expected new files.

## Files to modify

List expected existing files.

## Implementation requirements

Give precise technical instructions.

## UI requirements

If applicable, specify:

- Layout
- Components
- Navigation
- Responsive behavior
- States
- Loading states
- Empty states
- Error states
- Validation
- Accessibility
- Mobile behavior
- Desktop behavior

## Backend requirements

If applicable, specify:

- Routes
- Controllers
- Services
- Validation
- Authentication
- Authorization
- Database operations
- Error handling
- Logging

## Database requirements

Specify:

- Tables
- Fields
- Relationships
- Indexes
- Constraints
- Migrations
- Seed data
- Data validation

## API requirements

Specify:

- Endpoint
- HTTP method
- Request structure
- Response structure
- Authentication
- Authorization
- Validation
- Errors
- Status codes

## Security requirements

Specify relevant protections such as:

- Authentication
- Authorization
- Input validation
- Sanitization
- Rate limiting
- CSRF protection where applicable
- Secure cookies
- Secret management
- SQL injection prevention
- XSS prevention
- API security

## Testing requirements

Specify exactly what must be tested.

## Acceptance criteria

Define measurable conditions that determine whether the task is complete.

## Git requirements

Specify the commit expected after completion.

## Next task

Clearly identify the next implementation document.

---

# 8. SCREEN-BY-SCREEN REQUIREMENT

For projects containing a UI, do NOT describe only the major pages.

Break down the application into:

- Screens
- Pages
- Routes
- Layouts
- Sections
- Components
- Modals
- Drawers
- Forms
- Tables
- Cards
- Tabs
- Dropdowns
- Filters
- Search
- Pagination
- Notifications
- Loading states
- Empty states
- Error states
- Confirmation states

Every important screen must have implementation instructions.

For each screen document:

### Screen name

### Route

### Purpose

### User type

### Entry points

### Layout

### Components

### Data required

### API dependencies

### User interactions

### Validation

### Loading state

### Empty state

### Error state

### Success state

### Responsive behavior

### Accessibility

### Security considerations

### Acceptance criteria

Do not leave important UI behavior implicit.

---

# 9. SUBSCREEN / COMPONENT REQUIREMENT

If a screen contains meaningful subscreens or complex components, document them separately when necessary.

Examples:

Dashboard

→ Overview

→ Analytics

→ Recent Activity

→ Notifications

→ Filters

→ Detail View

→ Edit Modal

→ Confirmation Modal

Do not treat a complicated screen as one vague task.

Split it into logical implementation units.

---

# 10. DEPENDENCY ORDER

Implementation tasks must be ordered according to technical dependencies.

Generally follow a structure similar to:

1. Project discovery
2. Architecture
3. Repository setup
4. Application foundation
5. Design system
6. Database
7. Authentication
8. Core backend
9. Core frontend
10. Main features
11. Secondary features
12. Admin functionality
13. Integrations
14. Validation
15. Error handling
16. Security
17. Testing
18. Performance
19. Deployment
20. Final QA

However, adapt this order to the actual project.

Do not blindly follow this sequence when project architecture requires another dependency order.

---

# 11. STRICT SEQUENTIAL EXECUTION

This is extremely important.

Implementation documents must be executed sequentially.

For example:

01 → 02 → 03 → 04 → 05

Do NOT jump ahead.

Before starting task N+1:

1. Finish task N.
2. Test task N.
3. Verify task N.
4. Commit task N.
5. Push task N.
6. Update `.agent-state.md`.
7. Confirm the repository is in a clean/known state.
8. Only then start task N+1.

If task N is incomplete, do not pretend it is complete.

---

# 12. READ MD FILES IN SEQUENCE

When implementation instructions exist:

Read:

01-*.md

Complete it.

Commit it.

Update state.

Then read:

02-*.md

Complete it.

Commit it.

Update state.

Continue sequentially.

Never read the entire task sequence and then make uncontrolled changes across multiple future tasks.

The purpose is controlled incremental implementation.

---

# 13. GIT DISCIPLINE

Use Git professionally.

Before beginning:

Check:

git status

Check:

git branch

Check:

git remote -v

Determine whether the repository is already connected to the correct GitHub repository.

NEVER silently replace an existing remote.

NEVER delete existing Git history unless explicitly instructed.

---

# 14. GITHUB REPOSITORY REQUIREMENTS

The repository should be professional and publicly presentable.

The repository name must be:

- Meaningful
- Professional
- Searchable
- Related to the actual project
- Understandable without knowing the developer's personal name
- Based on relevant industry/product keywords

Avoid meaningless names such as:

- test-project
- final-project
- my-app
- project123
- maaz-project
- temp-project

Instead use a meaningful product/project keyword structure.

Examples:

- ai-tourism-recommendation-platform
- customer-support-ai-platform
- inventory-management-system
- ai-document-analysis-platform
- ecommerce-management-platform

Choose the actual name based on the project.

---

# 15. GITHUB DESCRIPTION

The GitHub repository description must professionally explain:

- What the project is
- The primary purpose
- Important technologies
- Key functionality

Avoid personal or informal descriptions.

Example structure:

"Production-ready [project type] built with [technology], providing [primary functionality] with [important capabilities]."

---

# 16. PUBLIC REPOSITORY HYGIENE

The GitHub repository is public.

Therefore NEVER commit:

- API keys
- Passwords
- Access tokens
- Private credentials
- `.env`
- `.env.local`
- Production secrets
- Personal authentication tokens
- Private certificates
- Private customer data
- Private datasets
- Internal agent state
- Temporary AI planning files
- AI conversation logs
- Claude-specific internal files
- Cursor-specific internal files
- Antigravity-specific internal files
- Temporary automation files
- Machine-specific configuration
- Local debugging artifacts

Use:

`.env.example`

for required environment variables.

---

# 17. INTERNAL AGENT FILES MUST REMAIN PRIVATE

Create internal agent state/planning files when useful.

However, these files must NOT be pushed to the public GitHub repository unless explicitly required by the project.

Examples:

- `.agent-state.md`
- internal AI prompts
- agent planning files
- temporary implementation instructions
- tool-specific configuration
- AI handoff notes
- internal scratch files

Add appropriate files/directories to `.gitignore`.

Before pushing, verify that no private/internal files are staged.

---

# 18. .AGENT-STATE.MD

Create:

`.agent-state.md`

This file is a local AI handoff/state file.

Its purpose is to allow another AI coding tool to continue the project.

It should contain:

# Agent State

## Project

[project name]

## Current phase

[phase]

## Last completed task

[task]

## Current task

[task]

## Next task

[task]

## Completed tasks

- [x] Task 01
- [x] Task 02

## Pending tasks

- [ ] Task 03
- [ ] Task 04

## Current architecture

[summary]

## Technology stack

[stack]

## Database status

[status]

## API status

[status]

## Authentication status

[status]

## Deployment status

[status]

## Last Git commit

[commit hash/message]

## Known issues

[list]

## Deferred work

[list]

## Important decisions

[list]

## Environment requirements

[list without exposing secrets]

## Resume instructions

[exact instructions for the next AI]

Update this file after every meaningful implementation unit.

---

# 19. AGENT STATE MUST NOT CONTAIN SECRETS

Never place:

- API keys
- Passwords
- Tokens
- Private URLs containing credentials
- Authentication cookies
- Sensitive personal information

inside `.agent-state.md`.

---

# 20. COMMIT STRATEGY

Every completed implementation unit must be committed before moving to the next implementation unit.

Prefer atomic commits.

Examples:

feat(auth): implement user authentication

feat(db): add initial database schema

feat(dashboard): implement dashboard layout

feat(api): add customer API endpoints

fix(auth): resolve session expiration issue

test(api): add customer endpoint tests

docs: update deployment instructions

Avoid meaningless commit messages such as:

- update
- changes
- final
- done
- work
- test

Commit messages must clearly describe the work.

---

# 21. FILE-BY-FILE COMMIT PRINCIPLE

Where practical, individual independent files may be committed individually.

However, do NOT create artificial commits merely to satisfy "one file = one commit."

If several files form one inseparable implementation unit, commit them together.

The priority is:

**Atomic + understandable + reversible Git history**

not:

**maximum number of commits**

---

# 22. PUSH AFTER EACH COMPLETED UNIT

After a successful implementation unit:

1. Run tests/checks.
2. Inspect git diff.
3. Verify no secrets are included.
4. Commit.
5. Push to the correct remote/branch.
6. Verify push succeeded.
7. Update `.agent-state.md`.

Only then proceed.

If pushing is impossible because authentication or network access is unavailable, clearly record the failure in `.agent-state.md` and continue only when safe.

Never claim something was pushed if it was not.

---

# 23. DO NOT DESTROY EXISTING GIT WORK

Before modifying a repository:

Check:

git status

If uncommitted user work exists:

DO NOT overwrite it.

Determine what belongs to the user and what belongs to the current task.

Never use destructive commands such as:

git reset --hard

git clean -fd

or force-push commands

unless explicitly authorized.

---

# 24. VERCEL DEPLOYMENT

If the project is compatible with Vercel, make it deployment-ready.

Verify:

- Build command
- Development command
- Production command
- Framework detection
- Environment variables
- Server/client boundaries
- API routes
- Database connectivity
- Authentication configuration
- CORS where applicable
- Image configuration
- Static assets
- Runtime compatibility
- Node/Python/runtime versions where relevant
- Build output
- Production error handling

Create/update:

`.env.example`

and deployment documentation.

Never commit actual production secrets.

---

# 25. VERCEL CONFIGURATION

If required, create the appropriate Vercel configuration.

For example:

`vercel.json`

Only create configuration when actually needed.

Do not add unnecessary configuration.

The goal is:

**git push → Vercel integration → build → deploy**

with minimal manual intervention.

---

# 26. DEPLOYMENT DOCUMENTATION

Create professional deployment documentation covering:

1. Prerequisites
2. Installation
3. Environment variables
4. Local development
5. Database setup
6. Build
7. Production configuration
8. Vercel setup
9. Domain configuration if applicable
10. Troubleshooting

Never expose secrets.

---

# 27. TESTING

Do not consider a feature complete simply because the code compiles.

Where applicable, test:

- Unit tests
- Integration tests
- API tests
- Authentication
- Authorization
- Form validation
- Database operations
- Error handling
- Responsive UI
- Critical user journeys
- Build
- Production configuration

For UI projects, manually inspect important screens where possible.

---

# 28. ERROR HANDLING

Every major feature must account for:

- Loading
- Success
- Empty
- Validation error
- Authentication error
- Authorization error
- Network error
- Server error
- Unexpected error

Do not build only the happy path.

---

# 29. SECURITY

Follow secure engineering practices.

Never:

- Hardcode secrets
- Trust client-side authorization
- Expose sensitive database fields
- Log credentials
- Store passwords insecurely
- Disable security controls merely to make development easier

Use the appropriate security mechanisms for the technology stack.

---

# 30. CODE QUALITY

Code must be:

- Modular
- Maintainable
- Readable
- Typed where appropriate
- Properly named
- DRY where appropriate
- Testable
- Production-oriented

Avoid unnecessary abstraction.

Avoid giant files when reasonable separation is possible.

Avoid duplicated business logic.

---

# 31. DO NOT OVERENGINEER

Use the simplest architecture that satisfies the requirements.

Do not introduce:

- unnecessary microservices
- unnecessary dependencies
- unnecessary databases
- unnecessary abstractions
- unnecessary AI agents
- unnecessary infrastructure

Every major technology choice must have a reason.

---

# 32. DEPENDENCY MANAGEMENT

Before adding a dependency:

1. Check whether the project already has an equivalent.
2. Determine whether the dependency is actively maintained.
3. Confirm compatibility.
4. Avoid adding packages for trivial functionality.

Keep dependencies minimal and intentional.

---

# 33. UI/UX QUALITY

For user-facing projects, the UI should be:

- Professional
- Consistent
- Responsive
- Accessible
- Intuitive
- Visually coherent

Define reusable:

- Colors
- Typography
- Spacing
- Buttons
- Inputs
- Cards
- Tables
- Modals
- Navigation
- Feedback states

Avoid random styling between screens.

---

# 34. RESPONSIVE DESIGN

Unless explicitly stated otherwise, support:

- Mobile
- Tablet
- Desktop

Consider:

- Navigation
- Tables
- Forms
- Cards
- Modals
- Sidebars
- Images
- Typography
- Touch targets

Do not simply shrink the desktop interface.

---

# 35. ACCESSIBILITY

Where applicable:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Form labels
- Accessible buttons
- Appropriate contrast
- Screen-reader considerations
- Error messaging

---

# 36. SEO

For public websites where applicable, implement:

- Page titles
- Meta descriptions
- Open Graph metadata
- Semantic HTML
- Clean URLs
- Sitemap
- Robots configuration
- Structured data where useful

Do not add SEO infrastructure to private/internal applications unless relevant.

---

# 37. DOCUMENTATION

The final project should have a professional README containing:

- Project overview
- Features
- Architecture
- Technology stack
- Project structure
- Installation
- Environment variables
- Local development
- Testing
- Deployment
- Vercel instructions where applicable
- Screenshots where appropriate
- API documentation where relevant
- Future improvements

The README is public-facing.

Do not include internal AI instructions.

---

# 38. PUBLIC VS PRIVATE DOCUMENTATION

Public documentation may include:

- README
- API documentation
- Architecture overview
- Installation
- Deployment
- Usage
- Contributing information

Private/internal documentation may include:

- `.agent-state.md`
- AI task plans
- Internal prompts
- Agent handoff notes
- Temporary implementation instructions
- Tool-specific instructions

Keep the second category out of the public repository.

---

# 39. IF REQUIREMENTS ARE AMBIGUOUS

Do not silently invent critical requirements.

Classify assumptions as:

### Confirmed

Explicitly provided by the project requirements.

### Reasonable assumption

Not specified but required for implementation.

### Needs clarification

Cannot safely determine without user input.

For non-critical ambiguity, make a reasonable professional assumption and record it.

For critical ambiguity that can materially change architecture, ask before implementing.

---

# 40. IF YOU DISCOVER A BETTER ARCHITECTURE

You may improve the architecture if:

- It materially improves reliability.
- It reduces unnecessary complexity.
- It improves maintainability.
- It improves security.
- It improves deployment.
- It follows established engineering practice.

However:

Do not silently make major architectural changes.

Document the decision and its reasoning.

---

# 41. DO NOT FAKE COMPLETION

Never say:

- implemented
- tested
- deployed
- pushed
- fixed

unless you actually verified it.

If something failed, report:

- What failed
- Why it failed
- What was attempted
- What remains

Honesty is more important than appearing complete.

---

# 42. LIMIT / SESSION INTERRUPTION RECOVERY

The project may be interrupted because:

- AI context limit is reached
- Coding agent session ends
- Computer restarts
- Different AI tool is used
- Different developer continues the project

Therefore, after every meaningful implementation unit, update `.agent-state.md`.

A new AI should be able to enter the project and understand:

1. What this project is.
2. What has already been built.
3. What is currently being worked on.
4. What remains.
5. What architecture decisions were made.
6. What the next task is.
7. What tests were run.
8. What the last Git commit was.
9. What known problems remain.

---

# 43. HANDOFF PROCEDURE

Before ending a session:

1. Finish the current safe implementation unit if possible.
2. Test it.
3. Commit it.
4. Push it.
5. Update `.agent-state.md`.
6. Record the exact next task.
7. Record unresolved issues.
8. Record important technical decisions.

If the current task cannot be completed, explicitly mark it:

`IN PROGRESS`

and explain exactly where work stopped.

---

# 44. RESUME PROCEDURE

When a new AI coding agent starts:

First read:

1. `.agent-state.md`
2. `README.md`
3. architecture documentation
4. relevant implementation task files
5. existing source code
6. Git status

Then determine the next task.

Do NOT restart the entire project.

Do NOT rebuild already completed functionality.

Do NOT assume the previous agent was correct without verification.

Verify the current state before continuing.

---

# 45. IMPLEMENTATION TASK FORMAT

Every implementation instruction file must use approximately this structure:

# TASK XX — [NAME]

## Objective

[objective]

## Why This Task Exists

[context]

## Dependencies

[dependencies]

## Current State

[current state]

## Files To Inspect

[list]

## Files To Create

[list]

## Files To Modify

[list]

## Implementation Instructions

[detailed instructions]

## UI Requirements

[requirements]

## Backend Requirements

[requirements]

## Database Requirements

[requirements]

## API Requirements

[requirements]

## Security Requirements

[requirements]

## Testing Requirements

[requirements]

## Acceptance Criteria

- [ ] ...
- [ ] ...
- [ ] ...

## Git Commit

Recommended commit:

`type(scope): description`

## Verification

[verification steps]

## Next Task

`TASK XX+1`

---

# 46. INITIAL PROJECT SETUP PROCEDURE

When starting a completely new project:

1. Analyze the requirements.
2. Determine project type.
3. Determine technology stack.
4. Determine architecture.
5. Determine project name.
6. Determine searchable GitHub repository name.
7. Determine public repository description.
8. Determine production directory structure.
9. Determine environment variables.
10. Determine database strategy.
11. Determine deployment strategy.
12. Generate implementation task files.
13. Create `.agent-state.md`.
14. Create `.gitignore`.
15. Create `.env.example`.
16. Initialize/check Git.
17. Connect to the existing GitHub repository if applicable.
18. Verify remote.
19. Make the first meaningful commit.
20. Push.
21. Begin TASK 01.

---

# 47. EXISTING PROJECT PROCEDURE

If the project already exists:

DO NOT recreate the project.

Instead:

1. Inspect the existing project.
2. Determine current architecture.
3. Determine current completion state.
4. Inspect Git history.
5. Inspect existing documentation.
6. Determine missing implementation tasks.
7. Generate/update the task sequence.
8. Update `.agent-state.md`.
9. Continue from the correct task.

---

# 48. GITHUB REMOTE SAFETY

Before pushing:

Verify:

- Remote URL
- Current branch
- Repository identity
- Git status
- Staged files

Never push to an unknown repository.

Never force-push unless explicitly authorized.

If the repository is already connected to GitHub, preserve the existing remote.

---

# 49. SEARCHABLE PROJECT NAMING

When choosing project/repository names, prioritize terminology that a developer, recruiter, client, or potential user would actually search for.

Use relevant keywords such as:

- AI
- CRM
- ecommerce
- inventory
- automation
- document-analysis
- tourism
- recommendation
- analytics
- customer-support
- booking
- management
- SaaS
- dashboard

Only use keywords that accurately describe the project.

Do not keyword-stuff.

---

# 50. FINAL PROJECT AUDIT

When all implementation tasks are complete, perform a final audit.

Check:

### Functionality

- [ ] All major requirements implemented
- [ ] All important screens implemented
- [ ] All critical workflows work

### Code

- [ ] No obvious dead code
- [ ] No accidental debug code
- [ ] No unnecessary dependencies
- [ ] Consistent architecture

### Security

- [ ] No secrets committed
- [ ] Authentication verified
- [ ] Authorization verified
- [ ] Input validation verified

### GitHub

- [ ] Professional repository name
- [ ] Professional description
- [ ] Clean Git history
- [ ] Correct remote
- [ ] Correct branch
- [ ] No private agent files
- [ ] No secrets

### Deployment

- [ ] Production build succeeds
- [ ] Environment variables documented
- [ ] Vercel configuration verified where applicable
- [ ] Production deployment tested

### Documentation

- [ ] README complete
- [ ] Setup instructions complete
- [ ] Deployment instructions complete
- [ ] `.env.example` complete
- [ ] Internal state files excluded

### Agent Continuity

- [ ] `.agent-state.md` updated
- [ ] Final architecture recorded
- [ ] Final commit recorded
- [ ] Known issues recorded
- [ ] Future improvements recorded

---

# 51. FINAL COMPLETION REPORT

When the project is complete, provide a concise final report containing:

## Project

[project name]

## Architecture

[summary]

## Technology Stack

[list]

## Major Features

[list]

## Database

[summary]

## API

[summary]

## Authentication

[summary]

## Testing

[summary]

## Deployment

[summary]

## GitHub

[repository information]

## Vercel

[deployment status]

## Completed Tasks

[list]

## Known Issues

[list]

## Future Improvements

[list]

## Final Agent State

[summary]

---

# 52. MOST IMPORTANT EXECUTION RULE

Always follow this loop:

**READ → UNDERSTAND → IMPLEMENT → TEST → VERIFY → COMMIT → PUSH → UPDATE STATE → NEXT TASK**

Never skip:

**TEST**

Never skip:

**COMMIT**

Never skip:

**UPDATE STATE**

Never move to the next implementation task while the previous task is knowingly incomplete.

---

# 53. PRIORITY ORDER

When requirements conflict, prioritize:

1. Explicit user requirements
2. Security
3. Data integrity
4. Functional correctness
5. Production reliability
6. Maintainability
7. Deployment reliability
8. Testing
9. UX
10. Performance
11. Convenience

Do not sacrifice security or data integrity merely to make implementation faster.

---

# 54. FINAL INSTRUCTION

You are not being asked to produce a quick prototype unless the project requirements explicitly say so.

Treat the project as a professional software engineering project.

Build it incrementally.

Document it.

Test it.

Commit it.

Push it.

Keep internal AI state private.

Make the public GitHub repository clean and professional.

Make deployment straightforward.

Maintain enough state that another AI coding agent can continue the project without needing the previous conversation.

When requirements are provided, first determine the complete implementation architecture and task sequence.

Then execute the tasks strictly in dependency order.

Do not improvise beyond the project requirements without documenting the decision.

Do not claim work is complete without verification.

**The objective is not merely to generate code.**

**The objective is to produce a maintainable, testable, documented, Git-managed, deployment-ready software project that can survive AI-agent handoffs.**

--- FILE: Prompts To Build System/ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md ---
# Assignment — SMB Project Management Tool
**Assigned to:** Maaz  
**Priority:** 🔴 High  
**Status:** 🟢 Active  
**Total Sub-tasks:** 11  
**Phase:** Phase A — Core Build  
**Previous Assignment:** SMB Finance Tracker (Paused — will resume after this)

---

## Objective

Build a complete SMB Project Management Tool for Innoventix Hub internal use. This is the **core foundation** of a full business management system that will eventually connect with Invoice Generator (Rehmat) and Finance Tracker (Phase 2) to create a fully automated end-to-end business operation platform.

---

## Big Picture — Where This Fits

```
Project Management (Maaz) ← YOU ARE HERE
        ↓
Invoice Generator (Rehmat) ← Running parallel
        ↓
Finance Tracker (Maaz - Phase 2)
        ↓
Full Connected System:
Client updates project → Auto invoice → Auto income recorded → Auto report
```

---

## How the System Will Work (Full Vision)

```
Ubaid adds client + project
        ↓
Team works on project
        ↓
Status updated → "Delivered"
        ↓
AUTO: Invoice Generator triggered → PDF → Email to client
        ↓
Client pays → Mark as Paid
        ↓
AUTO: Finance Tracker records income
        ↓
AUTO: Monthly report updated → Slack notification to Ubaid
```

---

## Sub-task 1 — Requirements Gathering

- Discuss with Ubaid: what types of projects does Innoventix Hub handle?
  - UGC Media (video ads)
  - AI Voice Agents
  - Automation/N8N builds
  - Combined projects
- Confirm team structure (who assigns tasks to whom)
- Confirm what Ubaid needs to see on dashboard
- Confirm what clients need to see on their portal
- Discuss integration plan with Rehmat (Invoice Generator)
- Confirm Supabase as shared database

---

## Sub-task 2 — Database Design (Supabase)

**All tables shared with Rehmat's Invoice Generator and future Finance Tracker.**

### clients table
```sql
CREATE TABLE clients (
  client_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  platform TEXT, -- WhatsApp/Slack/Upwork/Discord/Other
  country TEXT,
  currency TEXT DEFAULT 'USD',
  payment_schedule TEXT, -- Monthly/Weekly/Per Project
  status TEXT DEFAULT 'active', -- active/paused/completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### projects table
```sql
CREATE TABLE projects (
  project_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(client_id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- UGC Media/AI Voice Agent/Automation/Combined
  brief_source TEXT, -- WhatsApp/Slack/Upwork/Discord/Email
  amount DECIMAL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'brief_received',
  -- Status flow:
  -- brief_received → in_progress → review → delivered → invoiced → paid
  priority TEXT DEFAULT 'medium', -- low/medium/high
  start_date DATE,
  deadline DATE,
  delivered_at TIMESTAMPTZ,
  invoice_triggered BOOLEAN DEFAULT false,
  assigned_to TEXT, -- team member name
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### tasks table
```sql
CREATE TABLE tasks (
  task_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'todo', -- todo/in_progress/review/done
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### deliverables table
```sql
CREATE TABLE deliverables (
  deliverable_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  title TEXT NOT NULL,
  file_url TEXT,
  drive_link TEXT,
  status TEXT DEFAULT 'pending', -- pending/approved/revision_required
  client_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
```

### team_members table
```sql
CREATE TABLE team_members (
  member_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT, -- CEO/Co-Founder/AI Intern/Video Editor/etc
  email TEXT,
  skills TEXT[], -- ['n8n', 'voice_agents', 'video_editing']
  active BOOLEAN DEFAULT true
);
```

---

## Sub-task 3 — Project Status Flow & Automation (N8N)

### Status Flow:
```
Brief Received
      ↓
In Progress (team working)
      ↓
Review (Ubaid checks)
      ↓
Delivered (sent to client)
      ↓ ← AUTO TRIGGER HERE
Invoiced (Invoice Generator fires)
      ↓
Paid (after client payment)
```

### N8N Flow 1 — Project Delivered → Invoice Trigger:
```
Ubaid marks project → "Delivered"
        ↓
N8N detects Supabase change
        ↓
Check: payment_schedule = Per Project?
        ↓
YES → Trigger Rehmat's Invoice Generator
      (pass: client_id, project_id, amount)
        ↓
Invoice auto-generated → PDF → Email to client
        ↓
Project status → "Invoiced"
        ↓
Slack notification to Ubaid:
"Invoice sent to [Client Name] for [Project Title]"
```

### N8N Flow 2 — Task Deadline Alert:
```
N8N checks daily: any tasks due tomorrow?
        ↓
Slack notification to assigned team member:
"Task due tomorrow: [Task Title] — [Project Name]"
```

### N8N Flow 3 — Project Overdue Alert:
```
N8N checks daily: any projects past deadline?
        ↓
Status still not "Delivered"?
        ↓
Slack notification to Ubaid:
"⚠️ Project overdue: [Project Title] — [Client Name]"
```

### N8N Flow 4 — Weekly Summary:
```
N8N Schedule: Every Monday morning
        ↓
Collect: active projects, pending tasks, upcoming deadlines
        ↓
Slack notification to Ubaid:
Weekly project summary report
```

---

## Sub-task 4 — Frontend Pages (Next.js + Tailwind)

### Ubaid's Dashboard — Pages:

**`/dashboard`** — Main Overview:
- Active projects count
- Pending tasks count
- Overdue projects (red alert)
- Revenue this month (from connected system)
- Quick add: New Client / New Project

**`/clients`** — Client Management:
- All clients list with status
- Search and filter
- Click client → see all their projects

**`/clients/new`** — Add New Client:
- Name, company, email, phone
- Platform (WhatsApp/Slack/Upwork/Discord)
- Payment schedule
- Currency
- Notes

**`/projects`** — All Projects:
- Kanban board view (drag to change status)
- List view (with filters)
- Filter by: status, client, type, assigned to
- Color coded by priority

**`/projects/new`** — Add New Project:
- Select client (dropdown)
- Project title, description, type
- Brief source (which platform)
- Amount, currency
- Deadline
- Assign to team member

**`/projects/[id]`** — Project Detail:
- Full project info
- Task list with checkboxes
- Deliverables section (upload/link)
- Status update button
- Timeline/activity log
- Notes

**`/tasks`** — All Tasks:
- My tasks / All tasks toggle
- Filter by project, status, due date
- Quick complete checkbox

**`/team`** — Team Overview:
- Team members list
- Each member's active tasks
- Workload view

---

## Sub-task 5 — Project Status Tags (Frontend)

| Status | Color | Icon | Meaning |
|---|---|---|---|
| Brief Received | Gray | 📋 | Just added |
| In Progress | Blue | 🔄 | Team working |
| Review | Yellow | 👁️ | Ubaid checking |
| Delivered | Orange | 📤 | Sent to client |
| Invoiced | Purple | 🧾 | Invoice sent |
| Paid | Green | ✅ | Payment received |
| On Hold | Red | ⏸️ | Paused |

---

## Sub-task 6 — Client Portal (Separate Login)

**Clients access their own portal — no switching platforms needed for them:**

**`/client/login`** — Magic link or password login

**`/client/dashboard`** — Client sees:
- Their active projects + status
- Deliverables ready for review
- Pending invoices
- Payment history

**`/client/projects/[id]`** — Project detail:
- Current status
- Deliverables (download/view)
- Feedback form (approve or request revision)
- Invoice + payment status

**Client actions that auto-update Ubaid's system:**
```
Client approves deliverable
        ↓
AUTO: Project status → "Approved"
AUTO: Slack notification to Ubaid

Client requests revision
        ↓
AUTO: Task created for revision
AUTO: Slack notification to Ubaid

Client views invoice (future)
        ↓
Tracked in system
```

**Auth:** Supabase Auth — per client login  
**RLS:** Each client sees ONLY their own projects

---

## Sub-task 7 — Dashboard Analytics

**Ubaid's overview dashboard shows:**
- Total active projects
- Projects by status (pie/bar chart)
- Revenue pipeline (total value of active projects)
- Team workload (tasks per member)
- Upcoming deadlines (next 7 days)
- Overdue items (highlighted red)
- Monthly project completion rate

---

## Sub-task 8 — Testing

- Add 3 test clients manually
- Create 5 projects per client with different statuses
- Test full status flow: Brief Received → Paid
- Test N8N invoice trigger on "Delivered"
- Test task deadline Slack alert
- Test overdue project Slack alert
- Test client portal login — verify client sees only their data
- Test client approval → Ubaid gets notification
- Test Kanban drag and drop
- Mobile responsive check on all pages

---

## Sub-task 9 — Deployment

- Deploy frontend on Netlify
- Set up Supabase production database
- Configure RLS policies for client portal
- Activate all N8N workflows on Contabo VPS
- Share admin dashboard link with Ubaid
- Share client portal link (test with one client)

---

## Sub-task 10 — Integration with Invoice Generator (Rehmat)

**This runs in parallel with Rehmat's work:**

- Confirm shared Supabase tables structure with Rehmat
- Test trigger: project "Delivered" → Invoice auto-fires
- Test data passing: client_id, project_id, amount → Invoice Generator
- Verify invoice status reflects back in Project Management
- Full end-to-end test: project complete → invoice sent → paid → recorded

---

## Sub-task 11 — Demo to Ubaid

**Live demo walkthrough:**
- Add new client
- Add new project
- Assign tasks to team members
- Move project through all status stages
- Trigger invoice automatically on delivery
- Show client portal — client view
- Show Slack notifications firing
- Show dashboard analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Database | Supabase (PostgreSQL) — shared with Rehmat |
| Auth | Supabase Auth (team + client portal) |
| Automation | N8N (Contabo VPS) |
| Notifications | Slack |
| Hosting | Netlify |
| File Storage | Supabase Storage or Google Drive links |

---

## Phase 2 — Finance Tracker Connection (After this is complete)

```
Project marked PAID
        ↓
AUTO: Finance Tracker records income
      - Amount
      - Client name
      - Project type
      - Date
        ↓
Monthly financial report auto-updates
        ↓
Complete Business Management System:

[Project Management] ←→ [Invoice Generator] ←→ [Finance Tracker]
         ↑                                              ↓
    Client Portal                              Slack Reports to Ubaid
```

---

## Important Notes

- **Ubaid adds all clients and projects** — clients do NOT need to switch platforms
- **Client portal is optional per client** — some clients may never use it
- **N8N is the automation brain** — all triggers go through N8N on Contabo VPS
- **Supabase is shared** — same database as Rehmat's Invoice Generator
- **Build for scale** — design database to support 50+ clients from day one
- **Mobile first** — Ubaid checks on phone, make sure it works perfectly on mobile

---

*Assignment created: September 2026 | Innoventix Hub*
*Previous assignment (Finance Tracker) paused — will resume after Project Management is complete*


--- FILE: Prompts To Build System/README.md ---
# Task Index — Innoventix Platform Build

Read `00-MASTER-PROMPT-project-orchestrator.md` first, then work through these in order.

- `00-MASTER-PROMPT-project-orchestrator.md` — MASTER PROMPT — Innoventix Platform Build Orchestrator
- `01-repository-and-monorepo-foundation.md` — TASK 01 — Repository & Monorepo Foundation
- `02-multi-tenant-architecture-decision-record.md` — TASK 02 — Multi-Tenant Architecture Decision Record
- `03-core-database-schema--organizations-users-roles.md` — TASK 03 — Core Database Schema — Organizations, Users, Roles
- `04-core-database-schema--crm-and-project-management-tables.md` — TASK 04 — Core Database Schema — CRM & Project Management Tables
- `05-core-database-schema--communication-hub-and-billing.md` — TASK 05 — Core Database Schema — Communication Hub & Billing
- `06-authentication-supabase-auth--team-members.md` — TASK 06 — Authentication (Supabase Auth) — Team Members
- `07-authorization--roles-and-row-level-security-policies.md` — TASK 07 — Authorization — Roles & Row-Level Security Policies
- `08-organization-onboarding-and-tenant-provisioning.md` — TASK 08 — Organization Onboarding & Tenant Provisioning
- `09-subscription-plans-definition.md` — TASK 09 — Subscription Plans Definition
- `10-stripe-billing-integration.md` — TASK 10 — Stripe Billing Integration
- `11-application-shell-navigation-and-organization-switcher.md` — TASK 11 — Application Shell, Navigation & Organization Switcher
- `12-main-dashboard-overview.md` — TASK 12 — Main Dashboard Overview
- `13-organization-settings-and-team-management.md` — TASK 13 — Organization Settings & Team Management
- `14-crm--clients-list-and-management.md` — TASK 14 — CRM — Clients List & Management
- `15-crm--client-detail-page.md` — TASK 15 — CRM — Client Detail Page
- `16-crm--leads--sales-pipeline-kanban.md` — TASK 16 — CRM — Leads / Sales Pipeline (Kanban)
- `17-crm--client-communication-log.md` — TASK 17 — CRM — Client Communication Log
- `18-crm--tags-segmentation-and-advanced-search.md` — TASK 18 — CRM — Tags, Segmentation & Advanced Search
- `19-projects--list-and-kanban-board.md` — TASK 19 — Projects — List & Kanban Board
- `20-projects--detail-page.md` — TASK 20 — Projects — Detail Page
- `21-tasks-module.md` — TASK 21 — Tasks Module
- `22-deliverables-module.md` — TASK 22 — Deliverables Module
- `23-project-templates.md` — TASK 23 — Project Templates
- `24-team-workload-view.md` — TASK 24 — Team Workload View
- `25-status-tag-system--shared-component-library.md` — TASK 25 — Status Tag System — Shared Component Library
- `26-communication-hub--architecture-and-unified-inbox-data-layer.md` — TASK 26 — Communication Hub — Architecture & Unified Inbox Data Layer
- `27-communication-hub--slack-integration.md` — TASK 27 — Communication Hub — Slack Integration
- `28-communication-hub--whatsapp-integration.md` — TASK 28 — Communication Hub — WhatsApp Integration
- `29-communication-hub--email-integration.md` — TASK 29 — Communication Hub — Email Integration
- `30-communication-hub--discord-and-upwork-channel-stubs.md` — TASK 30 — Communication Hub — Discord & Upwork Channel Stubs
- `31-communication-hub--unified-inbox-ui.md` — TASK 31 — Communication Hub — Unified Inbox UI
- `32-n8n-automation-architecture-and-webhook-contracts.md` — TASK 32 — N8N Automation Architecture & Webhook Contracts
- `33-automation--project-delivered-→-invoice-trigger.md` — TASK 33 — Automation — Project Delivered → Invoice Trigger
- `34-automation--deadline-and-overdue-alerts.md` — TASK 34 — Automation — Deadline & Overdue Alerts
- `35-automation--weekly-summary-report.md` — TASK 35 — Automation — Weekly Summary Report
- `36-in-app-notification-center.md` — TASK 36 — In-App Notification Center
- `37-client-portal--auth-and-rls.md` — TASK 37 — Client Portal — Auth & RLS
- `38-client-portal--dashboard.md` — TASK 38 — Client Portal — Dashboard
- `39-client-portal--project-detail-and-approval-flow.md` — TASK 39 — Client Portal — Project Detail & Approval Flow
- `40-client-portal--invoice-and-payment-status-view.md` — TASK 40 — Client Portal — Invoice & Payment Status View
- `41-analytics-dashboard.md` — TASK 41 — Analytics Dashboard
- `42-revenue-and-plan-usage-reporting.md` — TASK 42 — Revenue & Plan-Usage Reporting
- `43-exportable-reports-pdf-csv.md` — TASK 43 — Exportable Reports (PDF/CSV)
- `44-input-validation-and-sanitization-layer.md` — TASK 44 — Input Validation & Sanitization Layer
- `45-secrets-management-and-api-security.md` — TASK 45 — Secrets Management & API Security
- `46-audit-logging.md` — TASK 46 — Audit Logging
- `47-automated-testing-setup--unit-and-integration.md` — TASK 47 — Automated Testing Setup — Unit & Integration
- `48-end-to-end-testing--critical-user-flows.md` — TASK 48 — End-to-End Testing — Critical User Flows
- `49-load-and-multi-tenant-scale-testing.md` — TASK 49 — Load & Multi-Tenant Scale Testing
- `50-environment-configuration-and-secrets-for-production.md` — TASK 50 — Environment Configuration & Secrets for Production
- `51-netlify-deployment-pipeline.md` — TASK 51 — Netlify Deployment Pipeline
- `52-n8n-workflow-activation-on-contabo-vps.md` — TASK 52 — N8N Workflow Activation on Contabo VPS
- `53-final-qa-security-audit-and-demo-preparation.md` — TASK 53 — Final QA, Security Audit & Demo Preparation


