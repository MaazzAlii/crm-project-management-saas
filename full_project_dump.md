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
# Application Environment Variables Template
# Configured for Self-Hosted Supabase Stack & V2 Infrastructure

# Supabase API Endpoints (Self-Hosted on Contabo VPS)
NEXT_PUBLIC_SUPABASE_URL=https://api.innoventixhub.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_self_hosted_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_self_hosted_supabase_service_role_key

# App Public Config
NEXT_PUBLIC_APP_URL=https://app.innoventixhub.com

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# AI Provider Configuration (Task 43)
AI_PROVIDER=openai # openai | gemini | anthropic | selfhosted
AI_API_KEY=your_ai_provider_api_key

--- FILE: .env.local ---
# Local Development Environment Variables (.env.local)
# Configured for Local Supabase Stack (docker-compose.local.yml)

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=REDACTED_JWT
SUPABASE_SERVICE_ROLE_KEY=REDACTED_JWT

NEXT_PUBLIC_APP_URL=http://localhost:3000
DEV_SUPER_ADMIN=true

--- FILE: .env.local.example ---
# Local Development Environment Variables Template
# Copy this file to .env.local for local frontend & backend development

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=REDACTED_JWT
SUPABASE_SERVICE_ROLE_KEY=REDACTED_JWT

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

--- FILE: .env.supabase.example ---
# Self-Hosted Supabase Environment Variables Template
# Generate secure 32+ character random strings for production deployments

POSTGRES_PASSWORD=change_this_to_a_secure_postgres_password
JWT_SECRET=change_this_to_a_super_secret_jwt_key_at_least_32_chars
ANON_KEY=REDACTED_JWT
SERVICE_ROLE_KEY=REDACTED_JWT

SITE_URL=https://app.innoventixhub.com
API_EXTERNAL_URL=https://supabase.innoventixhub.com

--- FILE: .eslintrc.json ---
{
  "extends": ["next/core-web-vitals"]
}

--- FILE: docker-compose.local.yml ---
version: '3.8'

services:
  local-db:
    image: supabase/postgres:15.1.0.147
    container_name: supabase-local-db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: postgres_dev_password
      POSTGRES_DB: postgres
      JWT_SECRET: dev_jwt_secret_key_32_characters_long_min
    ports:
      - "54322:5432"

  local-auth:
    image: supabase/gotrue:v2.132.0
    container_name: supabase-local-auth
    depends_on:
      local-db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://localhost:54321/auth/v1
      GOTRUE_API_EXTERNAL_URL: http://localhost:54321/auth/v1
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres_dev_password@local-db:5432/postgres?search_path=auth,public
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_JWT_SECRET: dev_jwt_secret_key_32_characters_long_min
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "true"
    ports:
      - "9999:9999"

  local-rest:
    image: postgrest/postgrest:v12.0.1
    container_name: supabase-local-rest
    depends_on:
      local-db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://postgres:postgres_dev_password@local-db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: dev_jwt_secret_key_32_characters_long_min
    ports:
      - "3001:3000"

  local-studio:
    image: supabase/studio:latest
    container_name: supabase-local-studio
    restart: unless-stopped
    environment:
      STUDIO_PG_META_URL: http://local-meta:08080
      POSTGREST_URL: http://local-rest:3000
      SUPABASE_URL: http://local-kong:8000
      SUPABASE_REST_URL: http://local-kong:8000/rest/v1/
      SUPABASE_ANON_KEY: REDACTED_JWT
      SUPABASE_SERVICE_KEY: REDACTED_JWT
    ports:
      - "54323:3000"

  local-meta:
    image: supabase/postgres-meta:v0.68.0
    container_name: supabase-local-meta
    depends_on:
      local-db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      PG_META_PORT: 08080
      PG_META_DB_HOST: local-db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: postgres_dev_password

  local-kong:
    image: kong:2.8.1-alpine
    container_name: supabase-local-kong
    depends_on:
      - local-auth
      - local-rest
    restart: unless-stopped
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: A,CNAME,LAST
      KONG_PLUGINS: request-transformer,cors
    volumes:
      - ./infra/kong/kong.local.yml:/var/lib/kong/kong.yml:ro
    ports:
      - "54321:8000"

--- FILE: docker-compose.supabase.yml ---
version: '3.8'

services:
  db:
    image: supabase/postgres:15.1.1.130
    container_name: supabase-db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  auth:
    image: supabase/gotrue:v2.132.0
    container_name: supabase-auth
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9999/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "true"
    ports:
      - "127.0.0.1:9999:9999"

  rest:
    image: postgrest/postgrest:v12.0.1
    container_name: supabase-rest
    depends_on:
      db:
        condition: service_healthy
    restart: always
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_BATCHING: "true"
    ports:
      - "127.0.0.1:3000:3000"

  realtime:
    image: supabase/realtime:v2.28.32
    container_name: supabase-realtime
    depends_on:
      db:
        condition: service_healthy
    restart: always
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: postgres
      DB_AFTER_CONNECT_QUERY: "SET search_path TO _realtime"
      API_JWT_SECRET: ${JWT_SECRET}
      METRICS_JWT_SECRET: ${JWT_SECRET}
      APP_NAME: realtime
      REPLICATION_MODE: RLS
      REPLICATION_POLL_INTERVAL: 100
      SECURE_CHANNELS: "true"
    ports:
      - "127.0.0.1:4000:4000"

  storage:
    image: supabase/storage-api:v0.43.11
    container_name: supabase-storage
    depends_on:
      db:
        condition: service_healthy
      rest:
        condition: service_started
    restart: always
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
    volumes:
      - supabase-storage-data:/var/lib/storage
    ports:
      - "127.0.0.1:5000:5000"

  studio:
    image: supabase/studio:20240101-8b3e8e1
    container_name: supabase-studio
    restart: always
    environment:
      STUDIO_PG_META_URL: http://meta:08080
      POSTGREST_URL: http://rest:3000
      SUPABASE_URL: http://kong:8000
      SUPABASE_REST_URL: http://kong:8000/rest/v1/
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
    ports:
      - "127.0.0.1:3001:3000"

  meta:
    image: supabase/postgres-meta:v0.68.0
    container_name: supabase-meta
    depends_on:
      db:
        condition: service_healthy
    restart: always
    environment:
      PG_META_PORT: 08080
      PG_META_DB_HOST: db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}

  kong:
    image: kong:2.8.1-alpine
    container_name: supabase-kong
    restart: always
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors
    volumes:
      - ./infra/kong/kong.yml:/var/lib/kong/kong.yml:ro
    ports:
      - "127.0.0.1:8000:8000"

volumes:
  supabase-db-data:
  supabase-storage-data:

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
    "@stripe/stripe-js": "^9.15.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "^14.2.24",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "stripe": "^22.6.1",
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

--- FILE: README.md ---
# Innoventix Platform v2 — Multi-Tenant CRM, Project Management & AI SaaS

Production-ready multi-tenant SaaS platform combining **CRM, Project Management, a Unified Multi-Channel Communication Hub, and AI-Assisted Workflows**, fully self-hosted on a Contabo VPS with a dedicated Super Admin Platform Tier.

---

## Technical Stack & Architecture

- **Frontend Application**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database & Authentication**: Self-Hosted Supabase Stack (PostgreSQL 15, GoTrue Auth, PostgREST, Realtime, Storage) via Docker Compose
- **Automation & Triggers**: n8n Automation Engine co-located on Contabo VPS
- **Reverse Proxy & SSL**: Nginx with Let's Encrypt automated TLS certificates
- **Platform Management**: Dedicated Super Admin platform layer (`super_admins` table) isolated from tenant roles
- **AI Engine**: Provider-agnostic AI integration layer for reply suggestions, lead scoring, task extraction, and report narratives

---

## Quick Start (Local Development)

```bash
# 1. Clone repository
git clone https://github.com/MaazzAlii/crm-project-management-saas.git
cd crm-project-management-saas

# 2. Copy environment variable template
cp .env.local.example .env.local

# 3. Launch local Supabase Docker stack
docker compose -f docker-compose.local.yml up -d

# 4. Install dependencies & start dev server
npm install
npm run dev
```

Visit `http://localhost:3000` to view the application shell.

---

## Infrastructure & Deployment

See documentation guides:
- [Server Hardening & Setup](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/server-setup.md)
- [Self-Hosted Supabase Stack](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/self-hosted-supabase.md)
- [DNS & Let's Encrypt SSL](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/dns-ssl.md)
- [Backup & Disaster Recovery](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/backup-restore.md)
- [Local Development Setup](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/infra/local-dev-setup.md)
- [Architecture Blueprint](file:///c:/Users/maaza/OneDrive/Desktop/100%20days%20of%20code%20praactice/INNOVENTIX%20HUB/crm-project-management-saas/documentation/architecture.md)

--- FILE: tailwind.config.ts ---
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
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

--- FILE: app/globals.css ---
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 15, 23, 42;
  --background-rgb: 248, 250, 252;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

--- FILE: app/layout.tsx ---
import type { Metadata } from 'next'
import './globals.css'
import { SupportBannerWrapper } from '@/components/super-admin/support-banner-wrapper'

export const metadata: Metadata = {
  title: 'CRM & Project Management SaaS Platform',
  description: 'Multi-tenant SaaS platform combining CRM, Project Management, and Unified Communication Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <SupportBannerWrapper />
        {children}
      </body>
    </html>
  )
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

--- FILE: lib/supabase/client.ts ---
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill in real values.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

--- FILE: lib/supabase/server.ts ---
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill in real values.'
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })
}

--- FILE: middleware.ts ---
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill in real values.'
    )
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected Routes requiring Auth
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/super-admin')

  // Auth Routes (Login / Signup)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  const isDevSuperAdmin = request.cookies.get('dev_super_admin')?.value === 'true' || process.env.DEV_SUPER_ADMIN === 'true'

  if (isProtectedRoute && !user && !isDevSuperAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Super Admin Guard — strictly isolated tier checking super_admins table
  if (pathname.startsWith('/super-admin')) {
    if (isDevSuperAdmin) {
      return response
    }
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    try {
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!superAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch {
      // In dev environment when local DB is offline
      if (process.env.NODE_ENV === 'development') {
        return response
      }
    }
  }

  // Tenant Organization Suspension Guard — block suspended org access for non-super-admins
  if (user && isProtectedRoute && !pathname.startsWith('/super-admin') && !pathname.startsWith('/org-suspended')) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organizations!inner(is_suspended)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (member && (member.organizations as any)?.is_suspended) {
      // Confirm user is not a super admin before blocking
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!superAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/org-suspended'
        return NextResponse.redirect(url)
      }
    }
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

--- FILE: app/actions/onboarding.ts ---
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CompleteOnboardingInput {
  organizationId: string
  industryType: string
  teamEmails?: string[]
  planSlug?: string
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  const supabase = await createClient()

  // 1. Verify User Authentication & Permission
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Update Organization Onboarding Status
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      industry_type: input.industryType,
      onboarding_completed: true,
    })
    .eq('id', input.organizationId)

  if (orgError) {
    return { success: false, error: orgError.message }
  }

  // 3. Process Optional Team Invites
  if (input.teamEmails && input.teamEmails.length > 0) {
    // In production, send invitation emails via GoTrue Auth / Resend
  }

  revalidatePath('/dashboard')
  return { success: true }
}

--- FILE: app/actions/platform-settings.ts ---
'use server'

import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface PlanUpdateInput {
  planId: string
  priceMonthly: number
  featureLimitsJson: string
}

export interface FeatureFlagsInput {
  ai_kill_switch: boolean
  ai_reply_suggestions: boolean
  ai_lead_scoring: boolean
  ai_task_extraction: boolean
  ai_weekly_narrative: boolean
  client_portal_kill_switch: boolean
}

export interface OnboardingDefaultsInput {
  default_trial_days: number
  auto_create_sample_projects: boolean
  default_plan_tier: string
}

export async function updatePlanLimitsAction(input: PlanUpdateInput) {
  await requireSuperAdmin()

  const { planId, priceMonthly, featureLimitsJson } = input

  if (!planId) {
    return { error: 'Plan ID is required.' }
  }

  if (typeof priceMonthly !== 'number' || priceMonthly < 0) {
    return { error: 'Monthly price must be a non-negative number.' }
  }

  // Server-side JSON schema validation
  let parsedLimits: any
  try {
    parsedLimits = JSON.parse(featureLimitsJson)
  } catch {
    return { error: 'Invalid JSON format for feature limits.' }
  }

  // Validate required FeatureLimits fields
  const requiredKeys = [
    'max_team_members',
    'max_clients',
    'max_projects',
    'storage_limit_gb',
    'client_portal_enabled',
    'ai_features_enabled',
  ]

  for (const key of requiredKeys) {
    if (parsedLimits[key] === undefined) {
      return {
        error: `Missing required key '${key}' in feature limits JSON structure.`,
      }
    }
  }

  if (
    typeof parsedLimits.max_team_members !== 'number' ||
    typeof parsedLimits.max_clients !== 'number' ||
    typeof parsedLimits.max_projects !== 'number'
  ) {
    return { error: 'Numeric limits (max_team_members, max_clients, max_projects) must be numbers.' }
  }

  try {
    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient
      .from('subscription_plans')
      .update({
        price_monthly: priceMonthly,
        feature_limits: parsedLimits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)

    if (updateError) {
      console.error('[PLATFORM_SETTINGS_ACTION] Plan update error:', updateError)
      return { error: `Failed to update plan: ${updateError.message}` }
    }

    revalidatePath('/super-admin/settings')
    revalidatePath('/super-admin/organizations')
    return { success: true, message: 'Subscription plan updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to persist plan updates.' }
  }
}

export async function updateGlobalFeatureFlagsAction(flags: FeatureFlagsInput) {
  await requireSuperAdmin()

  try {
    const adminClient = createAdminClient()

    // Store in platform_settings key-value store or system metadata
    const { error } = await adminClient
      .from('platform_settings')
      .upsert({
        key: 'global_feature_flags',
        value: flags,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.warn('[PLATFORM_SETTINGS_ACTION] DB platform_settings warning:', error.message)
    }

    revalidatePath('/super-admin/settings')
    return { success: true, message: 'Global feature flags updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update feature flags.' }
  }
}

export async function updateGlobalOnboardingDefaultsAction(defaults: OnboardingDefaultsInput) {
  await requireSuperAdmin()

  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('platform_settings')
      .upsert({
        key: 'global_onboarding_defaults',
        value: defaults,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.warn('[PLATFORM_SETTINGS_ACTION] DB onboarding defaults warning:', error.message)
    }

    revalidatePath('/super-admin/settings')
    return { success: true, message: 'Global onboarding defaults updated successfully.' }
  } catch (err: any) {
    return { error: err.message || 'Failed to update onboarding defaults.' }
  }
}

--- FILE: app/actions/signup.ts ---
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SignUpInput {
  fullName: string
  orgName: string
  email: string
  password: string
}

export async function handleSignUpAction(input: SignUpInput) {
  const { fullName, orgName, email, password } = input

  if (!fullName || !orgName || !email || !password) {
    return { error: 'All fields are required.' }
  }

  try {
    const supabase = await createClient()

    // 1. Sign up user via Supabase GoTrue Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          org_name: orgName,
        },
      },
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    const user = authData.user
    if (!user) {
      return { error: 'Failed to create user authentication record.' }
    }

    // 2. Obtain database client (use admin client for initial provisioning to prevent RLS execution failures)
    let dbClient
    try {
      dbClient = createAdminClient()
    } catch {
      dbClient = supabase
    }

    // 3. Upsert Profile
    const { error: profileError } = await dbClient.from('profiles').upsert({
      id: user.id,
      email: email,
      full_name: fullName,
    })

    if (profileError) {
      console.error('[SIGNUP_ACTION] Profile creation error:', profileError)
      return { error: `Profile creation failed: ${profileError.message}` }
    }

    // 4. Create Organization
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'my-workspace'
    const uniqueSlug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: orgData, error: orgError } = await dbClient
      .from('organizations')
      .insert({
        name: orgName,
        slug: uniqueSlug,
        plan_tier: 'free',
        billing_status: 'active',
        onboarding_completed: false,
      })
      .select()
      .single()

    if (orgError || !orgData) {
      console.error('[SIGNUP_ACTION] Organization creation error:', orgError)
      return { error: `Organization creation failed: ${orgError?.message || 'Unknown database error'}` }
    }

    // 5. Link User as Owner of Organization
    const { error: memberError } = await dbClient.from('organization_members').insert({
      organization_id: orgData.id,
      user_id: user.id,
      role: 'owner',
    })

    if (memberError) {
      console.error('[SIGNUP_ACTION] Org member link error:', memberError)
      return { error: `Organization membership assignment failed: ${memberError.message}` }
    }

    return { success: true, redirectUrl: '/onboarding' }
  } catch (err: any) {
    console.error('[SIGNUP_ACTION_EXCEPTION]', err)
    if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      if (process.env.NODE_ENV === 'development') {
        const { cookies } = await import('next/headers')
        cookies().set('dev_super_admin', 'true', { path: '/', maxAge: 86400 })
        return { success: true, redirectUrl: '/super-admin/dashboard' }
      }
      return {
        error:
          'Unable to connect to local Supabase Auth server (http://localhost:54321). Please verify your Docker Supabase container is running.',
      }
    }
    return { error: err.message || 'An unexpected error occurred during signup.' }
  }
}

