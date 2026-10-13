# Data & API Architecture

**Version:** 1.0  
**Last Updated:** 2026-10-13  
**Status:** Living Documentation

---

## 1. Relational Database Schema Overview

The database is powered by self-hosted PostgreSQL. Key tables include:

| Table | Key Columns | Indexes / Constraints |
| :--- | :--- | :--- |
| `users` | `id (UUID)`, `email`, `password_hash`, `full_name`, `email_verified_at`, `is_super_admin` | Unique `email`, `created_at` |
| `organizations` | `id (UUID)`, `name`, `slug`, `plan_tier`, `billing_status`, `stripe_customer_id` | Unique `slug` |
| `organization_members`| `id (UUID)`, `organization_id`, `user_id`, `role` | Unique `(organization_id, user_id)` |
| `clients` | `id (UUID)`, `organization_id`, `name`, `email`, `company`, `status`, `stage`, `deal_value` | Index `(organization_id, status)` |
| `projects` | `id (UUID)`, `organization_id`, `client_id`, `name`, `status`, `health_status`, `start_date` | Index `(organization_id, client_id)` |
| `tasks` | `id (UUID)`, `organization_id`, `project_id`, `title`, `status`, `assignee_id`, `due_date` | Index `(organization_id, project_id)` |
| `communications` | `id (UUID)`, `organization_id`, `client_id`, `channel`, `direction`, `content`, `sent_at` | Index `(organization_id, client_id)` |
| `invitations` | `id (UUID)`, `organization_id`, `email`, `token_hash`, `role`, `status`, `expires_at` | Index `(token_hash, status)` |
| `refresh_tokens` | `id (UUID)`, `user_id`, `token_hash`, `token_family`, `is_revoked`, `expires_at` | Index `(token_hash)`, Index `(token_family)` |
| `audit_logs` | `id (UUID)`, `organization_id`, `actor_id`, `action`, `resource_type`, `created_at` | Index `(organization_id, created_at DESC)` |

---

## 2. Multi-Tenancy Architecture

1. **Logical Isolation**:
   - Every tenant data table contains a foreign key `organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`.
2. **Mandatory Query Filtering**:
   - Application-layer queries must explicitly filter by `organization_id = $sessionOrgId`.
   - Never accept tenant identifiers from request query parameters or mutation payloads.
3. **Cross-Tenant Access Defense**:
   - Queries requesting an entity ID that does not match the active session's `organization_id` return HTTP 404 (Not Found) rather than HTTP 403 to prevent resource enumeration attacks.

---

## 3. API Conventions & Standards

### 3.1 Standard Response Shape
- **Success (200 / 201)**:
  ```json
  {
    "data": { ... },
    "meta": { "total": 100, "page": 1 }
  }
  ```
- **Error (400, 401, 403, 404, 422, 429, 500)**:
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Invalid email address provided",
      "fieldErrors": { "email": "Must be a valid email" }
    }
  }
  ```

### 3.2 Key Route Endpoints
- **Authentication**: `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`
- **Invitations**: `/api/invitations`, `/api/invitations/accept`, `/api/invitations/accept-info`
- **Clients**: `/api/clients`, `/api/clients/[id]`, `/api/clients/[id]/score`
- **Projects & Tasks**: `/api/projects`, `/api/projects/[id]`, `/api/tasks`
- **Communications**: `/api/communications`, `/api/inbox/messages`, `/api/inbox/suggest-task`
- **Super Admin**: `/api/super-admin/impersonate`, `/api/super-admin/organizations`

---

## 4. Related Files

- `docs/engineering/AUTH-AND-RBAC.md`
- `docs/engineering/CODING-STANDARDS.md`
- `lib/db/index.ts`
