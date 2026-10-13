# Project Context

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Active Production-Bound Migration & Modernization

---

## 1. Purpose

Innoventix is a high-performance, multi-tenant B2B SaaS platform combining:
1. **CRM & Client Management**: Client directory, multi-channel communication tracking, tagging, and activity logs.
2. **Sales Pipeline (Kanban)**: Visual drag-and-drop deal management with `@dnd-kit`, win/loss tracking, and AI lead scoring.
3. **Project Management**: Deliverables, milestones, tasks, team workload, and interactive Gantt-style timelines.
4. **Omni-Channel Unified Inbox**: Centralized message aggregation and responses across Slack, WhatsApp, and Email with AI task extraction.
5. **Client Portal**: External secure client access for viewing project deliverables, timelines, and invoices.
6. **Super Admin Suite**: Multi-tenant organization oversight, impersonation with audit trails, and system-wide settings.

---

## 2. Tech Stack

- **Frontend Core**: Next.js 14.2.24 (App Router), React 18.3.1, TypeScript 5.7.3.
- **Styling & Design System**: Tailwind CSS 3.4.17, PostCSS 8.5.2, CSS Custom Properties (Theme tokens for Light, Dark, High-Contrast), Lucide React (0.475.0).
- **Interactive Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Backend & APIs**: Next.js Server Actions (`'use server'`) and Next.js Route Handlers (`app/api/**`).
- **Database Engine**: Self-hosted PostgreSQL (migrated from Supabase), node-postgres (`pg` connection pool with min 2 / max 10 connections).
- **Authentication & Security**: Custom stateless JWT authentication (`jose`, `jsonwebtoken`), bcrypt password hashing (`bcryptjs`), HttpOnly Secure Lax session cookies, refresh token rotation with family invalidation.
- **Email & Communications**: NodeMailer over Mailcow SMTP (`mail.innoventixhub.tech:587`).
- **Billing & Subscriptions**: Stripe API (`@stripe/stripe-js`, `stripe`).
- **Validation**: Zod (v4.6.5) runtime schemas for all server actions and route handlers.
- **Testing & Quality Assurance**: Vitest 4.1.11 (Unit & Integration, 67 test suites, 449 passing tests), Playwright 1.63.0 (E2E full system).
- **Hosting & Infrastructure**: Contabo VPS, Docker Compose (`docker-compose.prod.yml`, `docker-compose.local.yml`), Nginx reverse proxy, PgBouncer pooler, Coolify deployment automation.

---

## 3. Core Architectural Constraints

1. **Self-Hosted PostgreSQL**: No cloud Supabase dependencies in production; schema migrations are tracked in `supabase/migrations/` and executed via `lib/db/auto-migrate.ts`.
2. **Strict Multi-Tenant Isolation**: Multi-tenancy is enforced at the application layer on every query and mutation. Every query MUST filter by `organization_id` derived exclusively from the verified session context (`getCurrentSessionContext()`). Client-supplied `orgId` overrides are forbidden.
3. **Dual-Repository Synchronization**:
   - `origin`: `https://github.com/MaazzAlii/crm-project-management-saas.git`
   - `deploy`: `https://github.com/Urk-Khan/Project-Management-CRM.git`
   Both remotes must stay 100% in sync at all times upon user push approval.
4. **Push Approval Protocol**: No code is pushed to remote without explicit written user approval during that active session.
5. **Audit Logging**: Every state change, auth event, and impersonation action must be logged via `logAuditEvent()`.

---

## 4. Key Architectural Decisions

- **ADR-001**: Migration from Supabase to Self-Hosted PostgreSQL with custom JWT auth.
- **ADR-002**: Stateless Access Token (30 min) + Rotating Refresh Token (7 days) with reuse detection.
- **ADR-003**: Universal Tokenized Design System supporting Light and Dark modes without hardcoded colors.
- **ADR-004**: Liquid Glass Material hierarchy (Glass strictly for chrome; opaque surfaces for data density).

---

## 5. Related Files

- `docs/prompts/UNIVERSAL-UI-AND-ENGINEERING-PROTOCOL.md`
- `docs/prompts/AUTH-HARDENING-MASTER-PROMPT.md`
- `docs/design/DESIGN-SYSTEM.md`
- `docs/engineering/DATA-AND-API.md`
- `docs/engineering/AUTH-AND-RBAC.md`
- `AGENTS.md`
- `MIGRATION_EXECUTION_LOG.md`
