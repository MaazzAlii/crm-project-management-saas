-- =============================================================================
-- Migration 0050: Add expiry and audit columns for sponsor overrides (BILL-3)
-- Targets public.organization_plans (single source of truth for plan overrides)
-- =============================================================================

ALTER TABLE public.organization_plans
  ADD COLUMN IF NOT EXISTS plan_override_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_override_granted_by UUID,
  ADD COLUMN IF NOT EXISTS plan_override_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_override_note TEXT;

CREATE INDEX IF NOT EXISTS idx_org_plans_override_expires
  ON organization_plans(plan_override_expires_at)
  WHERE plan_override_expires_at IS NOT NULL;

COMMENT ON COLUMN public.organization_plans.plan_override IS
  'Access override: ''lifetime'' for permanent Enterprise, or ''<N>_month'' for sponsored Enterprise that expires.';
