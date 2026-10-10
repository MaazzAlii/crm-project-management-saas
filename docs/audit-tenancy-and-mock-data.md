# Tenant Isolation and Mock Data Audit Report

> **Audit Date:** 2026-10-10  
> **Target Branch:** `main` (Synced with `deploy/main` at commit `3998e99`)  
> **Scope:** Read-Only Audit of API Route Handlers, Server Actions, Server Components, Mock Data, and Navigation Routes.

---

## Executive Summary Table

| Item | Severity | File | Screen / Area Affected | Description |
| :--- | :--- | :--- | :--- | :--- |
| **A-1** | **CRITICAL** | `app/(dashboard)/projects/[id]/page.tsx` (L38) | Project Detail (`/projects/[id]`) | Unfiltered `SELECT id, full_name, email FROM users` queries and leaks all platform users across all tenants. |
| **A-2** | **CRITICAL** | `app/(dashboard)/projects/kanban/page.tsx` (L23) | Projects Kanban (`/projects/kanban`) | Unfiltered `SELECT id, name FROM clients` queries and leaks every client in the platform across all tenants. |
| **A-3** | **CRITICAL** | `app/(dashboard)/projects/kanban/page.tsx` (L24) | Projects Kanban (`/projects/kanban`) | Unfiltered `SELECT id, full_name, email FROM users` queries and leaks all users across all tenants. |
| **A-4** | **CRITICAL** | `app/api/users/route.ts` (L17) | Users API (`GET /api/users`) | Calls `userService.listUsers()` executing `SELECT * FROM users` without tenant scoping; any authenticated user can dump all platform users. |
| **A-5** | **CRITICAL** | `app/api/users/[id]/route.ts` (L17) | Users API (`GET /api/users/[id]`) | Returns user profile for any user ID without checking organization membership or tenant boundary. |
| **A-6** | **CRITICAL** | `app/api/organizations/[id]/members/route.ts` (L17) | Organization Members API (`GET /api/organizations/[id]/members`) | Retrieves team members of ANY organization ID specified in the URL params without checking session membership. |
| **A-7** | **CRITICAL** | `app/api/organizations/[id]/route.ts` (L17) | Organization API (`GET /api/organizations/[id]`) | Returns full organization details of ANY tenant specified in the URL params without checking session membership. |
| **A-8** | **HIGH** | `app/api/crm/clients/route.ts` (L15, L40) | Clients API (`GET/POST /api/crm/clients`) | Derives `orgId` from query param `?orgId=` or body `organizationId` with fallback, allowing cross-tenant read/write injection. |
| **A-9** | **HIGH** | `app/api/crm/clients/[id]/route.ts` (L18, L42, L65) | Client Detail API (`GET/PUT/DELETE /api/crm/clients/[id]`) | Allows query string `?orgId=` or body `organizationId` to override tenant boundary on client read/update/delete. |
| **A-10** | **HIGH** | `app/api/crm/leads/route.ts` (L14, L34, L55) | Leads API (`GET/POST/PATCH /api/crm/leads`) | Allows query param `?orgId=` or body `organizationId` to override tenant context when reading/updating leads. |
| **A-11** | **HIGH** | `app/api/crm/analytics/route.ts` (L14) | CRM Analytics API (`GET /api/crm/analytics`) | Allows query param `?orgId=` to read full CRM analytics and revenue totals of another tenant. |
| **A-12** | **HIGH** | `app/api/projects/route.ts` (L15, L41) | Projects API (`GET/POST /api/projects`) | Derives `orgId` from query string or body instead of strict session context. |
| **A-13** | **HIGH** | `app/api/projects/[id]/route.ts` (L18, L42, L65) | Project Detail API (`GET/PUT/DELETE /api/projects/[id]`) | Derives `orgId` from query string or body instead of strict session context. |
| **A-14** | **HIGH** | `app/api/projects/[id]/tasks/route.ts` (L18, L42, L75, L104) | Project Tasks API (`/api/projects/[id]/tasks`) | Derives `orgId` from query string or body instead of strict session context. |
| **A-15** | **HIGH** | `app/api/billing/usage/route.ts` (L14) | Billing Usage API (`GET /api/billing/usage`) | Reads plan usage and quota limits for any tenant specified via `?orgId=`. |
| **A-16** | **HIGH** | `app/api/billing/invoices/route.ts` (L14) | Invoices API (`GET /api/billing/invoices`) | Exposes tenant invoices and billing amounts to any caller supplying `?orgId=`. |
| **A-17** | **HIGH** | `app/api/communications/inbox/route.ts` (L14) | Communications Inbox API (`GET /api/communications/inbox`) | Derives `orgId` from `?orgId=` parameter, exposing external client messages across tenants. |
| **A-18** | **HIGH** | `app/actions/org.ts` (L6) | Organization Switch Action (`setActiveOrgAction`) | Sets active org cookie directly from client argument without verifying user membership in that organization. |
| **B-1** | **MEDIUM** | `app/(dashboard)/inbox/actions.ts` (L50–140, L215, L276) | Unified Inbox (`/inbox`) | Fallback `DEV_SAMPLE_MESSAGES` with fake users ("Sarah Jenkins", "Michael Chang", "Elena Rostova") returned when DB is empty. |
| **B-2** | **MEDIUM** | `app/(dashboard)/projects/actions.ts` (L538–625) | Projects Directory (`/projects`) | Fallback `getDevProjects` returns 4 fake projects (`proj-1`, `proj-2`, `proj-3`, `proj-4`) with fixed dollar amounts ($14,500, $8,200, $6,500, $11,000). |
| **B-3** | **MEDIUM** | `app/(dashboard)/tasks/actions.ts` (L335–401) | Tasks Board (`/tasks`) | Fallback `getDevGlobalTasks` returns 4 fake tasks (`tsk-101`..`tsk-104`) referencing `proj-1`..`proj-3` and fake users ("Alex Johnson", "Sarah Smith", "Michael Brown"). |
| **B-4** | **MEDIUM** | `app/(dashboard)/dashboard/page.tsx` (L47–60) | Workspace Dashboard (`/dashboard`) | Hardcoded metric overrides (3 active projects, 8 pending tasks, 1 overdue, 5 clients, `act-1`) for dev default org. |
| **B-5** | **MEDIUM** | `app/(dashboard)/projects/[id]/page.tsx` (L48–52) | Project Detail (`/projects/[id]`) | Hardcoded fallback team members (`usr_1`: Alex Johnson, `usr_2`: Sarah Smith, `usr_3`: Michael Brown). |
| **B-6** | **MEDIUM** | `app/(dashboard)/projects/kanban/page.tsx` (L41–54) | Projects Kanban (`/projects/kanban`) | Hardcoded fallback clients (`Acme Corp`, `Stark Industries`, `Wayne Enterprises`) and members (`Alex Johnson`, `Sarah Smith`). |
| **B-7** | **MEDIUM** | `app/(dashboard)/tasks/page.tsx` (L52–58) | Tasks Directory (`/tasks`) | Hardcoded fallback team members (`usr_1`: Alex Johnson, `usr_2`: Sarah Smith, `usr_3`: Michael Brown). |
| **B-8** | **MEDIUM** | `app/(dashboard)/clients/[id]/page.tsx` (L47–64) | Client Detail (`/clients/[id]`) | Fallback mock client "Acme Global Ventures" when record is missing and `DEV_SUPER_ADMIN=true`. |
| **B-9** | **MEDIUM** | `app/(dashboard)/notifications/actions.ts` (L149–187) | In-App Notifications (`/notifications`) | Fallback `getDevNotifications` with 3 fake alerts referencing `proj-1` and `tsk-101`. |
| **C-1** | **HIGH** | `components/dashboard/QuickActions.tsx` (L26) | Workspace Dashboard Quick Actions | "Invite Team" button targets `/team?action=invite`, which **does not exist** (returns 404). Real route is `/settings/team`. |

