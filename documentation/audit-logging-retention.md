# Audit Logging & Retention Policy

## 1. Executive Summary

This document defines the architecture, data schema, access controls, and retention lifecycle for the **Audit Logging & Compliance Subsystem** in the self-hosted CRM & Project Management SaaS platform.

Audit logs provide an immutable, cryptographically verifiable, and tenant-isolated record of all sensitive operations, access changes, financial transactions, and elevated administrative actions across the platform.

---

## 2. Immutability & Security Architecture

### Append-Only Guarantee
Audit logs are stored in PostgreSQL table `public.audit_logs` protected by Supabase Row Level Security (RLS) policies:
- **`INSERT`**: Authorized application servers and authenticated actors can append new events.
- **`SELECT`**: 
  - **Super Admins**: Full platform-wide visibility across all tenant organizations.
  - **Org Owners & Admins**: Scoped strictly to records matching their active `organization_id`.
  - **Regular Members & Clients**: Strictly denied access (`SELECT` returns empty set).
- **`UPDATE`**: **Permanently Denied** via RLS rule `USING (FALSE)`.
- **`DELETE`**: **Permanently Denied** via RLS rule `USING (FALSE)`.

---

## 3. Audit Log Schema

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY` | Unique cryptographic identifier for each event (`gen_random_uuid()`). |
| `organization_id` | `UUID NULLABLE` | Foreign key to `public.organizations(id)`. Null for platform-wide Super Admin events. |
| `actor_user_id` | `UUID NULLABLE` | ID of user who initiated the action. |
| `actor_is_super_admin` | `BOOLEAN NOT NULL` | Flag set to `TRUE` if action was executed by elevated platform operator. |
| `actor_email` | `VARCHAR(255)` | Normalized email of the initiating actor. |
| `actor_name` | `VARCHAR(255)` | Full name or display moniker of the actor. |
| `action` | `VARCHAR(100) NOT NULL` | Standardized audit action enum identifier. |
| `entity_type` | `VARCHAR(100)` | Target domain entity (e.g. `client`, `project`, `task`, `organization_member`). |
| `entity_id` | `VARCHAR(255)` | Unique identifier of the target entity. |
| `metadata` | `JSONB NOT NULL` | Structured snapshot of changed values, before/after states, or event context. |
| `ip_address` | `VARCHAR(100)` | Originating client IPv4/IPv6 address. |
| `user_agent` | `TEXT` | HTTP User-Agent string. |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Timestamp of event generation (UTC `NOW()`). |

---

## 4. Tracked Action Taxonomy

### Authentication & Sessions
- `USER_LOGGED_IN`: Successful session establishment.
- `USER_LOGGED_OUT`: Explicit session termination.
- `USER_LOGIN_FAILED`: Failed credential validation attempt.
- `USER_SIGNUP`: New account creation.

### Organization & Governance
- `ORGANIZATION_CREATED`: New tenant workspace provisioned.
- `ORGANIZATION_PROFILE_UPDATE`: Workspace name, branding, or timezone updated.
- `ORGANIZATION_SUSPENDED`: Workspace access locked by Super Admin.
- `ORGANIZATION_RESUMED`: Workspace access restored by Super Admin.
- `ORGANIZATION_PLAN_OVERRIDDEN`: Manual plan tier adjustment by Super Admin.

### Team & Permissions
- `TEAM_MEMBER_INVITED`: Invitation sent to new team member.
- `TEAM_MEMBER_ROLE_UPDATED`: Member role elevated or demoted (owner, admin, member, billing_manager).
- `TEAM_MEMBER_REMOVED`: Member ejected from tenant workspace.
- `INVITATION_REVOKED`: Pending invitation cancelled.

### CRM & Project Management
- `CLIENT_CREATED` / `CLIENT_UPDATED` / `CLIENT_DELETED`: CRM client mutations.
- `PROJECT_CREATED` / `PROJECT_UPDATED` / `PROJECT_DELETED`: Project lifecycle events.
- `PROJECT_STATUS_UPDATED`: Milestone progress and delivery transitions.
- `PROJECT_DELIVERED_INVOICE_TRIGGERED`: Automated trigger from delivery to billing.
- `TASK_CREATED` / `TASK_UPDATED` / `TASK_STATUS_CHANGED` / `TASK_DELETED`: Task mutations.
- `DELIVERABLE_CREATED` / `DELIVERABLE_STATUS_UPDATED` / `DELIVERABLE_DELETED`: Client deliverable reviews.

### Billing & Stripe Financials
- `CHECKOUT_SESSION_INITIATED`: User redirected to Stripe Checkout.
- `STRIPE_CHECKOUT_COMPLETED`: Successful payment & subscription creation.
- `STRIPE_SUBSCRIPTION_UPDATED`: Tier change or billing cycle update.
- `STRIPE_SUBSCRIPTION_CANCELED`: Subscription termination.
- `STRIPE_PAYMENT_FAILED`: Past-due invoice or card failure.
- `BILLING_PORTAL_OPENED`: Access to Stripe Customer Portal.

### Super Admin Elevated Actions
- `SUPER_ADMIN_IMPERSONATION_START`: Read-only support access into tenant workspace.
- `SUPER_ADMIN_IMPERSONATION_END`: Support session exit.
- `SUPER_ADMIN_SETTINGS_UPDATED`: Platform rate limits or global toggles adjusted.

### Client Portal & Security
- `PORTAL_USER_INVITED`: Client magic-link invitation generated.
- `PORTAL_USER_REVOKED`: Client portal access disabled.
- `PORTAL_SETTINGS_UPDATED`: Client profile, billing, or notification settings updated.
- `API_KEY_ROTATED`: Integration credential change.
- `DATA_EXPORTED`: CSV or PDF export generated.

---

## 5. Data Retention & Archival Policy

| Tier | Duration | Storage Engine | Query SLA |
| :--- | :--- | :--- | :--- |
| **Hot Storage** | **90 Days** | Primary PostgreSQL Table (`audit_logs`) | Real-time indexed query (< 50ms) |
| **Cold Storage** | **365 Days** | Compressed Parquet / SQL Dump Archive | On-demand compliance extraction (< 1 hour) |
| **Purge Policy** | **> 365 Days** | Cryptographic erasure per GDPR right-to-be-forgotten | Automated background cron job |

### Automated Archival Job (Self-Hosted PostgreSQL)
For self-hosted deployments on Contabo VPS, cold storage archival runs monthly via cron:
```bash
# Export records older than 90 days to compressed audit archive
pg_dump -t 'public.audit_logs' \
  --where="created_at < NOW() - INTERVAL '90 days'" \
  $DATABASE_URL | gzip > /var/backups/audit_archive_$(date +%Y%m).sql.gz
```

---

## 6. Regulatory & Compliance Alignment

1. **SOC 2 Type II (Trust Services Criteria CC6.1 - CC6.3)**:
   - All access, permission changes, and data modifications maintain an immutable audit trail.
   - Dual-layer segregation: Super Admin and Org Admin separation prevents cross-tenant data leakage.

2. **GDPR (Article 30 - Records of Processing Activities)**:
   - Full accountability of who accessed or modified client personal data.
   - Strict tenant boundary isolation prevents unauthenticated data exposure.

3. **HIPAA Security Rule (45 CFR § 164.312(b))**:
   - Hardware and software mechanisms that record and examine activity in information systems that contain or use electronic protected health information.
