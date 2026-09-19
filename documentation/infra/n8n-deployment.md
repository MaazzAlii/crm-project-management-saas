# n8n Workflow Activation & Deployment Guide — Contabo VPS

## 1. Overview & Architecture

The self-hosted **n8n automation engine** is co-located with the Next.js application and Supabase stack on the **Contabo Cloud VPS**. It runs on internal port `5678` and is securely reverse-proxied by Nginx at `https://n8n.innoventixhub.com` with automatic Let's Encrypt SSL.

```
+----------------------------------------------------------------------------------+
|                                Contabo VPS Architecture                          |
|                                                                                  |
|   +--------------------------+           +────────────────────────────────────+  |
|   | Next.js SaaS Application |           |      n8n Automation Engine         |  |
|   | (app.innoventixhub.com)  |           |     (n8n.innoventixhub.com)        |  |
|   |                          |           |                                    |  |
|   | - lib/automation/emitter | ──HMAC──> | - Webhook Triggers                 |  |
|   | - /api/automation/cron/* |   POST    | - Signature Verification (crypto)  |  |
|   | - /api/automation/callbk | <──────── | - Slack Notifications              |  |
|   +--------------------------+           | - Invoice Automation               |  |
|                                          +────────────────────────────────────+  |
+----------------------------------------------------------------------------------+
```

This guide details how to import, configure, activate, and test the 4 core business workflows on the production n8n instance.

---

## 2. Server Environment Configuration for n8n

Before importing workflows, ensure the n8n container environment on the VPS has the required environment variables configured.

In `/opt/innoventix/n8n/.env` (or in the docker compose service definition for n8n):

```bash
# General n8n Configuration
N8N_HOST=n8n.innoventixhub.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.innoventixhub.com/

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

The 4 production workflows are located in the repository under [`n8n/workflows/`](file:///n8n/workflows/):

| File Path | Workflow Name in n8n | Primary Trigger |
| :--- | :--- | :--- |
| `n8n/workflows/project-delivered-invoice.json` | `Project Delivered -> Invoice Trigger & Slack Notification` | Webhook (`project-delivered`) |
| `n8n/workflows/task-deadline-alert.json` | `Task Deadline Alert (Due Tomorrow)` | Webhook (`task-deadline-alert`) |
| `n8n/workflows/project-overdue-alert.json` | `Project Overdue Alert` | Webhook (`project-overdue-alert`) |
| `n8n/workflows/weekly-summary.json` | `Weekly Summary Report & Executive AI Digest` | Schedule (Mon 9AM) + Webhook |

### Method A: Import via n8n Web UI (Recommended)
1. Open your browser and log in to `https://n8n.innoventixhub.com`.
2. Click **Workflows** in the left sidebar.
3. Click the **`+ Add Workflow`** button (or click the three dots `...` in the top-right corner of the canvas) and select **Import from File**.
4. Select the JSON file from your local repository (e.g., `project-delivered-invoice.json`).
5. Click **Save** (`Ctrl + S` / `Cmd + S`).
6. Repeat for all 4 workflow JSON files.

### Method B: Import via n8n CLI on Contabo VPS
If you prefer importing directly on the VPS via terminal:
```bash
# Copy workflows to VPS
scp -r n8n/workflows/ deploy@<CONTABO_HOST>:/opt/innoventix/n8n/workflows/

# Import all workflows into n8n container
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/project-delivered-invoice.json
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/task-deadline-alert.json
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/project-overdue-alert.json
docker exec -i n8n-container-name n8n import:workflow --input=/opt/innoventix/n8n/workflows/weekly-summary.json
```

---

## 4. Credentials & Node Configuration in n8n

### A. Slack Credentials Setup
The workflows post automated alerts to Slack channels (`agency-announcements`, `project-tasks`, `project-alerts`, `leadership`).

1. In n8n, navigate to **Credentials** → **Add Credential** → search for **Slack**.
2. Select **Slack OAuth2 API** or **Slack Bot Token**.
3. Provide your Slack Bot User OAuth Token (`xoxb-...`) with the following OAuth scopes:
   - `chat:write`
   - `chat:write.public` (or invite the bot to the private channels)
   - `channels:read`