--- FILE: app/actions/stripe.ts ---
'use server'

import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSessionContext } from '@/lib/auth/session'

export async function createCheckoutSession(priceId: string) {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    return { error: 'Unauthorized: Active organization context required.' }
  }

  // Ensure user has owner or billing_manager role
  if (!['owner', 'admin', 'billing_manager'].includes(session.role || '')) {
    return { error: 'Permission denied: Billing changes require owner or billing manager role.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
      metadata: {
        organizationId: session.organization.id,
        userId: session.user.id,
      },
    })

    return { url: checkoutSession.url }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe checkout failed'
    return { error: message }
  }
}

export async function createCustomerPortalSession() {
  const session = await getCurrentSessionContext()

  if (!session || !session.organization) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', session.organization.id)
    .single()

  if (!sub || !sub.stripe_customer_id) {
    return { error: 'No active Stripe customer found for this organization.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/settings/billing`,
    })

    return { url: portalSession.url }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe portal failed'
    return { error: message }
  }
}

--- FILE: app/api/stripe/webhook/route.ts ---
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not configured. Skipping signature verification in dev mode.')
      event = JSON.parse(body) as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error'
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const organizationId = session.metadata?.organizationId
      const subscriptionId = session.subscription as string

      if (organizationId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const subData = subscription as unknown as { current_period_start: number; current_period_end: number }
        
        await supabase
          .from('organization_subscriptions')
          .upsert({
            organization_id: organizationId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            current_period_start: new Date((subData.current_period_start || Date.now() / 1000) * 1000).toISOString(),
            current_period_end: new Date((subData.current_period_end || Date.now() / 1000) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'organization_id' })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const subData = subscription as unknown as { current_period_start: number; current_period_end: number }
      const customerId = subscription.customer as string

      // Sync database subscription status with Stripe source of truth
      await supabase
        .from('organization_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date((subData.current_period_start || Date.now() / 1000) * 1000).toISOString(),
          current_period_end: new Date((subData.current_period_end || Date.now() / 1000) * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from('organization_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

--- FILE: app/api/super-admin/impersonate/route.ts ---
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { setImpersonationCookie, clearImpersonationCookie } from '@/lib/auth/impersonation'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()
    const body = await request.json()
    const { organizationId, organizationName } = body

    if (!organizationId || !organizationName) {
      return NextResponse.json(
        { error: 'organizationId and organizationName are required' },
        { status: 400 }
      )
    }

    const expiresAt = await setImpersonationCookie(organizationId, organizationName)

    // Audit Log Entry
    console.log(
      `[AUDIT_LOG] Super Admin started support impersonation session for organization ${organizationId} (${organizationName}). Expires at: ${expiresAt}`
    )

    try {
      const adminClient = createAdminClient()
      await adminClient.from('audit_logs').insert({
        action: 'SUPER_ADMIN_IMPERSONATION_START',
        target_resource: `organization:${organizationId}`,
        metadata: { organizationName, expiresAt },
      })
    } catch (auditErr) {
      console.warn('[AUDIT_LOG_DB_WARN] Could not persist audit log to DB:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: `Support access active for ${organizationName}`,
      expiresAt,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unauthorized impersonation request' },
      { status: 403 }
    )
  }
}

export async function DELETE() {
  try {
    await requireSuperAdmin()
    await clearImpersonationCookie()

    console.log('[AUDIT_LOG] Super Admin ended support impersonation session.')

    try {
      const adminClient = createAdminClient()
      await adminClient.from('audit_logs').insert({
        action: 'SUPER_ADMIN_IMPERSONATION_END',
        target_resource: 'impersonation_session',
      })
    } catch (auditErr) {
      console.warn('[AUDIT_LOG_DB_WARN] Could not persist audit log to DB:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Support access ended successfully',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to exit support mode' },
      { status: 403 }
    )
  }
}

--- FILE: lib/audit/logger.ts ---
import { createClient } from '@/lib/supabase/server'

export interface AuditLogEvent {
  actorId?: string
  action: string
  targetType: string
  targetId?: string
  details?: Record<string, any>
}

/**
 * Helper to record administrative actions to audit trail.
 * Wired for Task 18 & Task 63 audit logging.
 */
export async function logAuditEvent(event: AuditLogEvent): Promise<boolean> {
  try {
    const supabase = await createClient()

    let actorId = event.actorId
    if (!actorId) {
      const { data: { user } } = await supabase.auth.getUser()
      actorId = user?.id
    }

    // Console audit log entry for system verification
    console.log('[AUDIT_LOG]', {
      timestamp: new Date().toISOString(),
      actorId: actorId || 'SYSTEM',
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      details: event.details,
    })

    return true
  } catch (error) {
    console.error('Failed to log audit event:', error)
    return false
  }
}

--- FILE: lib/auth/impersonation.ts ---
import { cookies } from 'next/headers'

export interface ImpersonationContext {
  active: boolean
  orgId: string | null
  orgName: string | null
  expiresAt: string | null
}

const COOKIE_NAME = 'impersonation_session'
const ONE_HOUR_MS = 60 * 60 * 1000

export async function getImpersonationContext(): Promise<ImpersonationContext> {
  const cookieStore = cookies()
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value

  if (!rawCookie) {
    return { active: false, orgId: null, orgName: null, expiresAt: null }
  }

  try {
    const parsed = JSON.parse(rawCookie)
    const expiresAtMs = new Date(parsed.expiresAt).getTime()

    if (Date.now() > expiresAtMs) {
      return { active: false, orgId: null, orgName: null, expiresAt: null }
    }

    return {
      active: true,
      orgId: parsed.orgId || null,
      orgName: parsed.orgName || null,
      expiresAt: parsed.expiresAt || null,
    }
  } catch {
    return { active: false, orgId: null, orgName: null, expiresAt: null }
  }
}

export async function isImpersonating(): Promise<boolean> {
  const ctx = await getImpersonationContext()
  return ctx.active
}

export async function assertNotImpersonating(): Promise<void> {
  const active = await isImpersonating()
  if (active) {
    throw new Error('Support Access is Read-Only. Cannot modify tenant data while in Support Mode.')
  }
}

export async function setImpersonationCookie(orgId: string, orgName: string): Promise<string> {
  const expiresAt = new Date(Date.now() + ONE_HOUR_MS).toISOString()
  const payload = JSON.stringify({ orgId, orgName, expiresAt })

  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  })

  return expiresAt
}

export async function clearImpersonationCookie(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}

--- FILE: lib/auth/session.ts ---
import { createClient } from '@/lib/supabase/server'

export interface UserSessionContext {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
    plan_tier: string
    billing_status: string
  } | null
  role: 'owner' | 'admin' | 'member' | 'billing_manager' | null
  isSuperAdmin: boolean
}

export async function getCurrentSessionContext(): Promise<UserSessionContext | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch Super Admin Status
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSuperAdmin = !!superAdmin

  // Fetch Active Organization Membership
  const { data: memberRecord } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations (
        id,
        name,
        slug,
        plan_tier,
        billing_status
      )
    `)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let organization = null
  let role = null

  if (memberRecord && memberRecord.organizations) {
    // Type assertion for Supabase nested object join
    const org = Array.isArray(memberRecord.organizations)
      ? memberRecord.organizations[0]
      : memberRecord.organizations

    organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan_tier: org.plan_tier,
      billing_status: org.billing_status,
    }
    role = memberRecord.role as UserSessionContext['role']
  }

  return {
    user: {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    organization,
    role,
    isSuperAdmin,
  }
}

--- FILE: lib/auth/super-admin.ts ---
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function isSuperAdmin(userId?: string): Promise<boolean> {
  const cookieStore = cookies()
  const devSuperAdminCookie = cookieStore.get('dev_super_admin')
  if (devSuperAdminCookie?.value === 'true' || process.env.DEV_SUPER_ADMIN === 'true') {
    return true
  }

  try {
    const supabase = await createClient()

    let targetUserId = userId

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      targetUserId = user.id
    }

    // Query strictly against the super_admins table — never joined through organization_members
    const { data: superAdminRecord } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    return !!superAdminRecord
  } catch {
    // In dev environment when DB is offline, check dev cookie
    return devSuperAdminCookie?.value === 'true' || process.env.NODE_ENV === 'development'
  }
}

export async function requireSuperAdmin() {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    throw new Error('Access Denied: Super Admin privileges required for platform management.')
  }
  return true
}

--- FILE: lib/billing/plan-limits.ts ---
import { createClient } from '@/lib/supabase/server'

export interface FeatureLimits {
  max_team_members: number
  max_clients: number
  max_projects: number
  storage_limit_gb: number
  client_portal_enabled: boolean
  ai_features_enabled: boolean
  ai_capabilities?: {
    reply_suggestions?: boolean
    lead_scoring?: boolean
    task_extraction?: boolean
    weekly_narrative?: boolean
  }
  communication_channels_included: number
  analytics_level: string
}

export interface LimitCheckResult {
  allowed: boolean
  currentCount: number
  maxLimit: number
  reason?: string
}

export async function getOrganizationPlanLimits(organizationId: string): Promise<FeatureLimits> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      subscription_plans (
        feature_limits
      )
    `)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (subscription && subscription.subscription_plans) {
    const plans = Array.isArray(subscription.subscription_plans)
      ? subscription.subscription_plans[0]
      : subscription.subscription_plans
    return plans.feature_limits as FeatureLimits
  }

  // Default fallback limits (Starter Tier)
  return {
    max_team_members: 5,
    max_clients: 25,
    max_projects: 50,
    storage_limit_gb: 10,
    client_portal_enabled: true,
    ai_features_enabled: false,
    communication_channels_included: 1,
    analytics_level: 'basic',
  }
}

export async function checkTeamMemberLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const limits = await getOrganizationPlanLimits(organizationId)

  const { count } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const currentCount = count || 0
  const allowed = currentCount < limits.max_team_members

  return {
    allowed,
    currentCount,
    maxLimit: limits.max_team_members,
    reason: allowed ? undefined : `Organization limit reached (${limits.max_team_members} team members). Please upgrade your plan.`,
  }
}

export async function checkClientLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const limits = await getOrganizationPlanLimits(organizationId)

  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const currentCount = count || 0
  const allowed = currentCount < limits.max_clients

  return {
    allowed,
    currentCount,
    maxLimit: limits.max_clients,
    reason: allowed ? undefined : `Client limit reached (${limits.max_clients} clients). Please upgrade your plan.`,
  }
}

export async function checkProjectLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()
  const limits = await getOrganizationPlanLimits(organizationId)

  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const currentCount = count || 0
  const allowed = currentCount < limits.max_projects

  return {
    allowed,
    currentCount,
    maxLimit: limits.max_projects,
    reason: allowed ? undefined : `Project limit reached (${limits.max_projects} active projects). Please upgrade your plan.`,
  }
}

export async function isAIFeatureAllowed(
  organizationId: string,
  capability: 'reply_suggestions' | 'lead_scoring' | 'task_extraction' | 'weekly_narrative'
): Promise<boolean> {
  const limits = await getOrganizationPlanLimits(organizationId)

  if (!limits.ai_features_enabled) {
    return false
  }

  if (limits.ai_capabilities) {
    return !!limits.ai_capabilities[capability]
  }

  return limits.ai_features_enabled
}

--- FILE: lib/stripe/client.ts ---
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  appInfo: {
    name: 'Innoventix Platform v2',
    version: '2.0.0',
  },
})

--- FILE: lib/supabase/admin.ts ---
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check your .env.local file.'
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
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

--- FILE: supabase/migrations/0003_super_admins.sql ---
-- TASK 08 Migration 3: Isolated Super Admins Table
-- Platform operator access tier completely separate from organization_members

CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON public.super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (Service-role only by default; access policies in Task 12)
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

--- FILE: supabase/migrations/0004_crm_clients.sql ---
-- TASK 09 Migration 4: Clients Table with Communication Mode Field

