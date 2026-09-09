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
