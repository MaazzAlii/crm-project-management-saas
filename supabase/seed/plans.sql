-- Production Seed Data for Subscription Plans & Tier Limits

INSERT INTO public.subscription_plans (id, name, slug, price_monthly, price_yearly, feature_limits)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        'Starter Plan',
        'starter',
        29.00,
        290.00,
        '{
            "max_team_members": 5,
            "max_clients": 25,
            "max_projects": 50,
            "storage_limit_gb": 10,
            "client_portal_enabled": true,
            "ai_features_enabled": false,
            "ai_capabilities": {
                "reply_suggestions": false,
                "lead_scoring": false,
                "task_extraction": false,
                "weekly_narrative": false
            },
            "communication_channels_included": 1,
            "analytics_level": "basic"
        }'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Pro Plan',
        'pro',
        79.00,
        790.00,
        '{
            "max_team_members": 15,
            "max_clients": 100,
            "max_projects": 250,
            "storage_limit_gb": 50,
            "client_portal_enabled": true,
            "ai_features_enabled": true,
            "ai_capabilities": {
                "reply_suggestions": true,
                "lead_scoring": true,
                "task_extraction": false,
                "weekly_narrative": false
            },
            "communication_channels_included": 3,
            "analytics_level": "advanced"
        }'::jsonb
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Agency Plan',
        'agency',
        199.00,
        1990.00,
        '{
            "max_team_members": 999,
            "max_clients": 9999,
            "max_projects": 9999,
            "storage_limit_gb": 500,
            "client_portal_enabled": true,
            "ai_features_enabled": true,
            "ai_capabilities": {
                "reply_suggestions": true,
                "lead_scoring": true,
                "task_extraction": true,
                "weekly_narrative": true
            },
            "communication_channels_included": 5,
            "analytics_level": "custom"
        }'::jsonb
    )
ON CONFLICT (slug) DO UPDATE 
SET 
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    feature_limits = EXCLUDED.feature_limits;
