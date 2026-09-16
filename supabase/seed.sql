-- Seed Data for Task 08 & Task 10: Core Organizations, Subscription Plans & Active Subscription

-- 1. Insert Innoventix Hub as Organization #1
INSERT INTO public.organizations (id, name, slug, plan_tier, billing_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Innoventix Hub',
    'innoventix-hub',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert 3 Subscription Plans (Starter, Pro, Enterprise)
INSERT INTO public.subscription_plans (id, name, slug, price_monthly, price_yearly, feature_limits)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        'Starter Plan',
        'starter',
        29.00,
        290.00,
        '{"max_team_members": 5, "max_clients": 25, "max_projects": 50, "ai_features_enabled": false, "storage_limit_gb": 10}'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Pro Plan',
        'pro',
        79.00,
        790.00,
        '{"max_team_members": 15, "max_clients": 100, "max_projects": 250, "ai_features_enabled": true, "storage_limit_gb": 50}'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Enterprise Plan',
        'enterprise',
        199.00,
        1990.00,
        '{"max_team_members": 999, "max_clients": 9999, "max_projects": 9999, "ai_features_enabled": true, "storage_limit_gb": 500}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Active Subscription for Innoventix Hub (Enterprise Plan)
INSERT INTO public.organization_subscriptions (organization_id, plan_id, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'active'
) ON CONFLICT (organization_id) DO NOTHING;

-- 4. Insert Sample Slack Communication Channel for Innoventix Hub
INSERT INTO public.communication_channels (id, organization_id, provider, external_account_id, channel_name, status, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'slack',
    'C0123456789',
    '#acme-redesign',
    'active',
    '{"slack_channel_id": "C0123456789", "slack_team_id": "T0123456789"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

