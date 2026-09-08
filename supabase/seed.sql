-- TASK 03 Seed: Initial Tenant Provisioning for Verification & Testing

-- Insert First Tenant: Innoventix Hub
INSERT INTO public.organizations (id, name, slug, plan_tier, billing_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Innoventix Hub',
    'innoventix-hub',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;
