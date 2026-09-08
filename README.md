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
