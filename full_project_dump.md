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


--- FILE: .eslintrc.json ---

{
  "extends": ["next/core-web-vitals"]
}


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


--- FILE: .prettierrc ---

{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}


--- FILE: next-env.d.ts ---

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.


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


--- FILE: postcss.config.js ---

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};


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


--- FILE: supabase/migrations/0003_crm_clients.sql ---

-- TASK 04 Migration 1: CRM Clients Table (Tenant Scoped)

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    platform VARCHAR(100),
    country VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_schedule VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('lead', 'active', 'inactive', 'archived')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for clients updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index on organization_id for multi-tenant RLS performance
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;


--- FILE: supabase/migrations/0004_projects_tasks_deliverables.sql ---

-- TASK 04 Migration 2: Projects, Tasks, and Deliverables Tables with Cross-Tenant Isolation Triggers

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100),
    brief_source VARCHAR(100),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'brief_received' CHECK (
        status IN ('brief_received', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'on_hold')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    start_date DATE,
    deadline DATE,
    delivered_at TIMESTAMPTZ,
    invoice_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (
        status IN ('todo', 'in_progress', 'review', 'completed', 'blocked')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Deliverables Table
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT,
    drive_link TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'submitted', 'approved', 'revision_requested')
    ),
    client_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Cross-Tenant Isolation Validation Triggers

-- Validate that project client belongs to the same organization
CREATE OR REPLACE FUNCTION validate_project_client_organization()
RETURNS TRIGGER AS $$
DECLARE
    client_org_id UUID;
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        SELECT organization_id INTO client_org_id FROM public.clients WHERE id = NEW.client_id;
        IF client_org_id IS NULL OR client_org_id <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-organization client assignment prohibited: Client % does not belong to Organization %', NEW.client_id, NEW.organization_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_project_client_org
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_client_organization();

-- Validate that task project belongs to the same organization
CREATE OR REPLACE FUNCTION validate_task_project_organization()
RETURNS TRIGGER AS $$
DECLARE
    project_org_id UUID;
BEGIN
    SELECT organization_id INTO project_org_id FROM public.projects WHERE id = NEW.project_id;
    IF project_org_id IS NULL OR project_org_id <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-organization task assignment prohibited: Project % does not belong to Organization %', NEW.project_id, NEW.organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_task_project_org
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_project_organization();

-- Validate that deliverable project belongs to the same organization
CREATE OR REPLACE FUNCTION validate_deliverable_project_organization()
RETURNS TRIGGER AS $$
DECLARE
    project_org_id UUID;
BEGIN
    SELECT organization_id INTO project_org_id FROM public.projects WHERE id = NEW.project_id;
    IF project_org_id IS NULL OR project_org_id <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-organization deliverable assignment prohibited: Project % does not belong to Organization %', NEW.project_id, NEW.organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_deliverable_project_org
    BEFORE INSERT OR UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE FUNCTION validate_deliverable_project_organization();

