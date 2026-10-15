-- =============================================================================
-- Migration 0046: Synchronize subscription_plans feature_limits with Tier Matrix
-- =============================================================================
-- Aligns DB feature_limits JSON with BILL-1 tier decisions:
-- - Starter/Free: 3 members, 5 clients, 3 projects, 1 channel, 25 AI requests, portal=false, email=false
-- - Pro: 15 members, 100 clients, 50 projects, 3 channels, 500 AI requests, portal=true, email=true
-- - Enterprise/Agency: 500 members, 999999 clients, 999999 projects, 999 channels, 10000 AI requests, portal=true, email=true, sso=true, auditLogs=true, apiAccess=true
-- - Lifetime: Same quotas and feature flags as Pro (does NOT cannibalize Enterprise)

-- 1. Starter / Free Plan
UPDATE public.subscription_plans
SET feature_limits = jsonb_build_object(
  'max_team_members', 3,
  'max_pending_invites', 2,
  'max_clients', 5,
  'max_projects', 3,
  'communication_channels_included', 1,
  'max_ai_requests_monthly', 25,
  'client_portal_enabled', false,
  'email_integration_enabled', false,
  'sso_enabled', false,
  'audit_logs_enabled', false,
  'api_access_enabled', false,
  'storage_limit_gb', 10,
  'ai_features_enabled', true,
  'analytics_level', 'basic'
)
WHERE slug = 'starter';

-- 2. Pro Plan
UPDATE public.subscription_plans
SET feature_limits = jsonb_build_object(
  'max_team_members', 15,
  'max_pending_invites', 20,
  'max_clients', 100,
  'max_projects', 50,
  'communication_channels_included', 3,
  'max_ai_requests_monthly', 500,
  'client_portal_enabled', true,
  'email_integration_enabled', true,
  'sso_enabled', false,
  'audit_logs_enabled', false,
  'api_access_enabled', false,
  'storage_limit_gb', 50,
  'ai_features_enabled', true,
  'analytics_level', 'advanced'
)
WHERE slug = 'pro';

-- 3. Enterprise / Agency Plan
UPDATE public.subscription_plans
SET feature_limits = jsonb_build_object(
  'max_team_members', 500,
  'max_pending_invites', 500,
  'max_clients', 999999,
  'max_projects', 999999,
  'communication_channels_included', 999,
  'max_ai_requests_monthly', 10000,
  'client_portal_enabled', true,
  'email_integration_enabled', true,
  'sso_enabled', true,
  'audit_logs_enabled', true,
  'api_access_enabled', true,
  'storage_limit_gb', 500,
  'ai_features_enabled', true,
  'analytics_level', 'custom'
)
WHERE slug = 'agency' OR slug = 'enterprise';

-- 4. Lifetime VIP Access (Matches Pro limits)
UPDATE public.subscription_plans
SET feature_limits = jsonb_build_object(
  'is_lifetime', true,
  'max_team_members', 15,
  'max_pending_invites', 20,
  'max_clients', 100,
  'max_projects', 50,
  'communication_channels_included', 3,
  'max_ai_requests_monthly', 500,
  'client_portal_enabled', true,
  'email_integration_enabled', true,
  'sso_enabled', false,
  'audit_logs_enabled', false,
  'api_access_enabled', false,
  'storage_limit_gb', 100,
  'ai_features_enabled', true,
  'analytics_level', 'advanced'
)
WHERE slug = 'lifetime';