4. Name the credential `Slack account` (or select this credential in the Slack nodes of each workflow).
5. Ensure the corresponding Slack channels exist in your workspace:
   - `#agency-announcements` (Flow 1)
   - `#project-tasks` (Flow 2)
   - `#project-alerts` (Flow 3)
   - `#leadership` (Flow 4)

---

## 5. Webhook Contract & Payload Verification

Each workflow's webhook trigger URL and payload contract exactly match what [`lib/automation/emitter.ts`](file:///lib/automation/emitter.ts) and the Next.js routes emit:

### Matrix of Webhook Endpoints & Contracts

| Flow # | Event Name (`X-Automation-Event`) | n8n Webhook Path | Full Production Webhook URL | Payload Data Keys | Downstream Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Flow 1** | `project.delivered` | `project-delivered` | `https://n8n.innoventixhub.com/webhook/project-delivered` | `project_id`, `project_name`, `client_id`, `client_name`, `client_email`, `budget`, `delivered_at`, `completed_by_name` | Triggers invoice generator, calls back to `/api/automation/callback/invoice-created`, posts to Slack `#agency-announcements` |
| **Flow 2** | `task.deadline_approaching` | `task-deadline-alert` | `https://n8n.innoventixhub.com/webhook/task-deadline-alert` | `task_id`, `task_title`, `project_id`, `project_name`, `due_date`, `priority`, `assignee_name` | Posts reminder to Slack `#project-tasks` |
| **Flow 3** | `project.overdue` | `project-overdue-alert` | `https://n8n.innoventixhub.com/webhook/project-overdue-alert` | `project_id`, `project_name`, `client_id`, `client_name`, `deadline`, `days_overdue`, `status` | Posts urgent warning to Slack `#project-alerts` |
| **Flow 4** | `weekly.summary_ready` | `weekly-summary-receiver` | `https://n8n.innoventixhub.com/webhook/weekly-summary-receiver` | `report_id`, `period_start`, `period_end`, `metrics: {...}`, `narrative_summary` | Posts executive digest + AI narrative to Slack `#leadership` |

### Standard Canonical Payload Structure
Every webhook received by n8n follows this schema:
```json
{
  "id": "uuid-v4-delivery-id",
  "event": "canonical.event_name",
  "organization_id": "uuid-v4-org-id",
  "timestamp": "2026-09-19T14:30:00.000Z",
  "data": { ... }
}
```

### HTTP Headers Sent by App:
- `Content-Type: application/json`
- `X-Automation-Event: <event-name>`
- `X-Automation-Delivery: <delivery-uuid>`
- `X-Automation-Timestamp: <iso-timestamp>`
- `X-Automation-Signature: sha256=<hmac-sha256-hex>`

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
> `https://n8n.innoventixhub.com/webhook/<path>`
> (If the workflow is inactive, n8n only listens on `/webhook-test/<path>` during manual canvas execution).

---

## 7. Step-by-Step Manual Test Procedures

You can verify each workflow end-to-end using the live production app or terminal `curl` commands.

### Test Procedure 1: Flow 1 — Project Delivered → Invoice Trigger
#### Option A: Via Next.js UI
1. Log in to `https://app.innoventixhub.com`.
2. Navigate to **Projects** (`/projects`) and open any active project (e.g., with a budget > 0).
3. Change the project status to **Delivered**.
4. The application emits a signed `project.delivered` webhook to n8n.
5. Verify in n8n: Go to **Executions** tab → confirm execution succeeded.
6. Verify in Next.js: Check that project status automatically updated to **Invoiced** (via the `/api/automation/callback/invoice-created` callback).
7. Verify in Slack: Confirm announcement appeared in `#agency-announcements`.

