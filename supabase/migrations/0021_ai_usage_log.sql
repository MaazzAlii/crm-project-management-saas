-- Migration 0021: AI Usage Logging & Multi-Tenant Cost Accounting
-- Tracks model usage, token consumption, feature invocation, and cost per organization

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feature VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(10, 6) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indices for reporting and throttling
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org_created ON public.ai_usage_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org_feature ON public.ai_usage_log(organization_id, feature);

-- Enable Row-Level Security
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Organization members can view their organization's AI usage logs
DROP POLICY IF EXISTS "Org members can view AI usage logs" ON public.ai_usage_log;
CREATE POLICY "Org members can view AI usage logs"
    ON public.ai_usage_log FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- Organization members and super admins can insert AI usage logs
DROP POLICY IF EXISTS "Org members can insert AI usage logs" ON public.ai_usage_log;
CREATE POLICY "Org members can insert AI usage logs"
    ON public.ai_usage_log FOR INSERT
    WITH CHECK (public.is_org_member(organization_id) OR public.is_super_admin());
