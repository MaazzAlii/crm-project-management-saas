-- =============================================================================
-- Migration 0038: Organization Plans Table & Backfill
-- Prompt 10: Store each organization's plan in the database
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.organization_plans (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill every existing organization to free
INSERT INTO public.organization_plans (organization_id, plan_id, status)
SELECT id, 'free', 'active'
FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;