---

## Part A: Tenant Isolation Audit

### 1. Route Handlers (`app/api`)

| Route Path | HTTP Methods | Tables Read / Written | `organization_id` Filter Derivation | Tenancy Evaluation & Flags |
| :--- | :--- | :--- | :--- | :--- |
| `app/api/auth/forgot-password` | POST | `users` | N/A (Public auth by email) | OK (Public) |
| `app/api/auth/reset-password` | POST | `users` | N/A (Public auth by reset token) | OK (Public) |
| `app/api/auth/refresh` | POST | `refresh_tokens`, `users` | N/A (User token refresh) | OK (User scoped) |
| `app/api/auth/session` | GET | `users`, `organizations`, `organization_members` | JWT Session Cookie | OK (Session scoped) |
| `app/api/auth/change-password` | POST | `users` | Session User ID | OK (User scoped) |
| `app/api/auth/magic-link` | POST | `users` | N/A (Email lookup) | OK (Public) |
| `app/api/auth/dev-bypass` | POST | `users` | N/A (Dev endpoint) | Caution (Dev only) |
| `app/api/auth/login` | POST | `users`, `refresh_tokens` | N/A (Public auth) | OK (Public) |
| `app/api/auth/signup` | POST | `users`, `organizations`, `organization_members`, `pipelines`, `pipeline_stages` | Inserts new tenant | OK (New tenant creation) |
| `app/api/auth/verify-magic-link` | GET | `users`, `refresh_tokens` | Token verification | OK (Public auth) |
| `app/api/auth/logout` | POST | `refresh_tokens` | Session Refresh Token | OK (User scoped) |
| `app/api/health` | GET | None (`SELECT 1`) | N/A (Liveness probe) | OK (System) |
| `app/api/users` | GET, POST | `users` | **None** (`SELECT * FROM users`) | **CRITICAL** (Unfiltered platform user read) |
| `app/api/users/[id]` | GET, PUT, DELETE | `users` | None (Direct URL parameter) | **CRITICAL** (Cross-tenant user profile read) |
| `app/api/users/profile` | GET, PUT | `users` | Session User ID | OK (Self profile) |
| `app/api/users/preferences` | GET, PUT | `users` | Session User ID | OK (Self preferences) |
| `app/api/organizations` | GET, POST | `organizations`, `organization_members` | User ID memberships | OK (Scoped to user memberships) |
| `app/api/organizations/[id]` | GET, PUT, DELETE | `organizations` | **URL Parameter `id`** | **CRITICAL** / **HIGH** (No membership check on GET) |
| `app/api/organizations/[id]/members` | GET, POST, PATCH, DELETE | `organization_members`, `users` | **URL Parameter `id`** | **CRITICAL** / **HIGH** (Cross-tenant member leak on GET) |
| `app/api/organizations/[id]/invitations` | GET, POST | `organization_invitations` | URL Parameter `id` | **HIGH** (Derived from URL param) |
| `app/api/organizations/[id]/settings` | GET, PUT | `organizations` | URL Parameter `id` | **HIGH** (Derived from URL param) |
| `app/api/crm/clients` | GET, POST | `clients` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/crm/clients/[id]` | GET, PUT, DELETE | `clients` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/crm/clients/[id]/interactions` | GET, POST | `client_interactions` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/crm/leads` | GET, POST, PATCH | `clients` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/crm/interactions` | GET, POST | `client_interactions` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/crm/analytics` | GET | `clients`, `projects` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/crm/tags` | GET, POST | `client_tags` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/projects` | GET, POST | `projects` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/projects/[id]` | GET, PUT, DELETE | `projects` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/projects/[id]/tasks` | GET, POST, PATCH, DELETE | `tasks` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/projects/[id]/deliverables` | GET, POST, PATCH | `deliverables` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/projects/templates` | GET, POST | `project_templates` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/pipelines` | GET, POST | `pipelines`, `pipeline_stages` | Session (`session.orgId`) | OK (Derived strictly from JWT session) |
| `app/api/pipelines/[id]` | GET, PATCH, DELETE | `pipelines` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/stages` | POST | `pipeline_stages` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/stages/[stageId]` | PATCH, DELETE | `pipeline_stages` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/stages/order` | PUT | `pipeline_stages` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/board` | GET | `deals`, `pipeline_stages` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/stats` | GET | `deals` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/export` | GET | `deals` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/labels` | GET, POST | `pipeline_labels` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/pipelines/[id]/labels/[labelId]` | DELETE | `pipeline_labels` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals` | POST | `deals` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]` | GET, PATCH, DELETE | `deals` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/move` | POST | `deals`, `deal_activities` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/archive` | POST | `deals`, `deal_activities` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/restore` | POST | `deals`, `deal_activities` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/activity` | GET | `deal_activities` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/comments` | GET, POST | `deal_comments` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/comments/[commentId]` | DELETE | `deal_comments` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/checklists` | GET, POST | `deal_checklists` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/checklists/[checklistId]/items` | POST | `deal_checklist_items` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/deals/[id]/checklists/[checklistId]/items/[itemId]` | PATCH, DELETE | `deal_checklist_items` | Session (`session.orgId`) | OK (Verified against session org) |
| `app/api/billing/plans` | GET | `subscription_plans` | Global public plans | OK (System-wide public plans) |
| `app/api/billing/usage` | GET | `organization_subscriptions`, `clients`, `projects` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/billing/invoices` | GET | `invoices` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/billing/subscribe` | POST | `organization_subscriptions` | `body.organizationId || auth.orgId` | **HIGH** (Body overrides session org) |
| `app/api/communications/inbox` | GET | `communication_messages` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/communications/channels` | GET, POST | `communication_channels` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/communications/history` | GET | `communication_messages` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/communications/send` | POST | `communication_messages` | `body.organizationId || auth.orgId` | **HIGH** (Body overrides session org) |
| `app/api/communications/[id]` | GET, DELETE | `communication_messages` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/webhooks/discord` | GET, POST | `communication_messages` | Inbound external webhook | OK (Matches channel token) |
| `app/api/webhooks/whatsapp` | GET, POST | `communication_messages` | Inbound external webhook | OK (Matches channel token) |
| `app/api/webhooks/slack` | GET, POST | `communication_messages` | Inbound external webhook | OK (Matches channel token) |
| `app/api/webhooks/email` | GET, POST | `communication_messages` | Inbound external webhook | OK (Matches channel token) |
| `app/api/webhooks/upwork` | GET, POST | `communication_messages` | Inbound external webhook | OK (Matches channel token) |
| `app/api/automation/webhooks` | POST | `automation_rules` | Inbound external webhook | OK (Matches rule token) |
| `app/api/automation/callback/invoice-created` | POST | `invoices`, `audit_logs` | Secret header verified | OK (Service callback) |
| `app/api/automation/history` | GET | `automation_logs` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/automation/events` | GET | `automation_events` | `searchParams.get('orgId') || auth.orgId` | **HIGH** (Query string overrides session org) |
| `app/api/automation/cron/weekly-summary` | POST | `reports`, `audit_logs` | Cron bearer secret token | OK (Background system task) |
| `app/api/automation/cron/deadline-check` | POST | `tasks`, `notifications` | Cron bearer secret token | OK (Background system task) |
| `app/api/stripe/webhook` | POST | `organization_subscriptions`, `invoices` | Stripe signature verified | OK (Stripe webhook) |
| `app/api/seed-demo-data` | GET, POST | Multiple tables | Session org / Body org | Caution (Dev / Demo seeding) |
| `app/api/super-admin/impersonate` | POST, DELETE | Session Cookie | Super admin role check | OK (Super Admin only) |

