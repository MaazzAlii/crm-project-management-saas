# Innoventix Sales Pipeline — Architectural Plan & Audit

This plan outlines the roadmap to implement a full Trello-style multi-pipeline sales engine into the existing Innoventix SaaS platform without disrupting existing CRM data.

---

## 1. Current Architecture Overview

- **Framework**: Next.js 14 (App Router) + TypeScript + Tailwind CSS (Dark slate theme).
- **Database**: Direct PostgreSQL pool singleton (`lib/db/index.ts`) with multi-tenancy enforced on every query via `organization_id`.
- **Migrations**: Automated startup runner (`lib/db/auto-migrate.ts`) applying sequential schema definitions in `lib/db/embedded-migrations.ts`.
- **Authentication**: Custom JWT session stored in HTTP-only `innoventix_session` cookie; session helper `getCurrentSessionContext()` returns `{ user, userId, organization, orgId, role, isSuperAdmin }`.
- **Existing Sales/CRM Layer**:
  - `clients` table stores client accounts and simple deal fields (`deal_value`, `pipeline_stage`, `lead_score`).
  - `/leads` page renders a static 6-stage lead board.

---

## 2. Target Trello-Style Pipeline Architecture

### A. Data Layer (`lib/types/pipeline.ts`, `lib/db/repositories/`)
- `pipelines`: Multi-pipeline container per organization (`id`, `organization_id`, `name`, `is_default`, `currency`, `created_at`).
- `pipeline_stages`: Dynamic columns with custom ordering (`id`, `pipeline_id`, `name`, `order_index`, `color_accent`, `win_probability`).
- `deals`: Rich cards with fractional positioning (`id`, `pipeline_id`, `stage_id`, `client_id`, `title`, `deal_value`, `position`, `due_date`, `assigned_user_id`, `status`).
- `deal_labels`: Color-coded tagging system (`id`, `organization_id`, `name`, `color_hex`).
- `deal_checklists` & `deal_checklist_items`: Actionable checklist items with completion states.
- `deal_comments` & `deal_activity_logs`: Immutable timeline and audit history.

### B. Business Services & API Routes (`lib/services/`, `app/api/pipeline/`)
- Fractional position calculation utility (`lib/utils/position.ts`) using midpoints to prevent full table re-indexing on drag-and-drop.
- Route Handlers with strict organization tenant gating:
  - `GET/POST /api/pipelines` & `/api/pipelines/[id]`
  - `GET/POST /api/deals` & `/api/deals/[id]`
  - `POST /api/deals/[id]/move` (optimistic drag-and-drop target stage and fractional index updater)
  - `POST /api/deals/[id]/labels`, `/checklists`, `/comments`

### C. UI & Drag-and-Drop Layer (`components/pipeline/`, `app/leads/`, `app/pipelines/`)
- Drag-and-drop engine powered by `@dnd-kit/core` and `@dnd-kit/sortable` with collision detection.
- Rich deal cards displaying deal value, assigned avatars, checklist progress bars, label pills, and AI score badges.
- Trello-style Card Detail Modal with inline title editing, description rich editor, checklist management, comments stream, and deal stage transitions.
- Header forecast summary showing total pipeline value, weighted forecast value, and win rate.

---

## 3. Files to Create / Modify

| Layer | Files |
|---|---|
| **Database Migrations** | `supabase/migrations/0034_sales_pipeline_tables.sql`, update `lib/db/embedded-migrations.ts` |
| **Type Definitions** | `lib/types/pipeline.ts` |
| **Repositories** | `lib/db/repositories/pipeline-repo.ts`, `lib/db/repositories/deal-repo.ts` |
| **Services & Utils** | `lib/services/pipeline-service.ts`, `lib/services/deal-service.ts`, `lib/utils/position.ts` |
| **API Endpoints** | `app/api/pipelines/route.ts`, `app/api/pipelines/[id]/route.ts`, `app/api/deals/route.ts`, `app/api/deals/[id]/route.ts`, `app/api/deals/[id]/move/route.ts` |
| **UI Components** | `components/pipeline/PipelineBoard.tsx`, `components/pipeline/PipelineColumn.tsx`, `components/pipeline/DealCard.tsx`, `components/pipeline/DealDetailModal.tsx`, `components/pipeline/PipelineHeader.tsx` |
| **Pages** | Update `app/leads/page.tsx` to mount the full interactive pipeline board |

---

## 4. Conflict & Risk Mitigation
1. **Existing CRM Compatibility**: Retain `clients` table associations and sync `deals` to client records so existing lead scores and client detail pipeline tabs continue working seamlessly.
2. **Multi-Tenant Isolation**: Enforce `organization_id` check in repository queries and verify deal belongs to user's tenant before permitting moves.
3. **Database Performance**: Add B-tree indexes on `(pipeline_id, stage_id, position)` for sub-5ms board queries under high card volume.