-- 5. Indexes for Query Performance & RLS Enforcement
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_deliverables_organization_id ON public.deliverables(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.deliverables(status);

-- 6. Enable Row-Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;


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


--- FILE: tsconfig.tsbuildinfo ---

{"fileNames":["./node_modules/typescript/lib/lib.es5.d.ts","./node_modules/typescript/lib/lib.es2015.d.ts","./node_modules/typescript/lib/lib.es2016.d.ts","./node_modules/typescript/lib/lib.es2017.d.ts","./node_modules/typescript/lib/lib.es2018.d.ts","./node_modules/typescript/lib/lib.es2019.d.ts","./node_modules/typescript/lib/lib.es2020.d.ts","./node_modules/typescript/lib/lib.es2021.d.ts","./node_modules/typescript/lib/lib.es2022.d.ts","./node_modules/typescript/lib/lib.es2023.d.ts","./node_modules/typescript/lib/lib.es2024.d.ts","./node_modules/typescript/lib/lib.esnext.d.ts","./node_modules/typescript/lib/lib.dom.d.ts","./node_modules/typescript/lib/lib.dom.iterable.d.ts","./node_modules/typescript/lib/lib.es2015.core.d.ts","./node_modules/typescript/lib/lib.es2015.collection.d.ts","./node_modules/typescript/lib/lib.es2015.generator.d.ts","./node_modules/typescript/lib/lib.es2015.iterable.d.ts","./node_modules/typescript/lib/lib.es2015.promise.d.ts","./node_modules/typescript/lib/lib.es2015.proxy.d.ts","./node_modules/typescript/lib/lib.es2015.reflect.d.ts","./node_modules/typescript/lib/lib.es2015.symbol.d.ts","./node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","./node_modules/typescript/lib/lib.es2016.array.include.d.ts","./node_modules/typescript/lib/lib.es2016.intl.d.ts","./node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","./node_modules/typescript/lib/lib.es2017.date.d.ts","./node_modules/typescript/lib/lib.es2017.object.d.ts","./node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2017.string.d.ts","./node_modules/typescript/lib/lib.es2017.intl.d.ts","./node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","./node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","./node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","./node_modules/typescript/lib/lib.es2018.intl.d.ts","./node_modules/typescript/lib/lib.es2018.promise.d.ts","./node_modules/typescript/lib/lib.es2018.regexp.d.ts","./node_modules/typescript/lib/lib.es2019.array.d.ts","./node_modules/typescript/lib/lib.es2019.object.d.ts","./node_modules/typescript/lib/lib.es2019.string.d.ts","./node_modules/typescript/lib/lib.es2019.symbol.d.ts","./node_modules/typescript/lib/lib.es2019.intl.d.ts","./node_modules/typescript/lib/lib.es2020.bigint.d.ts","./node_modules/typescript/lib/lib.es2020.date.d.ts","./node_modules/typescript/lib/lib.es2020.promise.d.ts","./node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2020.string.d.ts","./node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","./node_modules/typescript/lib/lib.es2020.intl.d.ts","./node_modules/typescript/lib/lib.es2020.number.d.ts","./node_modules/typescript/lib/lib.es2021.promise.d.ts","./node_modules/typescript/lib/lib.es2021.string.d.ts","./node_modules/typescript/lib/lib.es2021.weakref.d.ts","./node_modules/typescript/lib/lib.es2021.intl.d.ts","./node_modules/typescript/lib/lib.es2022.array.d.ts","./node_modules/typescript/lib/lib.es2022.error.d.ts","./node_modules/typescript/lib/lib.es2022.intl.d.ts","./node_modules/typescript/lib/lib.es2022.object.d.ts","./node_modules/typescript/lib/lib.es2022.string.d.ts","./node_modules/typescript/lib/lib.es2022.regexp.d.ts","./node_modules/typescript/lib/lib.es2023.array.d.ts","./node_modules/typescript/lib/lib.es2023.collection.d.ts","./node_modules/typescript/lib/lib.es2023.intl.d.ts","./node_modules/typescript/lib/lib.es2024.arraybuffer.d.ts","./node_modules/typescript/lib/lib.es2024.collection.d.ts","./node_modules/typescript/lib/lib.es2024.object.d.ts","./node_modules/typescript/lib/lib.es2024.promise.d.ts","./node_modules/typescript/lib/lib.es2024.regexp.d.ts","./node_modules/typescript/lib/lib.es2024.sharedmemory.d.ts","./node_modules/typescript/lib/lib.es2024.string.d.ts","./node_modules/typescript/lib/lib.esnext.array.d.ts","./node_modules/typescript/lib/lib.esnext.collection.d.ts","./node_modules/typescript/lib/lib.esnext.intl.d.ts","./node_modules/typescript/lib/lib.esnext.disposable.d.ts","./node_modules/typescript/lib/lib.esnext.promise.d.ts","./node_modules/typescript/lib/lib.esnext.decorators.d.ts","./node_modules/typescript/lib/lib.esnext.iterator.d.ts","./node_modules/typescript/lib/lib.esnext.float16.d.ts","./node_modules/typescript/lib/lib.esnext.error.d.ts","./node_modules/typescript/lib/lib.esnext.sharedmemory.d.ts","./node_modules/typescript/lib/lib.decorators.d.ts","./node_modules/typescript/lib/lib.decorators.legacy.d.ts","./node_modules/next/dist/styled-jsx/types/css.d.ts","./node_modules/@types/react/global.d.ts","./node_modules/csstype/index.d.ts","./node_modules/@types/prop-types/index.d.ts","./node_modules/@types/react/index.d.ts","./node_modules/next/dist/styled-jsx/types/index.d.ts","./node_modules/next/dist/styled-jsx/types/macro.d.ts","./node_modules/next/dist/styled-jsx/types/style.d.ts","./node_modules/next/dist/styled-jsx/types/global.d.ts","./node_modules/next/dist/shared/lib/amp.d.ts","./node_modules/next/amp.d.ts","./node_modules/@types/node/compatibility/disposable.d.ts","./node_modules/@types/node/compatibility/indexable.d.ts","./node_modules/@types/node/compatibility/iterators.d.ts","./node_modules/@types/node/compatibility/index.d.ts","./node_modules/@types/node/globals.typedarray.d.ts","./node_modules/@types/node/buffer.buffer.d.ts","./node_modules/@types/node/globals.d.ts","./node_modules/@types/node/web-globals/abortcontroller.d.ts","./node_modules/@types/node/web-globals/domexception.d.ts","./node_modules/@types/node/web-globals/events.d.ts","./node_modules/undici-types/header.d.ts","./node_modules/undici-types/readable.d.ts","./node_modules/undici-types/file.d.ts","./node_modules/undici-types/fetch.d.ts","./node_modules/undici-types/formdata.d.ts","./node_modules/undici-types/connector.d.ts","./node_modules/undici-types/client.d.ts","./node_modules/undici-types/errors.d.ts","./node_modules/undici-types/dispatcher.d.ts","./node_modules/undici-types/global-dispatcher.d.ts","./node_modules/undici-types/global-origin.d.ts","./node_modules/undici-types/pool-stats.d.ts","./node_modules/undici-types/pool.d.ts","./node_modules/undici-types/handlers.d.ts","./node_modules/undici-types/balanced-pool.d.ts","./node_modules/undici-types/agent.d.ts","./node_modules/undici-types/mock-interceptor.d.ts","./node_modules/undici-types/mock-agent.d.ts","./node_modules/undici-types/mock-client.d.ts","./node_modules/undici-types/mock-pool.d.ts","./node_modules/undici-types/mock-errors.d.ts","./node_modules/undici-types/proxy-agent.d.ts","./node_modules/undici-types/env-http-proxy-agent.d.ts","./node_modules/undici-types/retry-handler.d.ts","./node_modules/undici-types/retry-agent.d.ts","./node_modules/undici-types/api.d.ts","./node_modules/undici-types/interceptors.d.ts","./node_modules/undici-types/util.d.ts","./node_modules/undici-types/cookies.d.ts","./node_modules/undici-types/patch.d.ts","./node_modules/undici-types/websocket.d.ts","./node_modules/undici-types/eventsource.d.ts","./node_modules/undici-types/filereader.d.ts","./node_modules/undici-types/diagnostics-channel.d.ts","./node_modules/undici-types/content-type.d.ts","./node_modules/undici-types/cache.d.ts","./node_modules/undici-types/index.d.ts","./node_modules/@types/node/web-globals/fetch.d.ts","./node_modules/@types/node/assert.d.ts","./node_modules/@types/node/assert/strict.d.ts","./node_modules/@types/node/async_hooks.d.ts","./node_modules/@types/node/buffer.d.ts","./node_modules/@types/node/child_process.d.ts","./node_modules/@types/node/cluster.d.ts","./node_modules/@types/node/console.d.ts","./node_modules/@types/node/constants.d.ts","./node_modules/@types/node/crypto.d.ts","./node_modules/@types/node/dgram.d.ts","./node_modules/@types/node/diagnostics_channel.d.ts","./node_modules/@types/node/dns.d.ts","./node_modules/@types/node/dns/promises.d.ts","./node_modules/@types/node/domain.d.ts","./node_modules/@types/node/events.d.ts","./node_modules/@types/node/fs.d.ts","./node_modules/@types/node/fs/promises.d.ts","./node_modules/@types/node/http.d.ts","./node_modules/@types/node/http2.d.ts","./node_modules/@types/node/https.d.ts","./node_modules/@types/node/inspector.generated.d.ts","./node_modules/@types/node/module.d.ts","./node_modules/@types/node/net.d.ts","./node_modules/@types/node/os.d.ts","./node_modules/@types/node/path.d.ts","./node_modules/@types/node/perf_hooks.d.ts","./node_modules/@types/node/process.d.ts","./node_modules/@types/node/punycode.d.ts","./node_modules/@types/node/querystring.d.ts","./node_modules/@types/node/readline.d.ts","./node_modules/@types/node/readline/promises.d.ts","./node_modules/@types/node/repl.d.ts","./node_modules/@types/node/sea.d.ts","./node_modules/@types/node/stream.d.ts","./node_modules/@types/node/stream/promises.d.ts","./node_modules/@types/node/stream/consumers.d.ts","./node_modules/@types/node/stream/web.d.ts","./node_modules/@types/node/string_decoder.d.ts","./node_modules/@types/node/test.d.ts","./node_modules/@types/node/timers.d.ts","./node_modules/@types/node/timers/promises.d.ts","./node_modules/@types/node/tls.d.ts","./node_modules/@types/node/trace_events.d.ts","./node_modules/@types/node/tty.d.ts","./node_modules/@types/node/url.d.ts","./node_modules/@types/node/util.d.ts","./node_modules/@types/node/v8.d.ts","./node_modules/@types/node/vm.d.ts","./node_modules/@types/node/wasi.d.ts","./node_modules/@types/node/worker_threads.d.ts","./node_modules/@types/node/zlib.d.ts","./node_modules/@types/node/index.d.ts","./node_modules/next/dist/server/get-page-files.d.ts","./node_modules/@types/react/canary.d.ts","./node_modules/@types/react/experimental.d.ts","./node_modules/@types/react-dom/index.d.ts","./node_modules/@types/react-dom/canary.d.ts","./node_modules/@types/react-dom/experimental.d.ts","./node_modules/next/dist/compiled/webpack/webpack.d.ts","./node_modules/next/dist/server/config.d.ts","./node_modules/next/dist/lib/load-custom-routes.d.ts","./node_modules/next/dist/shared/lib/image-config.d.ts","./node_modules/next/dist/build/webpack/plugins/subresource-integrity-plugin.d.ts","./node_modules/next/dist/server/body-streams.d.ts","./node_modules/next/dist/server/future/route-kind.d.ts","./node_modules/next/dist/server/future/route-definitions/route-definition.d.ts","./node_modules/next/dist/server/future/route-matches/route-match.d.ts","./node_modules/next/dist/client/components/app-router-headers.d.ts","./node_modules/next/dist/server/request-meta.d.ts","./node_modules/next/dist/server/lib/revalidate.d.ts","./node_modules/next/dist/server/config-shared.d.ts","./node_modules/next/dist/server/base-http/index.d.ts","./node_modules/next/dist/server/api-utils/index.d.ts","./node_modules/next/dist/server/node-environment.d.ts","./node_modules/next/dist/server/require-hook.d.ts","./node_modules/next/dist/server/node-polyfill-crypto.d.ts","./node_modules/next/dist/lib/page-types.d.ts","./node_modules/next/dist/build/analysis/get-page-static-info.d.ts","./node_modules/next/dist/build/webpack/loaders/get-module-build-info.d.ts","./node_modules/next/dist/build/webpack/plugins/middleware-plugin.d.ts","./node_modules/next/dist/server/render-result.d.ts","./node_modules/next/dist/server/future/helpers/i18n-provider.d.ts","./node_modules/next/dist/server/web/next-url.d.ts","./node_modules/next/dist/compiled/@edge-runtime/cookies/index.d.ts","./node_modules/next/dist/server/web/spec-extension/cookies.d.ts","./node_modules/next/dist/server/web/spec-extension/request.d.ts","./node_modules/next/dist/server/web/spec-extension/fetch-event.d.ts","./node_modules/next/dist/server/web/spec-extension/response.d.ts","./node_modules/next/dist/server/web/types.d.ts","./node_modules/next/dist/lib/setup-exception-listeners.d.ts","./node_modules/next/dist/lib/constants.d.ts","./node_modules/next/dist/build/index.d.ts","./node_modules/next/dist/build/webpack/plugins/pages-manifest-plugin.d.ts","./node_modules/next/dist/shared/lib/router/utils/route-regex.d.ts","./node_modules/next/dist/shared/lib/router/utils/route-matcher.d.ts","./node_modules/next/dist/shared/lib/router/utils/parse-url.d.ts","./node_modules/next/dist/server/base-http/node.d.ts","./node_modules/next/dist/server/font-utils.d.ts","./node_modules/next/dist/build/webpack/plugins/flight-manifest-plugin.d.ts","./node_modules/next/dist/server/future/route-modules/route-module.d.ts","./node_modules/next/dist/shared/lib/deep-readonly.d.ts","./node_modules/next/dist/server/load-components.d.ts","./node_modules/next/dist/shared/lib/router/utils/middleware-route-matcher.d.ts","./node_modules/next/dist/build/webpack/plugins/next-font-manifest-plugin.d.ts","./node_modules/next/dist/server/future/route-definitions/locale-route-definition.d.ts","./node_modules/next/dist/server/future/route-definitions/pages-route-definition.d.ts","./node_modules/next/dist/shared/lib/mitt.d.ts","./node_modules/next/dist/client/with-router.d.ts","./node_modules/next/dist/client/router.d.ts","./node_modules/next/dist/client/route-loader.d.ts","./node_modules/next/dist/client/page-loader.d.ts","./node_modules/next/dist/shared/lib/bloom-filter.d.ts","./node_modules/next/dist/shared/lib/router/router.d.ts","./node_modules/next/dist/shared/lib/router-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/loadable-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/loadable.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/image-config-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/hooks-client-context.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/head-manager-context.shared-runtime.d.ts","./node_modules/next/dist/server/future/route-definitions/app-page-route-definition.d.ts","./node_modules/next/dist/shared/lib/modern-browserslist-target.d.ts","./node_modules/next/dist/shared/lib/constants.d.ts","./node_modules/next/dist/build/webpack/loaders/metadata/types.d.ts","./node_modules/next/dist/build/page-extensions-type.d.ts","./node_modules/next/dist/build/webpack/loaders/next-app-loader.d.ts","./node_modules/next/dist/server/lib/app-dir-module.d.ts","./node_modules/next/dist/server/response-cache/types.d.ts","./node_modules/next/dist/server/response-cache/index.d.ts","./node_modules/next/dist/server/lib/incremental-cache/index.d.ts","./node_modules/next/dist/client/components/hooks-server-context.d.ts","./node_modules/next/dist/server/app-render/dynamic-rendering.d.ts","./node_modules/next/dist/client/components/static-generation-async-storage-instance.d.ts","./node_modules/next/dist/client/components/static-generation-async-storage.external.d.ts","./node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.d.ts","./node_modules/next/dist/server/async-storage/draft-mode-provider.d.ts","./node_modules/next/dist/server/web/spec-extension/adapters/headers.d.ts","./node_modules/next/dist/client/components/request-async-storage-instance.d.ts","./node_modules/next/dist/client/components/request-async-storage.external.d.ts","./node_modules/next/dist/server/app-render/create-error-handler.d.ts","./node_modules/next/dist/server/app-render/app-render.d.ts","./node_modules/next/dist/shared/lib/server-inserted-html.shared-runtime.d.ts","./node_modules/next/dist/shared/lib/amp-context.shared-runtime.d.ts","./node_modules/next/dist/server/future/route-modules/app-page/vendored/contexts/entrypoints.d.ts","./node_modules/next/dist/server/future/route-modules/app-page/module.compiled.d.ts","./node_modules/@types/react/jsx-runtime.d.ts","./node_modules/next/dist/client/components/error-boundary.d.ts","./node_modules/next/dist/client/components/router-reducer/create-initial-router-state.d.ts","./node_modules/next/dist/client/components/app-router.d.ts","./node_modules/next/dist/client/components/layout-router.d.ts","./node_modules/next/dist/client/components/render-from-template-context.d.ts","./node_modules/next/dist/client/components/action-async-storage-instance.d.ts","./node_modules/next/dist/client/components/action-async-storage.external.d.ts","./node_modules/next/dist/client/components/client-page.d.ts","./node_modules/next/dist/client/components/search-params.d.ts","./node_modules/next/dist/client/components/not-found-boundary.d.ts","./node_modules/next/dist/server/app-render/rsc/preloads.d.ts","./node_modules/next/dist/server/app-render/rsc/postpone.d.ts","./node_modules/next/dist/server/app-render/rsc/taint.d.ts","./node_modules/next/dist/server/app-render/entry-base.d.ts","./node_modules/next/dist/build/templates/app-page.d.ts","./node_modules/next/dist/server/future/route-modules/app-page/module.d.ts","./node_modules/next/dist/server/lib/builtin-request-context.d.ts","./node_modules/next/dist/server/app-render/types.d.ts","./node_modules/next/dist/client/components/router-reducer/fetch-server-response.d.ts","./node_modules/next/dist/client/components/router-reducer/router-reducer-types.d.ts","./node_modules/next/dist/shared/lib/app-router-context.shared-runtime.d.ts","./node_modules/next/dist/server/future/route-modules/pages/vendored/contexts/entrypoints.d.ts","./node_modules/next/dist/server/future/route-modules/pages/module.compiled.d.ts","./node_modules/next/dist/build/templates/pages.d.ts","./node_modules/next/dist/server/future/route-modules/pages/module.d.ts","./node_modules/next/dist/server/render.d.ts","./node_modules/next/dist/server/future/route-definitions/pages-api-route-definition.d.ts","./node_modules/next/dist/server/future/route-matches/pages-api-route-match.d.ts","./node_modules/next/dist/server/future/route-matchers/route-matcher.d.ts","./node_modules/next/dist/server/future/route-matcher-providers/route-matcher-provider.d.ts","./node_modules/next/dist/server/future/route-matcher-managers/route-matcher-manager.d.ts","./node_modules/next/dist/server/future/normalizers/normalizer.d.ts","./node_modules/next/dist/server/future/normalizers/locale-route-normalizer.d.ts","./node_modules/next/dist/server/future/normalizers/request/pathname-normalizer.d.ts","./node_modules/next/dist/server/future/normalizers/request/suffix.d.ts","./node_modules/next/dist/server/future/normalizers/request/rsc.d.ts","./node_modules/next/dist/server/future/normalizers/request/prefix.d.ts","./node_modules/next/dist/server/future/normalizers/request/postponed.d.ts","./node_modules/next/dist/server/future/normalizers/request/action.d.ts","./node_modules/next/dist/server/future/normalizers/request/prefetch-rsc.d.ts","./node_modules/next/dist/server/future/normalizers/request/next-data.d.ts","./node_modules/next/dist/server/base-server.d.ts","./node_modules/next/dist/server/image-optimizer.d.ts","./node_modules/next/dist/server/next-server.d.ts","./node_modules/next/dist/lib/coalesced-function.d.ts","./node_modules/next/dist/server/lib/router-utils/types.d.ts","./node_modules/next/dist/trace/types.d.ts","./node_modules/next/dist/trace/trace.d.ts","./node_modules/next/dist/trace/shared.d.ts","./node_modules/next/dist/trace/index.d.ts","./node_modules/next/dist/build/load-jsconfig.d.ts","./node_modules/next/dist/build/webpack-config.d.ts","./node_modules/next/dist/build/webpack/plugins/define-env-plugin.d.ts","./node_modules/next/dist/build/swc/index.d.ts","./node_modules/next/dist/server/dev/parse-version-info.d.ts","./node_modules/next/dist/server/dev/hot-reloader-types.d.ts","./node_modules/next/dist/telemetry/storage.d.ts","./node_modules/next/dist/server/lib/types.d.ts","./node_modules/next/dist/server/lib/render-server.d.ts","./node_modules/next/dist/server/lib/router-server.d.ts","./node_modules/next/dist/shared/lib/router/utils/path-match.d.ts","./node_modules/next/dist/server/lib/router-utils/filesystem.d.ts","./node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.d.ts","./node_modules/next/dist/server/lib/dev-bundler-service.d.ts","./node_modules/next/dist/server/dev/static-paths-worker.d.ts","./node_modules/next/dist/server/dev/next-dev-server.d.ts","./node_modules/next/dist/server/next.d.ts","./node_modules/next/dist/lib/metadata/types/alternative-urls-types.d.ts","./node_modules/next/dist/lib/metadata/types/extra-types.d.ts","./node_modules/next/dist/lib/metadata/types/metadata-types.d.ts","./node_modules/next/dist/lib/metadata/types/manifest-types.d.ts","./node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts","./node_modules/next/dist/lib/metadata/types/twitter-types.d.ts","./node_modules/next/dist/lib/metadata/types/metadata-interface.d.ts","./node_modules/next/types/index.d.ts","./node_modules/next/dist/shared/lib/html-context.shared-runtime.d.ts","./node_modules/@next/env/dist/index.d.ts","./node_modules/next/dist/shared/lib/utils.d.ts","./node_modules/next/dist/pages/_app.d.ts","./node_modules/next/app.d.ts","./node_modules/next/dist/server/web/spec-extension/unstable-cache.d.ts","./node_modules/next/dist/server/web/spec-extension/revalidate.d.ts","./node_modules/next/dist/server/web/spec-extension/unstable-no-store.d.ts","./node_modules/next/cache.d.ts","./node_modules/next/dist/shared/lib/runtime-config.external.d.ts","./node_modules/next/config.d.ts","./node_modules/next/dist/pages/_document.d.ts","./node_modules/next/document.d.ts","./node_modules/next/dist/shared/lib/dynamic.d.ts","./node_modules/next/dynamic.d.ts","./node_modules/next/dist/pages/_error.d.ts","./node_modules/next/error.d.ts","./node_modules/next/dist/shared/lib/head.d.ts","./node_modules/next/head.d.ts","./node_modules/next/dist/client/components/draft-mode.d.ts","./node_modules/next/dist/client/components/headers.d.ts","./node_modules/next/headers.d.ts","./node_modules/next/dist/shared/lib/get-img-props.d.ts","./node_modules/next/dist/client/image-component.d.ts","./node_modules/next/dist/shared/lib/image-external.d.ts","./node_modules/next/image.d.ts","./node_modules/next/dist/client/link.d.ts","./node_modules/next/link.d.ts","./node_modules/next/dist/client/components/redirect-status-code.d.ts","./node_modules/next/dist/client/components/redirect.d.ts","./node_modules/next/dist/client/components/not-found.d.ts","./node_modules/next/dist/client/components/navigation.react-server.d.ts","./node_modules/next/dist/client/components/navigation.d.ts","./node_modules/next/navigation.d.ts","./node_modules/next/router.d.ts","./node_modules/next/dist/client/script.d.ts","./node_modules/next/script.d.ts","./node_modules/next/dist/server/web/spec-extension/user-agent.d.ts","./node_modules/next/dist/compiled/@edge-runtime/primitives/url.d.ts","./node_modules/next/dist/server/web/spec-extension/image-response.d.ts","./node_modules/next/dist/compiled/@vercel/og/satori/index.d.ts","./node_modules/next/dist/compiled/@vercel/og/emoji/index.d.ts","./node_modules/next/dist/compiled/@vercel/og/types.d.ts","./node_modules/next/server.d.ts","./node_modules/next/types/global.d.ts","./node_modules/next/types/compiled.d.ts","./node_modules/next/index.d.ts","./node_modules/next/image-types/global.d.ts","./next-env.d.ts","./node_modules/source-map-js/source-map.d.ts","./node_modules/postcss/lib/previous-map.d.ts","./node_modules/postcss/lib/input.d.ts","./node_modules/postcss/lib/css-syntax-error.d.ts","./node_modules/postcss/lib/declaration.d.ts","./node_modules/postcss/lib/root.d.ts","./node_modules/postcss/lib/warning.d.ts","./node_modules/postcss/lib/lazy-result.d.ts","./node_modules/postcss/lib/no-work-result.d.ts","./node_modules/postcss/lib/processor.d.ts","./node_modules/postcss/lib/result.d.ts","./node_modules/postcss/lib/document.d.ts","./node_modules/postcss/lib/rule.d.ts","./node_modules/postcss/lib/node.d.ts","./node_modules/postcss/lib/comment.d.ts","./node_modules/postcss/lib/container.d.ts","./node_modules/postcss/lib/at-rule.d.ts","./node_modules/postcss/lib/list.d.ts","./node_modules/postcss/lib/postcss.d.ts","./node_modules/postcss/lib/postcss.d.mts","./node_modules/tailwindcss/types/generated/corepluginlist.d.ts","./node_modules/tailwindcss/types/generated/colors.d.ts","./node_modules/tailwindcss/types/config.d.ts","./node_modules/tailwindcss/types/index.d.ts","./tailwind.config.ts","./app/layout.tsx","./app/page.tsx","./.next/types/app/layout.ts","./.next/types/app/page.ts","./node_modules/@types/cookie/index.d.ts","./node_modules/@types/json5/index.d.ts"],"fileIdsList":[[99,145,360,436],[99,145,360,437],[99,145,408],[99,145],[99,145,408,409],[99,142,145],[99,144,145],[145],[99,145,150,178],[99,145,146,151,156,164,175,186],[99,145,146,147,156,164],[94,95,96,99,145],[99,145,148,187],[99,145,149,150,157,165],[99,145,150,175,183],[99,145,151,153,156,164],[99,144,145,152],[99,145,153,154],[99,145,155,156],[99,144,145,156],[99,145,156,157,158,175,186],[99,145,156,157,158,171,175,178],[99,145,153,156,159,164,175,186],[99,145,156,157,159,160,164,175,183,186],[99,145,159,161,175,183,186],[97,98,99,100,101,102,103,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192],[99,145,156,162],[99,145,163,186,191],[99,145,153,156,164,175],[99,145,165],[99,145,166],[99,144,145,167],[99,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192],[99,145,169],[99,145,170],[99,145,156,171,172],[99,145,171,173,187,189],[99,145,156,175,176,178],[99,145,177,178],[99,145,175,176],[99,145,178],[99,145,179],[99,142,145,175,180],[99,145,156,181,182],[99,145,181,182],[99,145,150,164,175,183],[99,145,184],[99,145,164,185],[99,145,159,170,186],[99,145,150,187],[99,145,175,188],[99,145,163,189],[99,145,190],[99,140,145],[99,140,145,156,158,167,175,178,186,189,191],[99,145,175,192],[87,99,145,197,198,199],[87,99,145,197,198],[87,99,145],[87,91,99,145,196,361,404],[87,91,99,145,195,361,404],[84,85,86,99,145],[92,99,145],[99,145,365],[99,145,367,368,369],[99,145,371],[99,145,202,212,218,220,361],[99,145,202,209,211,214,232],[99,145,212],[99,145,212,214,339],[99,145,267,285,300,407],[99,145,309],[99,145,202,212,219,253,263,336,337,407],[99,145,219,407],[99,145,212,263,264,265,407],[99,145,212,219,253,407],[99,145,407],[99,145,202,219,220,407],[99,145,293],[99,144,145,193,292],[87,99,145,286,287,288,306,307],[87,99,145,286],[99,145,276],[99,145,275,277,381],[87,99,145,286,287,304],[99,145,282,307,393],[99,145,391,392],[99,145,226,390],[99,145,279],[99,144,145,193,226,242,275,276,277,278],[87,99,145,304,306,307],[99,145,304,306],[99,145,304,305,307],[99,145,170,193],[99,145,274],[99,144,145,193,211,213,270,271,272,273],[87,99,145,203,384],[87,99,145,186,193],[87,99,145,219,251],[87,99,145,219],[99,145,249,254],[87,99,145,250,364],[87,91,99,145,159,193,195,196,361,402,403],[99,145,361],[99,145,201],[99,145,354,355,356,357,358,359],[99,145,356],[87,99,145,250,286,364],[87,99,145,286,362,364],[87,99,145,286,364],[99,145,159,193,213,364],[99,145,159,193,210,211,222,240,242,274,279,280,302,304],[99,145,271,274,279,287,289,290,291,293,294,295,296,297,298,299,407],[99,145,272],[87,99,145,170,193,211,212,240,242,243,245,270,302,303,307,361,407],[99,145,159,193,213,214,226,227,275],[99,145,159,193,212,214],[99,145,159,175,193,210,213,214],[99,145,159,170,186,193,210,211,212,213,214,219,222,223,233,234,236,239,240,242,243,244,245,269,270,303,304,312,314,317,319,322,324,325,326,327],[99,145,159,175,193],[99,145,202,203,204,210,211,361,364,407],[99,145,159,175,186,193,207,338,340,341,407],[99,145,170,186,193,207,210,213,230,234,236,237,238,243,270,317,328,330,336,350,351],[99,145,212,216,270],[99,145,210,212],[99,145,223,318],[99,145,320,321],[99,145,320],[99,145,318],[99,145,320,323],[99,145,206,207],[99,145,206,246],[99,145,206],[99,145,208,223,316],[99,145,315],[99,145,207,208],[99,145,208,313],[99,145,207],[99,145,302],[99,145,159,193,210,222,241,261,267,281,284,301,304],[99,145,255,256,257,258,259,260,282,283,307,362],[99,145,311],[99,145,159,193,210,222,241,247,308,310,312,361,364],[99,145,159,186,193,203,210,212,269],[99,145,266],[99,145,159,193,344,349],[99,145,233,242,269,364],[99,145,332,336,350,353],[99,145,159,216,336,344,345,353],[99,145,202,212,233,244,347],[99,145,159,193,212,219,244,331,332,342,343,346,348],[99,145,194,240,241,242,361,364],[99,145,159,170,186,193,208,210,211,213,216,221,222,230,233,234,236,237,238,239,243,245,269,270,314,328,329,364],[99,145,159,193,210,212,216,330,352],[99,145,159,193,211,213],[87,99,145,159,170,193,201,203,210,211,214,222,239,240,242,243,245,311,361,364],[99,145,159,170,186,193,205,208,209,213],[99,145,206,268],[99,145,159,193,206,211,222],[99,145,159,193,212,223],[99,145,159,193],[99,145,226],[99,145,225],[99,145,227],[99,145,212,224,226,230],[99,145,212,224,226],[99,145,159,193,205,212,213,219,227,228,229],[87,99,145,304,305,306],[99,145,262],[87,99,145,203],[87,99,145,236],[87,99,145,194,239,242,245,361,364],[99,145,203,384,385],[87,99,145,254],[87,99,145,170,186,193,201,248,250,252,253,364],[99,145,213,219,236],[99,145,235],[87,99,145,157,159,170,193,201,254,263,361,362,363],[83,87,88,89,90,99,145,195,196,361,404],[99,145,150],[99,145,333,334,335],[99,145,333],[99,145,373],[99,145,375],[99,145,377],[99,145,379],[99,145,382],[99,145,386],[91,93,99,145,361,366,370,372,374,376,378,380,383,387,389,395,396,398,405,406,407],[99,145,388],[99,145,394],[99,145,250],[99,145,397],[99,144,145,227,228,229,230,399,400,401,404],[99,145,193],[87,91,99,145,159,161,170,193,195,196,197,199,201,214,353,360,364,404],[99,145,426],[99,145,424,426],[99,145,415,423,424,425,427,429],[99,145,413],[99,145,416,421,426,429],[99,145,412,429],[99,145,416,417,420,421,422,429],[99,145,416,417,418,420,421,429],[99,145,413,414,415,416,417,421,422,423,425,426,427,429],[99,145,429],[99,145,411,413,414,415,416,417,418,420,421,422,423,424,425,426,427,428],[99,145,411,429],[99,145,416,418,419,421,422,429],[99,145,420,429],[99,145,421,422,426,429],[99,145,414,424],[99,145,431,432],[99,145,430,433],[99,112,116,145,186],[99,112,145,175,186],[99,107,145],[99,109,112,145,183,186],[99,145,164,183],[99,107,145,193],[99,109,112,145,164,186],[99,104,105,108,111,145,156,175,186],[99,112,119,145],[99,104,110,145],[99,112,133,134,145],[99,108,112,145,178,186,193],[99,133,145,193],[99,106,107,145,193],[99,112,145],[99,106,107,108,109,110,111,112,113,114,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,136,137,138,139,145],[99,112,127,145],[99,112,119,120,145],[99,110,112,120,121,145],[99,111,145],[99,104,107,112,145],[99,112,116,120,121,145],[99,116,145],[99,110,112,115,145,186],[99,104,109,112,119,145],[99,145,175],[99,107,112,133,145,191,193],[99,145,434]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"27bdc30a0e32783366a5abeda841bc22757c1797de8681bbe81fbc735eeb1c10","impliedFormat":1},{"version":"8fd575e12870e9944c7e1d62e1f5a73fcf23dd8d3a321f2a2c74c20d022283fe","impliedFormat":1},{"version":"2ab096661c711e4a81cc464fa1e6feb929a54f5340b46b0a07ac6bbf857471f0","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"df83c2a6c73228b625b0beb6669c7ee2a09c914637e2d35170723ad49c0f5cd4","affectsGlobalScope":true,"impliedFormat":1},{"version":"436aaf437562f276ec2ddbee2f2cdedac7664c1e4c1d2c36839ddd582eeb3d0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e3c06ea092138bf9fa5e874a1fdbc9d54805d074bee1de31b99a11e2fec239d","affectsGlobalScope":true,"impliedFormat":1},{"version":"87dc0f382502f5bbce5129bdc0aea21e19a3abbc19259e0b43ae038a9fc4e326","affectsGlobalScope":true,"impliedFormat":1},{"version":"b1cb28af0c891c8c96b2d6b7be76bd394fddcfdb4709a20ba05a7c1605eea0f9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2fef54945a13095fdb9b84f705f2b5994597640c46afeb2ce78352fab4cb3279","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac77cb3e8c6d3565793eb90a8373ee8033146315a3dbead3bde8db5eaf5e5ec6","affectsGlobalScope":true,"impliedFormat":1},{"version":"56e4ed5aab5f5920980066a9409bfaf53e6d21d3f8d020c17e4de584d29600ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ece9f17b3866cc077099c73f4983bddbcb1dc7ddb943227f1ec070f529dedd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a6282c8827e4b9a95f4bf4f5c205673ada31b982f50572d27103df8ceb8013c","affectsGlobalScope":true,"impliedFormat":1},{"version":"1c9319a09485199c1f7b0498f2988d6d2249793ef67edda49d1e584746be9032","affectsGlobalScope":true,"impliedFormat":1},{"version":"e3a2a0cee0f03ffdde24d89660eba2685bfbdeae955a6c67e8c4c9fd28928eeb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811c71eee4aa0ac5f7adf713323a5c41b0cf6c4e17367a34fbce379e12bbf0a4","affectsGlobalScope":true,"impliedFormat":1},{"version":"51ad4c928303041605b4d7ae32e0c1ee387d43a24cd6f1ebf4a2699e1076d4fa","affectsGlobalScope":true,"impliedFormat":1},{"version":"60037901da1a425516449b9a20073aa03386cce92f7a1fd902d7602be3a7c2e9","affectsGlobalScope":true,"impliedFormat":1},{"version":"d4b1d2c51d058fc21ec2629fff7a76249dec2e36e12960ea056e3ef89174080f","affectsGlobalScope":true,"impliedFormat":1},{"version":"22adec94ef7047a6c9d1af3cb96be87a335908bf9ef386ae9fd50eeb37f44c47","affectsGlobalScope":true,"impliedFormat":1},{"version":"196cb558a13d4533a5163286f30b0509ce0210e4b316c56c38d4c0fd2fb38405","affectsGlobalScope":true,"impliedFormat":1},{"version":"73f78680d4c08509933daf80947902f6ff41b6230f94dd002ae372620adb0f60","affectsGlobalScope":true,"impliedFormat":1},{"version":"c5239f5c01bcfa9cd32f37c496cf19c61d69d37e48be9de612b541aac915805b","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"0990a7576222f248f0a3b888adcb7389f957928ce2afb1cd5128169086ff4d29","impliedFormat":1},{"version":"eb5b19b86227ace1d29ea4cf81387279d04bb34051e944bc53df69f58914b788","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac51dd7d31333793807a6abaa5ae168512b6131bd41d9c5b98477fc3b7800f9f","impliedFormat":1},{"version":"87d9d29dbc745f182683f63187bf3d53fd8673e5fca38ad5eaab69798ed29fbc","impliedFormat":1},{"version":"09ddcfcfbe77a8232d155ca1030005106b1328f6210df43629d0be750da07c16","affectsGlobalScope":true,"impliedFormat":1},{"version":"cc69795d9954ee4ad57545b10c7bf1a7260d990231b1685c147ea71a6faa265c","impliedFormat":1},{"version":"8bc6c94ff4f2af1f4023b7bb2379b08d3d7dd80c698c9f0b07431ea16101f05f","impliedFormat":1},{"version":"1b61d259de5350f8b1e5db06290d31eaebebc6baafd5f79d314b5af9256d7153","impliedFormat":1},{"version":"57194e1f007f3f2cbef26fa299d4c6b21f4623a2eddc63dfeef79e38e187a36e","impliedFormat":1},{"version":"0f6666b58e9276ac3a38fdc80993d19208442d6027ab885580d93aec76b4ef00","impliedFormat":1},{"version":"05fd364b8ef02fb1e174fbac8b825bdb1e5a36a016997c8e421f5fab0a6da0a0","impliedFormat":1},{"version":"70521b6ab0dcba37539e5303104f29b721bfb2940b2776da4cc818c07e1fefc1","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"d153a11543fd884b596587ccd97aebbeed950b26933ee000f94009f1ab142848","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"ba481bca06f37d3f2c137ce343c7d5937029b2468f8e26111f3c9d9963d6568d","affectsGlobalScope":true,"impliedFormat":1},{"version":"6d9ef24f9a22a88e3e9b3b3d8c40ab1ddb0853f1bfbd5c843c37800138437b61","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"e2677634fe27e87348825bb041651e22d50a613e2fdf6a4a3ade971d71bac37e","impliedFormat":1},{"version":"7394959e5a741b185456e1ef5d64599c36c60a323207450991e7a42e08911419","impliedFormat":1},{"version":"8c0bcd6c6b67b4b503c11e91a1fb91522ed585900eab2ab1f61bba7d7caa9d6f","impliedFormat":1},{"version":"8cd19276b6590b3ebbeeb030ac271871b9ed0afc3074ac88a94ed2449174b776","affectsGlobalScope":true,"impliedFormat":1},{"version":"696eb8d28f5949b87d894b26dc97318ef944c794a9a4e4f62360cd1d1958014b","impliedFormat":1},{"version":"3f8fa3061bd7402970b399300880d55257953ee6d3cd408722cb9ac20126460c","impliedFormat":1},{"version":"35ec8b6760fd7138bbf5809b84551e31028fb2ba7b6dc91d95d098bf212ca8b4","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"68bd56c92c2bd7d2339457eb84d63e7de3bd56a69b25f3576e1568d21a162398","affectsGlobalScope":true,"impliedFormat":1},{"version":"3e93b123f7c2944969d291b35fed2af79a6e9e27fdd5faa99748a51c07c02d28","impliedFormat":1},{"version":"9d19808c8c291a9010a6c788e8532a2da70f811adb431c97520803e0ec649991","impliedFormat":1},{"version":"87aad3dd9752067dc875cfaa466fc44246451c0c560b820796bdd528e29bef40","impliedFormat":1},{"version":"4aacb0dd020eeaef65426153686cc639a78ec2885dc72ad220be1d25f1a439df","impliedFormat":1},{"version":"f0bd7e6d931657b59605c44112eaf8b980ba7f957a5051ed21cb93d978cf2f45","impliedFormat":1},{"version":"8db0ae9cb14d9955b14c214f34dae1b9ef2baee2fe4ce794a4cd3ac2531e3255","affectsGlobalScope":true,"impliedFormat":1},{"version":"15fc6f7512c86810273af28f224251a5a879e4261b4d4c7e532abfbfc3983134","impliedFormat":1},{"version":"58adba1a8ab2d10b54dc1dced4e41f4e7c9772cbbac40939c0dc8ce2cdb1d442","impliedFormat":1},{"version":"641942a78f9063caa5d6b777c99304b7d1dc7328076038c6d94d8a0b81fc95c1","impliedFormat":1},{"version":"1123a83f35cf56c97de746f0a7250012153c61a167e4a61668bf50e558162d14","impliedFormat":1},{"version":"855cd5f7eb396f5f1ab1bc0f8580339bff77b68a770f84c6b254e319bbfd1ac7","impliedFormat":1},{"version":"5650cf3dace09e7c25d384e3e6b818b938f68f4e8de96f52d9c5a1b3db068e86","impliedFormat":1},{"version":"1354ca5c38bd3fd3836a68e0f7c9f91f172582ba30ab15bb8c075891b91502b7","affectsGlobalScope":true,"impliedFormat":1},{"version":"7e20d899c28ca26a2a7afc98beaa69e63ff7fba0a8bc47b4e3bf3ede5e09e424","impliedFormat":1},{"version":"2d2fcaab481b31a5882065c7951255703ddbe1c0e507af56ea42d79ac3911201","impliedFormat":1},{"version":"a192fe8ec33f75edbc8d8f3ed79f768dfae11ff5735e7fe52bfa69956e46d78d","impliedFormat":1},{"version":"ca867399f7db82df981d6915bcbb2d81131d7d1ef683bc782b59f71dda59bc85","affectsGlobalScope":true,"impliedFormat":1},{"version":"372413016d17d804e1d139418aca0c68e47a83fb6669490857f4b318de8cccb3","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e043a1bc8fbf2a255bccf9bf27e0f1caf916c3b0518ea34aa72357c0afd42ec","impliedFormat":1},{"version":"b4f70ec656a11d570e1a9edce07d118cd58d9760239e2ece99306ee9dfe61d02","impliedFormat":1},{"version":"3bc2f1e2c95c04048212c569ed38e338873f6a8593930cf5a7ef24ffb38fc3b6","impliedFormat":1},{"version":"6e70e9570e98aae2b825b533aa6292b6abd542e8d9f6e9475e88e1d7ba17c866","impliedFormat":1},{"version":"f9d9d753d430ed050dc1bf2667a1bab711ccbb1c1507183d794cc195a5b085cc","impliedFormat":1},{"version":"9eece5e586312581ccd106d4853e861aaaa1a39f8e3ea672b8c3847eedd12f6e","impliedFormat":1},{"version":"085f552d005479e2e6a7311cdbbe5d8c55c497b4d19274285df161ee9684cd9c","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"007faacc9268357caa21d24169f3f3f2497af3e9241308df2d89f6e6d9bb3f2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"74cf591a0f63db318651e0e04cb55f8791385f86e987a67fd4d2eaab8191f730","impliedFormat":1},{"version":"5eab9b3dc9b34f185417342436ec3f106898da5f4801992d8ff38ab3aff346b5","impliedFormat":1},{"version":"12ed4559eba17cd977aa0db658d25c4047067444b51acfdcbf38470630642b23","affectsGlobalScope":true,"impliedFormat":1},{"version":"f3ffabc95802521e1e4bcba4c88d8615176dc6e09111d920c7a213bdda6e1d65","impliedFormat":1},{"version":"809821b8a065e3234a55b3a9d7846231ed18d66dd749f2494c66288d890daf7f","impliedFormat":1},{"version":"ae56f65caf3be91108707bd8dfbccc2a57a91feb5daabf7165a06a945545ed26","impliedFormat":1},{"version":"a136d5de521da20f31631a0a96bf712370779d1c05b7015d7019a9b2a0446ca9","impliedFormat":1},{"version":"c3b41e74b9a84b88b1dca61ec39eee25c0dbc8e7d519ba11bb070918cfacf656","affectsGlobalScope":true,"impliedFormat":1},{"version":"4737a9dc24d0e68b734e6cfbcea0c15a2cfafeb493485e27905f7856988c6b29","affectsGlobalScope":true,"impliedFormat":1},{"version":"36d8d3e7506b631c9582c251a2c0b8a28855af3f76719b12b534c6edf952748d","impliedFormat":1},{"version":"1ca69210cc42729e7ca97d3a9ad48f2e9cb0042bada4075b588ae5387debd318","impliedFormat":1},{"version":"f5ebe66baaf7c552cfa59d75f2bfba679f329204847db3cec385acda245e574e","impliedFormat":1},{"version":"ed59add13139f84da271cafd32e2171876b0a0af2f798d0c663e8eeb867732cf","affectsGlobalScope":true,"impliedFormat":1},{"version":"b7c5e2ea4a9749097c347454805e933844ed207b6eefec6b7cfd418b5f5f7b28","impliedFormat":1},{"version":"b1810689b76fd473bd12cc9ee219f8e62f54a7d08019a235d07424afbf074d25","impliedFormat":1},{"version":"8caa5c86be1b793cd5f599e27ecb34252c41e011980f7d61ae4989a149ff6ccc","impliedFormat":1},{"version":"f9fd93190acb1ffe0bc0fb395df979452f8d625071e9ffc8636e4dfb86ab2508","impliedFormat":1},{"version":"5f41fd8732a89e940c58ce22206e3df85745feb8983e2b4c6257fb8cbb118493","impliedFormat":1},{"version":"17ed71200119e86ccef2d96b73b02ce8854b76ad6bd21b5021d4269bec527b5f","impliedFormat":1},{"version":"1cfa8647d7d71cb03847d616bd79320abfc01ddea082a49569fda71ac5ece66b","impliedFormat":1},{"version":"bb7a61dd55dc4b9422d13da3a6bb9cc5e89be888ef23bbcf6558aa9726b89a1c","impliedFormat":1},{"version":"db6d2d9daad8a6d83f281af12ce4355a20b9a3e71b82b9f57cddcca0a8964a96","impliedFormat":1},{"version":"cfe4ef4710c3786b6e23dae7c086c70b4f4835a2e4d77b75d39f9046106e83d3","impliedFormat":1},{"version":"cbea99888785d49bb630dcbb1613c73727f2b5a2cf02e1abcaab7bcf8d6bf3c5","impliedFormat":1},{"version":"3a8bddb66b659f6bd2ff641fc71df8a8165bafe0f4b799cc298be5cd3755bb20","impliedFormat":1},{"version":"a86f82d646a739041d6702101afa82dcb935c416dd93cbca7fd754fd0282ce1f","impliedFormat":1},{"version":"2dad084c67e649f0f354739ec7df7c7df0779a28a4f55c97c6b6883ae850d1ce","impliedFormat":1},{"version":"fa5bbc7ab4130dd8cdc55ea294ec39f76f2bc507a0f75f4f873e38631a836ca7","impliedFormat":1},{"version":"df45ca1176e6ac211eae7ddf51336dc075c5314bc5c253651bae639defd5eec5","impliedFormat":1},{"version":"cf86de1054b843e484a3c9300d62fbc8c97e77f168bbffb131d560ca0474d4a8","impliedFormat":1},{"version":"196c960b12253fde69b204aa4fbf69470b26daf7a430855d7f94107a16495ab0","impliedFormat":1},{"version":"ee15ea5dd7a9fc9f5013832e5843031817a880bf0f24f37a29fd8337981aae07","impliedFormat":1},{"version":"bf24f6d35f7318e246010ffe9924395893c4e96d34324cde77151a73f078b9ad","impliedFormat":1},{"version":"ea53732769832d0f127ae16620bd5345991d26bf0b74e85e41b61b27d74ea90f","impliedFormat":1},{"version":"10595c7ff5094dd5b6a959ccb1c00e6a06441b4e10a87bc09c15f23755d34439","impliedFormat":1},{"version":"9620c1ff645afb4a9ab4044c85c26676f0a93e8c0e4b593aea03a89ccb47b6d0","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"a9af0e608929aaf9ce96bd7a7b99c9360636c31d73670e4af09a09950df97841","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"c86fe861cf1b4c46a0fb7d74dffe596cf679a2e5e8b1456881313170f092e3fa","impliedFormat":1},{"version":"08ed0b3f0166787f84a6606f80aa3b1388c7518d78912571b203817406e471da","impliedFormat":1},{"version":"47e5af2a841356a961f815e7c55d72554db0c11b4cba4d0caab91f8717846a94","impliedFormat":1},{"version":"65f43099ded6073336e697512d9b80f2d4fec3182b7b2316abf712e84104db00","impliedFormat":1},{"version":"f5f541902bf7ae0512a177295de9b6bcd6809ea38307a2c0a18bfca72212f368","impliedFormat":1},{"version":"b0decf4b6da3ebc52ea0c96095bdfaa8503acc4ac8e9081c5f2b0824835dd3bd","impliedFormat":1},{"version":"ca1b882a105a1972f82cc58e3be491e7d750a1eb074ffd13b198269f57ed9e1b","impliedFormat":1},{"version":"fc3e1c87b39e5ba1142f27ec089d1966da168c04a859a4f6aab64dceae162c2b","impliedFormat":1},{"version":"3b414b99a73171e1c4b7b7714e26b87d6c5cb03d200352da5342ab4088a54c85","impliedFormat":1},{"version":"61888522cec948102eba94d831c873200aa97d00d8989fdfd2a3e0ee75ec65a2","impliedFormat":1},{"version":"4e10622f89fea7b05dd9b52fb65e1e2b5cbd96d4cca3d9e1a60bb7f8a9cb86a1","impliedFormat":1},{"version":"74b2a5e5197bd0f2e0077a1ea7c07455bbea67b87b0869d9786d55104006784f","impliedFormat":1},{"version":"59bf32919de37809e101acffc120596a9e45fdbab1a99de5087f31fdc36e2f11","impliedFormat":1},{"version":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","impliedFormat":1},{"version":"faa03dffb64286e8304a2ca96dd1317a77db6bfc7b3fb385163648f67e535d77","impliedFormat":1},{"version":"c40c848daad198266370c1c72a7a8c3d18d2f50727c7859fcfefd3ff69a7f288","impliedFormat":1},{"version":"ac60bbee0d4235643cc52b57768b22de8c257c12bd8c2039860540cab1fa1d82","impliedFormat":1},{"version":"6428e6edd944ce6789afdf43f9376c1f2e4957eea34166177625aaff4c0da1a0","impliedFormat":1},{"version":"ada39cbb2748ab2873b7835c90c8d4620723aedf323550e8489f08220e477c7f","impliedFormat":1},{"version":"6e5f5cee603d67ee1ba6120815497909b73399842254fc1e77a0d5cdc51d8c9c","impliedFormat":1},{"version":"8dba67056cbb27628e9b9a1cba8e57036d359dceded0725c72a3abe4b6c79cd4","impliedFormat":1},{"version":"70f3814c457f54a7efe2d9ce9d2686de9250bb42eb7f4c539bd2280a42e52d33","impliedFormat":1},{"version":"154dd2e22e1e94d5bc4ff7726706bc0483760bae40506bdce780734f11f7ec47","impliedFormat":1},{"version":"ef61792acbfa8c27c9bd113f02731e66229f7d3a169e3c1993b508134f1a58e0","impliedFormat":1},{"version":"9c82171d836c47486074e4ca8e059735bf97b205e70b196535b5efd40cbe1bc5","impliedFormat":1},{"version":"0131e203d8560edb39678abe10db42564a068f98c4ebd1ed9ffe7279c78b3c81","impliedFormat":1},{"version":"f6404e7837b96da3ea4d38c4f1a3812c96c9dcdf264e93d5bdb199f983a3ef4b","impliedFormat":1},{"version":"c5426dbfc1cf90532f66965a7aa8c1136a78d4d0f96d8180ecbfc11d7722f1a5","impliedFormat":1},{"version":"65a15fc47900787c0bd18b603afb98d33ede930bed1798fc984d5ebb78b26cf9","impliedFormat":1},{"version":"9d202701f6e0744adb6314d03d2eb8fc994798fc83d91b691b75b07626a69801","impliedFormat":1},{"version":"de9d2df7663e64e3a91bf495f315a7577e23ba088f2949d5ce9ec96f44fba37d","impliedFormat":1},{"version":"c7af78a2ea7cb1cd009cfb5bdb48cd0b03dad3b54f6da7aab615c2e9e9d570c5","impliedFormat":1},{"version":"1ee45496b5f8bdee6f7abc233355898e5bf9bd51255db65f5ff7ede617ca0027","impliedFormat":1},{"version":"8b8f00491431fe82f060dfe8c7f2180a9fb239f3d851527db909b83230e75882","affectsGlobalScope":true,"impliedFormat":1},{"version":"db01d18853469bcb5601b9fc9826931cc84cc1a1944b33cad76fd6f1e3d8c544","affectsGlobalScope":true,"impliedFormat":1},{"version":"dba114fb6a32b355a9cfc26ca2276834d72fe0e94cd2c3494005547025015369","impliedFormat":1},{"version":"903e299a28282fa7b714586e28409ed73c3b63f5365519776bf78e8cf173db36","affectsGlobalScope":true,"impliedFormat":1},{"version":"fa6c12a7c0f6b84d512f200690bfc74819e99efae69e4c95c4cd30f6884c526e","impliedFormat":1},{"version":"f1c32f9ce9c497da4dc215c3bc84b722ea02497d35f9134db3bb40a8d918b92b","impliedFormat":1},{"version":"b73c319af2cc3ef8f6421308a250f328836531ea3761823b4cabbd133047aefa","affectsGlobalScope":true,"impliedFormat":1},{"version":"e433b0337b8106909e7953015e8fa3f2d30797cea27141d1c5b135365bb975a6","impliedFormat":1},{"version":"dd3900b24a6a8745efeb7ad27629c0f8a626470ac229c1d73f1fe29d67e44dca","impliedFormat":1},{"version":"ddff7fc6edbdc5163a09e22bf8df7bef75f75369ebd7ecea95ba55c4386e2441","impliedFormat":1},{"version":"106c6025f1d99fd468fd8bf6e5bda724e11e5905a4076c5d29790b6c3745e50c","impliedFormat":1},{"version":"ec29be0737d39268696edcec4f5e97ce26f449fa9b7afc2f0f99a86def34a418","impliedFormat":1},{"version":"aeab39e8e0b1a3b250434c3b2bb8f4d17bbec2a9dbce5f77e8a83569d3d2cbc2","impliedFormat":1},{"version":"ec6cba1c02c675e4dd173251b156792e8d3b0c816af6d6ad93f1a55d674591aa","impliedFormat":1},{"version":"b620391fe8060cf9bedc176a4d01366e6574d7a71e0ac0ab344a4e76576fcbb8","impliedFormat":1},{"version":"d729408dfde75b451530bcae944cf89ee8277e2a9df04d1f62f2abfd8b03c1e1","impliedFormat":1},{"version":"e15d3c84d5077bb4a3adee4c791022967b764dc41cb8fa3cfa44d4379b2c95f5","impliedFormat":1},{"version":"5f58e28cd22e8fc1ac1b3bc6b431869f1e7d0b39e2c21fbf79b9fa5195a85980","impliedFormat":1},{"version":"e1fc1a1045db5aa09366be2b330e4ce391550041fc3e925f60998ca0b647aa97","impliedFormat":1},{"version":"63533978dcda286422670f6e184ac516805a365fb37a086eeff4309e812f1402","impliedFormat":1},{"version":"43ba4f2fa8c698f5c304d21a3ef596741e8e85a810b7c1f9b692653791d8d97a","impliedFormat":1},{"version":"31fb49ef3aa3d76f0beb644984e01eab0ea222372ea9b49bb6533be5722d756c","impliedFormat":1},{"version":"33cd131e1461157e3e06b06916b5176e7a8ec3fce15a5cfe145e56de744e07d2","impliedFormat":1},{"version":"889ef863f90f4917221703781d9723278db4122d75596b01c429f7c363562b86","impliedFormat":1},{"version":"3556cfbab7b43da96d15a442ddbb970e1f2fc97876d055b6555d86d7ac57dae5","impliedFormat":1},{"version":"437751e0352c6e924ddf30e90849f1d9eb00ca78c94d58d6a37202ec84eb8393","impliedFormat":1},{"version":"48e8af7fdb2677a44522fd185d8c87deff4d36ee701ea003c6c780b1407a1397","impliedFormat":1},{"version":"d11308de5a36c7015bb73adb5ad1c1bdaac2baede4cc831a05cf85efa3cc7f2f","impliedFormat":1},{"version":"38e4684c22ed9319beda6765bab332c724103d3a966c2e5e1c5a49cf7007845f","impliedFormat":1},{"version":"f9812cfc220ecf7557183379531fa409acd249b9e5b9a145d0d52b76c20862de","affectsGlobalScope":true,"impliedFormat":1},{"version":"e650298721abc4f6ae851e60ae93ee8199791ceec4b544c3379862f81f43178c","impliedFormat":1},{"version":"2e4f37ffe8862b14d8e24ae8763daaa8340c0df0b859d9a9733def0eee7562d9","impliedFormat":1},{"version":"13283350547389802aa35d9f2188effaeac805499169a06ef5cd77ce2a0bd63f","impliedFormat":1},{"version":"680793958f6a70a44c8d9ae7d46b7a385361c69ac29dcab3ed761edce1c14ab8","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"b838d4c72740eb0afd284bf7575b74c624b105eff2e8c7b4aeead57e7ac320ff","impliedFormat":1},{"version":"913ddbba170240070bd5921b8f33ea780021bdf42fbdfcd4fcb2691b1884ddde","impliedFormat":1},{"version":"b4e6d416466999ff40d3fe5ceb95f7a8bfb7ac2262580287ac1a8391e5362431","impliedFormat":1},{"version":"5fe23bd829e6be57d41929ac374ee9551ccc3c44cee893167b7b5b77be708014","impliedFormat":1},{"version":"0a626484617019fcfbfc3c1bc1f9e84e2913f1adb73692aa9075817404fb41a1","impliedFormat":1},{"version":"438c7513b1df91dcef49b13cd7a1c4720f91a36e88c1df731661608b7c055f10","impliedFormat":1},{"version":"cf185cc4a9a6d397f416dd28cca95c227b29f0f27b160060a95c0e5e36cda865","impliedFormat":1},{"version":"0086f3e4ad898fd7ca56bb223098acfacf3fa065595182aaf0f6c4a6a95e6fbd","impliedFormat":1},{"version":"efaa078e392f9abda3ee8ade3f3762ab77f9c50b184e6883063a911742a4c96a","impliedFormat":1},{"version":"54a8bb487e1dc04591a280e7a673cdfb272c83f61e28d8a64cf1ac2e63c35c51","impliedFormat":1},{"version":"021a9498000497497fd693dd315325484c58a71b5929e2bbb91f419b04b24cea","impliedFormat":1},{"version":"9385cdc09850950bc9b59cca445a3ceb6fcca32b54e7b626e746912e489e535e","impliedFormat":1},{"version":"2894c56cad581928bb37607810af011764a2f511f575d28c9f4af0f2ef02d1ab","impliedFormat":1},{"version":"0a72186f94215d020cb386f7dca81d7495ab6c17066eb07d0f44a5bf33c1b21a","impliedFormat":1},{"version":"84124384abae2f6f66b7fbfc03862d0c2c0b71b826f7dbf42c8085d31f1d3f95","impliedFormat":1},{"version":"63a8e96f65a22604eae82737e409d1536e69a467bb738bec505f4f97cce9d878","impliedFormat":1},{"version":"3fd78152a7031315478f159c6a5872c712ece6f01212c78ea82aef21cb0726e2","impliedFormat":1},{"version":"b01bd582a6e41457bc56e6f0f9de4cb17f33f5f3843a7cf8210ac9c18472fb0f","impliedFormat":1},{"version":"58b49e5c1def740360b5ae22ae2405cfac295fee74abd88d74ac4ea42502dc03","impliedFormat":1},{"version":"512fc15cca3a35b8dbbf6e23fe9d07e6f87ad03c895acffd3087ce09f352aad0","impliedFormat":1},{"version":"9a0946d15a005832e432ea0cd4da71b57797efb25b755cc07f32274296d62355","impliedFormat":1},{"version":"a52ff6c0a149e9f370372fc3c715d7f2beee1f3bab7980e271a7ab7d313ec677","impliedFormat":1},{"version":"fd933f824347f9edd919618a76cdb6a0c0085c538115d9a287fa0c7f59957ab3","impliedFormat":1},{"version":"6ac6715916fa75a1f7ebdfeacac09513b4d904b667d827b7535e84ff59679aff","impliedFormat":1},{"version":"6a1aa3e55bdc50503956c5cd09ae4cd72e3072692d742816f65c66ca14f4dfdd","impliedFormat":1},{"version":"ab75cfd9c4f93ffd601f7ca1753d6a9d953bbedfbd7a5b3f0436ac8a1de60dfa","impliedFormat":1},{"version":"f95180f03d827525ca4f990f49e17ec67198c316dd000afbe564655141f725cd","impliedFormat":1},{"version":"b73cbf0a72c8800cf8f96a9acfe94f3ad32ca71342a8908b8ae484d61113f647","impliedFormat":1},{"version":"bae6dd176832f6423966647382c0d7ba9e63f8c167522f09a982f086cd4e8b23","impliedFormat":1},{"version":"1364f64d2fb03bbb514edc42224abd576c064f89be6a990136774ecdd881a1da","impliedFormat":1},{"version":"c9958eb32126a3843deedda8c22fb97024aa5d6dd588b90af2d7f2bfac540f23","impliedFormat":1},{"version":"950fb67a59be4c2dbe69a5786292e60a5cb0e8612e0e223537784c731af55db1","impliedFormat":1},{"version":"e927c2c13c4eaf0a7f17e6022eee8519eb29ef42c4c13a31e81a611ab8c95577","impliedFormat":1},{"version":"07ca44e8d8288e69afdec7a31fa408ce6ab90d4f3d620006701d5544646da6aa","impliedFormat":1},{"version":"70246ad95ad8a22bdfe806cb5d383a26c0c6e58e7207ab9c431f1cb175aca657","impliedFormat":1},{"version":"f00f3aa5d64ff46e600648b55a79dcd1333458f7a10da2ed594d9f0a44b76d0b","impliedFormat":1},{"version":"772d8d5eb158b6c92412c03228bd9902ccb1457d7a705b8129814a5d1a6308fc","impliedFormat":1},{"version":"4e4475fba4ed93a72f167b061cd94a2e171b82695c56de9899275e880e06ba41","impliedFormat":1},{"version":"97c5f5d580ab2e4decd0a3135204050f9b97cd7908c5a8fbc041eadede79b2fa","impliedFormat":1},{"version":"c99a3a5f2215d5b9d735aa04cec6e61ed079d8c0263248e298ffe4604d4d0624","impliedFormat":1},{"version":"49b2375c586882c3ac7f57eba86680ff9742a8d8cb2fe25fe54d1b9673690d41","impliedFormat":1},{"version":"802e797bcab5663b2c9f63f51bdf67eff7c41bc64c0fd65e6da3e7941359e2f7","impliedFormat":1},{"version":"847e160d709c74cc714fbe1f99c41d3425b74cd47b1be133df1623cd87014089","impliedFormat":1},{"version":"9fee04f1e1afa50524862289b9f0b0fdc3735b80e2a0d684cec3b9ff3d94cecc","impliedFormat":1},{"version":"5cdc27fbc5c166fc5c763a30ac21cbac9859dc5ba795d3230db6d4e52a1965bb","impliedFormat":1},{"version":"6459054aabb306821a043e02b89d54da508e3a6966601a41e71c166e4ea1474f","impliedFormat":1},{"version":"f416c9c3eee9d47ff49132c34f96b9180e50485d435d5748f0e8b72521d28d2e","impliedFormat":1},{"version":"05c97cddbaf99978f83d96de2d8af86aded9332592f08ce4a284d72d0952c391","impliedFormat":1},{"version":"14e5cdec6f8ae82dfd0694e64903a0a54abdfe37e1d966de3d4128362acbf35f","impliedFormat":1},{"version":"bbc183d2d69f4b59fd4dd8799ffdf4eb91173d1c4ad71cce91a3811c021bf80c","impliedFormat":1},{"version":"7b6ff760c8a240b40dab6e4419b989f06a5b782f4710d2967e67c695ef3e93c4","impliedFormat":1},{"version":"8dbc4134a4b3623fc476be5f36de35c40f2768e2e3d9ed437e0d5f1c4cd850f6","impliedFormat":1},{"version":"4e06330a84dec7287f7ebdd64978f41a9f70a668d3b5edc69d5d4a50b9b376bb","impliedFormat":1},{"version":"65bfa72967fbe9fc33353e1ac03f0480aa2e2ea346d61ff3ea997dfd850f641a","impliedFormat":1},{"version":"c06f0bb92d1a1a5a6c6e4b5389a5664d96d09c31673296cb7da5fe945d54d786","impliedFormat":1},{"version":"f974e4a06953682a2c15d5bd5114c0284d5abf8bc0fe4da25cb9159427b70072","impliedFormat":1},{"version":"872caaa31423f4345983d643e4649fb30f548e9883a334d6d1c5fff68ede22d4","impliedFormat":1},{"version":"94404c4a878fe291e7578a2a80264c6f18e9f1933fbb57e48f0eb368672e389c","impliedFormat":1},{"version":"5c1b7f03aa88be854bc15810bfd5bd5a1943c5a7620e1c53eddd2a013996343e","impliedFormat":1},{"version":"09dfc64fcd6a2785867f2368419859a6cc5a8d4e73cbe2538f205b1642eb0f51","impliedFormat":1},{"version":"bcf6f0a323653e72199105a9316d91463ad4744c546d1271310818b8cef7c608","impliedFormat":1},{"version":"01aa917531e116485beca44a14970834687b857757159769c16b228eb1e49c5f","impliedFormat":1},{"version":"351475f9c874c62f9b45b1f0dc7e2704e80dfd5f1af83a3a9f841f9dfe5b2912","impliedFormat":1},{"version":"ac457ad39e531b7649e7b40ee5847606eac64e236efd76c5d12db95bf4eacd17","impliedFormat":1},{"version":"187a6fdbdecb972510b7555f3caacb44b58415da8d5825d03a583c4b73fde4cf","impliedFormat":1},{"version":"d4c3250105a612202289b3a266bb7e323db144f6b9414f9dea85c531c098b811","impliedFormat":1},{"version":"95b444b8c311f2084f0fb51c616163f950fb2e35f4eaa07878f313a2d36c98a4","impliedFormat":1},{"version":"741067675daa6d4334a2dc80a4452ca3850e89d5852e330db7cb2b5f867173b1","impliedFormat":1},{"version":"f8acecec1114f11690956e007d920044799aefeb3cece9e7f4b1f8a1d542b2c9","impliedFormat":1},{"version":"178071ccd043967a58c5d1a032db0ddf9bd139e7920766b537d9783e88eb615e","impliedFormat":1},{"version":"3a17f09634c50cce884721f54fd9e7b98e03ac505889c560876291fcf8a09e90","impliedFormat":1},{"version":"32531dfbb0cdc4525296648f53b2b5c39b64282791e2a8c765712e49e6461046","impliedFormat":1},{"version":"0ce1b2237c1c3df49748d61568160d780d7b26693bd9feb3acb0744a152cd86d","impliedFormat":1},{"version":"e489985388e2c71d3542612685b4a7db326922b57ac880f299da7026a4e8a117","impliedFormat":1},{"version":"5cad4158616d7793296dd41e22e1257440910ea8d01c7b75045d4dfb20c5a41a","impliedFormat":1},{"version":"04d3aad777b6af5bd000bfc409907a159fe77e190b9d368da4ba649cdc28d39e","affectsGlobalScope":true,"impliedFormat":1},{"version":"74efc1d6523bd57eb159c18d805db4ead810626bc5bc7002a2c7f483044b2e0f","impliedFormat":1},{"version":"19252079538942a69be1645e153f7dbbc1ef56b4f983c633bf31fe26aeac32cd","impliedFormat":1},{"version":"bc11f3ac00ac060462597add171220aed628c393f2782ac75dd29ff1e0db871c","impliedFormat":1},{"version":"616775f16134fa9d01fc677ad3f76e68c051a056c22ab552c64cc281a9686790","impliedFormat":1},{"version":"65c24a8baa2cca1de069a0ba9fba82a173690f52d7e2d0f1f7542d59d5eb4db0","impliedFormat":1},{"version":"f9fe6af238339a0e5f7563acee3178f51db37f32a2e7c09f85273098cee7ec49","impliedFormat":1},{"version":"3b0b1d352b8d2e47f1c4df4fb0678702aee071155b12ef0185fce9eb4fa4af1e","impliedFormat":1},{"version":"77e71242e71ebf8528c5802993697878f0533db8f2299b4d36aa015bae08a79c","impliedFormat":1},{"version":"a344403e7a7384e0e7093942533d309194ad0a53eca2a3100c0b0ab4d3932773","impliedFormat":1},{"version":"b7fff2d004c5879cae335db8f954eb1d61242d9f2d28515e67902032723caeab","impliedFormat":1},{"version":"5f3dc10ae646f375776b4e028d2bed039a93eebbba105694d8b910feebbe8b9c","impliedFormat":1},{"version":"bb18bf4a61a17b4a6199eb3938ecfa4a59eb7c40843ad4a82b975ab6f7e3d925","impliedFormat":1},{"version":"4545c1a1ceca170d5d83452dd7c4994644c35cf676a671412601689d9a62da35","impliedFormat":1},{"version":"e9b6fc05f536dfddcdc65dbcf04e09391b1c968ab967382e48924f5cb90d88e1","impliedFormat":1},{"version":"a2d648d333cf67b9aeac5d81a1a379d563a8ffa91ddd61c6179f68de724260ff","impliedFormat":1},{"version":"2b664c3cc544d0e35276e1fb2d4989f7d4b4027ffc64da34ec83a6ccf2e5c528","impliedFormat":1},{"version":"a3f41ed1b4f2fc3049394b945a68ae4fdefd49fa1739c32f149d32c0545d67f5","impliedFormat":1},{"version":"3cd8f0464e0939b47bfccbb9bb474a6d87d57210e304029cd8eb59c63a81935d","impliedFormat":1},{"version":"47699512e6d8bebf7be488182427189f999affe3addc1c87c882d36b7f2d0b0e","impliedFormat":1},{"version":"3026abd48e5e312f2328629ede6e0f770d21c3cd32cee705c450e589d015ee09","impliedFormat":1},{"version":"8b140b398a6afbd17cc97c38aea5274b2f7f39b1ae5b62952cfe65bf493e3e75","impliedFormat":1},{"version":"7663d2c19ce5ef8288c790edba3d45af54e58c84f1b37b1249f6d49d962f3d91","impliedFormat":1},{"version":"5cce3b975cdb72b57ae7de745b3c5de5790781ee88bcb41ba142f07c0fa02e97","impliedFormat":1},{"version":"00bd6ebe607246b45296aa2b805bd6a58c859acecda154bfa91f5334d7c175c6","impliedFormat":1},{"version":"ad036a85efcd9e5b4f7dd5c1a7362c8478f9a3b6c3554654ca24a29aa850a9c5","impliedFormat":1},{"version":"fedebeae32c5cdd1a85b4e0504a01996e4a8adf3dfa72876920d3dd6e42978e7","impliedFormat":1},{"version":"0d28b974a7605c4eda20c943b3fa9ae16cb452c1666fc9b8c341b879992c7612","impliedFormat":1},{"version":"cdf21eee8007e339b1b9945abf4a7b44930b1d695cc528459e68a3adc39a622e","impliedFormat":1},{"version":"db036c56f79186da50af66511d37d9fe77fa6793381927292d17f81f787bb195","impliedFormat":1},{"version":"87ac2fb61e629e777f4d161dff534c2023ee15afd9cb3b1589b9b1f014e75c58","impliedFormat":1},{"version":"13c8b4348db91e2f7d694adc17e7438e6776bc506d5c8f5de9ad9989707fa3fe","impliedFormat":1},{"version":"3c1051617aa50b38e9efaabce25e10a5dd9b1f42e372ef0e8a674076a68742ed","impliedFormat":1},{"version":"07a3e20cdcb0f1182f452c0410606711fbea922ca76929a41aacb01104bc0d27","impliedFormat":1},{"version":"1de80059b8078ea5749941c9f863aa970b4735bdbb003be4925c853a8b6b4450","impliedFormat":1},{"version":"1d079c37fa53e3c21ed3fa214a27507bda9991f2a41458705b19ed8c2b61173d","impliedFormat":1},{"version":"4cd4b6b1279e9d744a3825cbd7757bbefe7f0708f3f1069179ad535f19e8ed2c","impliedFormat":1},{"version":"5835a6e0d7cd2738e56b671af0e561e7c1b4fb77751383672f4b009f4e161d70","impliedFormat":1},{"version":"c0eeaaa67c85c3bb6c52b629ebbfd3b2292dc67e8c0ffda2fc6cd2f78dc471e6","impliedFormat":1},{"version":"4b7f74b772140395e7af67c4841be1ab867c11b3b82a51b1aeb692822b76c872","impliedFormat":1},{"version":"27be6622e2922a1b412eb057faa854831b95db9db5035c3f6d4b677b902ab3b7","impliedFormat":1},{"version":"b95a6f019095dd1d48fd04965b50dfd63e5743a6e75478343c46d2582a5132bf","impliedFormat":99},{"version":"c2008605e78208cfa9cd70bd29856b72dda7ad89df5dc895920f8e10bcb9cd0a","impliedFormat":99},{"version":"b97cb5616d2ab82a98ec9ada7b9e9cabb1f5da880ec50ea2b8dc5baa4cbf3c16","impliedFormat":99},{"version":"d23df9ff06ae8bf1dcb7cc933e97ae7da418ac77749fecee758bb43a8d69f840","affectsGlobalScope":true,"impliedFormat":1},{"version":"040c71dde2c406f869ad2f41e8d4ce579cc60c8dbe5aa0dd8962ac943b846572","affectsGlobalScope":true,"impliedFormat":1},{"version":"3586f5ea3cc27083a17bd5c9059ede9421d587286d5a47f4341a4c2d00e4fa91","impliedFormat":1},{"version":"a6df929821e62f4719551f7955b9f42c0cd53c1370aec2dd322e24196a7dfe33","impliedFormat":1},{"version":"b789bf89eb19c777ed1e956dbad0925ca795701552d22e68fd130a032008b9f9","impliedFormat":1},"e462a655754db9df18b4a657454a7b6a88717ffded4e89403b2b3a47c6603fc3",{"version":"402e5c534fb2b85fa771170595db3ac0dd532112c8fa44fc23f233bc6967488b","impliedFormat":1},{"version":"52dcc257df5119fb66d864625112ce5033ac51a4c2afe376a0b299d2f7f76e4a","impliedFormat":1},{"version":"e5bab5f871ef708d52d47b3e5d0aa72a08ee7a152f33931d9a60809711a2a9a3","impliedFormat":1},{"version":"e16dc2a81595736024a206c7d5c8a39bfe2e6039208ef29981d0d95434ba8fcf","impliedFormat":1},{"version":"38cb107048cd8ba54a70014ef9a30cf57bee0d9f10a0ca4cefa974056e1ee460","impliedFormat":1},{"version":"19ee8416e6473ed6c7adb868fa796b5653cf0fa2a337658e677eaa0d134388c3","impliedFormat":1},{"version":"1328ab4e442614b28cdb3d4b414cf68325c0da0dca07287a338d0654b7a00261","impliedFormat":1},{"version":"a039dc21f045919f3cbee2ec13812cc6cc3eebc99dae4be00973230f468d19a6","impliedFormat":1},{"version":"3fbe57af01460e49dcd29df55d6931e1672bc6f1be0fb073d11410bc16f9037d","impliedFormat":1},{"version":"f760be449e8562ec5c09bb5187e8e1eabf3c113c0c58cddda53ef8c69f3e2131","impliedFormat":1},{"version":"44325ed13294fce6ab825b82947bbeed2611db7dad9d9135260192f375e5a189","impliedFormat":1},{"version":"e392e8fb5b514eafc585601c1d781485aa6dd6a320e75daf1064a4c6918a1b45","impliedFormat":1},{"version":"46e4a36e8ddbdfb4e7330e11c81c970dc8b218611df9183d39c41c5f8c653b55","impliedFormat":1},{"version":"3cc8a3d123b6b232d48d34b51b785f9da8d193f5b5817fa521fcd2f3b9315c55","impliedFormat":1},{"version":"6332f565867cf4a740a70e30f31cefba37ef7cebcf74f22eab8d744fde6d193e","impliedFormat":1},{"version":"9a195d8476f48523446ece812e5450b5b1ec8c3b6abf99efb8ee2479524f6f56","impliedFormat":1},{"version":"17f2922d41ddd032830a91371c948cd9ce903b35c95adca72271a54584f19b0b","impliedFormat":1},{"version":"3eed76ede2a1a14d7c9bb0a642041282dcc264811139d3dd275c9fe14efc9840","impliedFormat":1},{"version":"354a7f8e1287d9d6b7561bc97fdd8cbc2f7c1dd79e4cb37b942e8a5cfaff1085","impliedFormat":1},{"version":"8d369483f0c2b9ee388129cfdb6a43bc8112b377e86a41884bd06e19ce04f4c1","impliedFormat":99},{"version":"b558c9a18ea4e6e4157124465c3ef1063e64640da139e67be5edb22f534f2f08","impliedFormat":1},{"version":"01374379f82be05d25c08d2f30779fa4a4c41895a18b93b33f14aeef51768692","impliedFormat":1},{"version":"b0dee183d4e65cf938242efaf3d833c6b645afb35039d058496965014f158141","impliedFormat":1},{"version":"c0bbbf84d3fbd85dd60d040c81e8964cc00e38124a52e9c5dcdedf45fea3f213","impliedFormat":1},{"version":"7add2fb915453d63d76378a77076d211f42b548a0e4cbad36526fcd541bc189d","signature":"f65ce75c9085571e6321abf2bf9833709f4897e381f89e9925521833dbb7ab16"},{"version":"90b48cc1fe582c743f43ae12889aad0806644b26f12db1c464f118a524394854","signature":"b0bcc3c474cf34eabaa3c6a23f95734d9999345db37b96201ac285771310b8ff"},{"version":"47d2f43dcdd5130b9b15cc170e18e84980e75e49ee8b464f2158329256a54256","signature":"3eb972ae325aa293fdb6077cdf956f209ee6ea34b4e874ff7ec8686b3079972f"},{"version":"e966bcfbb921a2b3739bbf27921ba8cf3783d76d8e93a473f95d71804c537a20","signature":"2cc743b624d6891f9275f11f76fedfe235af04641c806e7dc65e55740db4dd29"},{"version":"e3e84b5dcee097d7f5d7707497ad2ebfc5951827df9967b2773205ca8d8c0eec","signature":"2cc743b624d6891f9275f11f76fedfe235af04641c806e7dc65e55740db4dd29"},{"version":"1748c03e7a7d118f7f6648c709507971eb0d416f489958492c5ae625de445184","impliedFormat":1},{"version":"96d14f21b7652903852eef49379d04dbda28c16ed36468f8c9fa08f7c14c9538","impliedFormat":1}],"root":[410,[435,439]],"options":{"allowJs":true,"esModuleInterop":true,"jsx":1,"module":99,"skipLibCheck":true,"strict":true,"target":1},"referencedMap":[[438,1],[439,2],[436,3],[437,4],[410,5],[363,4],[440,4],[441,4],[142,6],[143,6],[144,7],[99,8],[145,9],[146,10],[147,11],[94,4],[97,12],[95,4],[96,4],[148,13],[149,14],[150,15],[151,16],[152,17],[153,18],[154,18],[155,19],[156,20],[157,21],[158,22],[100,4],[98,4],[159,23],[160,24],[161,25],[193,26],[162,27],[163,28],[164,29],[165,30],[166,31],[167,32],[168,33],[169,34],[170,35],[171,36],[172,36],[173,37],[174,4],[175,38],[177,39],[176,40],[178,41],[179,42],[180,43],[181,44],[182,45],[183,46],[184,47],[185,48],[186,49],[187,50],[188,51],[189,52],[190,53],[101,4],[102,4],[103,4],[141,54],[191,55],[192,56],[86,4],[198,57],[199,58],[197,59],[195,60],[196,61],[84,4],[87,62],[286,59],[85,4],[93,63],[366,64],[370,65],[372,66],[219,67],[233,68],[337,69],[265,4],[340,70],[301,71],[310,72],[338,73],[220,74],[264,4],[266,75],[339,76],[240,77],[221,78],[245,77],[234,77],[204,77],[292,79],[293,80],[209,4],[289,81],[294,82],[381,83],[287,82],[382,84],[271,4],[290,85],[394,86],[393,87],[296,82],[392,4],[390,4],[391,88],[291,59],[278,89],[279,90],[288,91],[305,92],[306,93],[295,94],[273,95],[274,96],[385,97],[388,98],[252,99],[251,100],[250,101],[397,59],[249,102],[225,4],[400,4],[403,4],[402,59],[404,103],[200,4],[331,4],[232,104],[202,105],[354,4],[355,4],[357,4],[360,106],[356,4],[358,107],[359,107],[218,4],[231,4],[365,108],[373,109],[377,110],[214,111],[281,112],[280,4],[272,95],[300,113],[298,114],[297,4],[299,4],[304,115],[276,116],[213,117],[238,118],[328,119],[205,120],[212,121],[201,69],[342,122],[352,123],[341,4],[351,124],[239,4],[223,125],[319,126],[318,4],[325,127],[327,128],[320,129],[324,130],[326,127],[323,129],[322,127],[321,129],[261,131],[246,131],[313,132],[247,132],[207,133],[206,4],[317,134],[316,135],[315,136],[314,137],[208,138],[285,139],[302,140],[284,141],[309,142],[311,143],[308,141],[241,138],[194,4],[329,144],[267,145],[303,4],[350,146],[270,147],[345,148],[211,4],[346,149],[348,150],[349,151],[332,4],[344,120],[243,152],[330,153],[353,154],[215,4],[217,4],[222,155],[312,156],[210,157],[216,4],[269,158],[268,159],[224,160],[277,161],[275,162],[226,163],[228,164],[401,4],[227,165],[229,166],[368,4],[367,4],[369,4],[399,4],[230,167],[283,59],[92,4],[307,168],[253,4],[263,169],[242,4],[375,59],[384,170],[260,59],[379,82],[259,171],[362,172],[258,170],[203,4],[386,173],[256,59],[257,59],[248,4],[262,4],[255,174],[254,175],[244,176],[237,94],[347,4],[236,177],[235,4],[371,4],[282,59],[364,178],[83,4],[91,179],[88,59],[89,4],[90,4],[343,180],[336,181],[335,4],[334,182],[333,4],[374,183],[376,184],[378,185],[380,186],[383,187],[409,188],[387,188],[408,189],[389,190],[395,191],[396,192],[398,193],[405,194],[407,4],[406,195],[361,196],[427,197],[425,198],[426,199],[414,200],[415,198],[422,201],[413,202],[418,203],[428,4],[419,204],[424,205],[430,206],[429,207],[412,208],[420,209],[421,210],[416,211],[423,197],[417,212],[411,4],[433,213],[432,4],[431,4],[434,214],[81,4],[82,4],[13,4],[14,4],[16,4],[15,4],[2,4],[17,4],[18,4],[19,4],[20,4],[21,4],[22,4],[23,4],[24,4],[3,4],[25,4],[26,4],[4,4],[27,4],[31,4],[28,4],[29,4],[30,4],[32,4],[33,4],[34,4],[5,4],[35,4],[36,4],[37,4],[38,4],[6,4],[42,4],[39,4],[40,4],[41,4],[43,4],[7,4],[44,4],[49,4],[50,4],[45,4],[46,4],[47,4],[48,4],[8,4],[54,4],[51,4],[52,4],[53,4],[55,4],[9,4],[56,4],[57,4],[58,4],[60,4],[59,4],[61,4],[62,4],[10,4],[63,4],[64,4],[65,4],[11,4],[66,4],[67,4],[68,4],[69,4],[70,4],[1,4],[71,4],[72,4],[12,4],[76,4],[74,4],[79,4],[78,4],[73,4],[77,4],[75,4],[80,4],[119,215],[129,216],[118,215],[139,217],[110,218],[109,219],[138,195],[132,220],[137,221],[112,222],[126,223],[111,224],[135,225],[107,226],[106,195],[136,227],[108,228],[113,229],[114,4],[117,229],[104,4],[140,230],[130,231],[121,232],[122,233],[124,234],[120,235],[123,236],[133,195],[115,237],[116,238],[125,239],[105,240],[128,231],[127,229],[131,4],[134,241],[435,242]],"affectedFilesPendingEmit":[438,439,436,437,435],"version":"5.9.3"}