---

### 2. Server Actions (`app/actions` and `app/**/actions.ts`)

| Action File & Function | Tables Read / Written | `organization_id` Derivation | Tenancy Evaluation & Flags |
| :--- | :--- | :--- | :--- |
| `app/actions/signup.ts`: `signupAction` | `users`, `organizations`, `organization_members` | Inserts new tenant | OK (Creates new tenant) |
| `app/actions/portal-settings.ts`: `updatePortalProfileAction` | `clients` | `requirePortalSession()` | **HIGH** (Query updates `WHERE id = $1` without `AND organization_id = $2`) |
| `app/actions/portal-settings.ts`: `updatePortalBillingAction` | `clients` | `requirePortalSession()` | **HIGH** (Updates `WHERE id = $1` without `AND organization_id = $2`) |
| `app/actions/portal-settings.ts`: `updatePortalNotificationsAction` | `clients` | `requirePortalSession()` | **HIGH** (Updates `WHERE id = $1` without `AND organization_id = $2`) |
| `app/actions/onboarding.ts`: `completeOnboardingAction` | `organizations` | `getCurrentSessionContext().organization.id` | OK (Session scoped) |
| `app/actions/analytics.ts`: `generateAnalyticsNarrativeAction` | `projects`, `tasks`, `clients` | `getCurrentSessionContext().organization.id` | OK (Session scoped) |
| `app/actions/stripe.ts`: `createCheckoutSessionAction` | `organization_subscriptions` | `getCurrentSessionContext().organization.id` | OK (Session scoped) |
| `app/actions/platform-settings.ts`: `savePlatformSettingsAction` | `platform_settings` | Platform Super-Admin scope | OK (Super Admin only) |
| `app/actions/org.ts`: `setActiveOrgAction` | None (cookie only) | **Client Argument `orgId`** | **HIGH** (Sets active org cookie without membership check) |
| `app/actions/ai.ts`: `executeAITaskAction` | `ai_usage_log` | `getCurrentSessionContext().organization.id` | OK (Session scoped) |
| `app/(dashboard)/clients/actions.ts`: `fetchClientsAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/clients/actions.ts`: `createClientAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/clients/actions.ts`: `updateClientAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/clients/actions.ts`: `deleteClientAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/clients/actions.ts`: `switchClientToConnectedModeAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/projects/actions.ts`: `fetchProjectsAction` | `projects` | `session.organization.id` | OK (Session scoped, dev fallback exists) |
| `app/(dashboard)/projects/actions.ts`: `createProjectAction` | `projects` | `session.organization.id` | OK (Session scoped, dev fallback exists) |
| `app/(dashboard)/projects/actions.ts`: `updateProjectStatusAction` | `projects` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/projects/actions.ts`: `deleteProjectAction` | `projects` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/tasks/actions.ts`: `fetchAllTasksAction` | `tasks` | `session.organization.id` | OK (Session scoped, dev fallback exists) |
| `app/(dashboard)/tasks/actions.ts`: `createGlobalTaskAction` | `tasks` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/tasks/actions.ts`: `updateTaskStatusAction` | `tasks` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/leads/actions.ts`: `updateLeadStageAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/leads/actions.ts`: `createLeadAction` | `clients` | `session.organization.id` | OK (Session scoped) |
| `app/(dashboard)/inbox/actions.ts`: `fetchInboxMessagesAction` | `communication_messages` | `session.organization.id` | OK (Session scoped, dev fallback exists) |
| `app/(dashboard)/notifications/actions.ts`: `fetchNotificationsAction` | `in_app_notifications` | `session.organization.id` | OK (Session scoped, dev fallback exists) |

