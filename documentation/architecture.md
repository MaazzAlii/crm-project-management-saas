# Platform Architecture — Multi-Tenant CRM & Project Management SaaS

## Vision & Scope
The platform combines **CRM, Project Management, and Unified Communication** into a single multi-tenant SaaS application.
- **Tenant Scope**: Every database record, API route, and UI view belongs to an `organization`.
- **First Tenant**: Innoventix Hub is the inaugural organization in the production database with zero special-case code logic.
- **External Customers**: Agencies and SMBs can sign up, select subscription tiers, onboard team members, and manage their clients and projects.

## Architecture Blueprint

### 1. Tenancy Model
- **Model**: Shared Database, Shared Schema with Row-Level Isolation.
- **Key Discriminator**: `organization_id` (UUID) present on all tenant-owned tables.
- **Enforcement**: Supabase Row-Level Security (RLS) policies validate `auth.uid()` membership in `organization_members`.

### 2. Core Functional Modules
1. **Auth & Organization Management**: Multi-tenant onboarding, role-based access control (Owner, Admin, Member, Billing Manager).
2. **CRM Module**: Clients, Sales Pipeline / Kanban (Leads, Proposals, Negotiation, Won, Lost), Segmentation Tags, Client Communication History.
3. **Project Management Module**: Projects, Tasks, Deliverables, Project Templates, Status Tag System, Team Workload View.
4. **Unified Communication Hub**: Central inbox aggregating Slack, WhatsApp Cloud API, Email (Inbound Parse), Discord, and Upwork channel stubs.
5. **Automation & Triggers (n8n)**: Webhook contracts triggering automatic invoicing upon project delivery, deadline alerts, weekly summary reports.
6. **Client Portal**: External client access with restricted RLS for project approvals, deliverable viewing, and invoice status.
7. **Billing & Subscriptions (Stripe)**: Tiered subscriptions, plan feature gating, self-serve customer portal.

### 3. Folder & Package Structure
- `/app`: Next.js App Router (Public routes, Auth, Dashboard, Client Portal)
- `/components`: UI Component Library (Design System, Kanban, Tables, Communication Inbox)
- `/lib`: Shared utilities, Supabase client initialization, Stripe helpers
- `/server`: Server Actions, Webhook Handlers
- `/types`: TypeScript interfaces & Supabase Database types
- `/supabase`: SQL Migrations, RLS definitions, Seeds
- `/documentation`: Architectural Decision Records (ADRs) & System Docs
