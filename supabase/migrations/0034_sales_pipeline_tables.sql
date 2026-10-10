-- =============================================================================
-- Migration: 0034_sales_pipeline_tables.sql
-- Description: Multi-tenant Sales Pipelines, Stages, Deals, Labels, Checklists,
--              Comments, and Activity Log for Trello-style Board
-- =============================================================================

-- 1. Pipelines Table
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_org_id ON public.pipelines(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipelines_unique_default_per_org ON public.pipelines(org_id) WHERE is_default = true;

-- 2. Pipeline Stages Table (Trello Lists / Columns)
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  position DOUBLE PRECISION NOT NULL,
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  wip_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_stage_not_both_won_and_lost CHECK (NOT (is_won AND is_lost))
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_org_id ON public.pipeline_stages(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_pos ON public.pipeline_stages(pipeline_id, position);

-- 3. Deals Table (Trello Cards)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  position DOUBLE PRECISION NOT NULL,
  expected_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'archived')),
  lost_reason TEXT,
  closed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_org_pipeline_stage_pos ON public.deals(org_id, pipeline_id, stage_id, position);
CREATE INDEX IF NOT EXISTS idx_deals_org_owner ON public.deals(org_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_org_close_date ON public.deals(org_id, expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON public.deals(client_id);

-- 4. Pipeline Labels
CREATE TABLE IF NOT EXISTS public.pipeline_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pipeline_labels_name UNIQUE (pipeline_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_labels_org ON public.pipeline_labels(org_id);

-- 5. Deal Labels Join Table
CREATE TABLE IF NOT EXISTS public.deal_labels (
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.pipeline_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, label_id)
);

-- 6. Deal Checklists
CREATE TABLE IF NOT EXISTS public.deal_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position DOUBLE PRECISION NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_checklists_deal ON public.deal_checklists(deal_id, position);

-- 7. Deal Checklist Items
CREATE TABLE IF NOT EXISTS public.deal_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.deal_checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position DOUBLE PRECISION NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_checklist_items_chk ON public.deal_checklist_items(checklist_id, position);

-- 8. Deal Comments
CREATE TABLE IF NOT EXISTS public.deal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deal_comments_deal ON public.deal_comments(deal_id, created_at);

-- 9. Deal Activity Log
CREATE TABLE IF NOT EXISTS public.deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_date ON public.deal_activities(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_activities_org ON public.deal_activities(org_id);