---

### 3. Server Components & Pages Querying Database Directly

| File Path | Query Executed | Tables Queried | `organization_id` Filtering | Evaluation & Flags |
| :--- | :--- | :--- | :--- | :--- |
| `app/(dashboard)/projects/[id]/page.tsx` (L38) | `SELECT id, full_name, email FROM users ORDER BY full_name` | `users` | **NONE** | **CRITICAL** (Cross-tenant leak of all platform users) |
| `app/(dashboard)/projects/kanban/page.tsx` (L23) | `SELECT id, name FROM clients ORDER BY name ASC` | `clients` | **NONE** | **CRITICAL** (Cross-tenant leak of all platform clients) |
| `app/(dashboard)/projects/kanban/page.tsx` (L24) | `SELECT id, full_name, email FROM users ORDER BY full_name ASC` | `users` | **NONE** | **CRITICAL** (Cross-tenant leak of all platform users) |
| `app/(dashboard)/tasks/page.tsx` (L36–40) | `SELECT u.id, u.full_name, u.email FROM users u JOIN organization_members om ON om.user_id = u.id WHERE om.organization_id = $1` | `users`, `organization_members` | `session.organization.id` | OK (Correctly scoped to tenant members) |
| `app/(dashboard)/clients/page.tsx` (L28–32) | `SELECT * FROM clients WHERE organization_id = $1 ORDER BY created_at DESC` | `clients` | `session.organization.id` | OK (Correctly scoped to tenant) |
| `app/(dashboard)/clients/[id]/page.tsx` (L34–37) | `SELECT * FROM clients WHERE id = $1 AND organization_id = $2` | `clients` | `session.organization.id` | OK (Correctly scoped to tenant) |
| `app/(dashboard)/dashboard/page.tsx` (L63–98) | `SELECT COUNT(*) FROM projects ... WHERE organization_id = $1`, `SELECT COUNT(*) FROM tasks ... WHERE organization_id = $1`, `SELECT COUNT(*) FROM clients ... WHERE organization_id = $1` | `projects`, `tasks`, `clients` | `sessionContext.organization.id` | OK (Correctly scoped to tenant) |
| `app/(dashboard)/settings/team/page.tsx` (L26–36) | `SELECT om.id, om.role, om.created_at, u.id as user_id, u.full_name, u.email FROM organization_members om JOIN users u ON u.id = om.user_id WHERE om.organization_id = $1` | `organization_members`, `users` | `session.organization.id` | OK (Correctly scoped to tenant) |
| `app/(dashboard)/settings/organization/page.tsx` (L21–25) | `SELECT id, name, slug, logo_url FROM organizations WHERE id = $1` | `organizations` | `session.organization.id` | OK (Correctly scoped to tenant) |
| `app/(dashboard)/leads/page.tsx` (L23–24) | `pipelineRepo.ensureDefaultPipeline(orgId)`, `pipelineRepo.listPipelines(orgId)` | `pipelines`, `pipeline_stages` | `session.organization.id` | OK (Correctly scoped to tenant) |
| `app/(dashboard)/analytics/plan-usage/page.tsx` (L22) | `getOrganizationPlanUsageDetails(orgId)` | `organization_subscriptions`, `organization_members`, `clients`, `projects`, `communication_channels` | `session.organization.id` | OK (Correctly scoped to tenant) |
| `app/(client-portal)/client/dashboard/page.tsx` | Queries for portal client dashboard | `projects`, `deliverables`, `invoices` | `portalSession.clientId`, `portalSession.organizationId` | OK (Scoped to portal client) |
| `app/(client-portal)/client/projects/[id]/page.tsx` | Queries for project details in portal | `projects`, `deliverables`, `tasks` | `portalSession.clientId` | OK (Scoped to client) |
| `app/(client-portal)/client/invoices/page.tsx` | Queries client invoices | `invoices` | `portalSession.clientId` | OK (Scoped to client) |
| `app/super-admin/**` | Platform-wide analytics and tenant management queries | `organizations`, `users`, `audit_logs` | Platform Super-Admin scope | OK (Super Admin dashboard) |

