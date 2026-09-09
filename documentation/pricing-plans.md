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
