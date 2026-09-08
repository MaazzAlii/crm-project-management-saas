-- TASK 04 Seed: Multi-Tenant Test Data & Isolation Verification

-- 1. Insert Test Organizations
INSERT INTO public.organizations (id, name, slug, plan_tier, billing_status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Innoventix Hub', 'innoventix-hub', 'enterprise', 'active'),
    ('00000000-0000-0000-0000-000000000002', 'Apex Digital Agency', 'apex-digital', 'pro', 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, plan_tier = EXCLUDED.plan_tier;

-- 2. Insert Test Users / Profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'owner@innoventix.com', 'Innoventix Owner', 'https://avatar.vercel.sh/innoventix'),
    ('22222222-2222-2222-2222-222222222222', 'owner@apexdigital.com', 'Apex Owner', 'https://avatar.vercel.sh/apex')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Organization Memberships
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
    ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Insert Clients for Organization 1 (Innoventix Hub)
INSERT INTO public.clients (id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Acme Corp Client', 'Acme Corporation', 'contact@acme.com', '+1-555-0199', 'Upwork', 'USA', 'USD', 'Milestone', 'active', 'Primary enterprise account'),
    ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TechStart Inc', 'TechStart', 'info@techstart.io', '+1-555-0244', 'Direct', 'Canada', 'USD', 'Monthly Retainer', 'active', 'SaaS client retainer')
ON CONFLICT (id) DO NOTHING;

-- Insert Clients for Organization 2 (Apex Digital Agency)
INSERT INTO public.clients (id, organization_id, name, company, email, phone, platform, country, currency, payment_schedule, status, notes)
VALUES 
    ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Apex Local Client', 'Local Retail Co', 'hello@localretail.com', '+44-20-7946-0912', 'Website', 'UK', 'GBP', 'Fixed', 'active', 'Apex local client')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Projects for Organization 1 (Innoventix Hub)
INSERT INTO public.projects (id, organization_id, client_id, title, description, type, brief_source, amount, currency, status, priority, start_date, deadline, assigned_to)
VALUES 
    ('p0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'E-Commerce Platform Redesign', 'Complete redesign of store UI and backend', 'Web Development', 'Upwork', 15000.00, 'USD', 'in_progress', 'high', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert Projects for Organization 2 (Apex Digital Agency)
INSERT INTO public.projects (id, organization_id, client_id, title, description, type, brief_source, amount, currency, status, priority, start_date, deadline, assigned_to)
VALUES 
    ('p0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Local SEO & Brand Identity', 'SEO optimization and branding assets', 'Marketing', 'Website', 3500.00, 'GBP', 'brief_received', 'medium', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Tasks
INSERT INTO public.tasks (id, organization_id, project_id, title, description, assigned_to, status, priority, due_date)
VALUES 
    ('t0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Design Figma Wireframes', 'High fidelity wireframes for checkout flow', '11111111-1111-1111-1111-111111111111', 'in_progress', 'high', CURRENT_DATE + INTERVAL '7 days'),
    ('t0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Keyword Audit Report', 'Comprehensive competitor keyword audit', '22222222-2222-2222-2222-222222222222', 'todo', 'medium', CURRENT_DATE + INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Deliverables
INSERT INTO public.deliverables (id, organization_id, project_id, title, file_url, drive_link, status)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Checkout Flow UI Prototype', 'https://figma.com/file/sample', 'https://drive.google.com/sample', 'pending'),
    ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Initial Keyword Matrix PDF', 'https://assets.apex.com/matrix.pdf', 'https://drive.google.com/apex', 'pending')
ON CONFLICT (id) DO NOTHING;