---

## Part B: Mock and Sample Data Audit

### 1. Hardcoded Sample Values Search Results

#### `proj-`
- `app/(dashboard)/projects/actions.ts:218`: `const devProjId = 'dev-proj-' + Date.now()`
- `app/(dashboard)/projects/actions.ts:545`: `id: 'proj-1'` (V2 AI Voice & CRM Portal Integration)
- `app/(dashboard)/projects/actions.ts:567`: `id: 'proj-2'` (UGC Content Creation & Media Ads Campaign)
- `app/(dashboard)/projects/actions.ts:589`: `id: 'proj-3'` (Automated Billing & Subscription Webhook Pipeline)
- `app/(dashboard)/projects/actions.ts:611`: `id: 'proj-4'` (Custom Client Portal & Analytics Board)
- `app/(dashboard)/tasks/actions.ts:345`: `project_id: 'proj-1'`
- `app/(dashboard)/tasks/actions.ts:359`: `project_id: 'proj-1'`
- `app/(dashboard)/tasks/actions.ts:373`: `project_id: 'proj-2'`
- `app/(dashboard)/tasks/actions.ts:387`: `project_id: 'proj-3'`
- `app/(dashboard)/inbox/actions.ts:718`: `{ id: 'proj-1', title: 'V2 AI Voice & CRM Portal Integration' }`
- `app/(dashboard)/inbox/actions.ts:719`: `{ id: 'proj-2', title: 'Agency Mobile App Redesign' }`
- `app/(dashboard)/notifications/actions.ts:161`: `related_entity_id: 'proj-1'`
- `app/(dashboard)/notifications/actions.ts:172`: `related_entity_id: 'proj-1'`

