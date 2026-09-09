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
