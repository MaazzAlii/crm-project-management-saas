# n8n Workflow Activation & Deployment Guide — Contabo VPS

## 1. Overview & Architecture

The self-hosted **n8n automation engine** is co-located with the Next.js application and Supabase stack on the **Contabo Cloud VPS**. It runs on internal port `5678` and is securely reverse-proxied by Nginx at `https://maaz.n8n.calara.agency` with automatic Let's Encrypt SSL.

```
+----------------------------------------------------------------------------------+
|                                Contabo VPS Architecture                          |
|                                                                                  |
|   +--------------------------+           +────────────────────────────────────+  |
|   | Next.js SaaS Application |           |      n8n Automation Engine         |  |
|   | (app.innoventixhub.com)  |           |     (maaz.n8n.calara.agency)        |  |
|   |                          |           |                                    |  |
|   | - lib/automation/emitter | ──HMAC──> | - Webhook Triggers                 |  |
|   | - /api/automation/cron/* |   POST    | - Signature Verification (crypto)  |  |
|   | - /api/automation/callbk | <──────── | - Slack Notifications              |  |
|   +--------------------------+           | - Invoice Automation               |  |
|                                          +────────────────────────────────────+  |
+----------------------------------------------------------------------------------+
```

### Webhook Routing

The emitter (`lib/automation/emitter.ts`) automatically maps each event name to a dedicated n8n webhook path:

| Event Name | n8n Webhook Path | Full Production URL |
| :--- | :--- | :--- |
| `project.delivered` | `/webhook/project-delivered` | `https://maaz.n8n.calara.agency/webhook/project-delivered` |
| `task.deadline_approaching` | `/webhook/task-deadline-alert` | `https://maaz.n8n.calara.agency/webhook/task-deadline-alert` |
| `project.overdue` | `/webhook/project-overdue-alert` | `https://maaz.n8n.calara.agency/webhook/project-overdue-alert` |
| `weekly.summary_ready` | `/webhook/weekly-summary-receiver` | `https://maaz.n8n.calara.agency/webhook/weekly-summary-receiver` |

The `N8N_WEBHOOK_URL` environment variable should be set to the **base URL** only (e.g., `https://maaz.n8n.calara.agency`). The emitter appends the event-specific path automatically.

---

## 2. Server Environment Configuration for n8n

Before importing workflows, ensure the n8n container environment on the VPS has the required environment variables configured.

In `/opt/innoventix/n8n/.env` (or in the docker compose service definition for n8n):

```bash
# General n8n Configuration
N8N_HOST=maaz.n8n.calara.agency
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://maaz.n8n.calara.agency/

# Shared Webhook Secret (MUST match N8N_WEBHOOK_SECRET in /opt/innoventix/app/.env.production)
AUTOMATION_WEBHOOK_SECRET=<COPIED_FROM_APP_ENV_PRODUCTION>

# SaaS Application Base URL (used for callbacks and cron endpoints)
APP_URL=https://app.innoventixhub.com

# External Invoice Generator API URL (if using external service)
INVOICE_GENERATOR_API_URL=https://api.innoventixhub.com/api/invoices/generate

# CRITICAL: Allow Node.js 'crypto' module in n8n Code nodes for HMAC-SHA256 verification
NODE_FUNCTION_ALLOW_BUILTIN=crypto
```

> [!IMPORTANT]
> `NODE_FUNCTION_ALLOW_BUILTIN=crypto` is **required**. The signature verification Code nodes in all 4 workflows execute `const crypto = require('crypto')` to compute and compare HMAC-SHA256 signatures. Without this flag, n8n will block the module import and fail with an execution error.

If you modify the n8n environment variables, restart n8n:
```bash
docker compose -f /opt/innoventix/n8n/docker-compose.yml restart n8n
```

---

## 3. Workflow Import Instructions

The 4 production workflows are located in the repository under `n8n/workflows/`:

| # | File | Workflow Name in n8n | Primary Trigger |
| :--- | :--- | :--- | :--- |
| 1 | `project-delivered-invoice.json` | `Project Delivered -> Invoice Trigger & Slack Notification` | Webhook (`project-delivered`) |
| 2 | `task-deadline-alert.json` | `Task Deadline Alert (Due Tomorrow)` | Webhook (`task-deadline-alert`) |
| 3 | `project-overdue-alert.json` | `Project Overdue Alert` | Webhook (`project-overdue-alert`) |
| 4 | `weekly-summary.json` | `Weekly Summary Report & Executive AI Digest` | Schedule (Mon 9AM) + Webhook (`weekly-summary-receiver`) |

### Method A: Import via n8n Web UI (Recommended)

1. Open your browser and log in to `https://maaz.n8n.calara.agency`.
2. Click **Workflows** in the left sidebar.
3. Click the **`+ Add Workflow`** button (or click the three dots `...` in the top-right corner of the canvas) and select **Import from File**.
4. Select the first JSON file from your local repository: `n8n/workflows/project-delivered-invoice.json`.
5. Click **Save** (`Ctrl + S` / `Cmd + S`).
6. Repeat steps 3-5 for each remaining file:
   - `n8n/workflows/task-deadline-alert.json`
   - `n8n/workflows/project-overdue-alert.json`
   - `n8n/workflows/weekly-summary.json`

> [!NOTE]
> After importing, each workflow will appear in the **Workflows** list but will be **Inactive** until you explicitly toggle it Active (see Section 6).

### Method B: Import via n8n CLI on Contabo VPS

If you prefer importing directly on the VPS via terminal:

```bash
# 1. Copy workflow files to VPS
scp -P <CONTABO_SSH_PORT> \
  n8n/workflows/project-delivered-invoice.json \
  n8n/workflows/task-deadline-alert.json \
  n8n/workflows/project-overdue-alert.json \
  n8n/workflows/weekly-summary.json \
  deploy@<CONTABO_HOST>:/opt/innoventix/n8n/workflows/

# 2. Import each workflow into the n8n container
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/project-delivered-invoice.json
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/task-deadline-alert.json
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/project-overdue-alert.json
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/weekly-summary.json
```

> [!TIP]
> Replace `n8n-container-name` with the actual Docker container name — find it with `docker ps | grep n8n`.

---

## 4. Credentials & Node Configuration in n8n

### A. Slack Credentials Setup

The workflows post automated alerts to Slack channels. You need a single Slack OAuth credential shared across all 4 workflows.

**Step-by-step:**

1. In the n8n web UI, navigate to **Credentials** → **Add Credential** → search for **Slack**.
2. Select **Slack OAuth2 API** (recommended) or **Slack Bot Token** (if using a Bot Token directly).
3. Provide your Slack Bot User OAuth Token (`xoxb-...`) with the following **minimum OAuth scopes**:
   - `chat:write` — post messages
   - `chat:write.public` — post to public channels without being a member
   - `channels:read` — list channels for the channel selector
4. Name the credential (e.g., `Slack – Innoventix`).
5. Click **Test** to verify the token works, then **Save**.
6. **Open each imported workflow** and click the Slack node(s) to assign this credential via the **Credential** dropdown.