#### `sample`
- `app/(dashboard)/inbox/actions.ts:50–140`: `DEV_SAMPLE_MESSAGES` array containing fake messages with IDs `msg-sample-1` through `msg-sample-6` and fake clients `cli-sample-1` through `cli-sample-3`.
- `app/(dashboard)/inbox/actions.ts:215`: Injects `DEV_SAMPLE_MESSAGES` when database query yields 0 rows.
- `app/(dashboard)/inbox/actions.ts:276–278`: Sets `totalMessages: DEV_SAMPLE_MESSAGES.length`, `unreadCount`, and `unmatchedCount` from fake sample array.
- `app/(dashboard)/inbox/actions.ts:295–297`: Injects fallback clients `cli-sample-1` ("Sarah Jenkins"), `cli-sample-2` ("Michael Chang"), `cli-sample-3` ("Elena Rostova").
- `app/(dashboard)/projects/actions.ts:1055, 1056, 1119`: Hardcoded template title `'Twilio Webhook Integration & Audio Sample Test'` and Google Drive link `'https://drive.google.com/file/d/audio-sample'`.
- `app/(dashboard)/settings/templates/actions.ts:276`: Hardcoded template item `'Twilio Webhook Integration & Audio Sample Test'`.
- `app/api/seed-demo-data/route.ts:450`: `sampleDeals` array used during demo data seeding.
- `components/super-admin/platform-settings-form.tsx:65, 463–475`: Toggle for `auto_create_sample_projects`.

#### `demo`
- `app/api/seed-demo-data/route.ts:77, 246, 517`: Endpoint for populating rich demo workspaces.
- `app/(dashboard)/clients/[id]/communications/actions.ts:209`: Comment noting sample mock seeding for demo.
- `app/(dashboard)/inbox/actions.ts:300`: `external_account_id: 'T08DEMO_SLACK'`.
- `app/page.tsx:122`: Landing page button `"Launch Live Demo Workspace"`.

#### `Maaz`
- `app/api/seed-demo-data/route.ts:425`: Hardcoded demo conversation message `{ senderType: 'agent', senderName: 'Maaz Ali Shahid', body: 'Hi Alex! The cluster latency is currently averaging 4.2ms...' }`.
- `app/super-admin/organizations/[id]/page.tsx:116–117`: Fallback mock tenant owner data `{ email: 'maaz@innoventixhub.com', full_name: 'Maaz Ali (Owner)' }`.

#### `Platform Administrator`
- `lib/db/auto-migrate.ts:147`: Bootstrap admin display name fallback:  
  `const adminName = process.env.ADMIN_NAME || process.env.BOOTSTRAP_ADMIN_NAME || 'Platform Administrator'`
- `app/org-suspended/page.tsx:15`: UI text: `"Access to this organization has been temporarily suspended by the platform administrator or support team."`