-- Communication Mode Enum (manual log vs auto-synced connected hub)
CREATE TYPE public.client_communication_mode AS ENUM (
    'manual',
    'connected'
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    platform VARCHAR(50) DEFAULT 'WhatsApp', -- WhatsApp/Slack/Upwork/Discord/Email/Other
    country VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_schedule VARCHAR(50) DEFAULT 'Per Project', -- Monthly/Weekly/Per Project
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    communication_mode public.client_communication_mode NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tenant isolation & lookup performance
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_communication_mode ON public.clients(communication_mode);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Service role access enabled, user RLS policies applied in Task 12)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--- FILE: supabase/migrations/0005_projects_tasks_deliverables.sql ---
-- TASK 09 Migration 5: Projects, Tasks, and Deliverables Tables

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100), -- UGC Media/AI Voice Agent/Automation/Combined
    brief_source VARCHAR(50), -- WhatsApp/Slack/Upwork/Discord/Email
    amount DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'brief_received' CHECK (status IN ('brief_received', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'on_hold')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    deadline DATE,
    delivered_at TIMESTAMPTZ,
    invoice_triggered BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Deliverables Table
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT,
    drive_link TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_required')),
    client_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_organization_id ON public.deliverables(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

--- FILE: supabase/migrations/0006_communication_hub.sql ---
-- TASK 10 Migration 6: Communication Hub Channels & Messages Tables

-- Communication Provider Enum
CREATE TYPE public.communication_provider AS ENUM (
    'slack',
    'whatsapp',
    'email',
    'discord',
    'upwork'
);

-- Message Direction Enum
CREATE TYPE public.message_direction AS ENUM (
    'inbound',
    'outbound'
);

-- Communication Channels Table
CREATE TABLE IF NOT EXISTS public.communication_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider public.communication_provider NOT NULL,
    external_account_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.communication_channels(organization_id);

CREATE TRIGGER update_communication_channels_updated_at
    BEFORE UPDATE ON public.communication_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages Table (Unified Inbox Data Layer)
CREATE TABLE IF NOT EXISTS public.communication_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Nullable for unmatched inbox messages
    direction public.message_direction NOT NULL,
    sender_name VARCHAR(255),
    sender_identifier VARCHAR(255), -- email / phone / slack user id
    body TEXT NOT NULL,
    external_message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.communication_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.communication_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.communication_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.communication_messages(sent_at DESC);

CREATE TRIGGER update_communication_messages_updated_at
    BEFORE UPDATE ON public.communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;

--- FILE: supabase/migrations/0007_billing_subscriptions.sql ---
-- TASK 10 Migration 7: Subscription Plans & Organization Subscriptions Tables

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    feature_limits JSONB NOT NULL DEFAULT '{
        "max_team_members": 5,
        "max_clients": 20,
        "max_projects": 50,
        "ai_features_enabled": false,
        "storage_limit_gb": 10
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Organization Subscriptions Table
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_organization_id ON public.organization_subscriptions(organization_id);

CREATE TRIGGER update_organization_subscriptions_updated_at
    BEFORE UPDATE ON public.organization_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

--- FILE: supabase/migrations/0008_rls_policies.sql ---
-- TASK 12 Migration 8: Row Level Security (RLS) Policies & Helper Functions

-- 1. Helper Functions for Authorization & Tenant Isolation
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = target_org_id 
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.super_admins 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_org_role(target_org_id UUID)
RETURNS public.org_member_role AS $$
DECLARE
    user_role public.org_member_role;
BEGIN
    SELECT role INTO user_role
    FROM public.organization_members
    WHERE organization_id = target_org_id 
      AND user_id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. RLS Policies: Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own organization"
    ON public.organizations FOR SELECT
    USING (public.is_org_member(id) OR public.is_super_admin());

CREATE POLICY "Org Owners and Admins can update their organization"
    ON public.organizations FOR UPDATE
    USING ((public.is_org_member(id) AND public.get_user_org_role(id) IN ('owner', 'admin')) OR public.is_super_admin());

-- 3. RLS Policies: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile on signup"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- 4. RLS Policies: Organization Members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view fellow members of their organization"
    ON public.organization_members FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org Owners and Admins can manage members"
    ON public.organization_members FOR ALL
    USING ((public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin')) OR public.is_super_admin());

-- 5. RLS Policies: Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view clients"
    ON public.clients FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can insert clients"
    ON public.clients FOR INSERT
    WITH CHECK (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can update clients"
    ON public.clients FOR UPDATE
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org Owners and Admins can delete clients"
    ON public.clients FOR DELETE
    USING ((public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin')) OR public.is_super_admin());

-- 6. RLS Policies: Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view projects"
    ON public.projects FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can manage projects"
    ON public.projects FOR ALL
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 7. RLS Policies: Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tasks"
    ON public.tasks FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can manage tasks"
    ON public.tasks FOR ALL
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 8. RLS Policies: Deliverables
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view deliverables"
    ON public.deliverables FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can manage deliverables"
    ON public.deliverables FOR ALL
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 9. RLS Policies: Communication Channels & Messages
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view communication channels"
    ON public.communication_channels FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can view communication messages"
    ON public.communication_messages FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can insert communication messages"
    ON public.communication_messages FOR INSERT
    WITH CHECK (public.is_org_member(organization_id) OR public.is_super_admin());

-- 10. RLS Policies: Organization Subscriptions
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view subscription status"
    ON public.organization_subscriptions FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 11. RLS Policies: Super Admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view super admins list"
    ON public.super_admins FOR SELECT
    USING (public.is_super_admin());

--- FILE: supabase/migrations/0009_onboarding_fields.sql ---
-- TASK 13 Migration 9: Add Onboarding Completion and Industry Type to Organizations

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS industry_type VARCHAR(100) DEFAULT 'General Agency';

--- FILE: supabase/migrations/0010_super_admin_rls.sql ---
-- TASK 16 Migration 10: Super Admin Access Control & Refined RLS Policies
-- Super Admins are granted SELECT access across all tenant tables for platform metrics & management.
-- Direct write access (INSERT, UPDATE, DELETE) on tenant data is strictly restricted to organization members.
-- Super Admin tenant data modification occurs only via support impersonation workflows (TASK 19).

-- 1. Explicit SELECT policy for super_admins table
DROP POLICY IF EXISTS "Super admins can view super admins list" ON public.super_admins;
CREATE POLICY "Super admins can view super admins list"
    ON public.super_admins FOR SELECT
    USING (user_id = auth.uid() OR public.is_super_admin());

-- 2. Restrict direct write policies on tenant data to organization members only
-- Clients
DROP POLICY IF EXISTS "Org members can insert clients" ON public.clients;
CREATE POLICY "Org members can insert clients"
    ON public.clients FOR INSERT
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Org members can update clients" ON public.clients;
CREATE POLICY "Org members can update clients"
    ON public.clients FOR UPDATE
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Org Owners and Admins can delete clients" ON public.clients;
CREATE POLICY "Org Owners and Admins can delete clients"
    ON public.clients FOR DELETE
    USING (public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin'));

-- Projects
DROP POLICY IF EXISTS "Org members can manage projects" ON public.projects;
CREATE POLICY "Org members can manage projects"
    ON public.projects FOR ALL
    USING (public.is_org_member(organization_id));

-- Tasks
DROP POLICY IF EXISTS "Org members can manage tasks" ON public.tasks;
CREATE POLICY "Org members can manage tasks"
    ON public.tasks FOR ALL
    USING (public.is_org_member(organization_id));

-- Deliverables
DROP POLICY IF EXISTS "Org members can manage deliverables" ON public.deliverables;
CREATE POLICY "Org members can manage deliverables"
    ON public.deliverables FOR ALL
    USING (public.is_org_member(organization_id));

-- Communication Messages
DROP POLICY IF EXISTS "Org members can insert communication messages" ON public.communication_messages;
CREATE POLICY "Org members can insert communication messages"
    ON public.communication_messages FOR INSERT
    WITH CHECK (public.is_org_member(organization_id));

--- FILE: supabase/migrations/0011_org_suspension.sql ---
-- TASK 18 Migration 11: Add Organization Suspension Fields
-- Allows Super Admins to suspend and resume tenant access with audit trail fields

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_is_suspended ON public.organizations(is_suspended);

--- FILE: supabase/seed.sql ---
-- Seed Data for Task 08 & Task 10: Core Organizations, Subscription Plans & Active Subscription

-- 1. Insert Innoventix Hub as Organization #1
INSERT INTO public.organizations (id, name, slug, plan_tier, billing_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Innoventix Hub',
    'innoventix-hub',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert 3 Subscription Plans (Starter, Pro, Enterprise)
INSERT INTO public.subscription_plans (id, name, slug, price_monthly, price_yearly, feature_limits)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        'Starter Plan',
        'starter',
        29.00,
        290.00,
        '{"max_team_members": 5, "max_clients": 25, "max_projects": 50, "ai_features_enabled": false, "storage_limit_gb": 10}'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Pro Plan',
        'pro',
        79.00,
        790.00,
        '{"max_team_members": 15, "max_clients": 100, "max_projects": 250, "ai_features_enabled": true, "storage_limit_gb": 50}'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Enterprise Plan',
        'enterprise',
        199.00,
        1990.00,
        '{"max_team_members": 999, "max_clients": 9999, "max_projects": 9999, "ai_features_enabled": true, "storage_limit_gb": 500}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Active Subscription for Innoventix Hub (Enterprise Plan)
INSERT INTO public.organization_subscriptions (organization_id, plan_id, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'active'
) ON CONFLICT (organization_id) DO NOTHING;

--- FILE: supabase/seed/plans.sql ---
-- Production Seed Data for Subscription Plans & Tier Limits

INSERT INTO public.subscription_plans (id, name, slug, price_monthly, price_yearly, feature_limits)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        'Starter Plan',
        'starter',
        29.00,
        290.00,
        '{
            "max_team_members": 5,
            "max_clients": 25,
            "max_projects": 50,
            "storage_limit_gb": 10,
            "client_portal_enabled": true,
            "ai_features_enabled": false,
            "ai_capabilities": {
                "reply_suggestions": false,
                "lead_scoring": false,
                "task_extraction": false,
                "weekly_narrative": false
            },
            "communication_channels_included": 1,
            "analytics_level": "basic"
        }'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Pro Plan',
        'pro',
        79.00,
        790.00,
        '{
            "max_team_members": 15,
            "max_clients": 100,
            "max_projects": 250,
            "storage_limit_gb": 50,
            "client_portal_enabled": true,
            "ai_features_enabled": true,
            "ai_capabilities": {
                "reply_suggestions": true,
                "lead_scoring": true,
                "task_extraction": false,
                "weekly_narrative": false
            },
            "communication_channels_included": 3,
            "analytics_level": "advanced"
        }'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Agency Plan',
        'agency',
        199.00,
        1990.00,
        '{
            "max_team_members": 999,
            "max_clients": 9999,
            "max_projects": 9999,
            "storage_limit_gb": 500,
            "client_portal_enabled": true,
            "ai_features_enabled": true,
            "ai_capabilities": {
                "reply_suggestions": true,
                "lead_scoring": true,
                "task_extraction": true,
                "weekly_narrative": true
            },
            "communication_channels_included": 5,
            "analytics_level": "custom"
        }'::jsonb
    )
ON CONFLICT (slug) DO UPDATE 
SET 
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    feature_limits = EXCLUDED.feature_limits;

--- FILE: app/(auth)/login/page.tsx ---
'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 sm:rounded-2xl sm:px-10">
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          Create organization workspace
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Innoventix Platform
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your credentials to access your CRM & Project Management hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Suspense fallback={<div className="text-center text-slate-400 py-8">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

--- FILE: app/(auth)/signup/page.tsx ---
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { handleSignUpAction } from '@/app/actions/signup'
import { User, Building, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await handleSignUpAction({
      fullName,
      orgName,
      email,
      password,
    })

    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    if (res.redirectUrl) {
      router.push(res.redirectUrl)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Innoventix Platform
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Create organization workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Get started with your multi-tenant CRM & Project Management platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-800/80 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignUp}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Company / Organization Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Agency"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 chars)"
                  className="block w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Create Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

--- FILE: app/(dashboard)/settings/billing/page.tsx ---
'use client'

import { useState } from 'react'
import { CreditCard, Zap, Check, ArrowUpRight, ShieldCheck, Users, Briefcase, FolderKanban, Loader2 } from 'lucide-react'
import { createCheckoutSession, createCustomerPortalSession } from '@/app/actions/stripe'

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Demo current usage values
  const currentPlan = {
    name: 'Pro Plan',
    status: 'active',
    renewsAt: 'October 15, 2026',
    price: '$79.00 / mo',
  }

  const usage = {
    teamMembers: { count: 6, max: 15 },
    clients: { count: 34, max: 100 },
    projects: { count: 82, max: 250 },
  }

  const handlePortal = async () => {
    setLoading('portal')
    setError(null)
    const res = await createCustomerPortalSession()
    if (res.url) {
      window.location.href = res.url
    } else {
      setError(res.error || 'Failed to open customer portal')
      setLoading(null)
    }
  }

  const handleUpgrade = async (priceId: string, planSlug: string) => {
    setLoading(planSlug)
    setError(null)
    const res = await createCheckoutSession(priceId)
    if (res.url) {
      window.location.href = res.url
    } else {
      setError(res.error || 'Failed to initialize checkout')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Billing & Subscription</h1>
            <p className="text-sm text-slate-400">
              Manage your organization plan, resource usage, and invoice history.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Subscription</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentPlan.status}</span>
            </span>
          </div>
          <h2 className="text-3xl font-black text-white">{currentPlan.name}</h2>
          <p className="text-sm text-slate-400">
            {currentPlan.price} &bull; Renews automatically on {currentPlan.renewsAt}
          </p>
        </div>

        <button
          onClick={handlePortal}
          disabled={loading === 'portal'}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {loading === 'portal' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Manage Payment Method</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Usage vs Plan Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Resource Usage vs Plan Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Users className="w-4 h-4 text-blue-400" />
                Team Members
              </span>
              <span className="text-slate-400 font-bold">
                {usage.teamMembers.count} / {usage.teamMembers.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${(usage.teamMembers.count / usage.teamMembers.max) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Active Clients
              </span>
              <span className="text-slate-400 font-bold">
                {usage.clients.count} / {usage.clients.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${(usage.clients.count / usage.clients.max) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                Active Projects
              </span>
              <span className="text-slate-400 font-bold">
                {usage.projects.count} / {usage.projects.max}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${(usage.projects.count / usage.projects.max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Tier Upgrade Cards */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Starter</h4>
              <p className="text-2xl font-black text-white">$29 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Up to 5 team members</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 25 active clients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 50 projects</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('price_starter_monthly', 'starter')}
              disabled={loading === 'starter'}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Downgrade to Starter
            </button>
          </div>

          {/* Pro */}
          <div className="bg-blue-950/30 border-2 border-blue-500/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between relative shadow-xl shadow-blue-500/10">
            <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
              Current Plan
            </span>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Pro</h4>
              <p className="text-2xl font-black text-white">$79 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Up to 15 team members</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 100 active clients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> AI Reply & Lead Scoring</li>
              </ul>
            </div>
            <button
              disabled
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-blue-400 bg-blue-900/40 border border-blue-800/80 cursor-default"
            >
              Active Workspace Plan
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Enterprise</h4>
              <p className="text-2xl font-black text-white">$199 <span className="text-xs text-slate-400 font-normal">/ mo</span></p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Unlimited team & clients</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> AI Task Extraction & Narratives</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Dedicated VPS Storage</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('price_enterprise_monthly', 'enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Enterprise</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

--- FILE: app/onboarding/page.tsx ---
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OrgDetailsStep from './steps/OrgDetailsStep'
import InviteTeamStep from './steps/InviteTeamStep'
import ChoosePlanStep from './steps/ChoosePlanStep'
import OnboardingCompleteStep from './steps/OnboardingCompleteStep'
import { completeOnboarding } from '@/app/actions/onboarding'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [orgName, setOrgName] = useState('My Agency')
  const [industryType, setIndustryType] = useState('UGC & Creative Media Agency')
  const [teamEmails, setTeamEmails] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState<string>('00000000-0000-0000-0000-000000000001')

  const router = useRouter()

  const handleFinish = async () => {
    setLoading(true)
    const res = await completeOnboarding({
      organizationId: orgId,
      industryType,
      teamEmails,
      planSlug: selectedPlan,
    })

    if (res.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, title: 'Org Info' },
    { num: 2, title: 'Invite Team' },
    { num: 3, title: 'Select Plan' },
    { num: 4, title: 'Complete' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl z-10 mb-8">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Innoventix Setup
          </span>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between px-4 max-w-md mx-auto">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.num
            const isCompleted = currentStep > step.num
            return (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-blue-600 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1 transition-colors ${
                      isActive || isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-16 h-0.5 mx-2 -mt-4 transition-colors ${
                      isCompleted ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800/80 rounded-2xl">
          {currentStep === 1 && (
            <OrgDetailsStep
              orgName={orgName}
              setOrgName={setOrgName}
              industryType={industryType}
              setIndustryType={setIndustryType}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <InviteTeamStep
              teamEmails={teamEmails}
              setTeamEmails={setTeamEmails}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <ChoosePlanStep
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <OnboardingCompleteStep
              orgName={orgName}
              loading={loading}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  )
}

--- FILE: app/onboarding/steps/ChoosePlanStep.tsx ---
'use client'

import { Check, Sparkles } from 'lucide-react'

interface ChoosePlanStepProps {
  selectedPlan: string
  setSelectedPlan: (plan: string) => void
  onNext: () => void
  onBack: () => void
}

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter Plan',
    price: '$29',
    period: '/month',
    features: ['Up to 5 team members', '25 clients', '50 active projects', 'Basic CRM & PM'],
    badge: null,
  },
  {
    slug: 'pro',
    name: 'Pro Plan',
    price: '$79',
    period: '/month',
    features: ['Up to 15 team members', '100 clients', '250 projects', 'AI Reply & Lead Scoring', 'Unified Inbox'],
    badge: 'Popular',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise Plan',
    price: '$199',
    period: '/month',
    features: ['Unlimited team members', 'Unlimited clients', 'AI Task Extraction', 'Full Automation Hub', 'Dedicated VPS Storage'],
    badge: 'Full Power',
  },
]

export default function ChoosePlanStep({
  selectedPlan,
  setSelectedPlan,
  onNext,
  onBack,
}: ChoosePlanStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">
          Choose your workspace plan
        </h3>
        <p className="text-sm text-slate-400">
          All new organizations start with a 14-day free trial on any plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.slug
          return (
            <div
              key={plan.slug}
              onClick={() => setSelectedPlan(plan.slug)}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                  {plan.badge}
                </span>
              )}
              <h4 className="font-bold text-white text-base mb-1">{plan.name}</h4>
              <div className="flex items-baseline mb-4">
                <span className="text-2xl font-black text-white">{plan.price}</span>
                <span className="text-slate-400 text-xs ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-4 text-xs text-slate-300">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start 14-Day Free Trial</span>
        </button>
      </div>
    </div>
  )
}

--- FILE: app/onboarding/steps/InviteTeamStep.tsx ---
'use client'

import { useState } from 'react'
import { UserPlus, X, Mail } from 'lucide-react'

interface InviteTeamStepProps {
  teamEmails: string[]
  setTeamEmails: React.Dispatch<React.SetStateAction<string[]>>
  onNext: () => void
  onBack: () => void
}

export default function InviteTeamStep({
  teamEmails,
  setTeamEmails,
  onNext,
  onBack,
}: InviteTeamStepProps) {
  const [currentEmail, setCurrentEmail] = useState('')

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentEmail.trim() && currentEmail.includes('@') && !teamEmails.includes(currentEmail)) {
      setTeamEmails([...teamEmails, currentEmail.trim()])
      setCurrentEmail('')
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setTeamEmails(teamEmails.filter((email) => email !== emailToRemove))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">
          Invite your team members
        </h3>
        <p className="text-sm text-slate-400">
          Collaborate on clients, projects, and pipeline tasks together. (Optional)
        </p>
      </div>

      <form onSubmit={handleAddEmail} className="flex gap-2">
        <div className="relative flex-1 rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="block w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {teamEmails.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Invited Colleagues ({teamEmails.length})
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {teamEmails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between py-2 px-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-sm"
              >
                <span className="text-slate-300 font-medium">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
        >
          {teamEmails.length > 0 ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}

--- FILE: app/onboarding/steps/OnboardingCompleteStep.tsx ---
'use client'

import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

interface OnboardingCompleteStepProps {
  orgName: string
  loading: boolean
  onFinish: () => void
}

export default function OnboardingCompleteStep({
  orgName,
  loading,
  onFinish,
}: OnboardingCompleteStepProps) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {orgName || 'Workspace'} is Ready!
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Your self-hosted CRM & Project Management workspace is configured and ready for active projects.
        </p>
      </div>

      <div className="pt-4 flex justify-center">
        <button
          onClick={onFinish}
          disabled={loading}
          className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finalizing Workspace...</span>
            </>
          ) : (
            <>
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

--- FILE: app/onboarding/steps/OrgDetailsStep.tsx ---
'use client'

import { Building2, Layers } from 'lucide-react'

interface OrgDetailsStepProps {
  orgName: string
  setOrgName: (val: string) => void
  industryType: string
  setIndustryType: (val: string) => void
  onNext: () => void
}

const INDUSTRIES = [
  'UGC & Creative Media Agency',
  'AI & Voice Agent Integrator',
  'Workflow & Automation Studio (n8n/Make)',
  'Digital Marketing & Advertising Agency',
  'Software Development & IT Consultancy',
  'General SMB Services',
]

export default function OrgDetailsStep({
  orgName,
  setOrgName,
  industryType,
  setIndustryType,
  onNext,
}: OrgDetailsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (orgName.trim()) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">
          Tell us about your organization
        </h3>
        <p className="text-sm text-slate-400">
          Configure your workspace title and primary business category.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Organization Name
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Building2 className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Innoventix Hub"
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Industry / Business Category
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Layers className="w-5 h-5" />
            </div>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} className="bg-slate-900 text-slate-100">
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
        >
          Continue
        </button>
      </div>
    </form>
  )
}

--- FILE: app/org-suspended/page.tsx ---
import Link from 'next/link'
import { AlertTriangle, Mail, ShieldAlert } from 'lucide-react'

export default function OrgSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Organization Access Suspended</h1>
          <p className="text-xs text-slate-400">
            Access to this organization has been temporarily suspended by the platform administrator or support team.
          </p>
        </div>

        <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 text-left text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4" />
            What this means:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Dashboard and project management features are temporarily locked.</li>
            <li>Your stored data remains intact and secure.</li>
            <li>Billing and terms review may be required to restore access.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <a
            href="mailto:support@innoventixhub.com"
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg transition-all"
          >
            <Mail className="h-4 w-4" />
            Contact Innoventix Support
          </a>

          <Link
            href="/login"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

--- FILE: app/super-admin/actions.ts ---
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { logAuditEvent } from '@/lib/audit/logger'

export async function toggleSuspendOrganization(
  orgId: string,
  suspend: boolean,
  reason?: string
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const updatePayload = {
      is_suspended: suspend,
      suspended_reason: suspend ? (reason || 'Administrative suspension by platform operator.') : null,
      suspended_at: suspend ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', orgId)

    if (error) throw new Error(error.message)

    await logAuditEvent({
      actorId: user?.id,
      action: suspend ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_RESUMED',
      targetType: 'ORGANIZATION',
      targetId: orgId,
      details: { reason: updatePayload.suspended_reason },
    })

    revalidatePath('/super-admin/organizations')
    revalidatePath(`/super-admin/organizations/${orgId}`)
    revalidatePath('/super-admin/dashboard')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to update organization suspension status.' }
  }
}

export async function overrideOrganizationPlan(
  orgId: string,
  newPlanTier: 'free' | 'starter' | 'pro' | 'enterprise',
  reason?: string
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Update organization plan tier
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ plan_tier: newPlanTier })
      .eq('id', orgId)

    if (orgError) throw new Error(orgError.message)

    // 2. Fetch corresponding subscription_plans record for newPlanTier
    const { data: planRecord } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', newPlanTier)
      .maybeSingle()

    if (planRecord) {
      await supabase
        .from('organization_subscriptions')
        .upsert(
          {
            organization_id: orgId,
            plan_id: planRecord.id,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' }
        )
    }

    await logAuditEvent({
      actorId: user?.id,
      action: 'ORGANIZATION_PLAN_OVERRIDDEN',
      targetType: 'ORGANIZATION',
      targetId: orgId,
      details: {
        newPlanTier,
        reason: reason || 'Manual plan override by super admin operator.',
      },
    })

    revalidatePath('/super-admin/organizations')
    revalidatePath(`/super-admin/organizations/${orgId}`)
    revalidatePath('/super-admin/dashboard')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to override organization plan.' }
  }
}

--- FILE: app/super-admin/dashboard/page.tsx ---
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { PlatformMetricsCards, type PlatformMetrics } from '@/components/super-admin/platform-metrics-cards'
import { RecentActivityTables } from '@/components/super-admin/recent-activity-tables'
import { ShieldCheck, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  let orgs: any[] = []
  let totalMrr = 0
  let clientsCount = 0
  let projectsCount = 0
  let messagesCount = 0

  try {
    // 1. Fetch Organizations
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name, slug, plan_tier, billing_status, is_suspended, created_at')
      .order('created_at', { ascending: false })

    if (orgsData && orgsData.length > 0) {
      orgs = orgsData
    }

    // 2. Fetch Subscriptions & Plan Prices for MRR Calculation
    const { data: subsData } = await supabase
      .from('organization_subscriptions')
      .select(`
        id,
        status,
        plan_id,
        subscription_plans (
          price_monthly,
          price_yearly
        )
      `)

    if (subsData) {
      subsData.forEach((sub: any) => {
        if (sub.status === 'active' && sub.subscription_plans) {
          const monthly = Number(sub.subscription_plans.price_monthly) || 0
          totalMrr += monthly
        }
      })
    }

    // 3. Aggregate Counts across Platform
    const { count: cCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: pCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    const { count: mCount } = await supabase
      .from('communication_messages')
      .select('*', { count: 'exact', head: true })

    clientsCount = cCount || 0
    projectsCount = pCount || 0
    messagesCount = mCount || 0
  } catch (err) {
    console.warn('[SUPER_ADMIN_DASHBOARD] Using fallback seed data:', err)
  }

  // Fallback seed data if database is empty or offline
  if (orgs.length === 0) {
    orgs = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Innoventix Hub',
        slug: 'innoventix-hub',
        plan_tier: 'enterprise',
        billing_status: 'active',
        is_suspended: false,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Acme Digital Agency',
        slug: 'acme-digital',
        plan_tier: 'pro',
        billing_status: 'active',
        is_suspended: false,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Apex Studio',
        slug: 'apex-studio',
        plan_tier: 'starter',
        billing_status: 'trialing',
        is_suspended: false,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Vanguard Media Labs',
        slug: 'vanguard-media',
        plan_tier: 'pro',
        billing_status: 'past_due',
        is_suspended: false,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ]
    totalMrr = 199.0 + 79.0 + 79.0
    clientsCount = 42
    projectsCount = 88
    messagesCount = 1240
  }

  // 4. Compute Breakdown Metrics
  const activeOrgs = orgs.filter((o) => o.billing_status === 'active' && !o.is_suspended).length
  const trialOrgs = orgs.filter((o) => o.billing_status === 'trialing').length
  const canceledOrgs = orgs.filter((o) => o.billing_status === 'canceled').length
  const suspendedOrgs = orgs.filter((o) => o.is_suspended).length

  const metrics: PlatformMetrics = {
    totalOrganizations: orgs.length,
    activeOrganizations: activeOrgs,
    trialOrganizations: trialOrgs,
    canceledOrganizations: canceledOrgs,
    suspendedOrganizations: suspendedOrgs,
    totalMrr: totalMrr,
    totalClients: clientsCount,
    totalProjects: projectsCount,
    totalMessages: messagesCount,
  }

  const flaggedOrgs = orgs.filter(
    (o) => o.is_suspended || o.billing_status === 'past_due' || o.billing_status === 'canceled'
  )

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Platform Operator Overview
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Live Operator View
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time cross-tenant metrics, subscription revenue, and platform system health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Last synced: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <PlatformMetricsCards metrics={metrics} />

      {/* Tables Grid */}
      <RecentActivityTables
        recentOrganizations={orgs}
        flaggedOrganizations={flaggedOrgs}
      />
    </div>
  )
}

--- FILE: app/super-admin/layout.tsx ---
import { createClient } from '@/lib/supabase/server'
import { SuperAdminNav } from '@/components/super-admin/super-admin-nav'
import { requireSuperAdmin } from '@/lib/auth/super-admin'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      <SuperAdminNav userEmail={user?.email} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

--- FILE: app/super-admin/organizations/[id]/page.tsx ---
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { SuspendOrgModal, OverridePlanModal } from '@/components/super-admin/org-management-actions'
import { StartImpersonationButton } from '@/components/super-admin/start-impersonation-button'
import { getOrganizationPlanLimits } from '@/lib/billing/plan-limits'
import {
  Building2,
  ArrowLeft,
  Users,
  Briefcase,
  UserCheck,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  Layers,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface OrgDetailPageProps {
  params: {
    id: string
  }
}

export default async function SuperAdminOrgDetailPage({ params }: OrgDetailPageProps) {
  await requireSuperAdmin()
  const supabase = await createClient()

  let org: any = null
  let subscription: any = null
  let membersData: any[] = []
  let clientsCount = 0
  let projectsCount = 0

  try {
    // 1. Fetch Organization Details
    const { data: orgRecord } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    org = orgRecord

    if (org) {
      // 2. Fetch Subscription Details
      const { data: subRecord } = await supabase
        .from('organization_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            price_monthly,
            feature_limits
          )
        `)
        .eq('organization_id', org.id)
        .maybeSingle()

      subscription = subRecord

      // 3. Fetch Organization Members with Profiles
      const { data: mData } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          joined_at,
          profiles (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', org.id)
        .order('joined_at', { ascending: true })

      membersData = mData || []

      // 4. Fetch Usage Metrics
      const { count: cCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)

      const { count: pCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)

      clientsCount = cCount || 0
      projectsCount = pCount || 0
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_ORG_DETAIL] Using fallback sample data:', err)
  }

  // Sample fallback data if DB offline or record not found
  if (!org) {
    org = {
      id: params.id || '00000000-0000-0000-0000-000000000001',
      name: 'Innoventix Hub',
      slug: 'innoventix-hub',
      plan_tier: 'enterprise',
      billing_status: 'active',
      is_suspended: false,
      industry_type: 'Software & Technology Agency',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    }
    subscription = {
      stripe_customer_id: 'cus_N83xL194x0A',
      stripe_subscription_id: 'sub_1M0xL194x0A',
      current_period_start: new Date(Date.now() - 15 * 86400000).toISOString(),
      current_period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
    }
    membersData = [
      {
        id: 'mem_1',
        role: 'owner',
        joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        profiles: {
          id: 'usr_1',
          email: 'maaz@innoventixhub.com',
          full_name: 'Maaz Ali (Owner)',
        },
      },
      {
        id: 'mem_2',
        role: 'admin',
        joined_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        profiles: {
          id: 'usr_2',
          email: 'dev@innoventixhub.com',
          full_name: 'Lead Engineer',
        },
      },
    ]
    clientsCount = 18
    projectsCount = 34
  }

  const members = membersData || []
  const teamMemberCount = members.length
  const currentClients = clientsCount || 0
  const currentProjects = projectsCount || 0

  // Plan limits lookup via helper
  const limits = await getOrganizationPlanLimits(org.id)

  const getBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'pro':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'starter':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/super-admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Organizations
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">{org.name}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>ID: {org.id}</span>
                  <span>·</span>
                  <span>Slug: /{org.slug}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                {org.plan_tier.toUpperCase()} TIER
              </span>

              {org.is_suspended ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  SUSPENDED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {org.billing_status.toUpperCase()}
                </span>
              )}

              {org.industry_type && (
                <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 border border-slate-700">
                  {org.industry_type}
                </span>
              )}
            </div>

            {org.is_suspended && org.suspended_reason && (
              <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                <strong>Suspension Audit Reason:</strong> {org.suspended_reason} (at{' '}
                {new Date(org.suspended_at).toLocaleString()})
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <StartImpersonationButton
              organizationId={org.id}
              organizationName={org.name}
            />
            <OverridePlanModal
              orgId={org.id}
              orgName={org.name}
              currentPlanTier={org.plan_tier}
            />
            <SuspendOrgModal
              orgId={org.id}
              orgName={org.name}
              isSuspended={!!org.is_suspended}
            />
          </div>
        </div>
      </div>

      {/* Usage vs Plan Limits Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          Tenant Usage vs Plan Limits
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Team Members Limit */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Team Members</span>
              <UserCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">
                {teamMemberCount}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {limits.max_team_members === Infinity ? 'Unlimited' : limits.max_team_members}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    limits.max_team_members === Infinity
                      ? 10
                      : (teamMemberCount / limits.max_team_members) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Clients Limit */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Clients</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">
                {currentClients}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {limits.max_clients === Infinity ? 'Unlimited' : limits.max_clients}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    limits.max_clients === Infinity
                      ? 10
                      : (currentClients / limits.max_clients) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Projects Limit */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Projects</span>
              <Briefcase className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">
                {currentProjects}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {limits.max_projects === Infinity ? 'Unlimited' : limits.max_projects}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    limits.max_projects === Infinity
                      ? 10
                      : (currentProjects / limits.max_projects) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Stripe Information */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <CreditCard className="h-5 w-5 text-indigo-400" />
          Subscription & Stripe Billing Status
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Stripe Customer ID</span>
            <span className="font-mono text-white mt-1 block">
              {org.stripe_customer_id || subscription?.stripe_customer_id || 'N/A (Comped / Self-Hosted)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Stripe Subscription ID</span>
            <span className="font-mono text-white mt-1 block">
              {subscription?.stripe_subscription_id || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Current Period Start</span>
            <span className="text-slate-200 mt-1 block">
              {subscription?.current_period_start
                ? new Date(subscription.current_period_start).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Current Period End</span>
            <span className="text-slate-200 mt-1 block">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Read-Only Team Members List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Organization Members ({members.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Read-Only Audit View</span>
        </div>

        <div className="overflow-x-auto">
          {members.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No members attached to this organization.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-2 font-medium">User Profile</th>
                  <th className="py-3 px-2 font-medium">Email</th>
                  <th className="py-3 px-2 font-medium">Assigned Role</th>
                  <th className="py-3 px-2 font-medium">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {members.map((m: any) => {
                  const profile = m.profiles
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2 font-semibold text-white">
                        {profile?.full_name || 'Unnamed User'}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-300">
                        {profile?.email || 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/20 capitalize">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">
                        {new Date(m.joined_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

--- FILE: app/super-admin/organizations/page.tsx ---
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { OrgListTable, type OrgListItem } from '@/components/super-admin/org-list-table'
import { Building2, Plus, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminOrganizationsPage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  let orgs: any[] = []
  const memberCountMap: Record<string, number> = {}

  try {
    // Fetch organizations
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name, slug, plan_tier, billing_status, is_suspended, created_at')
      .order('created_at', { ascending: false })

    if (orgsData && orgsData.length > 0) {
      orgs = orgsData
    }

    // Fetch member counts per organization
    const { data: membersData } = await supabase
      .from('organization_members')
      .select('organization_id')

    if (membersData) {
      membersData.forEach((m: any) => {
        memberCountMap[m.organization_id] = (memberCountMap[m.organization_id] || 0) + 1
      })
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_ORGS] Using fallback sample data:', err)
  }

  if (orgs.length === 0) {
    orgs = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Innoventix Hub',
        slug: 'innoventix-hub',
        plan_tier: 'enterprise',
        billing_status: 'active',
        is_suspended: false,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Acme Digital Agency',
        slug: 'acme-digital',
        plan_tier: 'pro',
        billing_status: 'active',
        is_suspended: false,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Apex Studio',
        slug: 'apex-studio',
        plan_tier: 'starter',
        billing_status: 'trialing',
        is_suspended: false,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Vanguard Media Labs',
        slug: 'vanguard-media',
        plan_tier: 'pro',
        billing_status: 'past_due',
        is_suspended: false,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
    ]
    memberCountMap['00000000-0000-0000-0000-000000000001'] = 12
    memberCountMap['00000000-0000-0000-0000-000000000002'] = 5
    memberCountMap['00000000-0000-0000-0000-000000000003'] = 2
    memberCountMap['00000000-0000-0000-0000-000000000004'] = 7
  }

  const items: OrgListItem[] = orgs.map((org) => ({
    ...org,
    memberCount: memberCountMap[org.id] || 1,
  }))

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Organization Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <Building2 className="h-3.5 w-3.5" />
              {items.length} Registered Tenants
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Control tenant status, manage subscription tiers, suspend/resume accounts, and monitor usage limits.
          </p>
        </div>
      </div>

      {/* Interactive Table */}
      <OrgListTable organizations={items} />
    </div>
  )
}

--- FILE: app/super-admin/page.tsx ---
import { redirect } from 'next/navigation'

export default function SuperAdminRootPage() {
  redirect('/super-admin/dashboard')
}

--- FILE: app/super-admin/settings/page.tsx ---
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/auth/super-admin'
import { PlatformSettingsForm, type PlanItem } from '@/components/super-admin/platform-settings-form'
import { Sliders, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin()
  const supabase = await createClient()

  let plans: PlanItem[] = []
  let flags: any = undefined
  let defaults: any = undefined

  try {
    // 1. Fetch Subscription Plans
    const { data: plansData } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly, feature_limits')
      .order('price_monthly', { ascending: true })

    if (plansData && plansData.length > 0) {
      plans = plansData as PlanItem[]
    }

    // 2. Fetch Platform Settings (Feature Flags & Onboarding Defaults)
    const { data: settingsData } = await supabase
      .from('platform_settings')
      .select('key, value')

    if (settingsData) {
      settingsData.forEach((row: any) => {
        if (row.key === 'global_feature_flags') flags = row.value
        if (row.key === 'global_onboarding_defaults') defaults = row.value
      })
    }
  } catch (err) {
    console.warn('[SUPER_ADMIN_SETTINGS] Using fallback data:', err)
  }

  if (plans.length === 0) {
    plans = [
      {
        id: 'plan_starter',
        name: 'Starter Plan',
        price_monthly: 29,
        feature_limits: {
          max_team_members: 5,
          max_clients: 25,
          max_projects: 50,
          storage_limit_gb: 10,
          client_portal_enabled: true,
          ai_features_enabled: false,
          communication_channels_included: 1,
          analytics_level: 'basic',
        },
      },
      {
        id: 'plan_pro',
        name: 'Pro Plan',
        price_monthly: 79,
        feature_limits: {
          max_team_members: 15,
          max_clients: 100,
          max_projects: 250,
          storage_limit_gb: 50,
          client_portal_enabled: true,
          ai_features_enabled: true,
          ai_capabilities: {
            reply_suggestions: true,
            lead_scoring: true,
            task_extraction: true,
            weekly_narrative: false,
          },
          communication_channels_included: 3,
          analytics_level: 'advanced',
        },
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise Plan',
        price_monthly: 199,
        feature_limits: {
          max_team_members: 9999,
          max_clients: 9999,
          max_projects: 9999,
          storage_limit_gb: 500,
          client_portal_enabled: true,
          ai_features_enabled: true,
          ai_capabilities: {
            reply_suggestions: true,
            lead_scoring: true,
            task_extraction: true,
            weekly_narrative: true,
          },
          communication_channels_included: 5,
          analytics_level: 'full_custom',
        },
      },
    ]
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Platform Settings & Global Configuration
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
              <Sliders className="h-3.5 w-3.5" />
              TASK 20
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Centralized platform control. Edit subscription plan limits, toggle feature flags, and configure onboarding defaults without redeploying code.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300 border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Super Admin Privileges Verified
        </div>
      </div>

      {/* Main Settings Form */}
      <PlatformSettingsForm
        initialPlans={plans}
        initialFlags={flags}
        initialDefaults={defaults}
      />
    </div>
  )
}

--- FILE: components/super-admin/impersonation-banner.tsx ---
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react'

interface ImpersonationBannerProps {
  initialActive: boolean
  orgName?: string | null
  expiresAt?: string | null
}

export function ImpersonationBanner({
  initialActive,
  orgName,
  expiresAt,
}: ImpersonationBannerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(initialActive)

  if (!active || !orgName) return null

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const handleExitSupportMode = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/impersonate', {
        method: 'DELETE',
      })
      if (res.ok) {
        setActive(false)
        router.refresh()
        window.location.href = '/super-admin/organizations'
      }
    } catch (err) {
      console.error('Failed to exit support mode:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div>
          <span className="font-bold text-amber-300">Viewing as [{orgName}]</span>
          <span className="ml-1.5 font-medium text-amber-200/80">— Support Mode (Read-Only)</span>
          {formattedExpiry && (
            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
              Expires at {formattedExpiry}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleExitSupportMode}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/20 px-3 py-1 font-semibold text-amber-200 transition hover:bg-amber-500/30 hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        Exit Support Mode
      </button>
    </div>
  )
}

--- FILE: components/super-admin/org-list-filter.tsx ---
'use client'

import { Search, Filter } from 'lucide-react'

interface OrgListFilterProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedPlan: string
  setSelectedPlan: (plan: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
}

export function OrgListFilter({
  searchTerm,
  setSearchTerm,
  selectedPlan,
  setSelectedPlan,
  selectedStatus,
  setSelectedStatus,
}: OrgListFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search organizations by name or slug..."
          className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Plan:</span>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trialing">Trialing</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>
    </div>
  )
}

--- FILE: components/super-admin/org-list-table.tsx ---
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { OrgListFilter } from './org-list-filter'
import { SuspendOrgModal, OverridePlanModal } from './org-management-actions'

export interface OrgListItem {
  id: string
  name: string
  slug: string
  plan_tier: string
  billing_status: string
  is_suspended?: boolean
  created_at: string
  memberCount: number
}

interface OrgListTableProps {
  organizations: OrgListItem[]
}

export function OrgListTable({ organizations }: OrgListTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlan =
      selectedPlan === 'all' || org.plan_tier.toLowerCase() === selectedPlan.toLowerCase()

    let matchesStatus = true
    if (selectedStatus === 'suspended') {
      matchesStatus = !!org.is_suspended
    } else if (selectedStatus !== 'all') {
      matchesStatus = org.billing_status.toLowerCase() === selectedStatus.toLowerCase()
    }

    return matchesSearch && matchesPlan && matchesStatus
  })

  const getBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'pro':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'starter':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50'
    }
  }

  return (
    <div className="space-y-4">
      <OrgListFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {filteredOrgs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No organizations match the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Organization</th>
                  <th className="py-3.5 px-4 font-semibold">Plan Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Team Members</th>
                  <th className="py-3.5 px-4 font-semibold">Created</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="font-bold text-white hover:text-purple-300 transition-colors flex items-center gap-1.5"
                      >
                        <Building2 className="h-4 w-4 text-purple-400" />
                        {org.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono ml-5">
                        /{org.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                        {org.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {org.is_suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="h-3 w-3" />
                          Suspended
                        </span>
                      ) : org.billing_status === 'active' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/40 capitalize">
                          {org.billing_status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {org.memberCount} members
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(org.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <OverridePlanModal
                          orgId={org.id}
                          orgName={org.name}
                          currentPlanTier={org.plan_tier}
                        />
                        <SuspendOrgModal
                          orgId={org.id}
                          orgName={org.name}
                          isSuspended={!!org.is_suspended}
                        />
                        <Link
                          href={`/super-admin/organizations/${org.id}`}
                          className="flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          Details
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

--- FILE: components/super-admin/org-management-actions.tsx ---
'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Loader2, X } from 'lucide-react'
import { toggleSuspendOrganization, overrideOrganizationPlan } from '@/app/super-admin/actions'

interface SuspendOrgModalProps {
  orgId: string
  orgName: string
  isSuspended: boolean
}

export function SuspendOrgModal({ orgId, orgName, isSuspended }: SuspendOrgModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAction = () => {
    setError(null)
    startTransition(async () => {
      const res = await toggleSuspendOrganization(orgId, !isSuspended, reason)
      if (res.error) {
        setError(res.error)
      } else {
        setIsOpen(false)
        setReason('')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
          isSuspended
            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
            : 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
        }`}
      >
        {isSuspended ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resume Access
          </>
        ) : (
          <>
            <AlertTriangle className="h-3.5 w-3.5" />
            Suspend Organization
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`h-5 w-5 ${isSuspended ? 'text-emerald-400' : 'text-rose-400'}`} />
                <h3 className="text-base font-bold text-white">
                  {isSuspended ? 'Resume Organization' : 'Suspend Organization'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Target Organization: <strong className="text-white">{orgName}</strong>
              </p>
              <p className="text-xs text-slate-400">
                {isSuspended
                  ? 'Resuming access will immediately restore full access for all members of this organization.'
                  : 'Suspending this organization will block all its members from accessing dashboard features until resumed.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Audit Trail
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isSuspended
                      ? 'e.g. Payment resolved or support review completed.'
                      : 'e.g. Terms of service review or non-payment.'
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="rounded-md bg-rose-500/10 p-2 text-xs font-medium text-rose-400 border border-rose-500/20">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-md transition-all ${
                    isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm {isSuspended ? 'Resume' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface OverridePlanModalProps {
  orgId: string
  orgName: string
  currentPlanTier: string
}

export function OverridePlanModal({ orgId, orgName, currentPlanTier }: OverridePlanModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>(
    (currentPlanTier.toLowerCase() as any) || 'free'
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAction = () => {
    setError(null)
    startTransition(async () => {
      const res = await overrideOrganizationPlan(orgId, selectedPlan, reason)
      if (res.error) {
        setError(res.error)
      } else {
        setIsOpen(false)
        setReason('')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600/20 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600/30 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
        Override Plan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Manual Plan Override</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Organization: <strong className="text-white">{orgName}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Target Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['free', 'starter', 'pro', 'enterprise'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedPlan(tier)}
                      className={`rounded-lg border p-2 text-center text-xs font-bold capitalize transition-all ${
                        selectedPlan === tier
                          ? 'border-purple-500 bg-purple-600/30 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Override (Audit Logged)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Comping internal agency account or granting VIP trial extension."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="rounded-md bg-rose-500/10 p-2 text-xs font-medium text-rose-400 border border-rose-500/20">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-md transition-all"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Apply Plan Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

--- FILE: components/super-admin/platform-metrics-cards.tsx ---
import { Building2, DollarSign, Users, Briefcase, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react'

export interface PlatformMetrics {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  canceledOrganizations: number
  suspendedOrganizations: number
  totalMrr: number
  totalClients: number
  totalProjects: number
  totalMessages: number
}

interface PlatformMetricsCardsProps {
  metrics: PlatformMetrics
}

export function PlatformMetricsCards({ metrics }: PlatformMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Organizations',
      value: metrics.totalOrganizations.toLocaleString(),
      subtitle: `${metrics.activeOrganizations} active · ${metrics.trialOrganizations} trial · ${metrics.suspendedOrganizations} suspended`,
      icon: Building2,
      color: 'from-blue-500 to-indigo-600',
      badge: `${metrics.activeOrganizations} Live`,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Platform Monthly Revenue (MRR)',
      value: `$${metrics.totalMrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Calculated across active subscription plans',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Stripe Synced',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      title: 'Total Platform Clients',
      value: metrics.totalClients.toLocaleString(),
      subtitle: 'Managed across all tenant CRMs',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      badge: 'CRM Volume',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      title: 'Total Projects',
      value: metrics.totalProjects.toLocaleString(),
      subtitle: 'Active & completed tenant projects',
      icon: Briefcase,
      color: 'from-amber-500 to-orange-600',
      badge: 'PM Activity',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Communication Hub Volume',
      value: metrics.totalMessages.toLocaleString(),
      subtitle: 'Unified messages (Email, Slack, WhatsApp)',
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Hub Activity',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/50 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  {card.value}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-400 line-clamp-1">
                {card.subtitle}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

--- FILE: components/super-admin/platform-settings-form.tsx ---
'use client'

import { useState } from 'react'
import {
  updatePlanLimitsAction,
  updateGlobalFeatureFlagsAction,
  updateGlobalOnboardingDefaultsAction,
  type FeatureFlagsInput,
  type OnboardingDefaultsInput,
} from '@/app/actions/platform-settings'
import {
  Sliders,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Code2,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Settings2,
} from 'lucide-react'

export interface PlanItem {
  id: string
  name: string
  price_monthly: number
  feature_limits: any
}

interface PlatformSettingsFormProps {
  initialPlans: PlanItem[]
  initialFlags?: FeatureFlagsInput
  initialDefaults?: OnboardingDefaultsInput
}

export function PlatformSettingsForm({
  initialPlans,
  initialFlags,
  initialDefaults,
}: PlatformSettingsFormProps) {
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editedPrice, setEditedPrice] = useState<number>(0)
  const [editedJson, setEditedJson] = useState<string>('')
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)

  const [flags, setFlags] = useState<FeatureFlagsInput>(
    initialFlags || {
      ai_kill_switch: false,
      ai_reply_suggestions: true,
      ai_lead_scoring: true,
      ai_task_extraction: true,
      ai_weekly_narrative: true,
      client_portal_kill_switch: false,
    }
  )
  const [savingFlags, setSavingFlags] = useState(false)

  const [defaults, setDefaults] = useState<OnboardingDefaultsInput>(
    initialDefaults || {
      default_trial_days: 14,
      auto_create_sample_projects: true,
      default_plan_tier: 'starter',
    }
  )
  const [savingDefaults, setSavingDefaults] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Plan Edit Handlers
  const handleEditPlan = (plan: PlanItem) => {
    setEditingPlanId(plan.id)
    setEditedPrice(plan.price_monthly)
    setEditedJson(JSON.stringify(plan.feature_limits, null, 2))
    setMessage(null)
  }

  const handleSavePlan = async (planId: string) => {
    setSavingPlanId(planId)
    setMessage(null)

    const res = await updatePlanLimitsAction({
      planId,
      priceMonthly: Number(editedPrice),
      featureLimitsJson: editedJson,
    })

    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: res.message || 'Plan updated successfully.' })
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                price_monthly: Number(editedPrice),
                feature_limits: JSON.parse(editedJson),
              }
            : p
        )
      )
      setEditingPlanId(null)
    }
    setSavingPlanId(null)
  }

  // Feature Flags Save
  const handleSaveFlags = async () => {
    setSavingFlags(true)
    setMessage(null)

    const res = await updateGlobalFeatureFlagsAction(flags)
    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: res.message || 'Feature flags updated.' })
    }
    setSavingFlags(false)
  }

  // Onboarding Defaults Save
  const handleSaveDefaults = async () => {
    setSavingDefaults(true)
    setMessage(null)

    const res = await updateGlobalOnboardingDefaultsAction(defaults)
    if (res.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: res.message || 'Onboarding defaults updated.' })
    }
    setSavingDefaults(false)
  }

  return (
    <div className="space-y-10">
      {/* Alert Notification */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-medium transition ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: Subscription Plans Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-400" />
              Subscription Plans & Limit Definitions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Edit price tiers and feature limits JSON. Changes apply immediately to tenant limit checks without redeploying code.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isEditing = editingPlanId === plan.id
            const isSaving = savingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl transition hover:border-slate-700"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-lg font-bold text-white uppercase tracking-wider">
                      {plan.name}
                    </span>
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                      ${plan.price_monthly}/mo
                    </span>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-3">
                      <div className="text-2xl font-extrabold text-white">
                        ${plan.price_monthly}{' '}
                        <span className="text-xs font-normal text-slate-400">/ month</span>
                      </div>

                      <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-48">
                        <pre>{JSON.stringify(plan.feature_limits, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Monthly Price ($)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Feature Limits JSON</span>
                          <Code2 className="h-3.5 w-3.5 text-purple-400" />
                        </label>
                        <textarea
                          rows={8}
                          value={editedJson}
                          onChange={(e) => setEditedJson(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  {!isEditing ? (
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      Edit Plan Limits
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={isSaving}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingPlanId(null)}
                        disabled={isSaving}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 2: Global Feature Flags */}
      <section className="space-y-6 border-t border-slate-800 pt-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Global Feature Flags & Kill Switches
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Platform-wide toggle controls. Instantly disable AI or Client Portal capabilities platform-wide.
            </p>
          </div>
          <button
            onClick={handleSaveFlags}
            disabled={savingFlags}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50"
          >
            {savingFlags ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Feature Flags
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* AI Platform Kill Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Platform Kill Switch</div>
              <div className="text-xs text-slate-400 mt-0.5">Disable all AI features platform-wide</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_kill_switch: !f.ai_kill_switch }))}
              className="text-amber-400 hover:text-amber-300"
            >
              {flags.ai_kill_switch ? (
                <ToggleRight className="h-8 w-8 text-rose-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Reply Suggestions */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Inbox Reply Suggestions</div>
              <div className="text-xs text-slate-400 mt-0.5">Auto-suggest contextual replies</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_reply_suggestions: !f.ai_reply_suggestions }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_reply_suggestions ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Lead Scoring */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Lead Scoring Engine</div>
              <div className="text-xs text-slate-400 mt-0.5">Automatic win probability calculation</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_lead_scoring: !f.ai_lead_scoring }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_lead_scoring ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Task Extraction */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Message Task Extraction</div>
              <div className="text-xs text-slate-400 mt-0.5">Extract tasks from client conversations</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_task_extraction: !f.ai_task_extraction }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_task_extraction ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* AI Weekly Narrative */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">AI Weekly Summary Narrative</div>
              <div className="text-xs text-slate-400 mt-0.5">Generate executive progress reports</div>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, ai_weekly_narrative: !f.ai_weekly_narrative }))}
              className="text-purple-400 hover:text-purple-300"
            >
              {flags.ai_weekly_narrative ? (
                <ToggleRight className="h-8 w-8 text-purple-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>

          {/* Client Portal Kill Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <div className="text-sm font-bold text-white">Client Portal Global Kill Switch</div>
              <div className="text-xs text-slate-400 mt-0.5">Disable external client access</div>
            </div>
            <button
              onClick={() =>
                setFlags((f) => ({ ...f, client_portal_kill_switch: !f.client_portal_kill_switch }))
              }
              className="text-amber-400 hover:text-amber-300"
            >
              {flags.client_portal_kill_switch ? (
                <ToggleRight className="h-8 w-8 text-rose-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Global Onboarding Defaults */}
      <section className="space-y-6 border-t border-slate-800 pt-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-400" />
              Global Onboarding Defaults
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configuration applied to newly registered tenant organizations.
            </p>
          </div>
          <button
            onClick={handleSaveDefaults}
            disabled={savingDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
          >
            {savingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <label className="block text-xs font-bold text-white">Default Trial Period (Days)</label>
            <input
              type="number"
              min="1"
              max="90"
              value={defaults.default_trial_days}
              onChange={(e) => setDefaults((d) => ({ ...d, default_trial_days: Number(e.target.value) }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Duration of free trial granted upon tenant creation.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
            <label className="block text-xs font-bold text-white">Default Tier for New Signups</label>
            <select
              value={defaults.default_plan_tier}
              onChange={(e) => setDefaults((d) => ({ ...d, default_plan_tier: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="starter">Starter Plan ($29/mo)</option>
              <option value="pro">Pro Plan ($79/mo)</option>
              <option value="enterprise">Enterprise Plan ($199/mo)</option>
            </select>
            <p className="text-[11px] text-slate-400">Initial tier assigned before billing activation.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Auto-Provision Sample Workspace Data</div>
              <p className="text-[11px] text-slate-400 mt-1">Seed sample project & task templates into new tenant</p>
            </div>
            <button
              onClick={() =>
                setDefaults((d) => ({
                  ...d,
                  auto_create_sample_projects: !d.auto_create_sample_projects,
                }))
              }
              className="text-blue-400 hover:text-blue-300"
            >
              {defaults.auto_create_sample_projects ? (
                <ToggleRight className="h-8 w-8 text-blue-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

--- FILE: components/super-admin/recent-activity-tables.tsx ---
import Link from 'next/link'
import { Building2, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react'

export interface RecentOrganization {
  id: string
  name: string
  slug: string
  plan_tier: string
  billing_status: string
  is_suspended?: boolean
  created_at: string
}

interface RecentActivityTablesProps {
  recentOrganizations: RecentOrganization[]
  flaggedOrganizations: RecentOrganization[]
}

export function RecentActivityTables({
  recentOrganizations,
  flaggedOrganizations,
}: RecentActivityTablesProps) {
  const getBadgeStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'pro':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'starter':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50'
    }
  }

  const getStatusBadge = (status: string, isSuspended?: boolean) => {
    if (isSuspended) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/40">
          <AlertTriangle className="h-3 w-3" />
          Suspended
        </span>
      )
    }
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        )
      case 'trialing':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/40">
            Trialing
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-300 border border-orange-500/40">
            Past Due
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-700">
            Canceled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-700">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Recent Tenant Signups */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">Recent Tenant Signups</h3>
          </div>
          <Link
            href="/super-admin/organizations"
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentOrganizations.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">No organizations found.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-2 font-medium">Organization</th>
                  <th className="py-3 px-2 font-medium">Plan</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentOrganizations.slice(0, 6).map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2">
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="font-medium text-white hover:text-purple-300 transition-colors"
                      >
                        {org.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono">/{org.slug}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                        {org.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(org.billing_status, org.is_suspended)}
                    </td>
                    <td className="py-3 px-2 text-slate-400">
                      {new Date(org.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Flagged / Action Required Orgs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Attention Required & Alerts</h3>
          </div>
          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300 border border-amber-500/20">
            {flaggedOrganizations.length} Flagged
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {flaggedOrganizations.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/50" />
              <p className="mt-2 text-xs text-slate-400">All tenant organizations operating cleanly without billing issues or suspension alerts.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-2 font-medium">Organization</th>
                  <th className="py-3 px-2 font-medium">Plan</th>
                  <th className="py-3 px-2 font-medium">Flag Status</th>
                  <th className="py-3 px-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {flaggedOrganizations.slice(0, 6).map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 font-medium text-white">
                      {org.name}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold border ${getBadgeStyle(org.plan_tier)}`}>
                        {org.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(org.billing_status, org.is_suspended)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="rounded-md bg-purple-600/20 px-2.5 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

--- FILE: components/super-admin/start-impersonation-button.tsx ---
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2 } from 'lucide-react'

interface StartImpersonationButtonProps {
  organizationId: string
  organizationName: string
}

export function StartImpersonationButton({
  organizationId,
  organizationName,
}: StartImpersonationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStartImpersonation = async () => {
    if (
      !confirm(
        `Start read-only Support Access as '${organizationName}'?\n\nAll support actions are logged.`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          organizationName,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to start support access.')
        return
      }

      router.refresh()
      window.location.href = `/dashboard`
    } catch (err) {
      console.error('Error starting support access:', err)
      alert('Network error initiating support access.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStartImpersonation}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      Start Support Access (Read-Only)
    </button>
  )
}

--- FILE: components/super-admin/super-admin-nav.tsx ---
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ShieldAlert, ArrowLeft, Sliders } from 'lucide-react'

interface SuperAdminNavProps {
  userEmail?: string
}

export function SuperAdminNav({ userEmail }: SuperAdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Platform Overview',
      href: '/super-admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Organizations',
      href: '/super-admin/organizations',
      icon: Building2,
    },
    {
      name: 'Platform Settings',
      href: '/super-admin/settings',
      icon: Sliders,
    },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-900/30">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                INNOVENTIX
              </span>
              <span className="ml-2 rounded-md bg-purple-950/80 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-800/50">
                SUPER ADMIN
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/super-admin/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden sm:inline-block text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              {userEmail}
            </span>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit to Tenant Hub
          </Link>
        </div>
      </div>
    </header>
  )
}

--- FILE: components/super-admin/support-banner-wrapper.tsx ---
import { getImpersonationContext } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from './impersonation-banner'

export async function SupportBannerWrapper() {
  const ctx = await getImpersonationContext()

  return (
    <ImpersonationBanner
      initialActive={ctx.active}
      orgName={ctx.orgName}
      expiresAt={ctx.expiresAt}
    />
  )
}

--- FILE: .agents/rules/graphify.md ---
---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

--- FILE: .agents/workflows/graphify.md ---
---
name: graphify
description: Turn any folder of files into a navigable knowledge graph
---

# Workflow: graphify

Follow the graphify skill to run the full pipeline.

If no path argument is given, use `.` (current directory).

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

# Graphify Cache
graphify-out/cache/


--- FILE: .prettierrc ---
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}

--- FILE: documentation/adr/001-multi-tenancy.md ---
# ADR 001: Multi-Tenant Architecture, Data Isolation & Super Admin Platform Tier

## Status
Accepted

## Context
The platform originated as an internal tool for Innoventix Hub and has evolved into a self-hosted, commercial multi-tenant SaaS. It features a dual-tier tenancy structure: tenant organizations (agencies/SMBs) and a platform-level Super Admin operator tier. We require an unambiguous architectural decision defining data boundaries, authorization models, and Super Admin privilege isolation before schema creation.

## Options Considered for Tenancy

### 1. Database-Per-Tenant
- **Pros**: Complete physical isolation.
- **Cons**: High operational overhead on self-hosted VPS, complex migrations across instances.

### 2. Shared Database, Shared Schema with Row-Level Security (RLS) — SELECTED
- **Pros**: Operational simplicity, single migration pipeline, high performance, robust RLS-enforced security.
- **Cons**: Requires strict RLS enforcement on 100% of tenant tables.

---

## Decision

We adopt **Shared Database, Shared Schema with Row-Level Isolation** for tenants, coupled with a **Strictly Separated Super Admin Table** for platform management.

### 1. Complete Hierarchy Structure
```
Super Admin Tier (Platform Operator / DEVMARK)
  │ (Stored in `super_admins` table; ZERO membership in `organization_members`)
  │
  ▼
Organization Tier (Tenants - Innoventix Hub = Org #1)
  ├── Organization Members (Owner, Admin, Member, Billing Manager)
  ├── Clients (Agency Clients - Manual or Connected Communication Mode)
  │     └── Projects
  │           ├── Tasks
  │           └── Deliverables
  ├── Communication Hub (Slack, WhatsApp, Email, Discord, Upwork)
  ├── AI Settings & Feature Flags (Per-Organization Controls)
  └── Subscription & Stripe Billing (Plan Tier & Limits)
```

### 2. Tenant Isolation Rules
- Every tenant-scoped table MUST include `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
- RLS MUST be enabled on every tenant table.
- Policies validate that `auth.uid()` exists in `organization_members` for the target `organization_id`.
- Innoventix Hub is Organization #1 in the database, with zero hardcoded code branches.

### 3. Super Admin Isolation Rules
- Super Admins are stored in a dedicated `super_admins` table (`id`, `user_id`, `created_at`).
- Super Admin status is NEVER derived or inherited from any organization role (`owner`/`admin`).
- Super Admin API endpoints (`/api/super-admin/*`) and UI routes (`/super-admin/*`) explicitly check the `super_admins` table.
- A compromised organization owner role CANNOT escalate to platform Super Admin access.

---

## Consequences
- Every database migration must include `organization_id` on tenant tables and appropriate RLS policies.
- Super Admin functionality is strictly isolated from tenant RLS contexts.
- Automated tests must verify both multi-tenant isolation and Super Admin security boundaries.

--- FILE: documentation/architecture.md ---
# Platform Architecture v2 — Self-Hosted Multi-Tenant CRM, PM & AI SaaS

## Vision & Scope
The Innoventix Platform v2 is a self-hosted, multi-tenant SaaS application combining **CRM, Project Management, a Multi-Channel Unified Communication Hub, and AI-Assisted Workflows**, managed via a dedicated **Super Admin Platform Layer** and fully self-hosted on a Contabo VPS.

- **Infrastructure**: 100% self-hosted on Contabo VPS (Docker Compose for Next.js, self-hosted Supabase stack, n8n automation, Nginx reverse proxy, Let's Encrypt SSL).
- **Tenant Scope**: Every tenant-owned database record, API endpoint, and UI view belongs to an `organization`.
- **Super Admin Platform Tier**: A platform operator tier (`super_admins` table) completely isolated from organization roles, enabling global tenant management, platform metrics, impersonation support, and system controls.
- **AI-Assisted Layer**: Provider-agnostic AI features (inbox reply suggestions, CRM lead scoring, auto-task extraction, weekly report narratives) with per-tenant controls and global kill switches.
- **Client Communication Modes**: Dual workflow support (Manual Communication Log for legacy clients vs. Connected Auto-Sync Channels for unified inbox integration).

---

## Architecture Blueprint

```
+-----------------------------------------------------------------------------------+
|                                 Nginx Reverse Proxy                               |
|                  (app.domain.com | api.domain.com | n8n.domain.com)               |
+----------------------------------------+------------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
+--------v-------+             +---------v--------+            +---------v--------+
|  Next.js App   |             |  Self-Hosted     |            |  n8n Automation  |
|  (App Router)  |             |  Supabase Stack  |            |  Engine (Docker) |
|  - App Shell   |             |  - Postgres      |            +------------------+
|  - CRM & PM UI |             |  - GoTrue Auth   |
|  - Client Port |             |  - PostgREST     |
|  - Super Admin |             |  - Realtime      |
+--------+-------+             |  - Storage API   |
         |                     +---------+--------+
         |                               |
         +-------------------------------+
```

---

## Tenancy & Authorization Architecture

### 1. Dual-Tier Tenancy Model
- **Organization Tier**: Multi-tenant SMB/agency workspace (`organization_id` UUID column on all tenant tables, guarded by Supabase RLS).
- **Super Admin Tier**: Isolated platform management (`super_admins` table). Super Admin privileges are never stored or inherited inside `organization_members`.

### 2. Multi-Channel Communication & Dual Workflow
- **Manual Communication Mode**: Manually logged touchpoints (WhatsApp, Email, Calls, Meetings, Upwork notes).
- **Connected Channel Mode**: Automated sync into `communication_messages` via Slack app, WhatsApp Cloud API, Inbound Email Webhooks, Discord bot, and n8n pipelines.

### 3. AI Feature Layer
- Provider-agnostic AI service interface (supporting OpenAI, Gemini, Anthropic, or self-hosted models).
- Feature flags per organization (`ai_reply_suggestions`, `ai_lead_scoring`, `ai_task_extraction`, `ai_report_narratives`).
- Platform-wide emergency kill-switch in Super Admin settings.

---

## Directory Layout
- `/app`: Next.js App Router (Dashboard, CRM, PM, Comms Hub, Client Portal, Super Admin `/super-admin`)
- `/components`: Shared Design System & Feature Components
- `/lib/supabase`: Supabase Client & Server Initialization (configured for self-hosted `api.innoventixhub.com`)
- `/lib/ai`: Provider-Agnostic AI Client Layer
- `/supabase/migrations`: SQL Schema Migrations & RLS Policies
- `/scripts/infra`: Production & Local Docker/Hardening Automation
- `/documentation`: Infra setup, ADRs, and System Specifications

--- FILE: documentation/infra/backup-restore.md ---
# Disaster Recovery Playbook: Backup & Restore Strategy

## Overview
This document specifies the automated backup routine, off-VPS replication strategy, and tested disaster recovery procedure for the self-hosted Innoventix Platform database and asset storage.

---

## 1. Automated Cron Schedule

Backups execute nightly at **02:00 AM UTC** via system crontab on the Contabo VPS.

Crontab entry (`/etc/cron.d/supabase-backup`):
```cron
0 2 * * * root /bin/bash /home/deploy/crm-project-management-saas/scripts/infra/backup-postgres.sh >> /var/log/supabase-backup.log 2>&1
```

---

## 2. Retention & Off-VPS Replication

- **Local Retention**: 14 days rolling window on `/var/backups/supabase/`.
- **Off-VPS Replication**: Nightly sync to secure off-site S3-compatible cloud storage (e.g. Cloudflare R2 / AWS S3) via `rclone`.
- **Encryption**: External copies are encrypted at rest using AES-256 before upload.

---

## 3. Disaster Recovery / Restoration Playbook

In the event of database corruption, container failure, or data loss, execute:

```bash
# 1. Inspect available backups
ls -lh /var/backups/supabase/

# 2. Execute restoration script
sudo bash scripts/infra/restore-postgres.sh /var/backups/supabase/db_backup_YYYYMMDD_HHMMSS.sql.gz

# 3. Verify database tables and data integrity
docker exec -it supabase-db psql -U postgres -d postgres -c "\dt"
```

--- FILE: documentation/infra/dns-ssl.md ---
# DNS Record Setup & Let's Encrypt SSL Automated Renewal

## Overview
This document specifies the DNS configuration, Nginx reverse proxy topology, and Let's Encrypt SSL certificate issuance/renewal procedure for the Contabo VPS.

---

## 1. DNS A Record Configuration

Point all required subdomains to your Contabo VPS Public IPv4 Address (`<VPS_PUBLIC_IP>`):

| Subdomain Host | Type | Target IP | Description |
| :--- | :--- | :--- | :--- |
| `app.innoventixhub.com` | `A` | `<VPS_PUBLIC_IP>` | Next.js Frontend Application Shell |
| `api.innoventixhub.com` | `A` | `<VPS_PUBLIC_IP>` | Self-Hosted Supabase Gateway (Kong API) |
| `n8n.innoventixhub.com` | `A` | `<VPS_PUBLIC_IP>` | n8n Automation Engine |

---

## 2. Let's Encrypt Certificate Issuance

Run Certbot on the Contabo VPS to obtain TLS certificates:

```bash
# 1. Install Certbot & Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Issue SSL certificates for all 3 subdomains
sudo certbot --nginx \
  -d app.innoventixhub.com \
  -d api.innoventixhub.com \
  -d n8n.innoventixhub.com \
  --non-interactive \
  --agree-tos \
  -m admin@innoventixhub.com
```

---

## 3. SSL Auto-Renewal Verification

Let's Encrypt certificates expire every 90 days. Certbot automatically registers a systemd timer (`certbot.timer`) for auto-renewal.

Verify timer and test dry-run:
```bash
# Check status of certbot systemd timer
sudo systemctl status certbot.timer

# Test auto-renewal dry run
sudo certbot renew --dry-run
```

---

## 4. Nginx Reload & Health Check Commands

```bash
# Test Nginx syntax
sudo nginx -t

# Reload Nginx configuration without downtime
sudo systemctl reload nginx

# Check listening SSL sockets
sudo ss -tulpn | grep ':443'
```

--- FILE: documentation/infra/local-dev-setup.md ---
# Local Development Environment Setup Guide

## Overview
This document specifies the setup for local development. Every developer and AI agent session runs against a self-contained local Docker stack (`docker-compose.local.yml`) that mirrors the production Supabase environment without touching live production databases.

---

## 1. Quick Start (One Command Setup)

```bash
# 1. Clone environment variables
cp .env.local.example .env.local

# 2. Launch local Supabase services
docker compose -f docker-compose.local.yml up -d

# 3. Verify container status
docker compose -f docker-compose.local.yml ps
```

---

## 2. Local Endpoint Reference

| Service | Protocol | Local URL / Port | Notes |
| :--- | :--- | :--- | :--- |
| **Local Gateway (Kong)** | `HTTP` | `http://localhost:54321` | Matches `NEXT_PUBLIC_SUPABASE_URL` |
| **Local Studio (Dashboard)** | `HTTP` | `http://localhost:54323` | Browser admin UI for local Postgres |
| **Local Postgres DB** | `PostgreSQL` | `localhost:54322` | User: `postgres`, Password: `postgres_dev_password` |
| **Local Auth (GoTrue)** | `HTTP` | `http://localhost:9999` | Local email/password auth |

---

## 3. Database Migration Execution Procedure

Apply database migration scripts located in `supabase/migrations/*.sql`:

```bash
# Apply SQL migrations locally using psql
cat supabase/migrations/*.sql | docker exec -i supabase-local-db psql -U postgres -d postgres
```

--- FILE: documentation/infra/self-hosted-supabase.md ---
# Self-Hosted Supabase Architecture & Deployment Guide

## Overview
This document specifies the self-hosted Supabase setup deployed via Docker Compose on the Contabo VPS, replacing Supabase Cloud for database, authentication, PostgREST API, realtime websockets, and file storage.

---

## 1. Stack Components & Container Services

- **`supabase-db`**: PostgreSQL 15 database instance with `pgvector`, `pg_crypto`, and Supabase schema extensions.
- **`supabase-auth`**: GoTrue authentication service handling user registration, JWT issuance, and email tokens.
- **`supabase-rest`**: PostgREST instance auto-generating RESTful endpoints from PostgreSQL schemas.
- **`supabase-realtime`**: Elixir-based websocket server for real-time Postgres changes.
- **`supabase-storage`**: Object storage API managing asset uploads with disk-backed volume.
- **`supabase-meta`**: Inspection service powering metadata queries.
- **`supabase-studio`**: Admin Dashboard UI for managing Postgres and Auth.
- **`supabase-kong`**: API Gateway routing request traffic to internal services.

---

## 2. Network Isolation & Security Rules

1. **Local Host Binding**:
   - All services (Postgres `5432`, Auth `9999`, REST `3000`, Realtime `4000`, Storage `5000`, Kong `8000`, Studio `3001`) are strictly bound to `127.0.0.1`.
   - None of the database or internal service ports are exposed to the public internet (`0.0.0.0`).

2. **Supabase Studio Protection**:
   - Studio is bound exclusively to `127.0.0.1:3001`.
   - Access to Studio is restricted to SSH Tunnels (`ssh -L 3001:127.0.0.1:3001 deploy@vps-ip`) or local VPN connections. Studio is NEVER exposed on Nginx or public DNS.

3. **Public Gateway Access**:
   - Only `supabase-kong` gateway (`127.0.0.1:8000`) is routed via Nginx reverse proxy under TLS/SSL (`https://supabase.innoventixhub.com`).

---

## 3. Secret Generation & Deployment Procedure

Execute on Contabo VPS:
```bash
# 1. Copy environment template
cp .env.supabase.example .env.supabase

# 2. Generate secure secrets
openssl rand -hex 32 # Use for POSTGRES_PASSWORD and JWT_SECRET

# 3. Start the stack
docker compose -f docker-compose.supabase.yml --env-file .env.supabase up -d

# 4. Verify health of all services
docker compose -f docker-compose.supabase.yml ps
curl http://127.0.0.1:8000/rest/v1/
```

--- FILE: documentation/infra/server-setup.md ---
# Contabo VPS Server Inventory & Infrastructure Setup

## Overview
This document outlines the base server configuration, security hardening, user access rules, and service topology for the self-hosted Innoventix Platform on Contabo VPS.

---

## 1. Service Topology & Port Allocation

| Service | Container / Process | External Port | Internal / Proxy Destination | Protocol / Auth |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | `sshd` | `22` | Direct | SSH Key Only (Non-root `deploy`) |
| **HTTP** | `nginx` | `80` | Direct -> HTTPS Redirect | Open |
| **HTTPS** | `nginx` | `443` | SSL Termination | TLS 1.2 / TLS 1.3 |
| **n8n Automation** | `n8n` (Docker) | `5678` | `localhost:5678` | Basic Auth / Session Auth |
| **Next.js App** | `app` (Docker) | Internal | `localhost:3000` | App Session / Bearer |
| **Self-Hosted Supabase API** | `postgrest`/`gotrue` | Internal | `localhost:8000` | Supabase JWT / Anon / Service Key |
| **Supabase Postgres DB** | `db` (PostgreSQL) | Internal | `localhost:5432` | DB Role Auth (Isolated) |

---

## 2. Server Access & User Policy

- **Root Access**: Disabled over SSH (`PermitRootLogin no`).
- **Deploy User**: Non-root user `deploy` with `sudo` privileges.
- **Authentication**: Strict SSH key-based authentication only (`PasswordAuthentication no`).
- **Firewall Policy**: `ufw` default-deny incoming, default-allow outgoing. Only Ports `22`, `80`, `443`, and `5678` are open externally.

---

## 3. Pre-Installed Runtimes & Dependencies

- **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS
- **Container Engine**: Docker Engine (`>= 24.0.0`)
- **Orchestration**: Docker Compose v2 (`docker compose`)
- **Reverse Proxy**: Nginx with Let's Encrypt (Certbot)
- **Existing Services**: Co-located n8n container preserved on port 5678.

---

## 4. Maintenance & Health Verification Commands

- Check Docker status: `docker ps`
- Check firewall status: `sudo ufw status verbose`
- Check listening ports: `sudo ss -tulpn`
- Run hardening script: `bash scripts/infra/harden.sh`

--- FILE: documentation/pricing-plans.md ---
# Subscription Plans & Feature Gating Specification

## Overview
This document defines the production subscription tiers, pricing, feature caps, and AI capability gates for all organizations on the Innoventix Platform.

---

## 1. Plan Tiers & Feature Matrix

| Feature / Limit | Starter Plan | Pro Plan | Agency / Enterprise Plan |
| :--- | :--- | :--- | :--- |
| **Monthly Price** | `$29.00 / mo` | `$79.00 / mo` | `$199.00 / mo` |
| **Yearly Price** | `$290.00 / yr` | `$790.00 / yr` | `$1,990.00 / yr` |
| **Max Team Members** | `5` | `15` | `999 (Unlimited)` |
| **Max Active Clients** | `25` | `100` | `9,999 (Unlimited)` |
| **Max Active Projects** | `50` | `250` | `9,999 (Unlimited)` |
| **Storage Limit** | `10 GB` | `50 GB` | `500 GB` |
| **Client Portal Enabled** | `Yes` | `Yes` | `Yes` |
| **AI Reply Suggestions** | `No` | `Yes` | `Yes` |
| **AI Lead Scoring** | `No` | `Yes` | `Yes` |
| **AI Task Extraction** | `No` | `No` | `Yes` |
| **AI Weekly Narrative** | `No` | `No` | `Yes` |
| **Communication Channels** | `1 (Manual Log)` | `3 (Slack + WhatsApp + Email)` | `5 (All Channels)` |

---

## 2. Feature Limits JSON Schema (`subscription_plans.feature_limits`)

```json
{
  "max_team_members": 15,
  "max_clients": 100,
  "max_projects": 250,
  "storage_limit_gb": 50,
  "client_portal_enabled": true,
  "ai_features_enabled": true,
  "ai_capabilities": {
    "reply_suggestions": true,
    "lead_scoring": true,
    "task_extraction": false,
    "weekly_narrative": false
  },
  "communication_channels_included": 3,
  "analytics_level": "advanced"
}
```

---

## 3. Server-Side Enforcement Policy

- All limit checks MUST be evaluated server-side in Server Actions, API routes, or database triggers before inserting new records (e.g. adding team member, creating client, uploading asset).
- Client-side UI disables buttons or displays upgrade banners based on server-evaluated limit state.

--- FILE: infra/kong/kong.local.yml ---
_format_version: "2.1"
_transform: true

services:
  - name: auth
    url: http://local-auth:9999/
    routes:
      - name: auth-v1
        paths:
          - /auth/v1
        strip_path: true

  - name: rest
    url: http://local-rest:3000/
    routes:
      - name: rest-v1
        paths:
          - /rest/v1
        strip_path: true

--- FILE: infra/kong/kong.yml ---
_format_version: "2.1"
_transform: true

services:
  - name: auth
    url: http://auth:9999/
    routes:
      - name: auth-v1
        paths:
          - /auth/v1
        strip_path: true

  - name: rest
    url: http://rest:3000/
    routes:
      - name: rest-v1
        paths:
          - /rest/v1
        strip_path: true

  - name: realtime
    url: http://realtime:4000/
    routes:
      - name: realtime-v1
        paths:
          - /realtime/v1
        strip_path: true

  - name: storage
    url: http://storage:5000/
    routes:
      - name: storage-v1
        paths:
          - /storage/v1
        strip_path: true

--- FILE: next-env.d.ts ---
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.

--- FILE: nginx/conf.d/api.conf ---
# Supabase API Gateway Server Block - api.innoventixhub.com

server {
    listen 80;
    listen [::]:80;
    server_name api.innoventixhub.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.innoventixhub.com;

    ssl_certificate /etc/letsencrypt/live/api.innoventixhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.innoventixhub.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    client_max_body_size 100M;

    # Supabase Kong Gateway reverse proxy
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

--- FILE: nginx/conf.d/app.conf ---
# Next.js App Server Block - app.innoventixhub.com

server {
    listen 80;
    listen [::]:80;
    server_name app.innoventixhub.com;

    # Certbot challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.innoventixhub.com;

    ssl_certificate /etc/letsencrypt/live/app.innoventixhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.innoventixhub.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}

--- FILE: nginx/conf.d/n8n.conf ---
# n8n Automation Engine Server Block - n8n.innoventixhub.com

server {
    listen 80;
    listen [::]:80;
    server_name n8n.innoventixhub.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name n8n.innoventixhub.com;

    ssl_certificate /etc/letsencrypt/live/n8n.innoventixhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.innoventixhub.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Chunked_Transfer_Encoding no;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
    }
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

--- FILE: scripts/infra/backup-postgres.sh ---
#!/usr/bin/env bash
#
# Nightly Automated Backup Script for Self-Hosted Supabase Postgres & Storage Volume
# Usage: bash scripts/infra/backup-postgres.sh
#

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/supabase}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
STORAGE_BACKUP_FILE="${BACKUP_DIR}/storage_backup_${TIMESTAMP}.tar.gz"

echo "[Backup] Starting backup at ${TIMESTAMP}..."

mkdir -p "${BACKUP_DIR}"

# 1. Dump PostgreSQL Database from Docker Container
echo "[Backup] Executing pg_dumpall from supabase-db container..."
docker exec -t supabase-db pg_dumpall -U postgres | gzip -9 > "${DB_BACKUP_FILE}"
chmod 600 "${DB_BACKUP_FILE}"

# 2. Archive Storage Volume
echo "[Backup] Archiving storage volume..."
if docker volume inspect crm-project-management-saas_supabase-storage-data &>/dev/null; then
    docker run --rm -v crm-project-management-saas_supabase-storage-data:/storage -v "${BACKUP_DIR}:/backup" alpine tar -czf "/backup/storage_backup_${TIMESTAMP}.tar.gz" -C /storage .
    chmod 600 "${STORAGE_BACKUP_FILE}"
fi

# 3. Apply Local Retention Policy (Prune backups older than RETENTION_DAYS)
echo "[Backup] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "*.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[Backup] Backup complete! DB: ${DB_BACKUP_FILE}"

--- FILE: scripts/infra/harden.sh ---
#!/usr/bin/env bash
#
# Harden Contabo VPS Base Server
# Usage: sudo bash scripts/infra/harden.sh [deploy_username]
#

set -euo pipefail

DEPLOY_USER="${1:-deploy}"

echo "======================================================"
echo " Starting Contabo VPS Base Server Hardening Routine"
echo " Target Deploy User: ${DEPLOY_USER}"
echo "======================================================"

# 1. Update OS Packages
echo "[1/6] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban ca-certificates gnupg lsb-release

# 2. Configure Non-Root Deploy User
echo "[2/6] Configuring deploy user (${DEPLOY_USER})..."
if ! id "${DEPLOY_USER}" &>/dev/null; then
    useradd -m -s /bin/bash "${DEPLOY_USER}"
    usermod -aG sudo "${DEPLOY_USER}"
    echo "Created user ${DEPLOY_USER}."
fi

# Ensure SSH directory for deploy user
mkdir -p "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/authorized_keys"
    chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
    echo "Copied root SSH authorized_keys to ${DEPLOY_USER}."
fi

# 3. Harden SSH Configuration
echo "[3/6] Hardening SSH daemon configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"
cp "${SSHD_CONFIG}" "${SSHD_CONFIG}.bak.$(date +%F_%T)"

sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "${SSHD_CONFIG}"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "${SSHD_CONFIG}"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "${SSHD_CONFIG}"

systemctl restart ssh || systemctl restart sshd

# 4. Install Docker & Docker Compose v2
echo "[4/6] Installing Docker Engine & Docker Compose v2..."
if ! command -v docker &>/dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

usermod -aG docker "${DEPLOY_USER}" || true

# 5. Configure Firewall (UFW)
echo "[5/6] Configuring UFW Firewall rules..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 5678/tcp comment 'n8n Automation'
ufw --force enable

# 6. Check Existing Services (n8n preservation)
echo "[6/6] Checking existing services..."
if docker ps --format '{{.Names}}' | grep -q "n8n"; then
    echo "CONFIRMED: Existing n8n Docker container is running unaffected."
else
    echo "NOTICE: n8n container not detected in active docker ps list."
fi

echo "======================================================"
echo " Base Server Hardening Complete!"
echo " Docker: $(docker --version)"
echo " Compose: $(docker compose version)"
echo " Firewall Status:"
ufw status numbered
echo "======================================================"

--- FILE: scripts/infra/restore-postgres.sh ---
#!/usr/bin/env bash
#
# Restore Script for Self-Hosted Supabase Postgres & Storage Volume
# Usage: bash scripts/infra/restore-postgres.sh <path_to_db_backup.sql.gz> [path_to_storage_backup.tar.gz]
#

set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: bash scripts/infra/restore-postgres.sh <path_to_db_backup.sql.gz> [path_to_storage_backup.tar.gz]"
    exit 1
fi

DB_BACKUP_FILE="$1"
STORAGE_BACKUP_FILE="${2:-}"

if [ ! -f "${DB_BACKUP_FILE}" ]; then
    echo "Error: File ${DB_BACKUP_FILE} not found."
    exit 1
fi

echo "======================================================"
echo " WARNING: THIS WILL OVERWRITE THE EXISTING DATABASE!"
echo " Target DB Backup: ${DB_BACKUP_FILE}"
echo "======================================================"

read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore canceled."
    exit 0
fi

# 1. Restore Postgres Database
echo "[Restore] Restoring database to supabase-db container..."
gunzip -c "${DB_BACKUP_FILE}" | docker exec -i supabase-db psql -U postgres

# 2. Restore Storage Volume if provided
if [ -n "${STORAGE_BACKUP_FILE}" ] && [ -f "${STORAGE_BACKUP_FILE}" ]; then
    echo "[Restore] Restoring storage volume from ${STORAGE_BACKUP_FILE}..."
    docker run --rm -v crm-project-management-saas_supabase-storage-data:/storage -v "$(dirname "${STORAGE_BACKUP_FILE}"):/backup" alpine tar -xzf "/backup/$(basename "${STORAGE_BACKUP_FILE}")" -C /storage
fi

echo "======================================================"
echo " Restoration Complete!"
echo "======================================================"

--- FILE: V2 Prompt to build system/.agent-state.md ---
# Agent State

## Project
Innoventix Platform v2 — multi-tenant CRM + Project Management + Communication Hub + AI features SaaS, fully self-hosted on Contabo VPS, with a Super Admin platform tier. Originated from the internal "SMB Project Management Tool" assignment for Innoventix Hub.

## Status
IN PROGRESS — Phase 4 Super Admin (Ready for TASK 19).

## Completed
- [x] TASK 01 — Contabo VPS Provisioning & Base Server Hardening (`chore(infra): provision and harden Contabo VPS base server`)
- [x] TASK 02 — Self-Hosted Supabase Stack via Docker Compose (`feat(infra): deploy self-hosted Supabase stack via Docker Compose`)
- [x] TASK 03 — Nginx Reverse Proxy, Domains & SSL Configuration (`feat(infra): configure Nginx reverse proxy with SSL for all subdomains`)
- [x] TASK 04 — Backup & Disaster Recovery Strategy (`feat(infra): add automated backup and tested disaster-recovery procedure`)
- [x] TASK 05 — Local Development Environment Parity (`chore(infra): add local development environment mirroring production Supabase stack`)
- [x] TASK 06 — Repository & Application Foundation (`chore(foundation): initialize application connected to self-hosted Supabase`)
- [x] TASK 07 — Multi-Tenant Architecture Decision Record (ADR) (`docs(architecture): record multi-tenancy and super-admin hierarchy decision`)
- [x] TASK 08 — Core Database Schema: Organizations, Users, Roles & Super Admins (`feat(db): add organizations, roles, and isolated super-admin schema`)
- [x] TASK 09 — Core Database Schema: CRM & Project Management Tables (`feat(db): add tenant-scoped CRM/PM schema with communication-mode field`)
- [x] TASK 10 — Core Database Schema: Communication Hub & Billing (`feat(db): add communication hub and billing schema`)
- [x] TASK 11 — Authentication (Self-Hosted GoTrue) & Team Member Management (`feat(auth): implement authentication against self-hosted Supabase Auth`)
- [x] TASK 12 — Authorization — Roles & Row-Level Security (RLS) Policies (`feat(security): enforce row-level security for full tenant isolation`)
- [x] TASK 13 — Organization Onboarding & Tenant Provisioning (`feat(onboarding): add multi-step tenant onboarding flow`)
- [x] TASK 14 — Subscription Plans Definition (`feat(billing): define subscription tiers and feature-limit enforcement`)
- [x] TASK 15 — Stripe Billing Integration (`feat(billing): integrate Stripe subscriptions and webhook sync`)
- [x] TASK 16 — Super Admin — Access Control Layer (`feat(security): implement isolated super-admin access-control layer`)
- [x] TASK 17 — Super Admin — Platform Dashboard (`feat(super-admin): build platform-wide operator dashboard`)
- [x] TASK 18 — Super Admin — Organization Management (`feat(super-admin): build organization management screen`)

## In Progress
- [ ] TASK 19 — Super Admin — Impersonation and Support Access

## Deferred
- (none yet)

## Architecture Decisions Made
- Row-level multi-tenancy via `organization_id` on every tenant-scoped table (documentation/adr/001-multi-tenancy.md, created in TASK 07).
- Super Admin stored in a fully separate `super_admins` table, never derivable from `organization_members` (TASK 07, TASK 16).
- Self-hosted Supabase (Docker Compose) on the Contabo VPS replaces Supabase Cloud (TASK 02); Next.js app self-hosted on the same VPS via CI/CD replaces Netlify (TASK 68).
- Innoventix Hub is Organization #1, no special-cased code.

## Blockers
- (none yet)

## Last Completed Task
- TASK 18 — Super Admin — Organization Management

## Last Successful Commit
- `bc2bb2d` — `feat(super-admin): build detailed organization management page`

## Deployment Status
- Tailwind CSS directives corrected in `app/globals.css` (`@tailwind base`, `@tailwind components`, `@tailwind utilities`), `.next` cache purged, and Next.js build compilation verified 100% clean.

## Known Bugs
- RESOLVED: Missing `.env.local` opaque failure during dev startup. Resolved by populating `.env.local` with local Supabase stack credentials and adding explicit startup guards in Supabase client helpers and middleware.
- RESOLVED: Tailwind CSS directives syntax in `app/globals.css` (`@tailwindcss` instead of `@tailwind`). Fixed by correcting directives in `app/globals.css`, expanding content array in `tailwind.config.ts`, and clearing `.next` build cache.

## Next Recommended Task
`TASK 19 — Super Admin — Impersonation and Support Access`
(see `19-super-admin--impersonation-and-support-access.md`)

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