--- FILE: V2 Prompt to build system/.agent-state.md ---

# Agent State

## Project
Innoventix Platform v2 — multi-tenant CRM + Project Management + Communication
Hub + AI features SaaS, fully self-hosted on Contabo VPS, with a Super Admin
platform tier. Originated from the internal "SMB Project Management Tool"
assignment for Innoventix Hub.

## Status
NOT STARTED — task files (v2) generated, no implementation begun.

## Completed
- (none yet)

## In Progress
- (none — next up is TASK 01)

## Deferred
- (none yet)

## Architecture Decisions Made
- Row-level multi-tenancy via `organization_id` on every tenant-scoped
  table (documentation/adr/001-multi-tenancy.md, created in TASK 07).
- Super Admin stored in a fully separate `super_admins` table, never
  derivable from `organization_members` (TASK 07, TASK 16).
- Self-hosted Supabase (Docker Compose) on the Contabo VPS replaces
  Supabase Cloud (TASK 02); Next.js app self-hosted on the same VPS via
  CI/CD replaces Netlify (TASK 68).
- Innoventix Hub is Organization #1, no special-cased code.

## Blockers
- (none yet)

## Last Completed Task
- None.

## Last Successful Commit
- None — repository not yet initialized.

## Deployment Status
- Not deployed. Contabo VPS already runs n8n; nothing else provisioned yet.

