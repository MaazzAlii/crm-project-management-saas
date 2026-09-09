-- Seed Data for Task 08: Core Organizations, Users, Roles & Super Admins

-- 1. Insert Innoventix Hub as Organization #1
INSERT INTO public.organizations (id, name, slug, plan_tier, billing_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Innoventix Hub',
    'innoventix-hub',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. Note: Profiles & Organization Members are created when auth users register.
-- 3. Bootstrap Super Admin seed query example:
-- INSERT INTO public.super_admins (user_id) VALUES ('<USER_UUID>') ON CONFLICT (user_id) DO NOTHING;
