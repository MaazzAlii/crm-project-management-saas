-- TASK 66 Migration 29: Production Multi-Tenant Performance & Scale Indexes
-- Targeted composite and partial indexes identified during load & scale profiling:
-- 1. Composite (organization_id, sent_at DESC) for Unified Inbox pagination
-- 2. Partial (organization_id, sent_at DESC) WHERE client_id IS NULL for Unmatched Messages filter
-- 3. Composite (organization_id, status, deadline ASC) for Projects Kanban & List views
-- 4. Composite (organization_id, status) for Tasks workload & status filtering
-- 5. Composite (project_id, status) for Tasks per-project completion aggregation
-- 6. Composite (organization_id, pipeline_stage, lead_score DESC) for CRM Sales Pipeline Kanban
-- 7. Composite (organization_id, created_at DESC) for CRM Clients List sorting

-- 1. Unified Inbox: Avoids in-memory sort of org messages
CREATE INDEX IF NOT EXISTS idx_messages_org_sent_desc
    ON public.communication_messages(organization_id, sent_at DESC);

-- 2. Unmatched Inbox Messages: Zero-cost lookup for unmatched streams
CREATE INDEX IF NOT EXISTS idx_messages_org_unmatched_sent
    ON public.communication_messages(organization_id, sent_at DESC)
    WHERE client_id IS NULL;

-- 3. Projects Kanban & Active Queries: Fast filtering by tenant & status
CREATE INDEX IF NOT EXISTS idx_projects_org_status_deadline
    ON public.projects(organization_id, status, deadline ASC);

CREATE INDEX IF NOT EXISTS idx_projects_org_deadline
    ON public.projects(organization_id, deadline ASC);

-- 4. Tasks Workload & Status Filtering
CREATE INDEX IF NOT EXISTS idx_tasks_org_status
    ON public.tasks(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status
    ON public.tasks(project_id, status);

-- 5. CRM Pipeline Kanban: Fast grouping by stage with score ordering
CREATE INDEX IF NOT EXISTS idx_clients_org_stage_score
    ON public.clients(organization_id, pipeline_stage, lead_score DESC);

-- 6. CRM Clients List: Direct indexed retrieval sorted by creation date
CREATE INDEX IF NOT EXISTS idx_clients_org_created_desc
    ON public.clients(organization_id, created_at DESC);

-- 7. Deliverables: Fast lookup per project in tenant
CREATE INDEX IF NOT EXISTS idx_deliverables_org_project
    ON public.deliverables(organization_id, project_id);
