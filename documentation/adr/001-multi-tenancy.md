# ADR 001: Multi-Tenant Architecture, Data Isolation & Super Admin Platform Tier

## Status
Accepted

## Context
The platform originated as an internal tool for Innoventix Hub and has evolved into a self-hosted, commercial multi-tenant SaaS. It features a dual-tier tenancy structure: tenant organizations (agencies/SMBs) and a platform-level Super Admin operator tier. We require an unambiguous architectural decision defining data boundaries, authorization models, and Super Admin privilege isolation before schema creation.

## Options Considered for Tenancy

### 1. Database-Per-Tenant
- **Pros**: Complete physical isolation.
- **Cons**: High operational overhead on self-hosted VPS, complex migrations across instances.

### 2. Shared Database, Shared Schema with Row-Level Security (RLS) — SELECTED
- **Pros**: Operational simplicity, single migration pipeline, high performance, robust RLS-enforced security.
- **Cons**: Requires strict RLS enforcement on 100% of tenant tables.

---

## Decision

We adopt **Shared Database, Shared Schema with Row-Level Isolation** for tenants, coupled with a **Strictly Separated Super Admin Table** for platform management.

### 1. Complete Hierarchy Structure
```
Super Admin Tier (Platform Operator / DEVMARK)
  │ (Stored in `super_admins` table; ZERO membership in `organization_members`)
  │
  ▼
Organization Tier (Tenants - Innoventix Hub = Org #1)
  ├── Organization Members (Owner, Admin, Member, Billing Manager)
  ├── Clients (Agency Clients - Manual or Connected Communication Mode)
  │     └── Projects
  │           ├── Tasks
  │           └── Deliverables
  ├── Communication Hub (Slack, WhatsApp, Email, Discord, Upwork)
  ├── AI Settings & Feature Flags (Per-Organization Controls)
  └── Subscription & Stripe Billing (Plan Tier & Limits)
```

### 2. Tenant Isolation Rules
- Every tenant-scoped table MUST include `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
- RLS MUST be enabled on every tenant table.
- Policies validate that `auth.uid()` exists in `organization_members` for the target `organization_id`.
- Innoventix Hub is Organization #1 in the database, with zero hardcoded code branches.

### 3. Super Admin Isolation Rules
- Super Admins are stored in a dedicated `super_admins` table (`id`, `user_id`, `created_at`).
- Super Admin status is NEVER derived or inherited from any organization role (`owner`/`admin`).
- Super Admin API endpoints (`/api/super-admin/*`) and UI routes (`/super-admin/*`) explicitly check the `super_admins` table.
- A compromised organization owner role CANNOT escalate to platform Super Admin access.

---

## Consequences
- Every database migration must include `organization_id` on tenant tables and appropriate RLS policies.
- Super Admin functionality is strictly isolated from tenant RLS contexts.
- Automated tests must verify both multi-tenant isolation and Super Admin security boundaries.
