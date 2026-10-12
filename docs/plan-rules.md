# Innoventix Plan & Tier Rules

This document specifies the billing and plan gating rules enforced across the Innoventix platform.

---

## 1. Core Principle: Full Platform Access on Free Tier

Innoventix provides a full-featured workspace experience on the Free plan tier:
- **Unrestricted Core Features**: Free organizations have full, unhindered access to all CRM and project management modules:
  - **Clients & Contacts**: Create, edit, and manage clients without quotas or caps.
  - **Projects & Tasks**: Create, schedule, and complete projects and tasks without volume restrictions.
  - **Sales Pipelines & Deals**: Manage deal stages, custom pipelines, kanban cards, and communications logs.
  - **Inbox & Communication Hub**: Unified communication threads and messages.
  - **Analytics & Reports**: Full access to reporting cards and workload summaries.
- **No Artificial Feature Gates**: No screen outside team management is blocked, greyed out, or paywalled for free workspaces.

---

## 2. Free Tier Limits: Team Size & Pending Invites Only

The Free plan tier places restrictions strictly on team collaboration capacity:

| Metric | Free Tier Limit | Pro Plan | Enterprise Plan |
| :--- | :--- | :--- | :--- |
| **Max Members (`maxMembers`)** | **3 active seats** | **15 active seats** | **Custom / Unlimited** |
| **Max Pending Invites (`maxPendingInvites`)** | **2 pending invites** | **10 pending invites** | **Custom / Unlimited** |
| **Total Reserved Seats (`seatsUsed`)** | **3 (`activeMembers + pendingInvites`)** | **15** | **Custom** |

### Enforcement Mechanics:
1. **Invite Creation (`Prompt 18`)**:
   - Refused if pending invitations count equals or exceeds `maxPendingInvites` (2).
   - Refused if reserved seats (`activeMembers + pendingInvites + 1`) exceed `maxMembers` (3).
2. **Invite Acceptance (`Prompt 20 & 21`)**:
   - Refused with a 403 status and descriptive message if active members already equal or exceed `maxMembers` at the time of token redemption.
   - Members are never silently added past the tier capacity.
3. **Revocation / Renewal**:
   - Revoking a pending invitation frees up both a pending invitation slot and a reserved seat immediately.
4. **Upgrade Banner**:
   - When a free workspace reaches its seat limit, a single, non-intrusive upgrade notification is displayed exclusively on the **Team Settings** page (`/settings/team`).
   - No other screen is disabled.

---

## 3. Verified Business Domains (Pro+ Only)

Custom business domain verification (`verified_domain` & `domain_verified_at`):
- **Pro / Enterprise Only**: Only workspaces with an active Pro or Enterprise subscription can initiate and confirm domain verification (`POST /api/organizations/domain/confirm`).
- **Free Tier Policy**: Free tier organizations cannot claim or verify custom domains. The team invite dialog and settings UI display an explicit explanation directing free users to upgrade to Pro.
