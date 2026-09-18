-- Migration 0023: Add per-organization AI feature settings
-- Enables tenant administrators to toggle individual AI capabilities on or off.

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS ai_feature_settings JSONB DEFAULT jsonb_build_object(
    'reply_suggestions', true,
    'lead_scoring', true,
    'task_extraction', true,
    'weekly_narrative', true
);

COMMENT ON COLUMN public.organizations.ai_feature_settings IS 'Tenant-level feature toggles for AI capabilities, checked in addition to subscription plan limits and platform kill switches.';
