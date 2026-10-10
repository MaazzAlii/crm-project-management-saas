# Innoventix Platform v2 — Full System E2E Testing & Screenshot Protocol

> **Admin Email**: Configure via `ADMIN_EMAIL` / `TEST_USER_EMAIL` env var (default: `admin@innoventix.io`)  
> **Admin Password**: Configure via `ADMIN_PASSWORD` / `TEST_USER_PASSWORD` env var  
> **Role**: `super_admin` & Workspace Owner  
> **Access Tier**: `Lifetime VIP Access` (Permanent unlimited access)  
> **Output Screenshot Directory**: `assets/screenshots/`  

---

## 🎯 Resumption Command for Next Session
When returning, simply prompt:  
> **"Continue test"** or **"Run Section 1 test"**  

The agent will read `.agent-state.md`, check the completed sections, launch the browser subagent / Playwright against the live domain, test every button and interaction, capture screenshots into `assets/screenshots/`, update `.agent-state.md`, commit atomically, and push to both GitHub remotes.

---

## 📋 The 7-Section Testing Breakdown

### 🔹 Section 1: Authentication, Onboarding & Workspace Initialization
- **Target URLs**:
  - Landing Page: `/`
  - Admin Sign In: `/login`
  - Workspace Sign Up: `/signup`
- **Actions to Execute**:
  1. Navigate to `/` landing page, inspect hero, features, and pricing cards.
  2. Click **"Sign In"** / navigate to `/login`.
  3. Enter configured administrator credentials.
  4. Submit login form and verify session cookie issuance and redirect to `/dashboard`.
- **Screenshots to Capture**:
  - `assets/screenshots/01-landing-page.png`
  - `assets/screenshots/02-login-page.png`
  - `assets/screenshots/03-dashboard-initial.png`

---

### 🔹 Section 2: Executive Dashboard & Analytics Suite
- **Target URLs**:
  - `/dashboard`
  - `/analytics`
  - `/analytics/revenue`
  - `/analytics/plan-usage`
  - `/reports`
- **Actions to Execute**:
  1. Open `/dashboard`, verify revenue pipeline metric cards, active workloads, and quick action buttons.
  2. Navigate to `/analytics`, verify status distribution chart, team workload, and delivery velocity.
  3. Navigate to `/analytics/revenue`, inspect financial ledger, top clients revenue bar chart, and CSV export.
  4. Navigate to `/analytics/plan-usage`, verify resource quotas (Lifetime VIP tier showing unlimited capacity).
  5. Navigate to `/reports`, trigger the AI Weekly Narrative generator modal.
- **Screenshots to Capture**:
  - `assets/screenshots/04-main-dashboard.png`
  - `assets/screenshots/05-analytics-overview.png`
  - `assets/screenshots/06-analytics-revenue.png`
  - `assets/screenshots/07-analytics-plan-usage.png`
  - `assets/screenshots/08-weekly-report-modal.png`

---

### 🔹 Section 3: CRM & Client Lifecycle
- **Target URLs**:
  - `/clients`
  - `/clients/new`
  - `/clients/[id]`
  - `/leads`
  - `/clients/[id]/communications`
- **Actions to Execute**:
  1. Navigate to `/clients` directory, check filters and search.
  2. Click **"Add Client"** (`/clients/new`), fill client creation modal/form, submit.
  3. View client detail page (`/clients/[id]`), check communication mode badge (`manual` vs `connected`).
  4. Navigate to `/leads` Kanban board, inspect deal cards and 0–100 AI Lead Scoring badges.
  5. Click AI Lead Score badge to verify breakdown modal.
- **Screenshots to Capture**:
  - `assets/screenshots/09-crm-clients-list.png`
  - `assets/screenshots/10-crm-add-client-modal.png`
  - `assets/screenshots/11-crm-client-detail.png`
  - `assets/screenshots/12-crm-leads-kanban.png`
  - `assets/screenshots/13-crm-lead-score-breakdown.png`

---

### 🔹 Section 4: Project Management Suite
- **Target URLs**:
  - `/projects`
  - `/projects/kanban`
  - `/projects/[id]`
  - `/tasks`