#### `Connected`
- `components/clients/CommunicationModeBadge.tsx:16–25`: Badge displays `"Connected"` with green styling when client's communication mode is `'connected'`.
- `components/clients/ClientsList.tsx:368, 432`: Renders `<CommunicationModeBadge mode={client.communication_mode} />`.
- `components/clients/ClientOverviewTab.tsx:101–152`: Renders `"Connected Hub"` badge and status indicators.
- `components/clients/ClientForm.tsx:228, 304`: Form selector for `"Connected Hub"` communication mode.
- `components/leads/DealCard.tsx:146`: Renders `<CommunicationModeBadge mode={client.communication_mode} />`.

#### Fixed Dollar Amounts & Fixed Counts
- `app/(dashboard)/projects/actions.ts:554, 576, 598, 620`: Fixed project contract values: `$14,500`, `$8,200`, `$6,500`, `$11,000`.
- `app/(dashboard)/dashboard/page.tsx:48–51`: Hardcoded metric counters when org matches dev default ID:
  - `activeProjectsCount = 3`
  - `pendingTasksCount = 8`
  - `overdueProjectsCount = 1`
  - `clientsCount = 5`
  - `recentActivities = [{ id: 'act-1', title: 'Project Created: Website Redesign' }]`
- `app/(dashboard)/projects/[id]/page.tsx:48–52`: Hardcoded fallback team member records:
  - `usr_1`: Alex Johnson
  - `usr_2`: Sarah Smith
  - `usr_3`: Michael Brown
- `app/(dashboard)/projects/kanban/page.tsx:41–53`: Hardcoded fallback clients (`cli_1` Acme Corp, `cli_2` Stark Industries, `cli_3` Wayne Enterprises) and fallback team members.
- `app/(dashboard)/tasks/page.tsx:53–57`: Hardcoded fallback team members (`usr_1`, `usr_2`, `usr_3`).
- `app/(dashboard)/clients/[id]/page.tsx:47–64`: Hardcoded fallback client object (`Acme Global Ventures`, `contact@acme-global.com`, `+1 (555) 789-0123`, `Monthly Retainer`).
- `app/(dashboard)/inbox/actions.ts:49`: Fixed counts and message data.

---

### 2. Analytics Quotas: Computed vs Hardcoded Breakdown

Source: `lib/billing/plan-limits.ts:193–330` in `getOrganizationPlanUsageDetails(organizationId)`.

| Metric / Label | Display Value | Source | Computed from Database vs Hardcoded Fallback |
| :--- | :--- | :--- | :--- |
| **Plan Name** | `"Starter Plan"` | `organization_subscriptions` JOIN `subscription_plans` | **Database Query with Fallback**: Queries `sp.name FROM organization_subscriptions os JOIN subscription_plans sp ON sp.id = os.plan_id WHERE os.organization_id = $1`. If no subscription row exists, defaults to hardcoded `'Starter Plan'` (L316). |
| **Team Members** | `"1/5"` | `organization_members` COUNT & `feature_limits` | **Numerator is Computed, Denominator is Hardcoded/Plan**: Numerator computed via `SELECT COUNT(*) FROM organization_members WHERE organization_id = $1` (L230). Denominator comes from `sp.feature_limits.max_team_members` or hardcoded fallback `5` (L211). |
| **Projects** | `"0/50"` | `projects` COUNT & `feature_limits` | **Numerator is Computed, Denominator is Hardcoded/Plan**: Numerator computed via `SELECT COUNT(*) FROM projects WHERE organization_id = $1` (L232). Denominator comes from `sp.feature_limits.max_projects` or hardcoded fallback `50` (L213). |
| **Connected Channels** | `"0/1"` | `communication_channels` COUNT & `feature_limits` | **Numerator is Computed, Denominator is Hardcoded/Plan**: Numerator computed via `SELECT COUNT(*) FROM communication_channels WHERE organization_id = $1 AND status = 'active'` (L233). Denominator comes from `sp.feature_limits.communication_channels_included` or hardcoded fallback `1` (L217). |
| **Cloud Storage** | `"0.2 / 10 GB"` | Synthetic Formula | **Synthetic Formula**: Computed as `Math.max(0.2, ((projects * 5 + clients * 2) / 100))` (L244–247). Denominator is hardcoded fallback `10 GB`. |

---

### 3. Client Card "Connected" Badge Breakdown

1. **Originating Source**: Rendered by `components/clients/CommunicationModeBadge.tsx` and used within `components/clients/ClientsList.tsx` (L368, L432) and `components/leads/DealCard.tsx` (L146).
2. **Database Column**: Backed by `clients.communication_mode` (`'manual'` or `'connected'`).
3. **Logic**:
   ```tsx
   const isConnected = mode === 'connected'
   if (isConnected) {
     return (
       <span className="... border-emerald-500/30 bg-emerald-500/10 text-emerald-400" title="Connected Hub: Auto-syncs conversations from linked channels into unified inbox">
         <Radio className="h-3 w-3 animate-pulse" />
         <span>Connected</span>
       </span>
     )
   }
   ```
