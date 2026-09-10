-- TASK 18 Migration 11: Add Organization Suspension Fields
-- Allows Super Admins to suspend and resume tenant access with audit trail fields

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_is_suspended ON public.organizations(is_suspended);
