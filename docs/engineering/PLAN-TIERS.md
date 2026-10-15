# Engineering Specification: Plan Tiers, Quotas & Feature Gating

**Source of Truth** for Plan Tiers, Resource Quotas, Feature Limits, and Server-Side Enforcement Mechanisms in the Innoventix SaaS platform.

---

## 1. Plan Tier Matrix & Quotas

| Dimension / Resource | Free Tier (Tight) | Pro Plan | Enterprise Plan | Lifetime VIP Access |
|---|---|---|---|---|
| **Max Team Members** | 3 | 15 | 500 | 15 |
| **Max Pending Invites** | 2 | 20 | 500 | 20 |
| **Max Clients** | 5 | 100 | 999,999 (Unlimited) | 100 |
| **Max Projects** | 3 | 50 | 999,999 (Unlimited) | 50 |
| **Max Connected Channels** | 1 | 3 | 999 | 3 |
| **Max AI Requests / Month** | 25 | 500 | 10,000 | 500 |
| **Client Portal Enabled** | ❌ No (`UPGRADE_REQUIRED`) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Email Integration Enabled**| ❌ No (`UPGRADE_REQUIRED`) | ✅ Yes | ✅ Yes | ✅ Yes |
| **SSO / SAML Enabled** | ❌ No | ❌ No | ✅ Yes (Enterprise-only)| ❌ No |
| **Audit Logs Enabled** | ❌ No | ❌ No | ✅ Yes (Enterprise-only)| ❌ No |
| **API Access Enabled** | ❌ No | ❌ No | ✅ Yes (Enterprise-only)| ❌ No |
| **Price (Monthly / Yearly)** | $0 | $79 / $790 | $199 / $1,990 | One-time / VIP |

> [!NOTE]
> **Lifetime VIP Tier Policy**: Lifetime VIP access maps strictly to the **Pro** tier quotas and feature capabilities (15 members, 100 clients, 50 projects, 3 channels, 500 AI requests, Client Portal, Email Integration). It does **NOT** receive Enterprise-only features (SSO, Audit Logs, API Access) to prevent cannibalization of high-value Enterprise sales.

---

## 2. Server-Side Enforcement Architecture

### 2.1 Unified Quota Engine: `lib/services/plan-limits.ts`
All enforcement routes through `lib/services/plan-limits.ts`. Legacy quota checks in `lib/services/billing-service.ts` have been deprecated and routed through `plan-limits.ts`.
- `checkClientLimit(orgId, options?: { client?: PoolClient })`
- `checkProjectLimit(orgId, options?: { client?: PoolClient })`
- `checkChannelLimit(orgId, options?: { client?: PoolClient })`
- `checkAIUsageLimit(orgId, options?: { client?: PoolClient })`
- `checkFeatureAccess(orgId, feature, options?: { client?: PoolClient })`

### 2.2 Concurrency & Race Condition Protection
Every quota check and insertion executes inside the **SAME atomic transaction** using row-level locking on the organization row:
```sql
SELECT id FROM organizations WHERE id = $1 FOR UPDATE;
```
This guarantees that concurrent requests (e.g., parallel client or project creation at limit - 1) cannot bypass quota boundaries.

### 2.3 Structured 402 Error Response
When a plan quota or feature limit is reached, all endpoints return HTTP 402 with structured error metadata:
```json
{
  "success": false,
  "error": {
    "code": "CLIENT_LIMIT_REACHED",
    "message": "Free plan allows up to 5 clients. Upgrade to add more.",
    "currentCount": 5,
    "limit": 5,
    "planName": "Free",
    "upgradeUrl": "/settings/billing"
  }
}
```

Standard Error Codes:
- `CLIENT_LIMIT_REACHED`
- `PROJECT_LIMIT_REACHED`
- `CHANNEL_LIMIT_REACHED`
- `AI_LIMIT_REACHED`
- `UPGRADE_REQUIRED` (feature gating)

---

## 3. AI Usage Accounting
AI consumption is tracked in the immutable `ai_usage_log` table. Monthly limits are computed dynamically via:
```sql
SELECT COUNT(*) as count 
FROM ai_usage_log 
WHERE organization_id = $1 
  AND created_at >= date_trunc('month', now()) 
  AND status = 'success';
```
Enforcement occurs **pre-flight** prior to calling external LLM providers. Free users receive 25 monthly requests before receiving `402 AI_LIMIT_REACHED`.

---

## 4. Database Schema Synchronization

Migration `0046_sync_plan_feature_limits.sql` synchronizes `subscription_plans.feature_limits` JSON columns across all four standard slugs (`starter`, `pro`, `agency`/`enterprise`, `lifetime`).
