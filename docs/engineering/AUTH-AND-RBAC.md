# Auth & Role-Based Access Control (RBAC)

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Role Hierarchy

Access privileges follow a strict numeric and semantic hierarchy:

$$\text{owner (4)} > \text{admin (3)} > \text{member (2)} > \text{viewer (1)}$$

In addition, **`billing_manager (0)`** operates as a specialized scoped role focused exclusively on invoices, subscription plans, and Stripe payment methods.

---

## 2. Capability Matrix

| Capability / Action | `owner` | `admin` | `member` | `viewer` | `billing_manager` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Clients, Projects, Tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create / Edit Clients & Projects | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Clients & Projects | ✅ | ✅ | ❌ | ❌ | ❌ |
| Move Deals in Kanban Pipeline | ✅ | ✅ | ✅ | ❌ | ❌ |
| Send / Receive Omni-Inbox Chats | ✅ | ✅ | ✅ | ❌ | ❌ |
| Invite Members / Revoke Invites | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change Member Roles / Remove | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Organization Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| View & Manage Stripe Billing | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Organization Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Entire Organization | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Session Lifecycle & Token Architecture

1. **Access Token**:
   - Format: Stateless JWT signed via `jose` using `HS256` and `JWT_SECRET`.
   - Lifespan: **30 minutes** (`JWT_EXPIRES_IN = 3600`).
   - Delivery: Sent in HttpOnly, SameSite=Lax cookie (`innoventix_session`).
   - Payload: `userId`, `email`, `organizationId`, `role`, `isSuperAdmin`.
2. **Refresh Token**:
   - Format: Secure random 64-character token hash stored in PostgreSQL `refresh_tokens`.
   - Lifespan: **7 days** (`REFRESH_TOKEN_EXPIRES_IN = 604800`).
   - Family Invalidation: Each refresh token belongs to a `token_family`. If a previously used or revoked token is presented, the entire family is revoked immediately to mitigate token theft.
3. **Session Verification**:
   - Route middleware and Server Actions verify session via `getCurrentSessionContext()`.
   - If expired, client background refresh triggers silently via `/api/auth/refresh`.

---

## 4. Super Admin Impersonation

- **Authorization**: Restricted strictly to users with `is_super_admin = true`.
- **Modes**:
  - `read`: Read-only tenant inspection.
  - `write`: Active support mode with mandatory audit logging of every mutation.
- **Banner**: Persistent sticky banner across all screens indicates active support mode with time remaining and one-click exit.

---

## 5. Related Files

- `docs/engineering/DATA-AND-API.md`
- `docs/prompts/AUTH-HARDENING-MASTER-PROMPT.md`
- `lib/auth/session.ts`
- `lib/auth/roles.ts`
