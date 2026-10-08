-- =============================================================================
-- Innoventix Platform v2 — Lifetime VIP Access Plan Definition
-- =============================================================================

INSERT INTO public.subscription_plans (id, name, slug, price_monthly, price_yearly, feature_limits)
VALUES (
    '10000000-0000-0000-0000-000000000004',
    'Lifetime VIP Access',
    'lifetime',
    0.00,
    0.00,
    '{
        "max_team_members": 9999,
        "max_clients": 99999,
        "max_projects": 99999,
        "storage_limit_gb": 10000,
        "client_portal_enabled": true,
        "ai_features_enabled": true,
        "ai_capabilities": {
            "reply_suggestions": true,
            "lead_scoring": true,
            "task_extraction": true,
            "weekly_narrative": true
        },
        "communication_channels_included": 999,
        "analytics_level": "custom",
        "is_lifetime": true
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    feature_limits = EXCLUDED.feature_limits;

-- Update check constraint on organizations table to allow 'agency' and 'lifetime'
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_tier_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_tier_check 
    CHECK (plan_tier IN ('free', 'starter', 'pro', 'agency', 'enterprise', 'lifetime'));