## Known Bugs
- (none yet)

## Next Recommended Task
`TASK 01 — Contabo VPS Provisioning & Base Server Hardening`
(see `01-contabo-vps-provisioning-and-base-server-hardening.md`)


--- FILE: V2 Prompt to build system/00-MASTER-PROMPT-v2-self-hosted.md ---

# MASTER PROMPT v2 — Innoventix Platform Build Orchestrator (Self-Hosted / Super Admin / AI)

Paste this whole file as your first message to Antigravity / Claude Code /
Cursor at the start of the build. It supersedes MASTER-PROMPT v1 — this
version reflects the expanded scope: fully self-hosted on your Contabo VPS,
a Super Admin platform tier, AI-assisted features, and an explicit
manual-vs-connected client communication workflow.

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
unified multi-channel communication hub + AI-assisted features**, fully
self-hosted on your own Contabo VPS, built first for internal use at
Innoventix Hub and sold as a paid subscription to other organizations.

## Origin and evolution
1. Started as an internal-only assignment: *SMB Project Management Tool for
   Innoventix Hub* (full text in `ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md`).
2. Expanded into a multi-tenant, subscription SaaS with a real CRM and a
   unified communication inbox (Slack/WhatsApp/Email/Discord/Upwork).
3. Expanded again (this version) to add:
   - **Fully self-hosted infrastructure** on Contabo — self-hosted Supabase
     (Postgres + Auth + Storage, Docker-based) and the Next.js app itself,
     replacing Supabase Cloud and Netlify entirely. n8n, already on the same
     VPS, is now co-located with everything else behind one Nginx proxy.
   - **A Super Admin platform tier** — a role above every organization,
     held only by you/DEVMARK, for managing all tenant organizations, plans,
     and platform-wide metrics. Fully isolated from organization-level
     roles; never derivable from an org owner/admin role.
   - **AI-assisted features** — inbox reply suggestions, CRM lead scoring,
     auto-task extraction from messages, and AI-written weekly report
     narratives — all plan-gated, individually toggleable per organization,
     and behind a platform-wide kill switch.
   - **Explicit manual-vs-connected client communication modes** — existing
     clients keep the manual-logging workflow untouched; new clients default
     to full multi-channel auto-sync into the unified inbox.
4. Every requirement in the original assignment remains binding, generalized
   so it works for any organization, not hardcoded to Innoventix.

## Tech stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS — self-hosted
  on the Contabo VPS via Docker, deployed through CI/CD (not Netlify).
- Database/Auth/Storage: **Self-hosted Supabase** (Postgres, GoTrue Auth,
  PostgREST, Realtime, Storage) via Docker Compose, on the same VPS.
- Automation: n8n on the same Contabo VPS.
- Billing: Stripe (the one component that necessarily stays external —
  self-hosting payment processing is not advisable).
- AI: a provider-agnostic AI client layer (specific model provider is a
  configurable decision, not hardcoded — see TASK 43).
- Reverse proxy/SSL: Nginx + Let's Encrypt, one proxy in front of the app,
  the Supabase API, and n8n, each on its own subdomain.
- Communication providers: Slack, WhatsApp Business Cloud API, Email
  (inbound-parse), Discord, Upwork (manual-log).

## The two tenancy tiers — do not confuse them
- **Organization** — a paying customer (agency/business). Innoventix Hub is
  simply the first organization row, no special-cased code.
- **Super Admin** — a platform operator (you/DEVMARK). Stored in a
  completely separate `super_admins` table, never joined through
  `organization_members`, so a compromised org role can never escalate to
  platform access. See TASK 07's ADR and TASK 16.

# 3. TASK SEQUENCE

71 implementation tasks are provided as separate `.md` files in this
folder, numbered `01` through `71`, each fully self-contained per the
orchestrator's task format. Work through them **strictly in order** — later
tasks assume earlier ones are complete.

Phase map (for orientation — task files are authoritative):

| Phase | Tasks | Covers |
|---|---|---|
| 0 — Self-Hosted Infrastructure | 01–05 | Contabo VPS hardening, self-hosted Supabase, Nginx/SSL, backups, local dev parity |
| 1 — App Foundation | 06–07 | Repo scaffold, multi-tenancy + super-admin ADR |
| 2 — Core Schema | 08–10 | Orgs/roles/super-admins, CRM/PM tables (+ comms-mode field), comms hub/billing tables |
| 3 — Auth & Tenancy | 11–15 | Self-hosted Auth, RLS, onboarding, plans, Stripe |
| 4 — Super Admin | 16–20 | Access control, dashboard, org management, impersonation, platform settings |
| 5 — Shell & Dashboard | 21–23 | App shell, main dashboard, org settings/team |
| 6 — CRM | 24–28 | Clients (+comms-mode), detail, pipeline, comms log, tags |
| 7 — Project Management | 29–34 | Kanban/list, detail, tasks, deliverables, templates, workload |
| 8 — Communication Hub | 35–42 | Status badges, inbox architecture, Slack/WhatsApp/Email/Discord/Upwork, inbox UI, manual-vs-connected workflow |
| 9 — AI Features | 43–48 | AI architecture, reply suggestions, lead scoring, task extraction, report narratives, AI settings |
| 10 — Automation (n8n) | 49–53 | Event contracts, invoice trigger, deadline/overdue alerts, weekly summary (+AI narrative), in-app notifications |
| 11 — Client Portal | 54–57 | Client auth/RLS, dashboard, approval flow, invoices |
| 12 — Analytics | 58–60 | Analytics dashboard, plan-usage reporting, exports |
| 13 — Security Hardening | 61–63 | Validation, secrets/API security, audit logging (incl. super-admin actions) |
| 14 — Testing | 64–66 | Unit/integration (incl. super-admin isolation), E2E, load/scale on real VPS hardware |
| 15 — Self-Hosted Deployment & Launch | 67–71 | Env/secrets, CI/CD to Contabo, n8n activation, monitoring/logging, final QA & demo |

# 4. FIRST ACTIONS