- **Actions to Execute**:
  1. Open `/projects` list view, inspect project progress indicators and budget health.
  2. Open `/projects/kanban`, drag/transition cards across stages (`planned` -> `in_progress` -> `delivered`).
  3. Verify Deliver Project confirmation modal and automatic invoice trigger.
  4. View project detail (`/projects/[id]`), inspect deliverables and approval flow.
  5. Open `/tasks` workload board, filter by assignee, priority, and due date.
- **Screenshots to Capture**:
  - `assets/screenshots/14-projects-list.png`
  - `assets/screenshots/15-projects-kanban.png`
  - `assets/screenshots/16-project-deliver-modal.png`
  - `assets/screenshots/17-project-detail-deliverables.png`
  - `assets/screenshots/18-tasks-workload-board.png`

---

### 🔹 Section 5: Communication Hub & AI Features
- **Target URLs**:
  - `/inbox`
  - `/settings/integrations`
  - `/settings/integrations/slack`
  - `/settings/integrations/whatsapp`
  - `/settings/integrations/email`
- **Actions to Execute**:
  1. Open Unified Inbox (`/inbox`), inspect multi-channel threads.
  2. Click message thread to test AI reply suggestion trigger.
  3. Test AI auto-task extraction modal.
  4. Open `/settings/integrations`, verify webhook configurations and connection statuses.
- **Screenshots to Capture**:
  - `assets/screenshots/19-unified-inbox.png`
  - `assets/screenshots/20-ai-reply-suggestions.png`
  - `assets/screenshots/21-ai-task-extraction-modal.png`
  - `assets/screenshots/22-channel-integrations.png`

---

### 🔹 Section 6: Super Admin & Lifetime Access Management
- **Target URLs**:
  - `/super-admin/dashboard`
  - `/super-admin/organizations`
  - `/super-admin/organizations/[id]`
  - `/super-admin/settings`
  - `/super-admin/audit-log`
- **Actions to Execute**:
  1. Open `/super-admin/dashboard`, verify global cross-tenant metrics and system health.
  2. Open `/super-admin/organizations`, list all tenant organizations.
  3. Open organization detail (`/super-admin/organizations/[id]`), click **"Override Plan"**.
  4. Verify **"⭐ Lifetime VIP"** option in modal, confirm permanent lifetime access assignment.
  5. Open `/super-admin/settings`, verify platform-level AI kill switch toggle.
  6. Open `/super-admin/audit-log`, verify immutable audit log records.
- **Screenshots to Capture**:
  - `assets/screenshots/23-super-admin-dashboard.png`
  - `assets/screenshots/24-super-admin-organizations.png`
  - `assets/screenshots/25-super-admin-lifetime-override.png`
  - `assets/screenshots/26-super-admin-platform-settings.png`
  - `assets/screenshots/27-super-admin-audit-log.png`

---

### 🔹 Section 7: Client Portal & Organization Settings
- **Target URLs**:
  - `/settings/team`
  - `/settings/organization`
  - `/settings/templates`
  - `/settings/ai`
  - `/settings/billing`
  - `/client/login`
- **Actions to Execute**:
  1. Open `/settings/team`, verify member list, roles, and invitation trigger.
  2. Open `/settings/organization`, inspect timezone, industry, and webhook keys.
  3. Open `/settings/templates`, view reusable project templates with offset scaffolding.
  4. Open `/settings/ai`, test tenant AI feature toggles and consumption statistics.
  5. Open `/settings/billing`, verify Lifetime VIP active status and unlimited quotas.
  6. Open `/client/login`, test client portal isolated authentication gateway.
- **Screenshots to Capture**:
  - `assets/screenshots/28-settings-team.png`
  - `assets/screenshots/29-settings-organization.png`
  - `assets/screenshots/30-settings-project-templates.png`
  - `assets/screenshots/31-settings-ai-controls.png`
  - `assets/screenshots/32-settings-billing-lifetime.png`
  - `assets/screenshots/33-client-portal-login.png`

---

## 🔄 Commit & Push Protocol After Each Section
Following repository instructions:
1. Save screenshots to `assets/screenshots/`
2. Update `.agent-state.md` with status `[x]`
3. Commit with Conventional Commits:  
   `git commit -m "test(e2e): complete section X testing and capture screenshots"`
4. Push to both remotes:  
   `git push origin main && git push deploy main`