**Required Slack channels** (create in your workspace if they don't exist):

| Workflow | Slack Channel | Purpose |
| :--- | :--- | :--- |
| Flow 1 – Invoice Trigger | `#agency-announcements` | Project delivery + invoice notification |
| Flow 2 – Deadline Alert | `#project-tasks` | Task due-tomorrow reminders to assignees |
| Flow 3 – Overdue Alert | `#project-alerts` | Urgent overdue project warnings |
| Flow 4 – Weekly Summary | `#leadership` | Executive weekly performance digest |

> [!IMPORTANT]
> After creating the Slack channels, invite the bot to each one: type `/invite @YourBotName` inside each channel. Without this, `chat:write` will fail with `channel_not_found` errors.

### B. Webhook Secret (HMAC Verification)

The shared webhook secret is configured as an **n8n environment variable** (`AUTOMATION_WEBHOOK_SECRET`), not as an n8n credential. The Code nodes in each workflow read it via `$env.AUTOMATION_WEBHOOK_SECRET`.

**Verification checklist:**

- [ ] `AUTOMATION_WEBHOOK_SECRET` in the n8n container `.env` file matches `N8N_WEBHOOK_SECRET` in `/opt/innoventix/app/.env.production`
- [ ] After any change, restart n8n: `docker compose restart n8n`

---

## 5. Webhook Contract & Payload Verification

Each workflow's webhook trigger URL and payload contract exactly match what `lib/automation/emitter.ts` and the Next.js routes emit.

### Event-to-Webhook Mapping Matrix

| Flow # | Event Name (`X-Automation-Event`) | n8n Webhook Path | Full Production Webhook URL | App Source |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `project.delivered` | `project-delivered` | `https://maaz.n8n.calara.agency/webhook/project-delivered` | `app/(dashboard)/projects/actions.ts` → `deliverProject()` |
| **2** | `task.deadline_approaching` | `task-deadline-alert` | `https://maaz.n8n.calara.agency/webhook/task-deadline-alert` | `app/api/automation/cron/deadline-check/route.ts` |
| **3** | `project.overdue` | `project-overdue-alert` | `https://maaz.n8n.calara.agency/webhook/project-overdue-alert` | `app/api/automation/cron/deadline-check/route.ts` |
| **4** | `weekly.summary_ready` | `weekly-summary-receiver` | `https://maaz.n8n.calara.agency/webhook/weekly-summary-receiver` | `app/api/automation/cron/weekly-summary/route.ts` |

### Standard Canonical Payload Structure

Every webhook received by n8n follows this envelope schema:
```json
{
  "id": "uuid-v4-delivery-id",
  "event": "canonical.event_name",
  "organization_id": "uuid-v4-org-id",
  "timestamp": "2026-09-19T14:30:00.000Z",
  "data": { ... }
}
```

### HTTP Headers Sent by App

| Header | Value |
| :--- | :--- |
| `Content-Type` | `application/json` |
| `X-Automation-Event` | `<event-name>` |
| `X-Automation-Delivery` | `<delivery-uuid>` |
| `X-Automation-Timestamp` | `<iso-timestamp>` |
| `X-Automation-Signature` | `sha256=<hmac-sha256-hex>` |

### Per-Event Payload Data Shapes

**Flow 1 — `project.delivered`:**
```typescript
{
  project_id: string
  project_name: string
  client_id: string
  client_name: string
  client_email?: string | null
  budget?: number | null          // Used by n8n "Check Budget > 0" node
  delivered_at: string
  completed_by_id?: string | null
  completed_by_name?: string | null
  completed_by_email?: string | null
}
```

**Flow 2 — `task.deadline_approaching`:**
```typescript
{
  task_id: string
  task_title: string
  project_id: string
  project_name: string
  due_date: string
  priority?: string               // "low" | "medium" | "high" | "urgent"
  assignee_id?: string | null
  assignee_name?: string | null
  assignee_email?: string | null
}
```

**Flow 3 — `project.overdue`:**
```typescript
{
  project_id: string
  project_name: string
  client_id: string
  client_name: string
  deadline: string
  days_overdue: number
  status: string
  owner_id?: string | null
  owner_name?: string | null
  owner_email?: string | null
}
```

**Flow 4 — `weekly.summary_ready`:**
```typescript
{
  report_id?: string
  period_start: string
  period_end: string
  metrics: {
    tasks_completed: number
    active_projects: number
    new_clients: number
    revenue: number
    communication_volume: number
    overdue_items: number
  }
  narrative_summary?: string       // AI-generated, present only if AI enabled
}
```

All type definitions live in `lib/automation/types.ts`.

---

## 6. How to Activate Each Workflow

In the n8n web interface:

1. Open the workflow (e.g., `Project Delivered -> Invoice Trigger & Slack Notification`).
2. In the top-right corner of the canvas, locate the **Active** toggle switch.
3. Click the toggle so it turns **green (Active)**.
4. Click **Save** (`Ctrl + S` / `Cmd + S`).
5. Verify in the main **Workflows** list that the workflow status displays a green badge: **Active**.
6. Repeat for all 4 workflows:
   - [ ] `Project Delivered -> Invoice Trigger & Slack Notification`
   - [ ] `Task Deadline Alert (Due Tomorrow)`
   - [ ] `Project Overdue Alert`
   - [ ] `Weekly Summary Report & Executive AI Digest`

> [!NOTE]
> When a workflow is **Active**, n8n listens on the production webhook URL:
> `https://maaz.n8n.calara.agency/webhook/<path>`
> If the workflow is inactive, n8n only listens on `/webhook-test/<path>` during manual canvas execution — production events will return 404.

---

## 7. Step-by-Step Manual Test Procedures

You can verify each workflow end-to-end using the live production app or terminal `curl` commands.

### Test 1: Flow 1 — Project Delivered → Invoice Trigger

#### Option A: Via Next.js UI
1. Log in to `https://app.innoventixhub.com`.
2. Navigate to **Projects** (`/projects`) and open any active project with a **budget > $0** and a client with `payment_schedule = 'Per Project'`.
3. Click the **Deliver** button in the project header (or drag to "Delivered" on the Kanban board).
4. Confirm the delivery in the modal.
5. **Verify in n8n:** Go to **Executions** tab → confirm the `Project Delivered -> Invoice Trigger & Slack Notification` workflow executed successfully (all nodes green).
6. **Verify in Next.js:** Check that the project status automatically updated to **Invoiced** (via the `/api/automation/callback/invoice-created` callback).
7. **Verify in Slack:** Confirm announcement appeared in `#agency-announcements`.

#### Option B: Via Direct Signed `curl`
```bash
SECRET="<YOUR_N8N_WEBHOOK_SECRET>"
PAYLOAD='{"id":"test-001","event":"project.delivered","organization_id":"org-1","timestamp":"2026-09-21T12:00:00.000Z","data":{"project_id":"p-100","project_name":"Brand Identity Redesign","client_id":"c-100","client_name":"Acme Corp","client_email":"billing@acme.com","budget":15000,"delivered_at":"2026-09-21T12:00:00.000Z","completed_by_name":"Alex Lead"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST https://maaz.n8n.calara.agency/webhook/project-delivered \
  -H "Content-Type: application/json" \
  -H "X-Automation-Event: project.delivered" \
  -H "X-Automation-Delivery: test-001" \
  -H "X-Automation-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```
**Expected:** HTTP 200 OK. All nodes green in n8n Executions. Slack message in `#agency-announcements`.

---

### Test 2: Flow 2 — Task Deadline Alert (Due Tomorrow)

#### Option A: Via App Cron Endpoint
Ensure you have at least one task with `due_date` = tomorrow and `status` ≠ `done`:
```bash
CRON_SECRET="<YOUR_CRON_SECRET>"

curl -X POST https://app.innoventixhub.com/api/automation/cron/deadline-check \
  -H "x-cron-secret: $CRON_SECRET"
```

#### Option B: Via Direct Signed `curl` to n8n
```bash
SECRET="<YOUR_N8N_WEBHOOK_SECRET>"
PAYLOAD='{"id":"test-002","event":"task.deadline_approaching","organization_id":"org-1","timestamp":"2026-09-21T08:00:00.000Z","data":{"task_id":"t-200","task_title":"Finalize Q3 Audit Report","project_id":"p-100","project_name":"Security Compliance","due_date":"2026-09-22","priority":"high","assignee_name":"Sarah Connor"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST https://maaz.n8n.calara.agency/webhook/task-deadline-alert \
  -H "Content-Type: application/json" \
  -H "X-Automation-Event: task.deadline_approaching" \
  -H "X-Automation-Delivery: test-002" \
  -H "X-Automation-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```
**Expected:** HTTP 200 OK. Slack message in `#project-tasks` with task details.

---

### Test 3: Flow 3 — Project Overdue Alert

#### Option A: Via App Cron Endpoint
Same cron endpoint triggers both deadline and overdue checks. Ensure at least one project has `deadline` < today and status ∉ `{delivered, invoiced, paid, completed, on_hold, archived}`:
```bash
CRON_SECRET="<YOUR_CRON_SECRET>"

curl -X POST https://app.innoventixhub.com/api/automation/cron/deadline-check \
  -H "x-cron-secret: $CRON_SECRET"
```

#### Option B: Via Direct Signed `curl` to n8n
```bash
SECRET="<YOUR_N8N_WEBHOOK_SECRET>"
PAYLOAD='{"id":"test-003","event":"project.overdue","organization_id":"org-1","timestamp":"2026-09-21T09:00:00.000Z","data":{"project_id":"p-300","project_name":"Mobile Banking UI Kit","client_id":"c-300","client_name":"Horizon Fintech","deadline":"2026-09-19","days_overdue":2,"status":"in_progress"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST https://maaz.n8n.calara.agency/webhook/project-overdue-alert \
  -H "Content-Type: application/json" \
  -H "X-Automation-Event: project.overdue" \
  -H "X-Automation-Delivery: test-003" \
  -H "X-Automation-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```
**Expected:** HTTP 200 OK. Slack warning in `#project-alerts` with overdue details.

---

### Test 4: Flow 4 — Weekly Summary Report

The weekly summary workflow has **two triggers**:
1. **Schedule Trigger:** Fires every Monday at 9:00 AM UTC automatically. Calls the app's cron endpoint.
2. **Webhook Receiver:** Receives the calculated metrics + optional AI narrative from the app.

#### Manual Trigger via Curl:
```bash
CRON_SECRET="<YOUR_CRON_SECRET>"

curl -X POST https://app.innoventixhub.com/api/automation/cron/weekly-summary \
  -H "x-cron-secret: $CRON_SECRET"
```

#### What happens:
1. The app aggregates 7-day metrics (completed tasks, active projects, new clients, delivered revenue, communication volume, overdue items) per organization.
2. If AI narrative is enabled for the org, generates an executive summary narrative via `generateWeeklyReportNarrative`.
3. Emits signed `weekly.summary_ready` event to `https://maaz.n8n.calara.agency/webhook/weekly-summary-receiver`.
4. Creates an entry in `in_app_notifications`.

#### Direct n8n Test:
```bash
SECRET="<YOUR_N8N_WEBHOOK_SECRET>"
PAYLOAD='{"id":"test-004","event":"weekly.summary_ready","organization_id":"org-1","timestamp":"2026-09-21T09:00:00.000Z","data":{"period_start":"2026-09-14T00:00:00.000Z","period_end":"2026-09-20T23:59:59.000Z","metrics":{"tasks_completed":12,"active_projects":5,"new_clients":1,"revenue":18500,"communication_volume":42,"overdue_items":1},"narrative_summary":"Strong week: 12 tasks completed across 5 active projects with $18.5k revenue."}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST https://maaz.n8n.calara.agency/webhook/weekly-summary-receiver \
  -H "Content-Type: application/json" \
  -H "X-Automation-Event: weekly.summary_ready" \
  -H "X-Automation-Delivery: test-004" \
  -H "X-Automation-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```
**Expected:** HTTP 200 OK. Executive digest in Slack `#leadership` with metric breakdowns and AI narrative.

---

## 8. Setting Up the Daily Cron Job

Flows 2 and 3 (task deadline alerts and project overdue alerts) require a **daily trigger** to call the app's cron endpoint. You have two options:

### Option A: System Crontab on Contabo VPS (Recommended)
```bash
# Edit the crontab for the deploy user
crontab -e

# Add this line — runs daily at 8:00 AM UTC
0 8 * * * curl -s -X POST https://app.innoventixhub.com/api/automation/cron/deadline-check -H "x-cron-secret: <YOUR_CRON_SECRET>" >> /var/log/innoventix-cron.log 2>&1
```

### Option B: Separate n8n Schedule Workflow
Create a simple n8n workflow with a Schedule Trigger (daily at 8 AM) → HTTP Request node calling the cron endpoint with the `x-cron-secret` header.

> [!NOTE]
> The weekly summary already has its own Schedule Trigger built into the workflow (Monday 9:00 AM), so no external cron is needed for Flow 4.

---

## 9. Post-Activation Verification Checklist

After importing, configuring credentials, and activating all workflows:

- [ ] **Environment:** `AUTOMATION_WEBHOOK_SECRET` in n8n `.env` matches `N8N_WEBHOOK_SECRET` in app `.env.production`
- [ ] **Environment:** `NODE_FUNCTION_ALLOW_BUILTIN=crypto` is set in n8n container
- [ ] **Environment:** `APP_URL=https://app.innoventixhub.com` is set in n8n container
- [ ] **Credentials:** Slack OAuth credential created and assigned to all 4 Slack nodes
- [ ] **Channels:** Bot invited to `#agency-announcements`, `#project-tasks`, `#project-alerts`, `#leadership`
- [ ] **Workflow 1:** Active (green toggle) — `Project Delivered -> Invoice Trigger & Slack Notification`
- [ ] **Workflow 2:** Active (green toggle) — `Task Deadline Alert (Due Tomorrow)`
- [ ] **Workflow 3:** Active (green toggle) — `Project Overdue Alert`
- [ ] **Workflow 4:** Active (green toggle) — `Weekly Summary Report & Executive AI Digest`
- [ ] **Test 1:** Delivered a test project → invoice callback fired → Slack announcement received
- [ ] **Test 2:** Triggered deadline check → task due-tomorrow alert delivered to Slack
- [ ] **Test 3:** Triggered deadline check → overdue project alert delivered to Slack
- [ ] **Test 4:** Triggered weekly summary → executive digest posted to `#leadership`
- [ ] **Cron:** Daily cron job configured for deadline checks (8:00 AM UTC)

---

## 10. Troubleshooting & Common Pitfalls

| Symptom | Probable Cause | Fix |
| :--- | :--- | :--- |
| `Cannot find module 'crypto'` in Code node | n8n environment missing built-in module permission | Set `NODE_FUNCTION_ALLOW_BUILTIN=crypto` in n8n container environment and restart container. |
| `Unauthorized: Invalid HMAC signature` | Secret mismatch between app `.env.production` and n8n | Ensure `AUTOMATION_WEBHOOK_SECRET` in n8n matches `N8N_WEBHOOK_SECRET` in `/opt/innoventix/app/.env.production`. |
| Webhook returns HTTP 404 | Workflow is inactive or webhook path has a typo | Ensure workflow toggle is **Active** (green) and path matches without leading/trailing slashes. |
| `channel_not_found` in Slack node | Bot is not invited to the channel | In Slack, type `/invite @YourBotName` in each required channel. |
| Cron endpoint returns HTTP 401 | Invalid or missing cron secret | Ensure `x-cron-secret` header matches `CRON_SECRET` in `.env.production`. |
| Slack message formatting broken | Payload data keys don't match n8n template expressions | Verify the TypeScript payload shapes in `lib/automation/types.ts` match the template variable names in the n8n Slack node text fields. |
| Events sent to wrong URL | `N8N_WEBHOOK_URL` still includes `/webhook/events` | Update to base URL only: `https://maaz.n8n.calara.agency`. The emitter appends event-specific paths automatically. |
| Invoice callback fails | `APP_URL` not set in n8n environment | Set `APP_URL=https://app.innoventixhub.com` in the n8n container `.env`. |
