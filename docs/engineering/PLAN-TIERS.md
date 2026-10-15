# Engineering Specification: Plan Tiers, Quotas & Feature Gating

**Source of Truth** for Plan Tiers, Resource Quotas, Feature Limits, and Server-Side Enforcement Mechanisms in the Innoventix SaaS platform.

---

## 1. Plan Tier Matrix & Quotas

| Dimension / Resource | Free Tier (Tight) | Pro Plan | Enterprise Plan | Lifetime VIP Access |
|---|---|---|---|---|
| **Max Team Members** | 3 | 15 | 500 | 500 |
| **Max Pending Invites** | 2 | 20 | 500 | 500 |
| **Max Clients** | 5 | 100 | 999,999 (Unlimited) | 999,999 (Unlimited) |
| **Max Projects** | 3 | 50 | 999,999 (Unlimited) | 999,999 (Unlimited) |
| **Max Connected Channels** | 1 | 3 | 999 | 999 |
| **Max AI Requests / Month** | 25 | 500 | 10,000 | 10,000 |
| **Client Portal Enabled** | ❌ No (`UPGRADE_REQUIRED`) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Email Integration Enabled**| ❌ No (`UPGRADE_REQUIRED`) | ✅ Yes | ✅ Yes | ✅ Yes |
| **SSO / SAML Enabled** | ❌ No | ❌ No | ✅ Yes (Enterprise-only)| ✅ Yes |
| **Audit Logs Enabled** | ❌ No | ❌ No | ✅ Yes (Enterprise-only)| ✅ Yes |
| **API Access Enabled** | ❌ No | ❌ No | ✅ Yes (Enterprise-only)| ✅ Yes |
| **Price (Monthly / Yearly)** | $0 | $79 / $790 | $199 / $1,990 | One-time / VIP |

> [!NOTE]
> **Lifetime VIP Tier Policy (BILL-3 Correction)**: Lifetime VIP access maps strictly to **Enterprise** tier quotas and feature capabilities (500 members, 500 pending invites, unlimited clients/projects, 999 channels, 10,000 AI requests, Client Portal, Email Integration, SSO, Audit Logs, and API Access).
>
> **Multi-Duration Plan Overrides (`organization_plans.plan_override`)**:
> - `lifetime`: Permanent Enterprise access (`maxMembers: 500`, all enterprise features enabled).
> - `enterprise`: Permanent Enterprise access.
> - `pro`: Permanent Pro access (`maxMembers: 15`).
> - `1_month`, `3_month`, `6_month`, `12_month`: Sponsored Enterprise access until `plan_override_expires_at`. Once expired, access falls back to the active Stripe subscription or Free tier.
> - Unknown override: Fails open to Enterprise quotas with a warning log.


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

---

## 5. Super-Admin Plan Override Management (BILL-3B)

### 5.1 Architecture & Overview
Super-admins can directly grant, modify, and revoke workspace plan overrides via the administrative interface at `/super-admin/organizations/[id]`. This eliminates manual database updates and enforces strict authorization, validation, cache invalidation, and immutable audit logging.

### 5.2 Supported Override Durations
Overrides map to full **Enterprise** tier quotas (`maxMembers: 500`, unlimited clients/projects, 999 channels, 10,000 AI requests, and all enterprise feature flags):
- **Lifetime VIP (`lifetime`)**: Permanent Enterprise access (`plan_override_expires_at = NULL`).
- **1 Month (`1_month`)**: Sponsored Enterprise access (`NOW() + INTERVAL '1 month'`).
- **3 Months (`3_month`)**: Sponsored Enterprise access (`NOW() + INTERVAL '3 months'`).
- **6 Months (`6_month`)**: Sponsored Enterprise access (`NOW() + INTERVAL '6 months'`).
- **12 Months (`12_month`)**: Sponsored Enterprise access (`NOW() + INTERVAL '12 months'`).
- **Custom Expiration (`custom`)**: Admin-selected future calendar date (`customExpiresAt::timestamptz`).

### 5.3 Database Schema (`public.organization_plans`)
Applied via migration `0050_plan_override_expiry.sql`:
- `plan_override_expires_at TIMESTAMPTZ`: Expiration timestamp (NULL for lifetime).
- `plan_override_granted_by UUID REFERENCES users(id)`: User ID of super-admin granter.
- `plan_override_granted_at TIMESTAMPTZ`: Timestamp when override was granted.
- `plan_override_note TEXT`: Optional administrative audit note (up to 500 characters).

### 5.4 Backend Service & Cache Invalidation
- **Service Layer**: `lib/services/plan-override.ts` provides `grantPlanOverride()`, `revokePlanOverride()`, and `getPlanOverrideDetails()`.
- **Server Actions**: `app/super-admin/plan-override-actions.ts` provides `grantPlanOverrideAction()` and `revokePlanOverrideAction()`, strictly guarded by `requireSuperAdmin()`.
- **Cache Invalidation**: Backed by `globalThis.__innoventix_plan_cache__` singleton. All grants and revocations execute `invalidatePlanCache(orgId)` followed by Next.js `revalidatePath` and client `router.refresh()`.
- **Audit Trails**: Every grant and revoke logs an immutable audit event (`PLAN_OVERRIDE_GRANTED`, `PLAN_OVERRIDE_REVOKED`) with target organization ID, granter ID, duration, expiry date, and admin note.