4. **Behavior**: Set during client creation or upgraded via `switchClientToConnectedModeAction` in `app/(dashboard)/clients/actions.ts:371`. It is backed by real database data, though in empty states or dev mock states (`__DEV_CLIENTS`), it was initialized with mock values.

---

## Part C: Routes and Deployment Audit

### 1. "Invite Member" Route Analysis

- **Location**: `components/dashboard/QuickActions.tsx` (Line 26)
- **Target Link**: `href: '/team?action=invite'`
- **Target Route Exists?**: **NO (Route Does NOT Exist)**.
- **Root Cause**: The directory `app/(dashboard)/team` does not exist in the codebase. Navigating to `/team` results in a **404 Not Found** page.
- **Actual Route in Codebase**: `app/(dashboard)/settings/team/page.tsx` (`/settings/team`).
- **Modal Component**: `components/settings/TeamMemberList.tsx` (Line 183) contains the actual Invite Member modal button within `/settings/team`.
- **Required Fix**: Update `components/dashboard/QuickActions.tsx` line 26 from `href: '/team?action=invite'` to `href: '/settings/team?action=invite'`.

---

### 2. Git Commit Hash Comparison

- **Command Run**: `git fetch deploy && git log --oneline deploy/main -1 && git log --oneline -1`
- **Deployed Commit Hash (`deploy/main`)**: `3998e99`
- **Local HEAD Commit Hash (`HEAD`)**: `3998e99`
- **Status**: **MATCHES IDENTICALLY**.
- **Active Commit Title**: `docs(screen-fix): add prompt 09 deploy and verify specification`

---

## Part D: Test Coverage Analysis

### Evaluation of Existing Test Suites Against CRITICAL Vulnerabilities

The codebase contains 24 Vitest unit/integration tests and 7 Playwright E2E spec files.

| CRITICAL Leak | File & Line | Would Existing Unit/Integration Tests Catch This? | Would Existing Playwright Tests Catch This? | Explanation of Test Blind Spot |
| :--- | :--- | :--- | :--- | :--- |
| **All Platform Users Leaked in Project Detail** | `app/(dashboard)/projects/[id]/page.tsx:38` | **NO** | **NO** | Vitest tests do not mount or render server component page files. E2E tests (`project-lifecycle.spec.ts`) only run within a single logged-in session and verify that the page renders without testing if other organization users appear in the assignee select. |
| **All Platform Clients Leaked in Kanban** | `app/(dashboard)/projects/kanban/page.tsx:23` | **NO** | **NO** | Vitest tests mock repository methods and do not execute the inline raw SQL query in `kanban/page.tsx`. E2E tests have no assertions verifying client multi-tenancy isolation. |
| **All Platform Users Leaked in Kanban** | `app/(dashboard)/projects/kanban/page.tsx:24` | **NO** | **NO** | Same as above. E2E tests only verify that the Kanban board renders columns. |
| **Unrestricted User List API** | `app/api/users/route.ts:17` | **NO** | **NO** | `tests/phase5-api-services.test.ts` tests `userService` in isolation without verifying that the HTTP route handler enforces an organization boundary. E2E tests do not call `/api/users`. |
| **Cross-Tenant User Profile Read** | `app/api/users/[id]/route.ts:17` | **NO** | **NO** | No negative cross-tenant authorization tests exist for user profile routes. |
| **Cross-Tenant Team Members Leak** | `app/api/organizations/[id]/members/route.ts:17` | **NO** | **NO** | Vitest tests for organizations do not attempt cross-tenant ID access against the route handler. |
| **Cross-Tenant Organization Details Leak** | `app/api/organizations/[id]/route.ts:17` | **NO** | **NO** | No cross-tenant negative test exists for `GET /api/organizations/[id]`. |
| **Query Parameter Tenant Hijacking** | `app/api/crm/*` & `app/api/projects/*` | **NO** | **NO** | Tests only supply valid default auth objects and never test injecting a malicious `?orgId=` parameter to probe cross-tenant access. |

### Summary of Testing Gaps
1. **No Negative Security Tests**: Zero tests in Vitest or Playwright attempt to access Resource B belonging to Tenant B while authenticated as Tenant A.
2. **Server Components Completely Untested for Tenancy**: Server components containing direct SQL queries (`projects/[id]/page.tsx`, `projects/kanban/page.tsx`) have zero unit or integration test coverage.
3. **Heavy Mocking in Vitest**: Tests like `tests/rls-isolation.test.ts` test a JavaScript imitation model rather than actual running application routes or database queries.
