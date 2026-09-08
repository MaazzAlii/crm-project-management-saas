# ADR 001: Multi-Tenant Architecture & Data Isolation

## Status
Accepted

## Context
The platform originated as an internal tool for Innoventix Hub but has been expanded into a commercial multi-tenant SaaS product sold to external agencies and SMBs. We need a clear, scalable, and secure multi-tenancy model before building the database schema, auth policies, or application features.

## Options Considered

### 1. Database-Per-Tenant
- **Pros**: Complete physical isolation, easy backup/restore per tenant.
- **Cons**: High operational complexity, high cost at scale, difficult schema migrations across hundreds of databases.

### 2. Schema-Per-Tenant (PostgreSQL Schemas)
- **Pros**: Strong logical isolation, shared DB instance.
- **Cons**: Schema migration overhead, connection pool challenges with hundreds of schemas.

### 3. Shared Database, Shared Schema (Row-Level Tenancy) — SELECTED
- **Pros**: Simple operational overhead, cost-effective, seamless schema migrations, highly scalable.
- **Cons**: Requires strict row-level security (RLS) on every table to prevent data leaks across tenants.

## Decision
We adopt **Shared Database, Shared Schema with Row-Level Isolation**.

1. **Organization as Tenant Root**:
   - An `organizations` table represents each tenant (paying company / agency).
   - Innoventix Hub is tenant #1 in the database (no special code branches).

2. **Foreign Key Enforcement**:
   - Every tenant-scoped table MUST include `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.

3. **Supabase Row-Level Security (RLS)**:
   - RLS is ENABLED on every tenant table.
   - Access is granted by evaluating whether `auth.uid()` belongs to `organization_members` for the given `organization_id`.

4. **Tenant Hierarchy**:
   ```
   Organization (e.g. Innoventix Hub or Agency X)
     ├── Members (Owners, Admins, Members, Billing Managers)
     ├── Clients (Agency's customers)
     │     └── Projects
     │           ├── Tasks
     │           └── Deliverables
     ├── Communication Hub (Org-connected Slack, Email, WhatsApp)
     └── Subscriptions & Billing (Stripe Customer per Org)
   ```

5. **Feature Gating**:
   - Feature gating and limits are checked at the `organizations.plan_tier` level.

## Consequences
- Every database migration must include `organization_id` on new tenant tables.
- RLS policies must be thoroughly tested for tenant isolation.
- No developer should write queries omitting `organization_id` filtering or bypassing RLS.
