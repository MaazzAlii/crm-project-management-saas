-- =============================================================================
-- Migration 0044: Add plan_override column to organization_plans
-- Security hardening: Decouple lifetime Enterprise access from hardcoded application code
-- =============================================================================

ALTER TABLE public.organization_plans
    ADD COLUMN IF NOT EXISTS plan_override TEXT DEFAULT NULL;
