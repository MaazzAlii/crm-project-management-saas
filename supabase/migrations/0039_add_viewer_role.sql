-- =============================================================================
-- Migration 0039: Add 'viewer' to org_member_role Enum
-- =============================================================================

ALTER TYPE public.org_member_role ADD VALUE IF NOT EXISTS 'viewer';
