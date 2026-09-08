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
