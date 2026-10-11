-- =============================================================================
-- Migration 0037: Organization Business-Domain Fields
-- Prompt 09: Organization business-domain fields
-- =============================================================================

ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS verified_domain TEXT,
    ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ;