1. Read `ORCHESTRATOR-FULL-RULES.md` in full.
2. Read `ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md` in full.
3. Read this file in full (you're doing that now).
4. Inspect the Contabo VPS's actual current state per the orchestrator's
   Section 3 — it already runs n8n; never assume it's empty, and never
   disrupt the existing n8n service while provisioning around it.
5. Open `01-contabo-vps-provisioning-and-base-server-hardening.md` and
   begin.

Do not improvise beyond what these documents specify without recording the
decision in `documentation/adr/`. When requirements conflict, follow the
Priority Order defined in the full orchestrator rules (explicit requirements
> security > data integrity > functional correctness > production
reliability > maintainability > deployment reliability > testing > UX >
performance > convenience).

# 5. A NOTE ON SCOPE SIZING

This is 71 tasks, not the "100–200" originally floated. Every phase above
maps to real, distinct engineering work introduced by this scope (self-
hosted infra swap, a genuinely isolated Super Admin tier, four real AI
features, and an explicit dual communication workflow) — nothing here is
padding. If any single task proves too large once you're inside it (for
example TASK 41's inbox UI), split it into 41a/41b sub-tasks at that point,
following the same template — that's a better time to split than deciding
task boundaries in advance of writing any code.


--- FILE: V2 Prompt to build system/01-contabo-vps-provisioning-and-base-server-hardening.md ---

# TASK 01 — Contabo VPS Provisioning & Base Server Hardening

## Objective
Prepare the Contabo VPS as the single home for the entire platform: app, database, automation, and reverse proxy.

## Why This Task Exists
The platform must run entirely on infrastructure you control, not third-party managed services. This task establishes the secure base every later container/service sits on.

## Dependencies
- None — first task.

## Current State
Contabo VPS already exists and already runs n8n; nothing else is provisioned yet.

## Files To Inspect
- Existing n8n setup/config on the VPS (do not disrupt it)

## Files To Create
- documentation/infra/server-setup.md
- scripts/infra/harden.sh

## Files To Modify


## Implementation Instructions
- Inventory what's already running on the VPS (n8n, any existing services) before touching anything — never assume it's empty.
- Update OS packages, configure a firewall (ufw) allowing only required ports (22, 80, 443, and n8n's existing port).
- Create a non-root deploy user with SSH-key-only access; disable root SSH login and password auth.
- Install Docker and Docker Compose (the runtime for every self-hosted service that follows).
- Document the final server inventory (services, ports, users) in documentation/infra/server-setup.md.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- SSH key-only access, firewall default-deny, no root login — treat this as the security foundation for everything else.

## Testing Requirements
- Confirm SSH access works only via key for the deploy user.
- Confirm existing n8n instance still runs unaffected after hardening.

## Acceptance Criteria
- [ ] Firewall active with minimal open ports.
- [ ] Root SSH login disabled.
- [ ] Docker + Compose installed and verified.
- [ ] Existing n8n service confirmed unaffected.

## Git Commit
Recommended commit:

`chore(infra): provision and harden Contabo VPS base server`

## Verification
- Attempt root SSH login and confirm it is rejected.
- Run `docker --version` and `docker compose version` to confirm install.

## Next Task
`TASK 02`


--- FILE: V2 Prompt to build system/02-self-hosted-supabase-stack-via-docker-compose.md ---

# TASK 02 — Self-Hosted Supabase Stack via Docker Compose

## Objective
Stand up the full open-source Supabase stack (Postgres, GoTrue Auth, PostgREST, Realtime, Storage, Studio) on the VPS, replacing Supabase Cloud.

## Why This Task Exists
Self-hosting Supabase keeps every later task's schema/RLS/Auth work valid (same APIs, same Postgres, same RLS model) while satisfying the requirement that everything runs on your own Contabo server, not a third-party cloud.

## Dependencies
- TASK 01

## Current State
No database or auth service exists on the VPS yet.

## Files To Inspect
- documentation/infra/server-setup.md

## Files To Create
- docker-compose.supabase.yml
- documentation/infra/self-hosted-supabase.md
- .env.supabase.example

## Files To Modify


## Implementation Instructions
- Use Supabase's official self-hosting Docker Compose reference as the base, adapted to this VPS's resources.
- Configure Postgres with a persistent volume and scheduled local backups (detailed further in Task 04).
- Configure GoTrue (Auth), PostgREST (auto REST API), Realtime, and Storage services, all pointed at the same Postgres instance.
- Restrict Supabase Studio (the admin UI) to VPN/SSH-tunnel or IP-allowlist access only — never expose it publicly.
- Generate and securely store the service-role key, anon key, and JWT secret — these replace the Supabase-Cloud-issued equivalents everywhere else in the codebase.

## UI Requirements
- N/A — infra only.

## Backend Requirements
- This IS the backend data/auth layer for the whole platform going forward.

## Database Requirements
- No schema yet — this is the empty Postgres instance schema work begins on in TASK 07.

## API Requirements
- PostgREST auto-generates the REST API from the schema — no custom API code needed for basic CRUD.

## Security Requirements
- Studio never publicly reachable.
- JWT secret and service-role key stored only in the VPS's environment, never committed.

## Testing Requirements
- Verify Postgres, Auth, REST, Storage, and Realtime all respond correctly to basic health-check calls.

## Acceptance Criteria
- [ ] Full self-hosted Supabase stack running and healthy on the VPS.
- [ ] Studio confirmed unreachable from the public internet.
- [ ] All keys generated and securely recorded.

## Git Commit
Recommended commit:

`feat(infra): deploy self-hosted Supabase stack via Docker Compose`

## Verification
- curl each service's health endpoint from the VPS and confirm 200 responses.
- Attempt to reach Studio's port from outside the VPN/allowlist and confirm it is blocked.

## Next Task
`TASK 03`


--- FILE: V2 Prompt to build system/03-nginx-reverse-proxy-domains-and-ssl.md ---

# TASK 03 — Nginx Reverse Proxy, Domains & SSL

## Objective
Put a single Nginx reverse proxy in front of the app, the Supabase API, and n8n, each on its own subdomain with automatic HTTPS.

## Why This Task Exists
One VPS now serves multiple services (app, Supabase API, Studio-restricted, n8n) — a proper reverse proxy with SSL is what makes this safe and production-usable.

## Dependencies
- TASK 02

## Current State
Services run on internal ports only; no public domain/HTTPS routing exists yet.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- nginx/conf.d/app.conf
- nginx/conf.d/api.conf
- nginx/conf.d/n8n.conf
- documentation/infra/dns-ssl.md

## Files To Modify


## Implementation Instructions
- Configure subdomains: app.yourdomain.com (Next.js), api.yourdomain.com (Supabase/PostgREST+Auth+Storage+Realtime), n8n.yourdomain.com (existing n8n, now proxied consistently).
- Issue and auto-renew SSL certificates via Let's Encrypt/Certbot for every subdomain.
- Force HTTPS redirects on all subdomains; set standard security headers (HSTS, X-Frame-Options, etc.).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Confirm no service is reachable over plain HTTP or on its raw internal port from the public internet.

## Testing Requirements
- Test each subdomain resolves, redirects HTTP→HTTPS, and serves a valid certificate.

## Acceptance Criteria
- [ ] All subdomains reachable over valid HTTPS only.
- [ ] Certificates auto-renew without manual intervention.

## Git Commit
Recommended commit:

`feat(infra): configure Nginx reverse proxy with SSL for all subdomains`

## Verification
- Run an SSL checker against each subdomain and confirm a valid, trusted certificate.

## Next Task
`TASK 04`


--- FILE: V2 Prompt to build system/04-backup-and-disaster-recovery-strategy.md ---

# TASK 04 — Backup & Disaster Recovery Strategy

## Objective
Implement automated backups for the Postgres database and uploaded files, with a documented restore procedure.

## Why This Task Exists
Self-hosting means you own disaster recovery too — there's no managed-cloud safety net. This must exist before real client data lives on the server.

## Dependencies
- TASK 02

## Current State
No backup automation exists yet.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- scripts/infra/backup-postgres.sh
- scripts/infra/restore-postgres.sh
- documentation/infra/backup-restore.md

## Files To Modify


## Implementation Instructions
- Nightly automated pg_dump of the Postgres database, retained on a rolling window (e.g. 14 days) plus a weekly off-VPS copy (a separate storage location, not just local disk).
- Back up the Storage volume (uploaded deliverables/files) on the same cadence.
- Write and test a documented restore procedure — a backup nobody has restored from is not a real backup.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Backups stored encrypted if placed on any external/off-VPS location.

## Testing Requirements
- Actually run the restore procedure against a scratch instance and confirm data integrity.

## Acceptance Criteria
- [ ] Nightly backups running automatically and verifiably.
- [ ] Restore procedure tested successfully at least once, off-VPS copy confirmed present.

## Git Commit
Recommended commit:

`feat(infra): add automated backup and tested disaster-recovery procedure`

## Verification
- Delete a test table locally, run the restore script, and confirm the table returns intact.

## Next Task
`TASK 05`


--- FILE: V2 Prompt to build system/05-local-development-environment-parity.md ---

# TASK 05 — Local Development Environment Parity

## Objective
Set up a local Docker Compose environment that mirrors the production self-hosted Supabase stack, so development never depends on a live connection to the production VPS.

## Why This Task Exists
Without a local mirror, every developer/agent session would need to develop directly against production infrastructure — risky and slow. This closes that gap before any application code is written.

## Dependencies
- TASK 02

## Current State
Production self-hosted Supabase stack exists on the VPS (TASK 02); no local equivalent exists yet.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- docker-compose.local.yml
- documentation/infra/local-dev-setup.md
- .env.local.example

## Files To Modify


## Implementation Instructions
- Adapt the production docker-compose.supabase.yml into a docker-compose.local.yml runnable on a developer machine (lighter resource settings, local-only ports, no public exposure).
- Document the one-command setup (`docker compose -f docker-compose.local.yml up`) and seed-data loading process.
- Confirm schema migrations (from TASK 08 onward) apply identically to local and production instances.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Local instance never shares credentials or data with production; .env.local.example contains only placeholder values.

## Testing Requirements
- Verify a fresh machine can run the one-command setup and reach a working local Supabase stack with zero manual steps beyond documented ones.

## Acceptance Criteria
- [ ] Local dev environment runs independently of production and stays schema-compatible with it.

## Git Commit
Recommended commit:

`chore(infra): add local development environment mirroring production Supabase stack`

## Verification
- Tear down and rebuild the local environment from scratch following only the documentation, confirming it works cleanly.

## Next Task
`TASK 06`


--- FILE: V2 Prompt to build system/06-repository-and-application-foundation.md ---

# TASK 06 — Repository & Application Foundation

## Objective
Initialize the Next.js application, base tooling, and directory structure, wired to the self-hosted Supabase instance.

## Why This Task Exists
First application-layer task — everything from here builds on this scaffold.

## Dependencies
- TASK 03
- TASK 05

## Current State
Infra is live; no application code exists yet, or an early single-tenant scaffold from the original internal assignment may exist and must be inspected first.

## Files To Inspect
- Any existing repo root

## Files To Create
- package.json
- tsconfig.json
- .eslintrc
- .env.example
- README.md
- documentation/architecture.md
- .agent-state.md

## Files To Modify


## Implementation Instructions
- Initialize Next.js (App Router) + TypeScript + Tailwind CSS.
- Configure the Supabase client libraries to point at the self-hosted api.yourdomain.com endpoints from TASK 03, not supabase.co.
- Write documentation/architecture.md capturing the full platform vision: multi-tenant CRM + Project Management + unified communication hub + AI features + Super Admin tier, fully self-hosted on Contabo.
- Create .agent-state.md per the orchestrator's continuity format.
- Do not hardcode Innoventix-specific data anywhere — it is tenant #1, not a special case.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Ensure Supabase client keys are read from environment, never hardcoded.

## Testing Requirements
- Verify `npm run build` succeeds and the app can reach the self-hosted Supabase health endpoint.

## Acceptance Criteria
- [ ] App builds and connects successfully to the self-hosted Supabase API.
- [ ] architecture.md reflects the full expanded scope.

## Git Commit
Recommended commit:

`chore(foundation): initialize application connected to self-hosted Supabase`

## Verification
- Run build and lint.
- Confirm a basic Supabase query round-trips against the self-hosted instance.

## Next Task
`TASK 07`


--- FILE: V2 Prompt to build system/07-multi-tenant-architecture-decision-record.md ---

# TASK 07 — Multi-Tenant Architecture Decision Record

## Objective
Formally define the tenancy model, now including the platform-level Super Admin tier, before schema work begins.

## Why This Task Exists
Every table, RLS policy, and screen depends on this being decided once and consistently, including where Super Admin sits relative to organizations.

## Dependencies
- TASK 06

## Current State
No tenancy model documented yet.

## Files To Inspect
- documentation/architecture.md

## Files To Create
- documentation/adr/001-multi-tenancy.md

## Files To Modify
- documentation/architecture.md

## Implementation Instructions
- Document the hierarchy: Super Admin (platform operator, you/DEVMARK) → Organization (paying tenant) → Team Members → Clients → Projects/Tasks/Deliverables.
- Row-level tenancy via organization_id on every tenant-scoped table, enforced by RLS (TASK 11).
- Super Admin is a platform-wide role stored separately from organization_members, never inherited from any single org — detailed in TASK 15.
- Document that Innoventix Hub is Organization #1 with no special-cased code.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Record this as the canonical isolation boundary all later RLS and Super Admin access rules must follow.

## Testing Requirements
- N/A — documentation task.

## Acceptance Criteria
- [ ] ADR unambiguous and covers both org-level and platform-level (Super Admin) access separately.

## Git Commit
Recommended commit:

`docs(architecture): record multi-tenancy and super-admin hierarchy decision`

## Verification
- Re-read the ADR and confirm every later task stays consistent with it.

## Next Task
`TASK 08`


--- FILE: V2 Prompt to build system/08-core-database-schema--organizations-users-roles-super-admins.md ---

# TASK 08 — Core Database Schema — Organizations, Users, Roles, Super Admins

## Objective
Create the foundational tables: organizations, profiles, org memberships/roles, and a separate super_admins table.

## Why This Task Exists
Every other table references these; the super_admins table is new versus the internal-only version and must be isolated from org-level roles.

## Dependencies
- TASK 07

## Current State
No schema exists yet on the fresh self-hosted Postgres instance.

## Files To Inspect
- documentation/adr/001-multi-tenancy.md

## Files To Create
- supabase/migrations/0001_organizations.sql
- supabase/migrations/0002_memberships_roles.sql
- supabase/migrations/0003_super_admins.sql

## Files To Modify


## Implementation Instructions
- organizations: id, name, slug, plan_tier, billing_status, created_at.
- profiles: id (fk auth.users), full_name, avatar_url.
- organization_members: organization_id, user_id, role (owner/admin/member/billing_manager).
- super_admins: id, user_id (fk auth.users), granted_by, granted_at — completely separate table, never joined through organization_members, so a compromised org role can never escalate to platform access.
- Add updated_at triggers reused by every future table.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- No RLS yet (TASK 11) — keep tables service-role-only until then.
- super_admins table itself must only ever be writable by an existing super admin or a one-time manual bootstrap (documented, not automated).

## Testing Requirements
- Seed one test organization, one owner, and one bootstrap super admin.

## Acceptance Criteria
- [ ] Migrations apply cleanly.
- [ ] super_admins is structurally isolated from organization_members.
- [ ] Seed data verifies both tiers work.

## Git Commit
Recommended commit:

`feat(db): add organizations, roles, and isolated super-admin schema`

## Verification
- Query super_admins and confirm it has no foreign-key path through organization_members.

## Next Task
`TASK 09`


--- FILE: V2 Prompt to build system/09-core-database-schema--crm-and-project-management-tables.md ---

# TASK 09 — Core Database Schema — CRM & Project Management Tables

## Objective
Create clients, projects, tasks, deliverables tables, tenant-scoped, including the new per-client communication_mode field.

## Why This Task Exists
Direct evolution of the original CRM/PM tables, now with the manual-vs-auto-sync distinction for existing vs new clients.

## Dependencies
- TASK 08

## Current State
Original single-tenant table definitions exist only in the source assignment doc; not yet implemented in this self-hosted schema.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- supabase/migrations/0004_crm_clients.sql
- supabase/migrations/0005_projects_tasks_deliverables.sql

## Files To Modify


## Implementation Instructions
- clients: id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes, communication_mode ('manual'|'connected', default 'manual'), created_at.
- projects: id, organization_id, client_id, title, description, type, brief_source, amount, currency, status (brief_received→in_progress→review→delivered→invoiced→paid, plus on_hold), priority, start_date, deadline, delivered_at, invoice_triggered, assigned_to, notes, created_at.
- tasks and deliverables tables as previously specified, organization_id denormalized for RLS.
- Add indexes on organization_id for every table.
- communication_mode is the field the unified inbox (TASK 40) and manual-log flow (TASK 41) both branch on.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- No cross-organization foreign keys permitted — enforced via trigger or app-layer check.

## Testing Requirements
- Seed clients in both communication_mode states across 2 test orgs.

## Acceptance Criteria
- [ ] Schema created with communication_mode field.
- [ ] Cross-org linkage blocked.

## Git Commit
Recommended commit:

`feat(db): add tenant-scoped CRM/PM schema with communication-mode field`

## Verification
- Attempt cross-org client/project linkage and confirm rejection.

## Next Task
`TASK 10`


--- FILE: V2 Prompt to build system/10-core-database-schema--communication-hub-and-billing.md ---

# TASK 10 — Core Database Schema — Communication Hub & Billing

## Objective
Create communication_channels, messages, subscription_plans, and organization_subscriptions tables.

## Why This Task Exists
Backbone for the unified inbox and for billing external organizations.

## Dependencies
- TASK 09

## Current State
No communication/billing tables exist yet.

## Files To Inspect
- supabase/migrations/0001..0005

## Files To Create
- supabase/migrations/0006_communication_hub.sql
- supabase/migrations/0007_billing_subscriptions.sql

## Files To Modify


## Implementation Instructions
- communication_channels: id, organization_id, provider (slack/whatsapp/email/discord/upwork), external_account_id, status, connected_at.
- messages: id, organization_id, channel_id, client_id (nullable), direction, sender, body, external_message_id, sent_at, read_at.
- subscription_plans: id, name, price_monthly, price_yearly, feature_limits (jsonb, including ai_features_enabled flag).
- organization_subscriptions: id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Never store raw provider credentials in plaintext (see TASK 62).

## Testing Requirements
- Seed 3 plans and one active subscription for the test org.

## Acceptance Criteria
- [ ] All tables created, organization-scoped, feature_limits shape documented.

## Git Commit
Recommended commit:

`feat(db): add communication hub and billing schema`

## Verification
- Confirm messages.client_id can be null (general inbox) and non-null (matched).

## Next Task
`TASK 11`


--- FILE: V2 Prompt to build system/11-authentication-self-hosted-gotrue--team-members.md ---

# TASK 11 — Authentication (Self-Hosted GoTrue) — Team Members

## Objective
Implement sign-up, login, and session handling against the self-hosted Auth service, resolving current org and role server-side.

## Why This Task Exists
No screen can be built before login and org-context resolution exist.

## Dependencies
- TASK 08

## Current State
Self-hosted GoTrue is live (TASK 02); no app-side auth flow implemented.

## Files To Inspect
- docker-compose.supabase.yml

## Files To Create
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- lib/auth/session.ts

## Files To Modify
- middleware.ts

## Implementation Instructions
- Configure email/password + magic link against the self-hosted GoTrue endpoint.
- On signup: create profile, then either create-new-org or accept-invite path.
- Server-side session helper resolving user, active organization, and role.
- Middleware protecting authenticated routes.

## UI Requirements
- Login/signup pages with error and loading states.
- Basic org switcher stub (refined TASK 21).

## Backend Requirements
- Session resolution usable in Server Components and Route Handlers.

## Database Requirements
- No schema change.

## API Requirements
- N/A — Auth SDK, no custom REST here.

## Security Requirements
- Session cookies httpOnly/secure; no service-role key ever reaches the client.

## Testing Requirements
- Test full signup→org→login→logout cycle against the self-hosted instance.

## Acceptance Criteria
- [ ] Working auth against self-hosted GoTrue with correct org-context resolution.

## Git Commit
Recommended commit:

`feat(auth): implement authentication against self-hosted Supabase Auth`

## Verification
- Manually test both signup paths.
- Confirm middleware blocks unauthenticated dashboard access.

## Next Task
`TASK 12`


--- FILE: V2 Prompt to build system/12-authorization--roles-and-row-level-security-policies.md ---

# TASK 12 — Authorization — Roles & Row-Level Security Policies

## Objective
Implement RLS policies on the self-hosted Postgres enforcing organization isolation and role-gated actions.

## Why This Task Exists
This is the actual security boundary of the platform.

## Dependencies
- TASK 11

## Current State
Tables exist without RLS beyond service-role-only placeholders.

## Files To Inspect
- supabase/migrations/0001..0007

## Files To Create
- supabase/migrations/0008_rls_policies.sql

## Files To Modify


## Implementation Instructions
- Enable RLS on every tenant-scoped table.
- Function is_org_member(org_id) and has_role(org_id, min_role) checking auth.uid() against organization_members.
- Apply SELECT/INSERT/UPDATE/DELETE policies per table.
- Explicitly test cross-org access is blocked for every table.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- This IS the security layer — every policy is a control, not a convenience filter.

## Testing Requirements
- Write SQL tests impersonating two orgs' users and confirm isolation.

## Acceptance Criteria
- [ ] No query from any non-super-admin role can read another org's rows.

## Git Commit
Recommended commit:

`feat(security): enforce row-level security for full tenant isolation`

## Verification
- Manually attempt cross-org SELECT via direct query and confirm rejection.

## Next Task
`TASK 13`


--- FILE: V2 Prompt to build system/13-organization-onboarding-and-tenant-provisioning.md ---

# TASK 13 — Organization Onboarding & Tenant Provisioning

## Objective
Build the guided first-run flow for any new organization signing up.

## Why This Task Exists
Must work for any generic agency, not assume Innoventix's specifics, since this now sells externally.

## Dependencies
- TASK 12

## Current State
Auth exists; no onboarding flow yet.

## Files To Inspect
- app/(auth)/signup/page.tsx

## Files To Create
- app/onboarding/page.tsx
- app/onboarding/steps/*.tsx

## Files To Modify


## Implementation Instructions
- Step 1: org details (name, industry_type — configurable, not hardcoded).
- Step 2: invite team (optional/skippable).
- Step 3: choose plan or start trial.
- Step 4: empty-state dashboard with 'add your first client' CTA.

## UI Requirements
- Multi-step wizard, progress indicator, skip/back nav.

## Backend Requirements
- Server actions creating org/memberships/invites/trial subscription.

## Database Requirements
- Add onboarding_completed, industry_type to organizations.

## API Requirements
- N/A

## Security Requirements
- Validate org name/slug uniqueness server-side; rate-limit invites.

## Testing Requirements
- Test onboarding as a brand-new, non-Innoventix organization.

## Acceptance Criteria
- [ ] New org can onboard end-to-end with zero Innoventix-specific assumptions leaking in.

## Git Commit
Recommended commit:

`feat(onboarding): add multi-step tenant onboarding flow`

## Verification
- Onboard a second fictitious org and confirm total isolation from Innoventix's org.

## Next Task
`TASK 14`


--- FILE: V2 Prompt to build system/14-subscription-plans-definition.md ---

# TASK 14 — Subscription Plans Definition

## Objective
Define concrete plan tiers, pricing, and feature gates including AI-feature and communication-channel limits.

## Why This Task Exists
Billing (TASK 15) and feature-gating throughout the app need explicit plan data to reference.

## Dependencies
- TASK 10
- TASK 13

## Current State
subscription_plans table exists but unseeded in business terms.

## Files To Inspect
- supabase/migrations/0007_billing_subscriptions.sql

## Files To Create
- documentation/pricing-plans.md
- supabase/seed/plans.sql
- lib/billing/plan-limits.ts

## Files To Modify


## Implementation Instructions
- Define 3 tiers (Starter/Pro/Agency) with feature_limits: max_team_members, max_clients, communication_channels_included, client_portal_enabled, ai_features_enabled, analytics_level.
- Write lib/billing/plan-limits.ts used everywhere a limit must be enforced.
- Record that Innoventix Hub is assigned a specific internal plan as data, not special-cased code.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Enforce all plan-limit checks server-side, never client-side only.

## Testing Requirements
- Unit test plan-limits.ts boundaries.

## Acceptance Criteria
- [ ] 3 plans seeded; plan-limits.ts correctly reports within/over-limit status for every gated feature.

## Git Commit
Recommended commit:

`feat(billing): define subscription tiers and feature-limit enforcement`

## Verification
- Simulate an org at its client limit and confirm blocking before it reaches the UI.

## Next Task
`TASK 15`


--- FILE: V2 Prompt to build system/15-stripe-billing-integration.md ---

# TASK 15 — Stripe Billing Integration

## Objective
Connect Stripe for real subscription billing — the one piece that necessarily stays external, since self-hosting payment processing is not advisable.

## Why This Task Exists
Turns the self-hosted platform into an actual billable SaaS product.

## Dependencies
- TASK 14

## Current State
No payment provider integrated.

## Files To Inspect
- lib/billing/plan-limits.ts

## Files To Create
- app/api/stripe/webhook/route.ts
- app/(dashboard)/settings/billing/page.tsx
- lib/stripe/client.ts

## Files To Modify
- supabase/migrations/0007_billing_subscriptions.sql (stripe_price_id columns)

## Implementation Instructions
- Create Stripe Products/Prices per tier (monthly/yearly).
- Stripe Checkout for new subscriptions, Customer Portal for self-serve changes.
- Webhook handler syncing organization_subscriptions.status from Stripe events, verified via signature, idempotent.
- Gate access on subscription status (past_due/canceled → restricted read-only, not data loss).

## UI Requirements
- Billing settings page: plan, usage vs limits, upgrade/downgrade CTA.

## Backend Requirements
- Signed webhook route reachable via the api/app subdomain configured in TASK 03.

## Database Requirements
- organization_subscriptions kept in sync with Stripe as source of truth.

## API Requirements
- POST /api/stripe/webhook — signature-verified.

## Security Requirements
- Verify Stripe signatures on every request.
- Restrict billing actions to owner/billing_manager.

## Testing Requirements
- Full Stripe test-mode lifecycle: subscribe→webhook→downgrade→cancel.

## Acceptance Criteria
- [ ] Org can subscribe/change/cancel, DB state matches Stripe at every step.

## Git Commit
Recommended commit:

`feat(billing): integrate Stripe subscriptions and webhook sync`

## Verification
- Run full Stripe test-mode lifecycle and confirm DB matches Stripe dashboard.

## Next Task
`TASK 16`


--- FILE: V2 Prompt to build system/16-super-admin--access-control-layer.md ---

# TASK 16 — Super Admin — Access Control Layer

## Objective
Implement the authorization layer distinguishing Super Admin (platform operator) access from all organization-level access.

## Why This Task Exists
Super Admin is new versus the original spec and must be built as a hard-isolated tier, not an org role with extra permissions.

## Dependencies
- TASK 12

## Current State
super_admins table exists (TASK 08); no access-control logic uses it yet.

## Files To Inspect
- supabase/migrations/0003_super_admins.sql

## Files To Create
- lib/auth/super-admin.ts
- supabase/migrations/0009_super_admin_rls.sql

## Files To Modify


## Implementation Instructions
- Write isSuperAdmin(userId) checked against the super_admins table only — never derived from any organization_members row.
- Add RLS policies allowing super admins read access across all organizations for platform-management purposes, while write access to tenant data stays restricted to the impersonation flow (TASK 19), not direct edits.
- Add a dedicated /super-admin route group with its own middleware guard, fully separate from the org dashboard's middleware.

## UI Requirements
- N/A

## Backend Requirements
- Middleware guard rejecting any non-super-admin request to /super-admin/*.

## Database Requirements
- RLS additions for cross-org SELECT limited to super admins.

## API Requirements
- N/A

## Security Requirements
- Treat this as the highest-privilege boundary in the system — audit every policy added here.

## Testing Requirements
- Test that an org owner (even of many orgs) cannot access /super-admin/* without an explicit super_admins row.

## Acceptance Criteria
- [ ] Only users in super_admins can reach /super-admin/* or read cross-org data.
- [ ] Org owner role alone never grants this.

## Git Commit
Recommended commit:

`feat(security): implement isolated super-admin access-control layer`

## Verification
- Attempt /super-admin access as a regular org owner and confirm rejection.

## Next Task
`TASK 17`


--- FILE: V2 Prompt to build system/17-super-admin--platform-dashboard.md ---

# TASK 17 — Super Admin — Platform Dashboard

## Objective
Build the Super Admin landing dashboard: platform-wide metrics across all organizations.

## Why This Task Exists
Gives you (DEVMARK) the operator's view of the whole business, not any single tenant's view.

## Dependencies
- TASK 16

## Current State
Access control exists; no dashboard UI yet.

## Files To Inspect
- lib/auth/super-admin.ts

## Files To Create
- app/super-admin/dashboard/page.tsx
- components/super-admin/*.tsx

## Files To Modify


## Implementation Instructions
- Metrics: total organizations, active vs trial vs churned, total MRR (from Stripe/org_subscriptions), total clients/projects across the platform, platform-wide message volume.
- Recent signups and recent cancellations lists.

## UI Requirements
- Dashboard grid distinct in styling from the org-level dashboard (TASK 22) so it's never confused for it.

## Backend Requirements
- Server Components running cross-org aggregate queries under the super-admin RLS grant.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Confirm every aggregate query here explicitly requires the super-admin check — never reachable by a mis-scoped org query.

## Testing Requirements
- Test metrics accuracy against manual cross-org queries.

## Acceptance Criteria
- [ ] Dashboard shows accurate platform-wide metrics, reachable only by super admins.

## Git Commit
Recommended commit:

`feat(super-admin): build platform-wide operator dashboard`

## Verification
- Cross-check MRR figure against Stripe's own dashboard.

## Next Task
`TASK 18`


--- FILE: V2 Prompt to build system/18-super-admin--organization-management.md ---

# TASK 18 — Super Admin — Organization Management

## Objective
Build the screen for managing all tenant organizations: view, suspend/resume, override plan, view usage.

## Why This Task Exists
The operational tool for actually running the platform as a business.

## Dependencies
- TASK 17

## Current State
Platform dashboard exists; no per-org management screen yet.

## Files To Inspect
- app/super-admin/dashboard/page.tsx

## Files To Create
- app/super-admin/organizations/page.tsx
- app/super-admin/organizations/[id]/page.tsx

## Files To Modify


## Implementation Instructions
- List all organizations with plan, status, MRR, created date, searchable/filterable.
- Detail view per org: usage vs plan limits, billing status, team member list (read-only), suspend/resume action.
- Manual plan override (e.g. comping Innoventix's own account, or granting a trial extension) recorded with a reason, tied into the audit log (TASK 63).

## UI Requirements
- List + detail layout consistent with TASK 17's styling.

## Backend Requirements
- Server actions for suspend/resume/plan-override, super-admin-gated and audit-logged.

## Database Requirements
- No schema change — reads/writes organizations, organization_subscriptions.

## API Requirements
- N/A

## Security Requirements
- Every mutating action here must call the audit-log helper (TASK 63) once it exists — stub the call now, wire fully later.

## Testing Requirements
- Test suspend correctly restricts that org's users' access; resume restores it.

## Acceptance Criteria
- [ ] Any organization can be viewed, suspended, resumed, and plan-overridden by a super admin, with every action recorded.

## Git Commit
Recommended commit:

`feat(super-admin): build organization management screen`

## Verification
- Suspend a test org and confirm its users are correctly blocked from the app until resumed.

## Next Task
`TASK 19`


--- FILE: V2 Prompt to build system/19-super-admin--impersonation-and-support-access.md ---

# TASK 19 — Super Admin — Impersonation & Support Access

## Objective
Allow a super admin to securely view an organization's data as read-only support access, without ever exposing raw credentials.

## Why This Task Exists
Necessary for support/debugging across external customer organizations without weakening the RLS boundary elsewhere.

## Dependencies
- TASK 18

## Current State
No impersonation mechanism exists.

## Files To Inspect
- lib/auth/super-admin.ts

## Files To Create
- app/api/super-admin/impersonate/route.ts
- lib/auth/impersonation.ts

## Files To Modify


## Implementation Instructions
- Implement a short-lived, read-only impersonation session (never a real login as the org's user — a scoped, time-boxed viewing context instead).
- Every impersonation session start/end is written to the audit log (TASK 63) with the super admin's identity and target org.
- Visible banner in the UI at all times during an impersonation session ('Viewing as [Org] — Support Mode') so it's never silently invisible to anyone reviewing screen recordings/logs.

## UI Requirements
- Persistent support-mode banner across all impersonated views.

## Backend Requirements
- Time-boxed session token scoped read-only, expiring automatically.

## Database Requirements
- No schema change beyond the audit log dependency.

## API Requirements
- POST /api/super-admin/impersonate — super-admin-gated, audit-logged.

## Security Requirements
- Read-only enforced at the RLS level during impersonation, not just hidden in the UI — a super admin in support mode must not be able to mutate tenant data through this path.

## Testing Requirements
- Test that write attempts during impersonation are rejected at the database level, not just hidden client-side.

## Acceptance Criteria
- [ ] Impersonation is read-only, time-boxed, always visibly bannered, and fully audit-logged.

## Git Commit
Recommended commit:

`feat(super-admin): add read-only, audited impersonation for support`

## Verification
- Attempt a write action while impersonating and confirm it is rejected server-side, not just absent from the UI.

## Next Task
`TASK 20`


--- FILE: V2 Prompt to build system/20-super-admin--platform-settings-and-global-configuration.md ---

# TASK 20 — Super Admin — Platform Settings & Global Configuration

## Objective
Build the settings screen for platform-wide configuration: plan definitions, feature flags, global integration defaults.

## Why This Task Exists
Centralizes control that shouldn't live in code (e.g. changing a plan's price or feature limits without a deploy).

## Dependencies
- TASK 18

## Current State
Plans/feature_limits currently only editable via direct DB/seed changes.

## Files To Inspect
- supabase/seed/plans.sql
- lib/billing/plan-limits.ts

## Files To Create
- app/super-admin/settings/page.tsx

## Files To Modify


## Implementation Instructions
- Editable UI for subscription_plans (price, feature_limits json) so plan changes don't require a redeploy.
- Global feature flags (e.g. AI features platform-wide kill switch, new-provider rollout flags).
- Global default settings for new organizations at signup.

## UI Requirements
- Form-based settings screen with JSON editor for feature_limits, validated against a schema before save.

## Backend Requirements
- Server actions gated to super admins only.

## Database Requirements
- No schema change — edits subscription_plans rows.

## API Requirements
- N/A

## Security Requirements
- Validate feature_limits JSON shape server-side before persisting to prevent malformed plan data from breaking gating logic.

## Testing Requirements
- Test editing a plan's limits and confirm plan-limits.ts picks up the change without a redeploy.

## Acceptance Criteria
- [ ] Platform-wide settings editable by super admins without code changes; changes take effect immediately.

## Git Commit
Recommended commit:

`feat(super-admin): add platform settings and global configuration UI`

## Verification
- Change a plan's client limit live and confirm an org near that limit is immediately re-evaluated correctly.

## Next Task
`TASK 21`


--- FILE: V2 Prompt to build system/21-application-shell-navigation-and-organization-switcher.md ---

# TASK 21 — Application Shell, Navigation & Organization Switcher

## Objective
Build the persistent org-level app shell (sidebar/topbar) and org switcher, distinct from the Super Admin shell.

## Why This Task Exists
Every org-facing screen from here lives inside this shell.

## Dependencies
- TASK 11
- TASK 13

## Current State
Only bare auth/onboarding pages exist.

## Files To Inspect
- app/(auth)/login/page.tsx

## Files To Create
- app/(dashboard)/layout.tsx
- components/shell/Sidebar.tsx
- components/shell/Topbar.tsx
- components/shell/OrgSwitcher.tsx

## Files To Modify


## Implementation Instructions
- Sidebar sections: Dashboard, Clients (CRM), Projects, Tasks, Inbox, Team, Analytics, Settings.
- Topbar with org switcher, user menu, notification bell (stub, wired TASK 53).
- Persist active organization in a cookie; mobile collapses to hamburger/drawer nav.

## UI Requirements
- Responsive shell with active-route highlighting.
- Loading skeleton while session resolves.

## Backend Requirements
- Server-side org-context resolution reused from TASK 11.

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Switching orgs fully re-scopes all subsequent queries — no stale org_id client-side.

## Testing Requirements
- Test navigation and org-switch data re-scoping.

## Acceptance Criteria
- [ ] Shell renders consistently; org switch correctly changes visible data everywhere.

## Git Commit
Recommended commit:

`feat(ui): build application shell, navigation, and organization switcher`

## Verification
- Switch organizations and confirm the dashboard reloads with the new org's data.

## Next Task
`TASK 22`


--- FILE: V2 Prompt to build system/22-main-dashboard-overview.md ---

# TASK 22 — Main Dashboard Overview

## Objective
Build the org-level landing dashboard.

## Why This Task Exists
First thing any team member sees after login.

## Dependencies
- TASK 21
- TASK 09

## Current State
Shell exists; no data widgets built.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (dashboard requirements)

## Files To Create
- app/(dashboard)/dashboard/page.tsx
- components/dashboard/*.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects, pending tasks, overdue projects (red), revenue this month, unread inbox count.
- Quick-add: New Client, New Project.
- Recent activity feed.

## UI Requirements
- Card grid, responsive, empty state for brand-new orgs, loading skeletons.

## Backend Requirements
- Server Components with RLS-scoped aggregate queries.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Test dashboard for orgs with data vs a brand-new empty org.

## Acceptance Criteria
- [ ] All widgets show accurate, org-scoped counts; empty state renders correctly.

## Git Commit
Recommended commit:

`feat(dashboard): build main overview dashboard with live widgets`

## Verification
- Compare widget counts against manual DB queries for the same org.

## Next Task
`TASK 23`


--- FILE: V2 Prompt to build system/23-organization-settings-and-team-management.md ---

# TASK 23 — Organization Settings & Team Management

## Objective
Build settings for org profile, team members, roles, and invitations.

## Why This Task Exists
Self-serve team management for any organization, not just Ubaid manually managed via SQL.

## Dependencies
- TASK 21
- TASK 12

## Current State
No settings UI exists.

## Files To Inspect
- supabase/migrations/0002_memberships_roles.sql

## Files To Create
- app/(dashboard)/settings/organization/page.tsx
- app/(dashboard)/settings/team/page.tsx

## Files To Modify


## Implementation Instructions
- Org profile form: name, industry_type, logo, timezone.
- Team list with role/status; invite flow (email+role); role change/removal restricted to owner/admin.

## UI Requirements
- Tabs: Organization, Team, Billing, Integrations (later tasks).

## Backend Requirements
- Server actions, all role-gated server-side.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Only owner/admin can invite/change-roles/remove; last owner cannot be removed.

## Testing Requirements
- Test invite→accept→role-change→removal lifecycle.

## Acceptance Criteria
- [ ] Team management works end-to-end; non-admins blocked both in UI and server-side.

## Git Commit
Recommended commit:

`feat(settings): add organization profile and team management`

## Verification
- Attempt a role-change as a 'member' role and confirm server-side rejection.

## Next Task
`TASK 24`


--- FILE: V2 Prompt to build system/24-crm--clients-list-and-management.md ---

# TASK 24 — CRM — Clients List & Management

## Objective
Build the client list with search/filter/creation, including the new manual-vs-connected communication_mode selector.

## Why This Task Exists
Anchor CRM screen; now surfaces the manual/auto-sync choice per client explicitly.

## Dependencies
- TASK 21
- TASK 09

## Current State
clients table + RLS exist; no UI yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/clients/page.tsx
- app/(dashboard)/clients/new/page.tsx

## Files To Modify


## Implementation Instructions
- List: table/card toggle, columns include a Communication Mode badge (Manual/Connected).
- Search/filter by name, status, platform, country, communication_mode.
- New-client form: existing fields plus a Communication Mode choice — Manual (team logs conversations by hand, matches existing-client workflow) or Connected (auto-syncs from linked channels once set up in TASK 41).
- Enforce plan client-limit (TASK 14) before insert.

## UI Requirements
- Responsive list, filter bar, empty state, inline validation.

## Backend Requirements
- Server actions for create/list/filter.

## Database Requirements
- No schema change — uses TASK 09's communication_mode field.

## API Requirements
- N/A

## Security Requirements
- Validate/sanitize inputs server-side; enforce plan limit with clear upgrade messaging.

## Testing Requirements
- Test create/search/filter, including filtering by communication_mode.

## Acceptance Criteria
- [ ] Clients listed/searched/filtered/created correctly, including by communication mode; plan limits enforced.

## Git Commit
Recommended commit:

`feat(crm): build client list with communication-mode selection`

## Verification
- Create a Manual client and a Connected client and confirm both display correctly in the list.

## Next Task
`TASK 25`


--- FILE: V2 Prompt to build system/25-crm--client-detail-page.md ---

# TASK 25 — CRM — Client Detail Page

## Objective
Build the single-client 360-degree view: projects, communication history, notes.

## Why This Task Exists
The CRM core view.

## Dependencies
- TASK 24

## Current State
Client list exists; no detail page.

## Files To Inspect
- components/clients/*.tsx

## Files To Create
- app/(dashboard)/clients/[id]/page.tsx

## Files To Modify


## Implementation Instructions
- Header: name, company, status, communication_mode badge, quick actions.
- Tabs: Overview, Projects, Communication (TASK 27), Activity Log.
- Editable notes with autosave.

## UI Requirements
- Tabbed layout, mobile tabs collapse to select.
- Not-found/cross-tenant 404 handling.

## Backend Requirements
- Server Component aggregating client + projects + messages, RLS-scoped.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Cross-org client id access returns 404, never leaks data.

## Testing Requirements
- Test detail page with clients having many/zero projects and messages.

## Acceptance Criteria
- [ ] Client detail aggregates correctly; cross-tenant access denied.

## Git Commit
Recommended commit:

`feat(crm): build client detail page with tabs`

## Verification
- Attempt to load another org's client by id directly and confirm access denied.

## Next Task
`TASK 26`


--- FILE: V2 Prompt to build system/26-crm--leads--sales-pipeline-kanban.md ---

# TASK 26 — CRM — Leads / Sales Pipeline (Kanban)

## Objective
Add a lightweight sales-pipeline kanban for tracking prospects before they become active clients.

## Why This Task Exists
The defining CRM capability beyond plain project tracking.

## Dependencies
- TASK 24

## Current State
clients only track active/paused/completed status; no lead stage.

## Files To Inspect
- supabase/migrations/0004_crm_clients.sql

## Files To Create
- supabase/migrations/0010_leads_pipeline.sql
- app/(dashboard)/leads/page.tsx

## Files To Modify


## Implementation Instructions
- Add pipeline_stage (new/contacted/qualified/proposal_sent/won/lost) and lost_reason to clients.
- Kanban with drag-and-drop between stages; won converts to active client automatically.

## UI Requirements
- Kanban columns, card shows name/company/value estimate; lost-reason modal.

## Backend Requirements
- Server action validating allowed stage transitions server-side.

## Database Requirements
- pipeline_stage enum + lost_reason columns.

## API Requirements
- N/A

## Security Requirements
- Stage transitions respect org RLS.

## Testing Requirements
- Test drag through every stage; test won-conversion.

## Acceptance Criteria
- [ ] Pipeline persists correctly; winning a lead activates the client record.

## Git Commit
Recommended commit:

`feat(crm): add sales pipeline kanban for lead tracking`

## Verification
- Drag a card through all stages and confirm persistence after reload.

## Next Task
`TASK 27`


--- FILE: V2 Prompt to build system/27-crm--client-communication-log.md ---

# TASK 27 — CRM — Client Communication Log

## Objective
Surface a chronological, filterable per-client communication history pulling from the unified inbox.

## Why This Task Exists
Ties CRM to the Communication Hub — without it 'CRM' is just a database, not the all-in-one platform requested.

## Dependencies
- TASK 25
- TASK 10

## Current State
messages table exists; client detail exists without a real communication tab yet.

## Files To Inspect
- supabase/migrations/0006_communication_hub.sql

## Files To Create
- components/clients/CommunicationTimeline.tsx

## Files To Modify
- app/(dashboard)/clients/[id]/page.tsx

## Implementation Instructions
- Query messages filtered by client_id, chronological, grouped by day, channel icon per message.
- Manual-log quick-add for Manual-mode clients or off-channel events (e.g. a phone call).

## UI Requirements
- Chat-style timeline, channel filter chips, manual-log form.

## Backend Requirements
- Server action for manual logging; read path reused from TASK 42.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Manual log entries respect organization/client scoping.

## Testing Requirements
- Test timeline with mixed-channel and manual entries.

## Acceptance Criteria
- [ ] Communication history renders correctly across channels and manual entries for both client modes.

## Git Commit
Recommended commit:

`feat(crm): add per-client communication timeline`

## Verification
- Log a manual entry for a Manual-mode client and confirm correct chronological placement.

## Next Task
`TASK 28`


--- FILE: V2 Prompt to build system/28-crm--tags-segmentation-and-advanced-search.md ---

# TASK 28 — CRM — Tags, Segmentation & Advanced Search

## Objective
Add tagging and segment filtering beyond fixed status fields.

## Why This Task Exists
Rounds out CRM flexibility.

## Dependencies
- TASK 24

## Current State
Clients only filterable by fixed fields.

## Files To Inspect
- app/(dashboard)/clients/page.tsx

## Files To Create
- supabase/migrations/0011_client_tags.sql
- components/clients/TagPicker.tsx

## Files To Modify
- app/(dashboard)/clients/page.tsx

## Implementation Instructions
- tags (org-scoped) and client_tags join table.
- Tag picker with create-on-the-fly.
- Multi-tag AND/OR filtering; saved segments.

## UI Requirements
- Tag chips, tag management in settings.

## Backend Requirements
- Server actions for tag CRUD.

## Database Requirements
- tags, client_tags tables.

## API Requirements
- N/A

## Security Requirements
- Tag CRUD respects org RLS.

## Testing Requirements
- Test creation, assignment, multi-tag filtering.

## Acceptance Criteria
- [ ] Clients taggable and filterable by tag combinations reliably.

## Git Commit
Recommended commit:

`feat(crm): add client tagging and segmentation`

## Verification
- Create overlapping filters and confirm AND/OR logic returns expected results.

## Next Task
`TASK 29`


--- FILE: V2 Prompt to build system/29-projects--list-and-kanban-board.md ---

# TASK 29 — Projects — List & Kanban Board

## Objective
Build kanban and list views for projects, matching the original spec's 7-stage flow and color coding.

## Why This Task Exists
Core project-tracking screen.

## Dependencies
- TASK 21
- TASK 09

## Current State
projects table + RLS exist; no UI yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/projects/page.tsx
- components/projects/KanbanBoard.tsx
- components/projects/ProjectListView.tsx

## Files To Modify


## Implementation Instructions
- Kanban columns matching the exact 7-stage colors/icons.
- List view with status/client/type/assigned_to/priority filters.
- Drag-and-drop status change via a shared server action reused by the detail page and automation triggers.

## UI Requirements
- Kanban/list toggle, optimistic drag with rollback, mobile-collapsible filters.

## Backend Requirements
- Shared updateProjectStatus server action.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Status-change action re-validates org/client ownership server-side.

## Testing Requirements
- Test drag across every status; test filter combinations.

## Acceptance Criteria
- [ ] Both views fully functional; colors match spec exactly.

## Git Commit
Recommended commit:

`feat(projects): build kanban and list views with drag-and-drop status flow`

## Verification
- Drag a project through the full flow and confirm delivered_at/invoice_triggered populate correctly.

## Next Task
`TASK 30`


--- FILE: V2 Prompt to build system/30-projects--detail-page.md ---

# TASK 30 — Projects — Detail Page

## Objective
Build the single-project view: info, tasks, deliverables, timeline, status control.

## Why This Task Exists
Operational hub of a project.

## Dependencies
- TASK 29

## Current State
Kanban/list exist; no detail page.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/projects/[id]/page.tsx
- components/projects/ProjectTimeline.tsx

## Files To Modify


## Implementation Instructions
- Header with status change + deadline countdown.
- Embedded task list and deliverables sections.
- Activity/timeline log recording every status change and task completion.
- Notes field.

## UI Requirements
- Sectioned layout, Delivered-transition confirmation modal (automation trigger warning), 404 handling.

## Backend Requirements
- Server Component aggregating project+tasks+deliverables+activity log.

## Database Requirements
- Add project_activity_log table.

## API Requirements
- N/A

## Security Requirements
- Cross-tenant project id access returns 404.

## Testing Requirements
- Test full render with a project having tasks/deliverables/history.

## Acceptance Criteria
- [ ] Detail page accurate and complete; Delivered transition shows the automation confirmation.

## Git Commit
Recommended commit:

`feat(projects): build project detail page with tasks, deliverables, and activity log`

## Verification
- Change status to Delivered and confirm an activity_log row is created.

## Next Task
`TASK 31`


--- FILE: V2 Prompt to build system/31-tasks-module.md ---

# TASK 31 — Tasks Module

## Objective
Build standalone task list, creation, completion, and a global My Tasks / All Tasks view.

## Why This Task Exists
Matches the original /tasks requirement.

## Dependencies
- TASK 30

## Current State
Embedded task list exists on project detail; no standalone module.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/tasks/page.tsx
- components/tasks/TaskList.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- My Tasks / All Tasks toggle; filter by project/status/due-date range.
- Quick-complete with optimistic update; inline quick-add.

## UI Requirements
- List with checkbox-complete, overdue flagged red, empty state.

## Backend Requirements
- Server actions reused from project detail.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Reassignment restricted to org members, validated server-side.

## Testing Requirements
- Test My Tasks vs All Tasks scoping; overdue flagging.

## Acceptance Criteria
- [ ] Both views correct and consistent with the embedded project-detail task list.

## Git Commit
Recommended commit:

`feat(tasks): build standalone task module with My Tasks/All Tasks views`

## Verification
- Complete a task globally and confirm it reflects instantly on project detail.

## Next Task
`TASK 32`


--- FILE: V2 Prompt to build system/32-deliverables-module.md ---

# TASK 32 — Deliverables Module

## Objective
Build deliverable upload/linking, review status, and client feedback capture.

## Why This Task Exists
Feeds directly into the client-portal approval flow (TASK 56).

## Dependencies
- TASK 30

## Current State
deliverables table exists; only referenced inline so far.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- components/deliverables/DeliverableCard.tsx
- components/deliverables/UploadForm.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Support file upload (self-hosted Supabase Storage) or external drive_link.
- Status: pending/approved/revision_required with client_feedback.

## UI Requirements
- Upload widget with progress, status badges, feedback display.

## Backend Requirements
- Server action for upload+record creation, and status update.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Restrict upload size/type; confirm self-hosted Storage bucket policies match org scoping (not publicly listable across orgs).

## Testing Requirements
- Test upload flow and link-only flow; test status transitions.

## Acceptance Criteria
- [ ] Deliverables uploadable/linkable, status accurately reflects review outcome.

## Git Commit
Recommended commit:

`feat(projects): build deliverables upload and review status tracking`

## Verification
- Attempt to access another org's uploaded file URL directly and confirm it is not publicly reachable.

## Next Task
`TASK 33`


--- FILE: V2 Prompt to build system/33-project-templates.md ---

# TASK 33 — Project Templates

## Objective
Allow saving a project's task structure as a reusable template.

## Why This Task Exists
Innoventix's recurring project types (UGC/Voice Agents/Automation) and other agencies' equivalents benefit directly.

## Dependencies
- TASK 31

## Current State
No template concept exists.

## Files To Inspect
- app/(dashboard)/projects/new/page.tsx

## Files To Create
- supabase/migrations/0012_project_templates.sql
- app/(dashboard)/settings/templates/page.tsx

## Files To Modify
- app/(dashboard)/projects/new/page.tsx

## Implementation Instructions
- project_templates and project_template_tasks tables, org-scoped.
- Save-as-template action; template picker on new-project form.

## UI Requirements
- Template management page; picker on new-project form.

## Backend Requirements
- Server actions for template CRUD and templated creation.

## Database Requirements
- project_templates, project_template_tasks tables.

## API Requirements
- N/A

## Security Requirements
- Template CRUD respects org RLS.

## Testing Requirements
- Test saving and applying a template.

## Acceptance Criteria
- [ ] Templates create/edit/apply correctly, pre-populating tasks with correct due-date offsets.

## Git Commit
Recommended commit:

`feat(projects): add reusable project templates`

## Verification
- Create a project from a template and confirm all default tasks appear correctly.

## Next Task
`TASK 34`


--- FILE: V2 Prompt to build system/34-team-workload-view.md ---

# TASK 34 — Team Workload View

## Objective
Build a per-member workload view.

## Why This Task Exists
Matches the original /team requirement.

## Dependencies
- TASK 31
- TASK 23

## Current State
Team management exists; no workload visualization.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/team/page.tsx
- components/team/WorkloadCard.tsx

## Files To Modify


## Implementation Instructions
- Per-member active task/project/overdue counts; simple workload visualization.
- Click member to filter task list (reuse TASK 31 component).

## UI Requirements
- Grid of member cards; empty state for solo-founder orgs.

## Backend Requirements
- Server Component aggregating counts per member.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Standard RLS applies.

## Testing Requirements
- Test with a 1-member org and a multi-member org.

## Acceptance Criteria
- [ ] Workload accurately reflects each member's load.

## Git Commit
Recommended commit:

`feat(team): build team workload overview`

## Verification
- Compare displayed counts against manual queries per member.

## Next Task
`TASK 35`


--- FILE: V2 Prompt to build system/35-status-tag-system--shared-component-library.md ---

# TASK 35 — Status Tag System — Shared Component Library

## Objective
Extract status/priority tag styling into one reusable component used everywhere.

## Why This Task Exists
Prevents drift across kanban, list, detail, and client-portal screens.

## Dependencies
- TASK 29

## Current State
Status colors used ad-hoc in TASK 29's kanban only.

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
- Implement the exact 7-status table as a single source of truth constant.
- Build <StatusBadge/> consumed everywhere instead of per-screen color logic.

## UI Requirements
- Consistent badges app-wide, including the future client portal.

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Visually diff badges across kanban/list/detail for consistency.

## Acceptance Criteria
- [ ] Every status-rendering screen uses the shared component with zero visual drift.

## Git Commit
Recommended commit:

`refactor(ui): extract shared status badge component and constants`

## Verification
- Grep the codebase to confirm no duplicated status color/icon mapping remains.

## Next Task
`TASK 36`


--- FILE: V2 Prompt to build system/36-communication-hub--architecture-and-unified-inbox-data-layer.md ---

# TASK 36 — Communication Hub — Architecture & Unified Inbox Data Layer

## Objective
Implement the ingestion/query layer every channel integration writes into and the UI reads from.

## Why This Task Exists
Backbone of the 'all communication from one platform' requirement.

## Dependencies
- TASK 10
- TASK 23

## Current State
messages/communication_channels tables exist; no ingestion/read layer yet.

## Files To Inspect
- supabase/migrations/0006_communication_hub.sql

## Files To Create
- documentation/adr/002-communication-hub.md
- lib/inbox/ingest.ts
- lib/inbox/query.ts

## Files To Modify


## Implementation Instructions
- ingestMessage(orgId, channelId, payload) normalizing provider-specific payloads into the messages schema, called by every provider webhook (TASKS 37-40).
- Auto-match inbound message to an existing client by phone/email; leave client_id null for manual triage if no match.
- lib/inbox/query.ts filters by channel/client/read-unread/org, used by the global inbox (TASK 41) and client timeline (TASK 27).

## UI Requirements
- N/A — data layer only.

## Backend Requirements
- Core backend module of the hub; no HTTP routes here.

## Database Requirements
- No schema change.

## API Requirements
- N/A here — added per provider in TASKS 37-40.

## Security Requirements
- Ingestion always resolves organization_id from the channel record, never a client-supplied org id.

## Testing Requirements
- Unit test ingestMessage with mock payloads per future provider shape; test client-matching edge cases.

## Acceptance Criteria
- [ ] ingestMessage normalizes/stores correctly; auto-matching works for clear matches and safely no-ops for ambiguous ones.

## Git Commit
Recommended commit:

`feat(inbox): build unified communication hub data layer`

## Verification
- Feed synthetic payloads for 3 providers through ingestMessage and confirm consistent row shape.

## Next Task
`TASK 37`


--- FILE: V2 Prompt to build system/37-communication-hub--slack-integration.md ---

# TASK 37 — Communication Hub — Slack Integration

## Objective
Connect an organization's own Slack workspace for two-way conversation, distinct from the internal Slack automation alerts.

## Why This Task Exists
Extends existing internal Slack use into a client/team conversation channel routed through the hub.

## Dependencies
- TASK 36

## Current State
No provider integrations exist.

## Files To Inspect
- lib/inbox/ingest.ts

## Files To Create
- app/api/webhooks/slack/route.ts
- app/(dashboard)/settings/integrations/slack/page.tsx
- lib/providers/slack.ts

## Files To Modify


## Implementation Instructions
- Slack OAuth per organization, tokens stored via the secure pattern from TASK 62.
- Slack Events API webhook calling ingestMessage; outbound send via Slack Web API from the inbox compose box (TASK 41).
- Keep this two-way conversation channel architecturally separate from the automation notification flows (TASKS 50-52).

## UI Requirements
- Integrations settings page: connect/disconnect, status.

## Backend Requirements
- Webhook route verifying Slack signing secret.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/webhooks/slack — signature-verified, responds within Slack's timeout.

## Security Requirements
- Verify Slack signatures on every call; store tokens encrypted, never logged.

## Testing Requirements
- Test OAuth connect/disconnect; inbound and outbound message delivery.

## Acceptance Criteria
- [ ] Org can connect Slack, receive into unified inbox, and reply from the platform.

## Git Commit
Recommended commit:

`feat(inbox): add Slack channel integration`

## Verification
- Send a real test message in a connected workspace and confirm inbox ingestion within seconds.

## Next Task
`TASK 38`


--- FILE: V2 Prompt to build system/38-communication-hub--whatsapp-integration.md ---

# TASK 38 — Communication Hub — WhatsApp Integration

## Objective
Connect WhatsApp Business Cloud API per organization phone number into the unified inbox.

## Why This Task Exists
WhatsApp is an explicit client platform in the original spec — closes the loop for those conversations.

## Dependencies
- TASK 36

## Current State
No WhatsApp integration exists.

## Files To Inspect
- lib/providers/slack.ts

## Files To Create
- app/api/webhooks/whatsapp/route.ts
- app/(dashboard)/settings/integrations/whatsapp/page.tsx
- lib/providers/whatsapp.ts

## Files To Modify


## Implementation Instructions
- Webhook verification handshake and inbound handling into ingestMessage.
- Outbound respecting the 24-hour session window and template-message rules.
- Auto-match sender phone number to existing client.

## UI Requirements
- Integrations settings page for number connection/status.

## Backend Requirements
- Webhook with verification token check; session-window enforcement.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/webhooks/whatsapp.

## Security Requirements
- Verify webhook payload authenticity; never expose the access token client-side.

## Testing Requirements
- Test inbound flow and outbound within/outside the session window.

## Acceptance Criteria
- [ ] WhatsApp conversations appear in the unified inbox and can be replied to within platform rules.

## Git Commit
Recommended commit:

`feat(inbox): add WhatsApp Business integration`

## Verification
- Send a test WhatsApp message to the connected number and confirm ingestion and correct client match.

## Next Task
`TASK 39`


--- FILE: V2 Prompt to build system/39-communication-hub--email-integration.md ---

# TASK 39 — Communication Hub — Email Integration

## Objective
Connect an inbound-parse email channel so email-based client communication is captured too.

## Why This Task Exists
Closes email into the same unified system as chat channels.

## Dependencies
- TASK 36

## Current State
No email channel integration exists.

## Files To Inspect
- lib/providers/whatsapp.ts

## Files To Create
- app/api/webhooks/email/route.ts
- app/(dashboard)/settings/integrations/email/page.tsx
- lib/providers/email.ts

## Files To Modify


## Implementation Instructions
- Org-specific inbound address forwarding to an inbound-parse webhook.
- Parse sender/subject/body, call ingestMessage, auto-match sender email to client.
- Outbound replies via transactional send API, threaded where possible.

## UI Requirements
- Integrations settings page showing the org's dedicated inbound address.

## Backend Requirements
- Webhook parsing provider-specific inbound format.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/webhooks/email.

## Security Requirements
- Validate inbound requests are genuinely from the configured provider.

## Testing Requirements
- Test inbound ingestion/matching and outbound threading.

## Acceptance Criteria
- [ ] Email conversations flow into the unified inbox alongside Slack/WhatsApp.

## Git Commit
Recommended commit:

`feat(inbox): add email channel integration`

## Verification
- Send a real test email to the org's inbound address and confirm correct ingestion and match.

## Next Task
`TASK 40`


--- FILE: V2 Prompt to build system/40-communication-hub--discord-and-upwork-channel-stubs.md ---

# TASK 40 — Communication Hub — Discord & Upwork Channel Stubs

## Objective
Add Discord (full) and Upwork (manual-log) integrations following the same provider contract.

## Why This Task Exists
Keeps the provider architecture genuinely pluggable, covering every platform named in the original spec.

## Dependencies
- TASK 36
- TASK 37

## Current State
Provider pattern established; Discord/Upwork not yet implemented.

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
- Discord bot webhook following the ingestMessage contract, full send/receive.
- Upwork: manual message logging only (documented as a future full-API enhancement, not launch-blocking).
- Integrations list page reflecting accurate connected/manual-only states per channel.

## UI Requirements
- Integrations list page with accurate per-provider status.

## Backend Requirements
- Webhook route for Discord.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/webhooks/discord.

## Security Requirements
- Same webhook-verification discipline as prior provider tasks.

## Testing Requirements
- Test Discord inbound/outbound; confirm Upwork manual-log path works without live API access.

## Acceptance Criteria
- [ ] All 5 platforms from the original spec are represented, either fully live or clearly manual-log-only.

## Git Commit
Recommended commit:

`feat(inbox): add Discord integration and Upwork manual-log support`

## Verification
- Confirm the integrations page accurately reflects each channel's real capability level.

## Next Task
`TASK 41`


--- FILE: V2 Prompt to build system/41-communication-hub--unified-inbox-ui.md ---

# TASK 41 — Communication Hub — Unified Inbox UI

## Objective
Build the inbox screen where team members read/respond across every connected channel.

## Why This Task Exists
The user-facing payoff of the whole hub.

## Dependencies
- TASK 36
- TASK 37
- TASK 38
- TASK 39

## Current State
Data layer and provider connections exist; no inbox UI yet.

## Files To Inspect
- lib/inbox/query.ts

## Files To Create
- app/(dashboard)/inbox/page.tsx
- components/inbox/ConversationList.tsx
- components/inbox/MessageThread.tsx
- components/inbox/ComposeBox.tsx

## Files To Modify


## Implementation Instructions
- Two-pane layout: conversation list (grouped by client, or raw sender if unmatched) + thread view.
- Filter by channel, read/unread, assigned-to-me.
- Compose box routes send through the correct provider based on the conversation's channel.
- Manual triage: link an unmatched conversation to an existing client, which also flips that client toward 'connected' visibility going forward.

## UI Requirements
- Two-pane responsive layout, unread badge feeding the topbar bell, empty state pointing to Integrations settings when no channels connected.

## Backend Requirements
- Server actions for send/mark-read/link-to-client.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Validate channel-org ownership server-side on every send.

## Testing Requirements
- Test cross-channel inbox rendering and manual client-linking.

## Acceptance Criteria
- [ ] Inbox aggregates all channels, supports reply, unread state accurate.

## Git Commit
Recommended commit:

`feat(inbox): build unified multi-channel inbox UI`

## Verification
- Send messages via 3 channels and confirm all render correctly with correct channel icons in one inbox.

## Next Task
`TASK 42`


--- FILE: V2 Prompt to build system/42-client-communication-mode--manual-vs-connected-workflow.md ---

# TASK 42 — Client Communication Mode — Manual vs Connected Workflow

## Objective
Implement the explicit behavioral split: existing clients stay on manual logging, new clients get full auto-sync into the unified inbox by default.

## Why This Task Exists
This is the exact requirement: preserve the existing manual workflow for current clients while giving every new client full multi-channel automation from day one.

## Dependencies
- TASK 41
- TASK 24

## Current State
communication_mode field and inbox both exist independently; no explicit workflow ties them together yet.

## Files To Inspect
- app/(dashboard)/clients/new/page.tsx
- components/inbox/ConversationList.tsx

## Files To Create
- lib/clients/communication-mode.ts

## Files To Modify
- app/(dashboard)/clients/new/page.tsx
- app/(dashboard)/clients/[id]/page.tsx

## Implementation Instructions
- Default new-client creation to communication_mode = 'connected' when at least one channel is already configured for the org; otherwise default to 'manual' with a prompt to connect a channel.
- For 'manual' clients: hide auto-sync UI, keep the manual-log form (TASK 27) as the only communication entry point.
- For 'connected' clients: surface inbound/outbound messages automatically once matched by TASK 36's auto-matching logic; allow switching a client from manual→connected at any time (never force connected→manual, since that could hide already-synced history).
- Bulk-import existing clients from the original spreadsheet/CRM data (if provided) explicitly as 'manual' by default, per the requirement that existing clients are unaffected.

## UI Requirements
- Clear mode indicator and toggle on client detail; confirmation copy explaining what changes when switching to Connected.

## Backend Requirements
- Server action enforcing the one-way manual→connected transition rule.

## Database Requirements
- No schema change — uses TASK 09's field.

## API Requirements
- N/A

## Security Requirements
- Mode-switch action still respects organization RLS and role gating.

## Testing Requirements
- Test new-client default mode logic, manual→connected switch, and that connected clients correctly receive auto-synced messages.

## Acceptance Criteria
- [ ] Existing/manual clients behave exactly as before; new/connected clients receive full auto-sync; the one-way switch rule is enforced.

## Git Commit
Recommended commit:

`feat(crm): implement manual-vs-connected client communication workflow`

## Verification
- Create both a manual and connected client, message the connected one via WhatsApp, and confirm only the connected client's inbox updates automatically.

## Next Task
`TASK 43`


--- FILE: V2 Prompt to build system/43-ai-feature-architecture-and-model-provider-configuration.md ---

# TASK 43 — AI Feature Architecture & Model Provider Configuration

## Objective
Establish the shared AI-access layer (model provider config, prompt templates, per-org enablement) before building individual AI features.

## Why This Task Exists
Every AI feature (TASKS 44-47) should call one consistent, swappable layer rather than each hardcoding a provider.

## Dependencies
- TASK 14

## Current State
No AI integration exists yet.

## Files To Inspect
- documentation/architecture.md
- lib/billing/plan-limits.ts

## Files To Create
- documentation/adr/003-ai-architecture.md
- lib/ai/client.ts
- lib/ai/prompts/

## Files To Modify


## Implementation Instructions
- Define a provider-agnostic lib/ai/client.ts wrapping whichever LLM API is chosen (documented as a decision, configurable via environment, not hardcoded to one vendor).
- Gate all AI features behind subscription_plans.feature_limits.ai_features_enabled (TASK 14) and a super-admin platform-wide kill switch (TASK 20).
- Store prompt templates centrally in lib/ai/prompts/ so they're auditable and versionable, not scattered inline.
- Log AI usage per organization (call count, approximate token/cost) for future cost-control and plan-based throttling.

## UI Requirements
- N/A — architecture task.

## Backend Requirements
- Server-only AI calls, never exposing the model API key to the client.

## Database Requirements
- Add ai_usage_log table: organization_id, feature, tokens_used (approx), created_at.

## API Requirements
- N/A

## Security Requirements
- Never send more client data to the AI provider than the specific feature requires (e.g. lead scoring shouldn't leak full message bodies from unrelated clients).

## Testing Requirements
- Test the provider wrapper against a simple prompt and confirm the plan/kill-switch gates correctly block disabled orgs.

## Acceptance Criteria
- [ ] AI client layer works, is gated by plan and platform kill switch, and logs usage per org.

## Git Commit
Recommended commit:

`feat(ai): establish shared AI provider architecture and usage logging`

## Verification
- Disable AI for a test org via both the plan flag and the kill switch and confirm both correctly block calls.

## Next Task
`TASK 44`


--- FILE: V2 Prompt to build system/44-ai--inbox-reply-suggestions.md ---

# TASK 44 — AI — Inbox Reply Suggestions

## Objective
Add AI-generated reply suggestions in the unified inbox, drafted from conversation context.

## Why This Task Exists
Speeds up response time across every connected channel — a natural fit given the inbox already aggregates full conversation history.

## Dependencies
- TASK 43
- TASK 41

## Current State
Unified inbox exists; no AI assistance in it yet.

## Files To Inspect
- lib/ai/client.ts
- components/inbox/MessageThread.tsx

## Files To Create
- lib/ai/features/reply-suggestions.ts
- components/inbox/AISuggestButton.tsx

## Files To Modify
- components/inbox/ComposeBox.tsx

## Implementation Instructions
- Generate 1-3 short reply drafts from the recent thread context on request (not automatically sent — always a human-reviewed suggestion, never auto-send).
- Respect communication_mode and channel type in tone/length (e.g. WhatsApp shorter than email).

## UI Requirements
- 'Suggest reply' button in the compose box; suggestions shown as selectable drafts, editable before send.

## Backend Requirements
- Server action calling lib/ai/features/reply-suggestions.ts, gated by TASK 43's plan/kill-switch checks.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Suggestions never auto-send; always require explicit human send action.

## Testing Requirements
- Test suggestion quality/relevance across a few realistic thread samples; confirm gating blocks non-AI-enabled orgs.

## Acceptance Criteria
- [ ] Reply suggestions generate correctly, are always human-reviewed before sending, and respect plan gating.

## Git Commit
Recommended commit:

`feat(ai): add AI-generated reply suggestions in the unified inbox`

## Verification
- Confirm an AI-disabled org sees no suggestion button at all, not just a disabled one.

## Next Task
`TASK 45`


--- FILE: V2 Prompt to build system/45-ai--lead-scoring-in-the-sales-pipeline.md ---

# TASK 45 — AI — Lead Scoring in the Sales Pipeline

## Objective
Add an AI-assisted lead score surfaced on pipeline cards, based on available client/communication data.

## Why This Task Exists
Helps prioritize the leads pipeline built in TASK 26 with a data-informed signal rather than manual guesswork alone.

## Dependencies
- TASK 43
- TASK 26

## Current State
Pipeline kanban exists with manual stage-only prioritization; no scoring signal yet.

## Files To Inspect
- app/(dashboard)/leads/page.tsx
- lib/ai/client.ts

## Files To Create
- lib/ai/features/lead-scoring.ts

## Files To Modify
- components/leads/KanbanBoard.tsx

## Implementation Instructions
- Compute a lead score (e.g. 0-100 or Low/Medium/High) from available signals: communication recency/volume, stated deal value, response patterns — recomputed on a schedule or on-demand, not on every page load.
- Always show the score as an assistive signal alongside human judgment, never as an automated stage-mover.

## UI Requirements
- Score badge on pipeline cards; tooltip explaining the top contributing factors in plain language.

## Backend Requirements
- Scheduled or on-demand server action, gated by plan/kill-switch.

## Database Requirements
- Add lead_score, lead_score_updated_at columns to clients (or leads table).

## API Requirements
- N/A

## Security Requirements
- Same data-minimization principle as TASK 44 — only relevant signals sent to the AI call.

## Testing Requirements
- Test scoring against a few synthetic lead profiles with clearly different engagement levels and confirm sensible relative ordering.

## Acceptance Criteria
- [ ] Lead scores computed and displayed correctly, gated by plan, never auto-moving pipeline stages.

## Git Commit
Recommended commit:

`feat(ai): add AI-assisted lead scoring to the sales pipeline`

## Verification
- Compare relative scores across 3 synthetic leads with obviously different engagement levels for sanity.

## Next Task
`TASK 46`


--- FILE: V2 Prompt to build system/46-ai--auto-task-extraction-from-messages.md ---

# TASK 46 — AI — Auto-Task Extraction from Messages

## Objective
Detect actionable items in inbound messages and suggest creating a task from them.

## Why This Task Exists
Reduces manual overhead when a client message implies a to-do (e.g. 'can you also add X').

## Dependencies
- TASK 43
- TASK 41
- TASK 31

## Current State
Inbox and tasks module exist independently; no AI bridge between them.

## Files To Inspect
- lib/ai/client.ts
- components/inbox/MessageThread.tsx

## Files To Create
- lib/ai/features/task-extraction.ts
- components/inbox/SuggestedTaskCard.tsx

## Files To Modify


## Implementation Instructions
- On new inbound messages (for connected clients), run a lightweight extraction pass suggesting 0-2 candidate tasks with a title and suggested project link.
- Suggestions require explicit one-click acceptance to actually create a task — never auto-created silently.

## UI Requirements
- Suggested-task card inline in the message thread with Accept/Dismiss actions.

## Backend Requirements
- Server action creating the task via the existing TASK 31 task-creation path on Accept.

## Database Requirements
- No schema change — creates rows in existing tasks table.

## API Requirements
- N/A

## Security Requirements
- Never create a task without explicit human acceptance; respect plan/kill-switch gating.

## Testing Requirements
- Test extraction against a few realistic messages with and without actionable content.

## Acceptance Criteria
- [ ] Actionable messages surface a sensible suggested task; accepting creates a real task correctly linked.

## Git Commit
Recommended commit:

`feat(ai): add AI-assisted task extraction from inbound messages`

## Verification
- Send a message with a clear action item and confirm a relevant suggestion appears and creates the task correctly on accept.

## Next Task
`TASK 47`


--- FILE: V2 Prompt to build system/47-ai--weekly-report-narrative-generation.md ---

# TASK 47 — AI — Weekly Report Narrative Generation

## Objective
Add an AI-written plain-language summary layered on top of the existing weekly-summary automation data.

## Why This Task Exists
Turns the raw weekly numbers (TASK 52) into a short readable narrative for the org owner, not just a stat block.

## Dependencies
- TASK 43

## Current State
Weekly summary automation will exist (TASK 52) producing raw figures only; no narrative generation yet.

## Files To Inspect
- lib/ai/client.ts

## Files To Create
- lib/ai/features/report-narrative.ts

## Files To Modify


## Implementation Instructions
- Given the same aggregate figures the weekly-summary job computes (active projects, pending tasks, deadlines, overdue items), generate a 3-5 sentence plain-language narrative highlighting what most needs attention.
- Attach the narrative to both the Slack weekly summary and the in-app notification/report (wired once TASKS 47/52/58 exist together — implement this as a pluggable formatter those tasks call).

## UI Requirements
- N/A — backend generation; consumed by TASK 52's output and TASK 58's analytics.

## Backend Requirements
- Pure function taking aggregate figures in, narrative text out — no direct DB access needed.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Gated by plan/kill-switch like other AI features; never invents figures not present in the input data (explicitly instruct the model to only summarize supplied numbers).

## Testing Requirements
- Test narrative generation against a few different figure sets, confirming no fabricated numbers appear.

## Acceptance Criteria
- [ ] Narrative generator produces accurate, non-fabricated summaries of the exact figures supplied.

## Git Commit
Recommended commit:

`feat(ai): add AI-generated narrative for weekly summary reports`

## Verification
- Feed a known figure set and manually verify every number mentioned in the narrative matches the input exactly.

## Next Task
`TASK 48`


--- FILE: V2 Prompt to build system/48-ai-settings-and-usage-controls.md ---

# TASK 48 — AI Settings & Usage Controls

## Objective
Build the org-level settings screen for enabling/disabling individual AI features and viewing usage.

## Why This Task Exists
Gives organizations (and you, via Super Admin) visibility and control over AI usage and cost, beyond the binary plan gate.

## Dependencies
- TASK 43
- TASK 44
- TASK 45
- TASK 46
- TASK 47

## Current State
AI features exist individually with only plan/kill-switch gating; no per-feature toggle or usage visibility for org owners.

## Files To Inspect
- lib/ai/client.ts
- supabase/migrations (ai_usage_log)

## Files To Create
- app/(dashboard)/settings/ai/page.tsx

## Files To Modify


## Implementation Instructions
- Per-feature toggle (reply suggestions / lead scoring / task extraction / report narratives) stored per organization, checked in addition to the plan-level flag.
- Usage summary: calls this billing period, rough cost estimate if applicable, restricted to owner/admin/billing_manager.

## UI Requirements
- Settings page with toggles and a simple usage summary.

## Backend Requirements
- Server actions for toggle updates, role-gated.

## Database Requirements
- Add ai_feature_settings table or jsonb column on organizations.

## API Requirements
- N/A

## Security Requirements
- Toggle checks combine with, never bypass, the plan-level and platform kill-switch gates from TASK 43.

## Testing Requirements
- Test toggling each feature off and confirming the corresponding AI action becomes unavailable.

## Acceptance Criteria
- [ ] Org owners can control AI features individually and see usage, all still bounded by plan/kill-switch limits.

## Git Commit
Recommended commit:

`feat(ai): add per-organization AI feature settings and usage visibility`

## Verification
- Turn off task-extraction only and confirm reply suggestions still work while task extraction stops.

## Next Task
`TASK 49`


--- FILE: V2 Prompt to build system/49-n8n-automation-architecture-and-webhook-contracts.md ---

# TASK 49 — N8N Automation Architecture & Webhook Contracts

## Objective
Define the event contract between the app and the already-running n8n instance on the Contabo VPS.

## Why This Task Exists
The original automations (invoice trigger, deadline/overdue alerts, weekly summary) all depend on a consistent, documented, signed event contract.

## Dependencies
- TASK 30
- TASK 09

## Current State
n8n already runs on the VPS (proxied in TASK 03); no event contracts documented yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (all 4 N8N flows)
- nginx/conf.d/n8n.conf

## Files To Create
- documentation/automation-contracts.md
- app/api/automation/events/route.ts

## Files To Modify


## Implementation Instructions
- Signed outbound event-emitter: on key state changes, POST a signed payload to the org's configured n8n webhook URL (now n8n.yourdomain.com per TASK 03).
- Payload schema: event_type, organization_id, timestamp, relevant entity data.
- Add organization-level automation_webhook_url + automation_webhook_secret fields.

## UI Requirements
- N/A

## Backend Requirements
- Signed outbound webhook sender utility used by TASKS 50-52.

## Database Requirements
- Add automation_webhook_url, automation_webhook_secret to organizations.

## API Requirements
- Signed POST to the org's n8n webhook — outbound only, HMAC-signed.

## Security Requirements
- Sign every outbound payload; never log the secret.

## Testing Requirements
- Send a test event to a mock endpoint and confirm payload shape and signature verify correctly.

## Acceptance Criteria
- [ ] Event contract documented and signed-sender utility works against a test endpoint.

## Git Commit
Recommended commit:

`feat(automation): define n8n event contract and signed webhook sender`

## Verification
- Manually verify signature validation against a known secret/payload pair.

## Next Task
`TASK 50`


--- FILE: V2 Prompt to build system/50-automation--project-delivered-ÔåÆ-invoice-trigger.md ---

# TASK 50 — Automation — Project Delivered → Invoice Trigger

## Objective
Implement N8N Flow 1: Delivered status change fires the invoice generation trigger.

## Why This Task Exists
Most business-critical automation, connecting Project Management to the Invoice Generator.

## Dependencies
- TASK 49
- TASK 30

## Current State
Status-change action exists; no automation firing on it yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (N8N Flow 1)
- app/api/automation/events/route.ts

## Files To Create
- n8n/workflows/project-delivered-invoice.json (exported flow, documentation)

## Files To Modify
- Server action updateProjectStatus

## Implementation Instructions
- On transition to 'delivered', check payment_schedule (per_project vs recurring) per the original spec's decision branch.
- If per-project, emit invoice.trigger with client_id/project_id/amount/currency.
- On confirmed callback, update status to 'invoiced' and invoice_triggered=true.
- Trigger the Slack notification to the org owner as specified.

## UI Requirements
- Confirmation modal on Delivered transition (from TASK 30) showing what will be triggered.

## Backend Requirements
- Callback webhook route accepting invoice-created confirmation.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/automation/callback/invoice-created.

## Security Requirements
- Verify callback authenticity via shared secret before trusting it.

## Testing Requirements
- Test the full loop against a mock n8n workflow.

## Acceptance Criteria
- [ ] Delivering a per-project-billed project reliably emits the trigger and updates to Invoiced on confirmed callback.

## Git Commit
Recommended commit:

`feat(automation): implement delivered-to-invoice trigger flow`

## Verification
- Walk a test project through Delivered with a mocked callback and confirm status/flags update exactly.

## Next Task
`TASK 51`


--- FILE: V2 Prompt to build system/51-automation--deadline-and-overdue-alerts.md ---

# TASK 51 — Automation — Deadline & Overdue Alerts

## Objective
Implement N8N Flows 2 and 3: task-due-tomorrow and project-overdue alerts.

## Why This Task Exists
Daily-cadence accountability automations from the original spec.

## Dependencies
- TASK 49

## Current State
Event contract exists; no scheduled checks implemented.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (N8N Flow 2, 3)

## Files To Create
- app/api/automation/cron/deadline-check/route.ts

## Files To Modify


## Implementation Instructions
- Daily cron-triggered route (invoked by n8n's schedule trigger) querying tasks due tomorrow and overdue projects per org.
- Emit task.due_soon and project.overdue events to the correct org's webhook.

## UI Requirements
- N/A

## Backend Requirements
- Cron-safe, idempotent, scoped per organization.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/deadline-check — protected by a cron secret.

## Security Requirements
- Protect the cron endpoint with a secret header, not publicly callable.

## Testing Requirements
- Test with synthetic due-tomorrow/overdue records; confirm no duplicate alerts on repeat runs.

## Acceptance Criteria
- [ ] Daily check correctly identifies matches per org without duplication.

## Git Commit
Recommended commit:

`feat(automation): implement deadline and overdue alert checks`

## Verification
- Run the check twice against the same data and confirm no duplicate alerts.

## Next Task
`TASK 52`


--- FILE: V2 Prompt to build system/52-automation--weekly-summary-report.md ---

# TASK 52 — Automation — Weekly Summary Report

## Objective
Implement N8N Flow 4: Monday-morning summary of active projects/tasks/deadlines per org, now including the AI narrative from TASK 47.

## Why This Task Exists
Completes the original automation requirements with the AI enhancement layered in.

## Dependencies
- TASK 49
- TASK 47

## Current State
No weekly aggregation exists yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (N8N Flow 4)
- lib/ai/features/report-narrative.ts

## Files To Create
- app/api/automation/cron/weekly-summary/route.ts

## Files To Modify


## Implementation Instructions
- Weekly job aggregating active project count, pending task count, 7-day deadlines per org.
- Pass figures through TASK 47's narrative generator (only if AI features are enabled for that org) before emitting weekly.summary.

## UI Requirements
- N/A

## Backend Requirements
- Cron-safe, protected route.

## Database Requirements
- No schema change.

## API Requirements
- GET/POST /api/automation/cron/weekly-summary — protected.

## Security Requirements
- Same cron-secret protection pattern as TASK 51.

## Testing Requirements
- Test aggregation numbers against manual queries for a seeded org; test with AI on and off.

## Acceptance Criteria
- [ ] Weekly summary contains accurate figures, with narrative attached only for AI-enabled orgs.

## Git Commit
Recommended commit:

`feat(automation): implement weekly summary report generation with optional AI narrative`

## Verification
- Manually trigger the endpoint and diff output against direct DB queries.

## Next Task
`TASK 53`


--- FILE: V2 Prompt to build system/53-in-app-notification-center.md ---

# TASK 53 — In-App Notification Center

## Objective
Add in-app notifications so alerting doesn't rely on Slack alone — necessary since external tenant organizations won't all use Slack.

## Why This Task Exists
Generalizes alerting beyond one channel for any organization.

## Dependencies
- TASK 49
- TASK 21

## Current State
Notification bell exists as a UI stub; no backing logic.

## Files To Inspect
- components/shell/Topbar.tsx

## Files To Create
- supabase/migrations/0013_notifications.sql
- components/shell/NotificationPanel.tsx

## Files To Modify
- components/shell/Topbar.tsx

## Implementation Instructions
- notifications table: organization_id, user_id, type, title, body, read_at, related_entity link.
- Hook TASKS 50-52's automation events to also create in-app notifications, giving orgs channel choice.

## UI Requirements
- Dropdown panel from the topbar bell, unread badge, mark-read/mark-all-read.

## Backend Requirements
- Server action to create/mark-read, reused by automation handlers.

## Database Requirements
- notifications table.

## API Requirements
- N/A

## Security Requirements
- Notifications strictly per-user within org via RLS.

## Testing Requirements
- Test notification creation from each automation trigger type and correct per-user delivery.

## Acceptance Criteria
- [ ] Every automation event can optionally also generate an in-app notification, correctly scoped.

## Git Commit
Recommended commit:

`feat(notifications): add in-app notification center`

## Verification
- Trigger a deadline alert and confirm both Slack and in-app notification appear consistently.

## Next Task
`TASK 54`


--- FILE: V2 Prompt to build system/54-client-portal--auth-and-rls.md ---

# TASK 54 — Client Portal — Auth & RLS

## Objective
Implement a fully separate authentication/authorization boundary for external clients.

## Why This Task Exists
Each client must see only their own projects — a different RLS shape from organization-member access.

## Dependencies
- TASK 12
- TASK 24

## Current State
Only internal team auth exists; no client-facing auth exists.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (Client Portal)
- supabase/migrations/0008_rls_policies.sql

## Files To Create
- supabase/migrations/0014_client_portal_auth.sql
- app/(client-portal)/client/login/page.tsx

## Files To Modify


## Implementation Instructions
- client_users table linking a clients row to an auth identity, distinct from organization_members.
- RLS scoped by client_id for portal read paths, further constrained to that client's organization.
- Magic-link login per the original spec.
- Portal reachable only for orgs whose plan includes client_portal_enabled.

## UI Requirements
- Portal login page, separate route group/branding namespace.

## Backend Requirements
- Auth callback distinct from the internal one.

## Database Requirements
- client_users table.

## API Requirements
- N/A

## Security Requirements
- Second, independent security boundary — test as rigorously as org-level RLS, including cross-client and cross-org access attempts.

## Testing Requirements
- Test Client A cannot see Client B's data even within the same org; test plan-gating blocks portal access when not enabled.

## Acceptance Criteria
- [ ] Client portal auth is fully isolated per-client and correctly plan-gated.

## Git Commit
Recommended commit:

`feat(client-portal): implement client-scoped authentication and RLS`

## Verification
- Attempt cross-client and cross-org data access as an authenticated client_user and confirm both blocked.

## Next Task
`TASK 55`


--- FILE: V2 Prompt to build system/55-client-portal--dashboard.md ---

# TASK 55 — Client Portal — Dashboard

## Objective
Build the client-facing dashboard: active projects, deliverables awaiting review, invoices.

## Why This Task Exists
Matches the original /client/dashboard requirement.

## Dependencies
- TASK 54

## Current State
Client portal auth exists; no portal screens yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (/client/dashboard)

## Files To Create
- app/(client-portal)/client/dashboard/page.tsx
- app/(client-portal)/layout.tsx

## Files To Modify


## Implementation Instructions
- Widgets: active projects+status, deliverables awaiting review, pending invoices, payment history summary.
- Simplified client-friendly nav distinct from the internal shell.

## UI Requirements
- Client-appropriate branding (org logo/colors if white-label enabled by plan); empty states for brand-new clients.

## Backend Requirements
- Server Component scoped by client_id via TASK 54's RLS.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Confirm every query on this path is client_id-scoped, never organization-wide.

## Testing Requirements
- Test dashboard renders correctly and only shows that one client's data.

## Acceptance Criteria
- [ ] Client dashboard accurately and exclusively reflects the logged-in client's own data.

## Git Commit
Recommended commit:

`feat(client-portal): build client dashboard`

## Verification
- Log in as two different clients in the same org and confirm zero data overlap.

## Next Task
`TASK 56`


--- FILE: V2 Prompt to build system/56-client-portal--project-detail-and-approval-flow.md ---

# TASK 56 — Client Portal — Project Detail & Approval Flow

## Objective
Build client-facing project detail with deliverable download/view and approve/request-revision.

## Why This Task Exists
Matches /client/projects/[id] and wires into internal deliverables and notifications.

## Dependencies
- TASK 55
- TASK 32

## Current State
Client dashboard exists; no per-project client view yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (client actions auto-update Ubaid's system)

## Files To Create
- app/(client-portal)/client/projects/[id]/page.tsx
- components/client-portal/ApprovalForm.tsx

## Files To Modify


## Implementation Instructions
- Show status, deliverables, and an approve/request-revision form.
- On approve: deliverable status→approved, project status update if applicable, notify internally (in-app+Slack).
- On revision request: create a new internal task for the revision and notify.

## UI Requirements
- Deliverable viewer/downloader; approve/revision form with feedback field.

## Backend Requirements
- Server actions restricted to the deliverable's own linked client_id.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Re-verify client_id ownership server-side on every approval action.

## Testing Requirements
- Test both approve and revision-request paths end-to-end.

## Acceptance Criteria
- [ ] Client actions correctly and exclusively affect their own project with accurate downstream automation.

## Git Commit
Recommended commit:

`feat(client-portal): build project detail with approval and revision-request flow`

## Verification
- Approve a deliverable as a client and confirm the internal team sees the change and notification within seconds.

## Next Task
`TASK 57`


--- FILE: V2 Prompt to build system/57-client-portal--invoice-and-payment-status-view.md ---

# TASK 57 — Client Portal — Invoice & Payment Status View

## Objective
Build the client-facing invoice list and payment status view.

## Why This Task Exists
Matches the original spec's requirement and the natural counterpart to the internal invoice automation.

## Dependencies
- TASK 55
- TASK 50

## Current State
No client-facing billing view exists yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (invoice + payment status)

## Files To Create
- app/(client-portal)/client/invoices/page.tsx

## Files To Modify


## Implementation Instructions
- List invoices linked to the client's projects, sourced from the shared invoices table structure agreed with the Invoice Generator integration.
- Show status (sent/paid/overdue) and payment history; read-only.

## UI Requirements
- Simple list/table with status badges.

## Backend Requirements
- Read-only Server Component, RLS-scoped by client_id.

## Database Requirements
- Document the exact expected shared invoices table shape in documentation/adr/004-invoice-integration.md if not already defined.

## API Requirements
- N/A

## Security Requirements
- Read-only reduces risk; confirm RLS still restricts to the client's own invoices only.

## Testing Requirements
- Test with a client having multiple invoices in different statuses.

## Acceptance Criteria
- [ ] Client sees accurate invoice/payment status, never another client's.

## Git Commit
Recommended commit:

`feat(client-portal): build invoice and payment status view`

## Verification
- Cross-check displayed invoice statuses against the shared invoices table for accuracy.

## Next Task
`TASK 58`


--- FILE: V2 Prompt to build system/58-analytics-dashboard.md ---

# TASK 58 — Analytics Dashboard

## Objective
Build the org-level analytics view from the original spec's Sub-task 7.

## Why This Task Exists
Owners need aggregate visibility beyond the main dashboard's basic counts.

## Dependencies
- TASK 29
- TASK 09

## Current State
Only basic counts exist on the main dashboard; no dedicated analytics page yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (Dashboard Analytics)

## Files To Create
- app/(dashboard)/analytics/page.tsx
- components/analytics/*.tsx

## Files To Modify


## Implementation Instructions
- Charts: projects by status, revenue pipeline, team workload (reuse TASK 34 data), upcoming deadlines (7 days), overdue highlighted, monthly completion rate.
- Date-range selector where feasible; optional AI narrative summary at the top (reuse TASK 47's generator).

## UI Requirements
- Chart components (bar/pie/line), responsive for mobile.

## Backend Requirements
- Server Components running RLS-scoped aggregate queries.

## Database Requirements
- No schema change; consider a materialized view for expensive aggregates at scale.

## API Requirements
- N/A

## Security Requirements
- Aggregate queries never leak cross-org data even in edge-case group-bys.

## Testing Requirements
- Test analytics accuracy against manual calculations for a seeded org.

## Acceptance Criteria
- [ ] All analytics widgets implemented and accurate.

## Git Commit
Recommended commit:

`feat(analytics): build organization analytics dashboard`

## Verification
- Validate revenue pipeline figure against a manual sum of active project amounts.

## Next Task
`TASK 59`


--- FILE: V2 Prompt to build system/59-revenue-and-plan-usage-reporting.md ---

# TASK 59 — Revenue & Plan-Usage Reporting

## Objective
Extend analytics with plan-usage vs limits and revenue breakdown by client/project type.

## Why This Task Exists
Owners need visibility into their own subscription usage, not just client project revenue.

## Dependencies
- TASK 58
- TASK 14

## Current State
Analytics exists but doesn't show plan-limit usage.

## Files To Inspect
- lib/billing/plan-limits.ts
- app/(dashboard)/analytics/page.tsx

## Files To Create
- components/analytics/PlanUsageCard.tsx

## Files To Modify
- app/(dashboard)/analytics/page.tsx
- app/(dashboard)/settings/billing/page.tsx

## Implementation Instructions
- Usage vs plan limits (clients, team members, channels) with proximity-to-limit indicators.
- Revenue breakdown by client and project type, sortable/filterable.

## UI Requirements
- Usage bars/progress indicators; upsell prompt near limits.

## Backend Requirements
- Reuses plan-limits.ts.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- No new security surface beyond existing RLS.

## Testing Requirements
- Test usage indicators at various proximities to plan limits.

## Acceptance Criteria
- [ ] Usage reporting accurate against real counts, correct upsell prompting.

## Git Commit
Recommended commit:

`feat(analytics): add plan-usage and revenue breakdown reporting`

## Verification
- Push a test org to 90% of a limit and confirm the correct visual warning and upsell CTA.

## Next Task
`TASK 60`


--- FILE: V2 Prompt to build system/60-exportable-reports-pdf-csv.md ---

# TASK 60 — Exportable Reports (PDF/CSV)

## Objective
Add export functionality for clients list, projects list, revenue breakdown, and a formatted monthly summary.

## Why This Task Exists
Agencies need to report activity/revenue to their own stakeholders offline.

## Dependencies
- TASK 58

## Current State
Analytics is view-only; no export capability.

## Files To Inspect
- app/(dashboard)/analytics/page.tsx

## Files To Create
- lib/reports/csv-export.ts
- lib/reports/pdf-export.ts
- app/api/reports/export/route.ts

## Files To Modify


## Implementation Instructions
- CSV export for clients/projects/revenue.
- PDF export for a formatted monthly summary (reusing TASK 52's data shape as base, with the AI narrative included if enabled).

## UI Requirements
- Export buttons on relevant list/analytics pages, format choice.

## Backend Requirements
- Export route generating files server-side, streamed as download.

## Database Requirements
- No schema change.

## API Requirements
- GET /api/reports/export?type=...&format=... — authenticated, org-scoped.

## Security Requirements
- Export endpoint respects the same RLS/org-scoping as underlying data — no export-based shortcut.

## Testing Requirements
- Test CSV/PDF export content matches on-screen data exactly.

## Acceptance Criteria
- [ ] Exports accurate, correctly formatted, strictly org-scoped.

## Git Commit
Recommended commit:

`feat(reports): add CSV and PDF export for key reports`

## Verification
- Diff exported CSV row counts against the underlying list view's row count.

## Next Task
`TASK 61`


--- FILE: V2 Prompt to build system/61-input-validation-and-sanitization-layer.md ---

# TASK 61 — Input Validation & Sanitization Layer

## Objective
Introduce a consistent, shared validation layer (e.g. Zod schemas) across every form and server action.

## Why This Task Exists
With 40+ prior tasks each defining ad-hoc forms/actions, this task audits and unifies validation before launch.

## Dependencies
- TASK 60

## Current State
Validation implemented ad-hoc per task; no shared schema library yet.

## Files To Inspect
- All app/(dashboard)/**/page.tsx and lib/**/actions.ts files

## Files To Create
- lib/validation/schemas.ts

## Files To Modify
- Every server action file across the codebase (systematic pass).

## Implementation Instructions
- Define schemas per entity: client, project, task, deliverable, message, organization, invite, AI-settings, etc.
- Refactor every server action to validate before touching the database.
- Sanitize free-text fields against stored-XSS before render.

## UI Requirements
- Consistent inline validation error display across all forms.

## Backend Requirements
- Centralized schema-based validation used everywhere.

## Database Requirements
- No DB schema change.

## API Requirements
- N/A

## Security Requirements
- Every server action rejects invalid payloads with safe error messages, no stack traces leaked.

## Testing Requirements
- Write validation tests for the 10 highest-traffic actions.

## Acceptance Criteria
- [ ] No server action accepts unvalidated input; no user text renders unsanitized anywhere.

## Git Commit
Recommended commit:

`fix(security): unify input validation and sanitization across all server actions`

## Verification
- Attempt a stored-XSS payload in a notes/feedback field and confirm it renders inert.

## Next Task
`TASK 62`


--- FILE: V2 Prompt to build system/62-secrets-management-and-api-security.md ---

# TASK 62 — Secrets Management & API Security

## Objective
Harden how provider tokens (Slack/WhatsApp/Stripe/n8n/AI-provider secrets), API routes, and rate limiting are handled platform-wide, on self-hosted infra.

## Why This Task Exists
Multiple earlier tasks store or use sensitive tokens on your own VPS now — this consolidated audit is even more important without a managed cloud's built-in protections.

## Dependencies
- TASK 61

## Current State
Tokens stored per-integration ad-hoc; no unified encryption-at-rest or rate-limiting strategy audited.

## Files To Inspect
- lib/providers/*.ts
- app/api/webhooks/*/route.ts
- app/api/automation/*/route.ts
- lib/ai/client.ts

## Files To Create
- lib/security/encrypt.ts
- middleware/rate-limit.ts

## Files To Modify
- All provider integration files and webhook routes (systematic pass).

## Implementation Instructions
- Encrypt provider tokens at rest (application-level, on top of Postgres) — decrypt only server-side at point of use.
- Rate-limit all public-facing webhook/API routes.
- Confirm every webhook route validates a signature/secret (audit TASKS 37-40, 49-52).
- Confirm no service-role key is ever used in a user-facing request path.
- Confirm the self-hosted Studio (TASK 02) and Postgres port remain non-public (re-verify TASK 03's proxy config).

## UI Requirements
- N/A

## Backend Requirements
- This IS the backend security task.

## Database Requirements
- No schema change unless a token column needs re-encrypting.

## API Requirements
- Rate-limit thresholds documented per route.

## Security Requirements
- This task's whole purpose is security — audit exhaustively against the checklist above.

## Testing Requirements
- Attempt each webhook route with an invalid/missing signature; load-test a public route to confirm rate limiting.

## Acceptance Criteria
- [ ] Every provider token encrypted at rest.
- [ ] Every public route signature-verified and rate-limited.
- [ ] No service-role key in user-facing code.
- [ ] Studio/Postgres confirmed non-public.

## Git Commit
Recommended commit:

`fix(security): harden secrets management, encryption, and API rate limiting`

## Verification
- Search the codebase for service_role usage and confirm every occurrence is server-only.
- Re-run TASK 03's SSL/exposure checks against Studio and the raw Postgres port.

## Next Task
`TASK 63`


--- FILE: V2 Prompt to build system/63-audit-logging.md ---

# TASK 63 — Audit Logging

## Objective
Add an audit trail for sensitive actions across the platform, including Super Admin actions.

## Why This Task Exists
Self-hosting your own client data and billing needs accountability — and Super Admin's cross-org/impersonation powers (TASKS 18-19) specifically depend on this existing.

## Dependencies
- TASK 62
- TASK 19

## Current State
No audit log exists; only project_activity_log covers project-specific events; TASKS 18-19 stubbed calls to this.

## Files To Inspect
- supabase/migrations/0008_rls_policies.sql
- app/super-admin/organizations/[id]/page.tsx
- app/api/super-admin/impersonate/route.ts

## Files To Create
- supabase/migrations/0015_audit_log.sql
- lib/audit/log.ts
- app/(dashboard)/settings/audit-log/page.tsx
- app/super-admin/audit-log/page.tsx

## Files To Modify


## Implementation Instructions
- audit_log table: organization_id (nullable for platform-level events), actor_user_id, actor_is_super_admin, action, entity_type, entity_id, metadata (jsonb), created_at.
- Log sensitive org-level actions (role changes, member removal, billing changes, deletions, exports) and all Super Admin actions (suspend/resume, plan override, impersonation start/end).
- Org-level audit log viewer restricted to owner/admin; separate platform-wide audit log viewer restricted to super admins.

## UI Requirements
- Two filterable table views: org-scoped and platform-wide, each restricted to the correct audience.

## Backend Requirements
- Shared logAuditEvent() helper called from relevant server actions across earlier tasks, wiring up TASK 18/19's stubs.

## Database Requirements
- audit_log table.

## API Requirements
- N/A

## Security Requirements
- Audit log itself RLS-protected and append-only (no update/delete for non-service roles).

## Testing Requirements
- Test sensitive org actions and Super Admin actions all generate correct entries; confirm non-admins/non-super-admins cannot view or tamper.

## Acceptance Criteria
- [ ] Sensitive actions reliably logged at both levels; log is append-only and correctly access-restricted.

## Git Commit
Recommended commit:

`feat(security): add audit logging for sensitive org and super-admin actions`

## Verification
- Perform a role change, a billing change, and an impersonation session, then confirm all three appear correctly in the right audit log.

## Next Task
`TASK 64`


--- FILE: V2 Prompt to build system/64-automated-testing-setup--unit-and-integration.md ---

# TASK 64 — Automated Testing Setup — Unit & Integration

## Objective
Establish the testing framework and write unit/integration tests for the highest-risk logic built across all prior tasks.

## Why This Task Exists
TEST before COMMIT is mandatory per the orchestrator loop — this retroactively covers RLS, billing, automation, and AI-gating with real automated tests.

## Dependencies
- TASK 63

## Current State
No automated test suite exists yet; verification so far has been manual per-task.

## Files To Inspect
- lib/**
- supabase/migrations/**

## Files To Create
- vitest.config.ts
- tests/rls-isolation.test.ts
- tests/super-admin-isolation.test.ts
- tests/billing.test.ts
- tests/automation-contracts.test.ts
- tests/ai-gating.test.ts

## Files To Modify


## Implementation Instructions
- Set up Vitest against the self-hosted Postgres test instance.
- Cross-tenant isolation tests, formalizing TASK 12's manual checks, across every table.
- Super-admin isolation tests: confirm no org role alone reaches super-admin data (formalizing TASK 16).
- Unit tests for plan-limits.ts, ingestMessage client-matching, automation payload builders, and AI feature plan/kill-switch gating.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Test suite is itself the security/quality gate for the rest of the platform.

## Testing Requirements
- This IS the testing task — see implementation instructions above.

## Acceptance Criteria
- [ ] CI-runnable suite passes; cross-tenant and super-admin isolation covered by automated tests, not just manual checks; billing/automation/AI-gating meaningfully covered.

## Git Commit
Recommended commit:

`test: add unit and integration test suite covering RLS, super-admin isolation, billing, automation, and AI gating`

## Verification
- Run the full suite locally and confirm all tests pass before proceeding.

## Next Task
`TASK 65`


--- FILE: V2 Prompt to build system/65-end-to-end-testing--critical-user-flows.md ---

# TASK 65 — End-to-End Testing — Critical User Flows

## Objective
Write E2E tests covering the platform's most critical journeys end-to-end, including the Super Admin and AI-assisted flows.

## Why This Task Exists
Unit tests cover logic in isolation; E2E confirms the full stack works together for what matters most.

## Dependencies
- TASK 64

## Current State
No E2E coverage exists yet.

## Files To Inspect
- app/(dashboard)/**
- app/(client-portal)/**
- app/super-admin/**

## Files To Create
- playwright.config.ts
- e2e/onboarding.spec.ts
- e2e/project-lifecycle.spec.ts
- e2e/client-portal.spec.ts
- e2e/billing.spec.ts
- e2e/super-admin.spec.ts

## Files To Modify


## Implementation Instructions
- E2E: full onboarding (signup→org→first client→first project).
- E2E: full project lifecycle (create→tasks→deliverable→delivered→invoice-trigger event→paid).
- E2E: client portal isolation (two clients, zero cross-visibility) and approval flow.
- E2E: Stripe test-mode subscription flow.
- E2E: Super Admin org-suspend/resume and impersonation (read-only enforcement).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Run against a staging environment, not production data.

## Testing Requirements
- This IS the E2E testing task.

## Acceptance Criteria
- [ ] All five critical flows pass reliably in CI; isolation is explicitly asserted, not assumed.

## Git Commit
Recommended commit:

`test: add end-to-end tests for onboarding, project lifecycle, client portal, billing, and super-admin flows`

## Verification
- Run the E2E suite twice in a row to confirm no flakiness on isolation-sensitive tests.

## Next Task
`TASK 66`


--- FILE: V2 Prompt to build system/66-load-and-multi-tenant-scale-testing.md ---

# TASK 66 — Load & Multi-Tenant Scale Testing

## Objective
Verify the self-hosted platform performs acceptably as organizations, clients, and message volume grow, per the original 'design for 50+ clients' requirement.

## Why This Task Exists
Self-hosted infrastructure has a fixed VPS ceiling — this validates real headroom exists, not just that RLS queries are logically correct.

## Dependencies
- TASK 64

## Current State
No load testing performed yet.

## Files To Inspect
- supabase/migrations/** (index review)
- docker-compose.supabase.yml

## Files To Create
- scripts/seed-load-test.ts
- documentation/performance-notes.md

## Files To Modify


## Implementation Instructions
- Seed a synthetic organization with 50+ clients, 200+ projects, 1000+ messages.
- Measure list/kanban/inbox load times against this dataset on the actual Contabo VPS; identify and add missing indexes.
- Load-test the deadline-check/weekly-summary cron routes and the self-hosted Postgres instance's resource headroom under this load.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Record before/after query times for any optimization; record VPS resource headroom (CPU/RAM) at target scale.

## Testing Requirements
- Platform meets acceptable load times at the stated 50+ client scale on the actual VPS hardware, with documented headroom.

## Acceptance Criteria
- [ ] Any missing indexes identified/added; VPS resource ceiling documented for future capacity planning.

## Git Commit
Recommended commit:

`perf: validate and optimize multi-tenant performance at target scale on self-hosted infra`

## Verification
- Re-run the seeded load test after optimizations and confirm measurable improvement; check VPS resource usage during the test.

## Next Task
`TASK 67`


--- FILE: V2 Prompt to build system/67-environment-configuration-and-secrets-for-production.md ---

# TASK 67 — Environment Configuration & Secrets for Production

## Objective
Finalize all environment variables and secrets for the self-hosted production deployment.

## Why This Task Exists
Consolidates every secret from TASKS 11-62 (self-hosted Supabase keys, Stripe, Slack, WhatsApp, Email, n8n, AI provider, encryption keys) into one audited, documented set.

## Dependencies
- TASK 62

## Current State
Secrets scattered across many .env references from individual tasks; no consolidated production checklist yet.

## Files To Inspect
- .env.example
- all lib/providers/*.ts, lib/stripe/*.ts, lib/ai/client.ts files

## Files To Create
- documentation/deployment-checklist.md

## Files To Modify
- .env.example (finalize)

## Implementation Instructions
- Audit every environment variable referenced anywhere in the codebase, documented with a description in .env.example.
- Separate secrets by environment (development/staging/production), all living on the VPS itself, not a third-party secrets manager unless explicitly decided otherwise.
- Document exact provisioning steps for deploying secrets to the Contabo VPS (TASK 68).

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Confirm no secret is committed to the repository anywhere in git history.

## Testing Requirements
- Verify a fresh clone + .env.example-based setup can run the app against a scratch instance with zero missing variables.

## Acceptance Criteria
- [ ] .env.example complete and accurate; no secret in git history; a new developer/agent can configure the app from documentation alone.

## Git Commit
Recommended commit:

`chore(deploy): finalize environment configuration and secrets documentation`

## Verification
- Run a secret-scanning tool (e.g. gitleaks) against the full repository history.

## Next Task
`TASK 68`


--- FILE: V2 Prompt to build system/68-ci-cd-pipeline-to-contabo-vps.md ---

# TASK 68 — CI/CD Pipeline to Contabo VPS

## Objective
Set up an automated deploy pipeline that builds the app and deploys it to the Contabo VPS, replacing any managed-platform deploy flow.

## Why This Task Exists
Since hosting is now fully self-managed, this replaces what a service like Netlify would otherwise handle automatically.

## Dependencies
- TASK 67
- TASK 03

## Current State
No deployment pipeline configured yet; app currently only runs locally/manually on the VPS if at all.

## Files To Inspect
- documentation/deployment-checklist.md
- package.json
- docker-compose.supabase.yml

## Files To Create
- .github/workflows/deploy.yml
- Dockerfile
- documentation/infra/deployment-pipeline.md

## Files To Modify


## Implementation Instructions
- Containerize the Next.js app (Dockerfile) so it deploys the same way in every environment.
- GitHub Actions (or equivalent) workflow: build → run tests (TASKS 64-65) → build/push Docker image → SSH deploy to the VPS → restart the app container behind the TASK 03 Nginx proxy.
- Set up a staging deploy path (separate container/port, same VPS or a scratch DB) for safe review before promoting to production.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Deploy credentials (SSH key, registry token) stored as CI secrets, never in the repo; production deploy trigger restricted (e.g. main branch only, or manual approval).

## Testing Requirements
- Deploy to staging and run the E2E suite (TASK 65) against it before promoting to production.

## Acceptance Criteria
- [ ] Production deployment succeeds and is reachable via the app subdomain; staging is safely isolated from production data.

## Git Commit
Recommended commit:

`chore(deploy): set up CI/CD pipeline deploying to the self-hosted Contabo VPS`

## Verification
- Trigger a full pipeline run and verify the live site against the deployment checklist.

## Next Task
`TASK 69`


--- FILE: V2 Prompt to build system/69-n8n-workflow-activation-on-contabo-vps.md ---

# TASK 69 — N8N Workflow Activation on Contabo VPS

## Objective
Activate all n8n automation workflows in production, now fully co-located with the app on the same VPS.

## Why This Task Exists
Matches the original spec's requirement — the automation layer (TASKS 49-53) is only live once these actually run in production.

## Dependencies
- TASK 68
- TASK 50
- TASK 51
- TASK 52

## Current State
N8N flows are designed/documented; not yet activated against the production app deployment.

## Files To Inspect
- n8n/workflows/*.json
- documentation/automation-contracts.md

## Files To Create
- documentation/infra/n8n-deployment.md

## Files To Modify


## Implementation Instructions
- Import all documented workflows (invoice trigger, deadline alert, overdue alert, weekly summary) into the production n8n instance on the VPS.
- Configure each organization's webhook secret in n8n's credential store, matching TASK 49's signing scheme.
- Set up cron/schedule triggers for TASKS 51/52 calling the platform's protected cron endpoints.
- Verify end-to-end for at least the Innoventix organization before considering this phase complete.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- N8n credentials stored securely on the VPS, never in exported workflow JSON committed to any repo.

## Testing Requirements
- Trigger each of the 4 workflows against the live production environment for the Innoventix org and confirm correct Slack + in-app delivery.

## Acceptance Criteria
- [ ] All 4 automation flows live and verified end-to-end in production for at least the first real organization.

## Git Commit
Recommended commit:

`chore(deploy): activate n8n automation workflows in production`

## Verification
- Manually walk one project through Delivered in production and confirm the full invoice-trigger chain fires correctly.

## Next Task
`TASK 70`


--- FILE: V2 Prompt to build system/70-monitoring-logging-and-uptime-for-self-hosted-infrastructure.md ---

# TASK 70 — Monitoring, Logging & Uptime for Self-Hosted Infrastructure

## Objective
Set up monitoring, centralized logging, and uptime alerting for every self-hosted service.

## Why This Task Exists
A managed cloud platform normally provides this for free; self-hosting on Contabo means you must build it deliberately or you'll be blind to outages.

## Dependencies
- TASK 68

## Current State
No monitoring/alerting exists for the self-hosted stack.

## Files To Inspect
- docker-compose.supabase.yml
- nginx/conf.d/*.conf

## Files To Create
- documentation/infra/monitoring.md
- docker-compose.monitoring.yml

## Files To Modify


## Implementation Instructions
- Set up basic uptime monitoring (external ping/health-check service) for app, api, and n8n subdomains, alerting you (e.g. via Slack/email) on downtime.
- Centralize container logs (app, Postgres, Auth, Nginx) so they're queryable in one place, not scattered across `docker logs` on the VPS.
- Set up basic resource alerts (disk space, memory, CPU) on the VPS itself — critical since there's no managed auto-scaling.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Logs and monitoring dashboards themselves must not be publicly exposed.

## Testing Requirements
- Simulate a service outage (stop a container) and confirm the alert fires within an acceptable window.

## Acceptance Criteria
- [ ] Uptime, logs, and resource alerts all working and correctly notifying you on failure.

## Git Commit
Recommended commit:

`feat(infra): add monitoring, centralized logging, and uptime alerting`

## Verification
- Stop the app container briefly and confirm an alert is received.

## Next Task
`TASK 71`


--- FILE: V2 Prompt to build system/71-final-qa-security-audit-and-demo-preparation.md ---

# TASK 71 — Final QA, Security Audit & Demo Preparation

## Objective
Perform the final full-platform audit and prepare the live demo walkthrough from the original assignment, updated for the full expanded platform.

## Why This Task Exists
Closing task: verifies all 70 prior tasks together and delivers the demo Ubaid — and any future external customer — will actually see.

## Dependencies
- TASK 66
- TASK 69
- TASK 70

## Current State
All individual features are built and deployed; no final cross-cutting audit performed yet.

## Files To Inspect
- Entire codebase and documentation/ directory

## Files To Create
- documentation/final-completion-report.md

## Files To Modify


## Implementation Instructions
- Run the full Final Project Audit checklist from the orchestrator template (Functionality, Code, Security, Git, Deployment, Documentation, Agent Continuity), extended to explicitly cover self-hosted infra, Super Admin isolation, and AI-feature gating.
- Prepare and rehearse the live demo: add client (manual and connected) → add project → assign tasks → move through all statuses → trigger invoice automatically → show client portal → show Slack + in-app notifications → show analytics → show a Super Admin walkthrough of organization management → show an AI reply-suggestion in the inbox.
- Write the Final Completion Report per the orchestrator's format.
- Update .agent-state.md to reflect full completion and hand back to the Finance Tracker assignment, now that it can integrate against this platform's shared self-hosted schema.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Final security pass: no secrets committed, RLS and super-admin isolation re-confirmed, audit log functioning, self-hosted services confirmed non-public where required (Studio, raw Postgres, monitoring dashboards).

## Testing Requirements
- Run the full unit, integration, and E2E suites one final time before sign-off.

## Acceptance Criteria
- [ ] Every item in the extended Final Project Audit checklist passes.
- [ ] The full demo script runs successfully live.
- [ ] Final completion report and .agent-state.md are accurate and complete.

## Git Commit
Recommended commit:

`chore(release): final QA pass and v1.0 completion report`

## Verification
- Walk through the entire demo script live, end to end, without errors.

## Next Task
`None — build complete. Resume the Finance Tracker assignment (Phase B) next, integrating it against this platform's self-hosted schema.`


--- FILE: V2 Prompt to build system/ORCHESTRATOR-FULL-RULES.md ---

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

--- FILE: V2 Prompt to build system/ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md ---

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


--- FILE: V2 Prompt to build system/README.md ---

# Task Index — Innoventix Platform Build (v2, Self-Hosted + Super Admin + AI)

Read `00-MASTER-PROMPT-v2-self-hosted.md` first, then work through these in order.

This supersedes the earlier v1 task set (Supabase Cloud + Netlify, no Super Admin/AI). Use this set for the actual build.

- `00-MASTER-PROMPT-v2-self-hosted.md` — MASTER PROMPT v2 — Innoventix Platform Build Orchestrator (Self-Hosted / Super Admin / AI)
- `01-contabo-vps-provisioning-and-base-server-hardening.md` — TASK 01 — Contabo VPS Provisioning & Base Server Hardening
- `02-self-hosted-supabase-stack-via-docker-compose.md` — TASK 02 — Self-Hosted Supabase Stack via Docker Compose
- `03-nginx-reverse-proxy-domains-and-ssl.md` — TASK 03 — Nginx Reverse Proxy, Domains & SSL
- `04-backup-and-disaster-recovery-strategy.md` — TASK 04 — Backup & Disaster Recovery Strategy
- `05-local-development-environment-parity.md` — TASK 05 — Local Development Environment Parity
- `06-repository-and-application-foundation.md` — TASK 06 — Repository & Application Foundation
- `07-multi-tenant-architecture-decision-record.md` — TASK 07 — Multi-Tenant Architecture Decision Record
- `08-core-database-schema--organizations-users-roles-super-admins.md` — TASK 08 — Core Database Schema — Organizations, Users, Roles, Super Admins
- `09-core-database-schema--crm-and-project-management-tables.md` — TASK 09 — Core Database Schema — CRM & Project Management Tables
- `10-core-database-schema--communication-hub-and-billing.md` — TASK 10 — Core Database Schema — Communication Hub & Billing
- `11-authentication-self-hosted-gotrue--team-members.md` — TASK 11 — Authentication (Self-Hosted GoTrue) — Team Members
- `12-authorization--roles-and-row-level-security-policies.md` — TASK 12 — Authorization — Roles & Row-Level Security Policies
- `13-organization-onboarding-and-tenant-provisioning.md` — TASK 13 — Organization Onboarding & Tenant Provisioning
- `14-subscription-plans-definition.md` — TASK 14 — Subscription Plans Definition
- `15-stripe-billing-integration.md` — TASK 15 — Stripe Billing Integration
- `16-super-admin--access-control-layer.md` — TASK 16 — Super Admin — Access Control Layer
- `17-super-admin--platform-dashboard.md` — TASK 17 — Super Admin — Platform Dashboard
- `18-super-admin--organization-management.md` — TASK 18 — Super Admin — Organization Management
- `19-super-admin--impersonation-and-support-access.md` — TASK 19 — Super Admin — Impersonation & Support Access
- `20-super-admin--platform-settings-and-global-configuration.md` — TASK 20 — Super Admin — Platform Settings & Global Configuration
- `21-application-shell-navigation-and-organization-switcher.md` — TASK 21 — Application Shell, Navigation & Organization Switcher
- `22-main-dashboard-overview.md` — TASK 22 — Main Dashboard Overview
- `23-organization-settings-and-team-management.md` — TASK 23 — Organization Settings & Team Management
- `24-crm--clients-list-and-management.md` — TASK 24 — CRM — Clients List & Management
- `25-crm--client-detail-page.md` — TASK 25 — CRM — Client Detail Page
- `26-crm--leads--sales-pipeline-kanban.md` — TASK 26 — CRM — Leads / Sales Pipeline (Kanban)
- `27-crm--client-communication-log.md` — TASK 27 — CRM — Client Communication Log
- `28-crm--tags-segmentation-and-advanced-search.md` — TASK 28 — CRM — Tags, Segmentation & Advanced Search
- `29-projects--list-and-kanban-board.md` — TASK 29 — Projects — List & Kanban Board
- `30-projects--detail-page.md` — TASK 30 — Projects — Detail Page
- `31-tasks-module.md` — TASK 31 — Tasks Module
- `32-deliverables-module.md` — TASK 32 — Deliverables Module
- `33-project-templates.md` — TASK 33 — Project Templates
- `34-team-workload-view.md` — TASK 34 — Team Workload View
- `35-status-tag-system--shared-component-library.md` — TASK 35 — Status Tag System — Shared Component Library
- `36-communication-hub--architecture-and-unified-inbox-data-layer.md` — TASK 36 — Communication Hub — Architecture & Unified Inbox Data Layer
- `37-communication-hub--slack-integration.md` — TASK 37 — Communication Hub — Slack Integration
- `38-communication-hub--whatsapp-integration.md` — TASK 38 — Communication Hub — WhatsApp Integration
- `39-communication-hub--email-integration.md` — TASK 39 — Communication Hub — Email Integration
- `40-communication-hub--discord-and-upwork-channel-stubs.md` — TASK 40 — Communication Hub — Discord & Upwork Channel Stubs
- `41-communication-hub--unified-inbox-ui.md` — TASK 41 — Communication Hub — Unified Inbox UI
- `42-client-communication-mode--manual-vs-connected-workflow.md` — TASK 42 — Client Communication Mode — Manual vs Connected Workflow
- `43-ai-feature-architecture-and-model-provider-configuration.md` — TASK 43 — AI Feature Architecture & Model Provider Configuration
- `44-ai--inbox-reply-suggestions.md` — TASK 44 — AI — Inbox Reply Suggestions
- `45-ai--lead-scoring-in-the-sales-pipeline.md` — TASK 45 — AI — Lead Scoring in the Sales Pipeline
- `46-ai--auto-task-extraction-from-messages.md` — TASK 46 — AI — Auto-Task Extraction from Messages
- `47-ai--weekly-report-narrative-generation.md` — TASK 47 — AI — Weekly Report Narrative Generation
- `48-ai-settings-and-usage-controls.md` — TASK 48 — AI Settings & Usage Controls
- `49-n8n-automation-architecture-and-webhook-contracts.md` — TASK 49 — N8N Automation Architecture & Webhook Contracts
- `50-automation--project-delivered-→-invoice-trigger.md` — TASK 50 — Automation — Project Delivered → Invoice Trigger
- `51-automation--deadline-and-overdue-alerts.md` — TASK 51 — Automation — Deadline & Overdue Alerts
- `52-automation--weekly-summary-report.md` — TASK 52 — Automation — Weekly Summary Report
- `53-in-app-notification-center.md` — TASK 53 — In-App Notification Center
- `54-client-portal--auth-and-rls.md` — TASK 54 — Client Portal — Auth & RLS
- `55-client-portal--dashboard.md` — TASK 55 — Client Portal — Dashboard
- `56-client-portal--project-detail-and-approval-flow.md` — TASK 56 — Client Portal — Project Detail & Approval Flow
- `57-client-portal--invoice-and-payment-status-view.md` — TASK 57 — Client Portal — Invoice & Payment Status View
- `58-analytics-dashboard.md` — TASK 58 — Analytics Dashboard
- `59-revenue-and-plan-usage-reporting.md` — TASK 59 — Revenue & Plan-Usage Reporting
- `60-exportable-reports-pdf-csv.md` — TASK 60 — Exportable Reports (PDF/CSV)
- `61-input-validation-and-sanitization-layer.md` — TASK 61 — Input Validation & Sanitization Layer
- `62-secrets-management-and-api-security.md` — TASK 62 — Secrets Management & API Security
- `63-audit-logging.md` — TASK 63 — Audit Logging
- `64-automated-testing-setup--unit-and-integration.md` — TASK 64 — Automated Testing Setup — Unit & Integration
- `65-end-to-end-testing--critical-user-flows.md` — TASK 65 — End-to-End Testing — Critical User Flows
- `66-load-and-multi-tenant-scale-testing.md` — TASK 66 — Load & Multi-Tenant Scale Testing
- `67-environment-configuration-and-secrets-for-production.md` — TASK 67 — Environment Configuration & Secrets for Production
- `68-ci-cd-pipeline-to-contabo-vps.md` — TASK 68 — CI/CD Pipeline to Contabo VPS
- `69-n8n-workflow-activation-on-contabo-vps.md` — TASK 69 — N8N Workflow Activation on Contabo VPS
- `70-monitoring-logging-and-uptime-for-self-hosted-infrastructure.md` — TASK 70 — Monitoring, Logging & Uptime for Self-Hosted Infrastructure
- `71-final-qa-security-audit-and-demo-preparation.md` — TASK 71 — Final QA, Security Audit & Demo Preparation