#### Option B: Via Direct Signed `curl`
Run this script to send a signed test payload directly to n8n:
```bash
SECRET="<YOUR_N8N_WEBHOOK_SECRET>"
PAYLOAD='{"id":"test-001","event":"project.delivered","organization_id":"org-1","timestamp":"2026-09-19T12:00:00.000Z","data":{"project_id":"p-100","project_name":"Brand Identity Redesign","client_id":"c-100","client_name":"Acme Corp","client_email":"billing@acme.com","budget":15000,"delivered_at":"2026-09-19T12:00:00.000Z","completed_by_name":"Alex Lead"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST https://n8n.innoventixhub.com/webhook/project-delivered \
  -H "Content-Type: application/json" \
  -H "X-Automation-Event: project.delivered" \
  -H "X-Automation-Delivery: test-001" \
  -H "X-Automation-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```
**Expected Response**: HTTP 200 OK. Check n8n **Executions** to see all nodes green.

---

### Test Procedure 2: Flow 2 & 3 — Deadline & Overdue Checks
The deadline and overdue checks are driven by the platform's protected cron endpoint `/api/automation/cron/deadline-check`.

#### Triggering via Curl:
```bash
CRON_SECRET="<YOUR_CRON_SECRET>"

curl -X POST https://app.innoventixhub.com/api/automation/cron/deadline-check \
  -H "x-cron-secret: $CRON_SECRET"
```

#### What happens:
1. The app queries tasks due tomorrow (`task.deadline_approaching`) and projects past deadline (`project.overdue`).
2. For matching tasks, it sends signed events to `https://n8n.innoventixhub.com/webhook/task-deadline-alert`.
3. For matching overdue projects, it sends signed events to `https://n8n.innoventixhub.com/webhook/project-overdue-alert`.
4. In n8n, verify executions in **Executions** tab for both workflows.
5. In Slack, verify messages in `#project-tasks` and `#project-alerts`.

---

### Test Procedure 3: Flow 4 — Weekly Summary Report
The weekly summary workflow has two triggers:
1. **Schedule Trigger**: Fires every Monday at 9:00 AM UTC. It calls `POST https://app.innoventixhub.com/api/automation/cron/weekly-summary` with `x-cron-secret`.
2. **Webhook Receiver**: Receives the calculated report payload from the app and posts to Slack `#leadership`.

#### Manual Trigger via Curl:
```bash
CRON_SECRET="<YOUR_CRON_SECRET>"

curl -X POST https://app.innoventixhub.com/api/automation/cron/weekly-summary \
  -H "x-cron-secret: $CRON_SECRET"
```

#### What happens:
1. The app aggregates 7-day metrics (completed tasks, active projects, new clients, delivered revenue, communication volume, overdue items).
2. If AI narrative is enabled, generates executive summary narrative.
3. Emits signed `weekly.summary_ready` event to `https://n8n.innoventixhub.com/webhook/weekly-summary-receiver`.
4. Creates an entry in `in_app_notifications`.
5. In n8n, verify execution under `Weekly Summary Report & Executive AI Digest`.
6. In Slack, confirm formatted digest appears in `#leadership`.

---

## 8. Troubleshooting & Common Pitfalls

| Symptom | Probable Cause | Fix |
| :--- | :--- | :--- |
| `Cannot find module 'crypto'` in Code node | n8n environment missing built-in module permission | Set `NODE_FUNCTION_ALLOW_BUILTIN=crypto` in n8n container environment and restart container. |
| `Unauthorized: Invalid HMAC signature` | Secret mismatch between app `.env.production` and n8n | Ensure `AUTOMATION_WEBHOOK_SECRET` in n8n matches `N8N_WEBHOOK_SECRET` in `/opt/innoventix/app/.env.production`. |
| Webhook returns HTTP 404 | Workflow is inactive or webhook path has a typo | Ensure workflow toggle is **Active** (green) and path matches without leading/trailing slashes. |
| `channel_not_found` in Slack node | Bot is not invited to the channel | In Slack, type `/invite @YourBotName` in `#agency-announcements`, `#project-tasks`, `#project-alerts`, `#leadership`. |
| Cron endpoint returns HTTP 401 | Invalid or missing cron secret | Ensure `x-cron-secret` header matches `CRON_SECRET` in `.env.production`. |
