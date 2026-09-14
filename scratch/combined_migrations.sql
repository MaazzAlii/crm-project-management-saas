-- TASK 03 Migration 1: Organizations Table & Updated-At Trigger Helper

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations table (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
    billing_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (billing_status IN ('active', 'past_due', 'canceled', 'trialing')),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Temporary RLS safety (Task 07 will implement full tenant policies)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- TASK 03 Migration 2: Profiles, User Roles & Organization Memberships

-- Profiles Table linked to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Role Enum Type
CREATE TYPE public.org_member_role AS ENUM (
    'owner',
    'admin',
    'member',
    'billing_manager'
);

-- Organization Members Table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.org_member_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

CREATE TRIGGER update_org_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Service role access enabled, user RLS policies applied in Task 07)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
-- TASK 08 Migration 3: Isolated Super Admins Table
-- Platform operator access tier completely separate from organization_members

CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON public.super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (Service-role only by default; access policies in Task 12)
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
-- TASK 09 Migration 4: Clients Table with Communication Mode Field

-- Communication Mode Enum (manual log vs auto-synced connected hub)
CREATE TYPE public.client_communication_mode AS ENUM (
    'manual',
    'connected'
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    platform VARCHAR(50) DEFAULT 'WhatsApp', -- WhatsApp/Slack/Upwork/Discord/Email/Other
    country VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_schedule VARCHAR(50) DEFAULT 'Per Project', -- Monthly/Weekly/Per Project
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    communication_mode public.client_communication_mode NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tenant isolation & lookup performance
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_communication_mode ON public.clients(communication_mode);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Service role access enabled, user RLS policies applied in Task 12)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- TASK 09 Migration 5: Projects, Tasks, and Deliverables Tables

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100), -- UGC Media/AI Voice Agent/Automation/Combined
    brief_source VARCHAR(50), -- WhatsApp/Slack/Upwork/Discord/Email
    amount DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'brief_received' CHECK (status IN ('brief_received', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'on_hold')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    deadline DATE,
    delivered_at TIMESTAMPTZ,
    invoice_triggered BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Deliverables Table
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT,
    drive_link TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_required')),
    client_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_organization_id ON public.deliverables(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
-- TASK 10 Migration 6: Communication Hub Channels & Messages Tables

-- Communication Provider Enum
CREATE TYPE public.communication_provider AS ENUM (
    'slack',
    'whatsapp',
    'email',
    'discord',
    'upwork'
);

-- Message Direction Enum
CREATE TYPE public.message_direction AS ENUM (
    'inbound',
    'outbound'
);

-- Communication Channels Table
CREATE TABLE IF NOT EXISTS public.communication_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider public.communication_provider NOT NULL,
    external_account_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, provider, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.communication_channels(organization_id);

CREATE TRIGGER update_communication_channels_updated_at
    BEFORE UPDATE ON public.communication_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages Table (Unified Inbox Data Layer)
CREATE TABLE IF NOT EXISTS public.communication_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Nullable for unmatched inbox messages
    direction public.message_direction NOT NULL,
    sender_name VARCHAR(255),
    sender_identifier VARCHAR(255), -- email / phone / slack user id
    body TEXT NOT NULL,
    external_message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.communication_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.communication_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.communication_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.communication_messages(sent_at DESC);

CREATE TRIGGER update_communication_messages_updated_at
    BEFORE UPDATE ON public.communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
-- TASK 10 Migration 7: Subscription Plans & Organization Subscriptions Tables

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    feature_limits JSONB NOT NULL DEFAULT '{
        "max_team_members": 5,
        "max_clients": 20,
        "max_projects": 50,
        "ai_features_enabled": false,
        "storage_limit_gb": 10
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Organization Subscriptions Table
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_organization_id ON public.organization_subscriptions(organization_id);

CREATE TRIGGER update_organization_subscriptions_updated_at
    BEFORE UPDATE ON public.organization_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
-- TASK 12 Migration 8: Row Level Security (RLS) Policies & Helper Functions

-- 1. Helper Functions for Authorization & Tenant Isolation
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = target_org_id 
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.super_admins 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_org_role(target_org_id UUID)
RETURNS public.org_member_role AS $$
DECLARE
    user_role public.org_member_role;
BEGIN
    SELECT role INTO user_role
    FROM public.organization_members
    WHERE organization_id = target_org_id 
      AND user_id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. RLS Policies: Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own organization"
    ON public.organizations FOR SELECT
    USING (public.is_org_member(id) OR public.is_super_admin());

CREATE POLICY "Org Owners and Admins can update their organization"
    ON public.organizations FOR UPDATE
    USING ((public.is_org_member(id) AND public.get_user_org_role(id) IN ('owner', 'admin')) OR public.is_super_admin());

-- 3. RLS Policies: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile on signup"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- 4. RLS Policies: Organization Members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view fellow members of their organization"
    ON public.organization_members FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org Owners and Admins can manage members"
    ON public.organization_members FOR ALL
    USING ((public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin')) OR public.is_super_admin());

-- 5. RLS Policies: Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view clients"
    ON public.clients FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can insert clients"
    ON public.clients FOR INSERT
    WITH CHECK (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can update clients"
    ON public.clients FOR UPDATE
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org Owners and Admins can delete clients"
    ON public.clients FOR DELETE
    USING ((public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin')) OR public.is_super_admin());

-- 6. RLS Policies: Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view projects"
    ON public.projects FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can manage projects"
    ON public.projects FOR ALL
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 7. RLS Policies: Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tasks"
    ON public.tasks FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can manage tasks"
    ON public.tasks FOR ALL
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 8. RLS Policies: Deliverables
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view deliverables"
    ON public.deliverables FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can manage deliverables"
    ON public.deliverables FOR ALL
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 9. RLS Policies: Communication Channels & Messages
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view communication channels"
    ON public.communication_channels FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can view communication messages"
    ON public.communication_messages FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org members can insert communication messages"
    ON public.communication_messages FOR INSERT
    WITH CHECK (public.is_org_member(organization_id) OR public.is_super_admin());

-- 10. RLS Policies: Organization Subscriptions
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view subscription status"
    ON public.organization_subscriptions FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

-- 11. RLS Policies: Super Admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view super admins list"
    ON public.super_admins FOR SELECT
    USING (public.is_super_admin());
-- TASK 13 Migration 9: Add Onboarding Completion and Industry Type to Organizations

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS industry_type VARCHAR(100) DEFAULT 'General Agency';
-- TASK 16 Migration 10: Super Admin Access Control & Refined RLS Policies
-- Super Admins are granted SELECT access across all tenant tables for platform metrics & management.
-- Direct write access (INSERT, UPDATE, DELETE) on tenant data is strictly restricted to organization members.
-- Super Admin tenant data modification occurs only via support impersonation workflows (TASK 19).

-- 1. Explicit SELECT policy for super_admins table
DROP POLICY IF EXISTS "Super admins can view super admins list" ON public.super_admins;
CREATE POLICY "Super admins can view super admins list"
    ON public.super_admins FOR SELECT
    USING (user_id = auth.uid() OR public.is_super_admin());

-- 2. Restrict direct write policies on tenant data to organization members only
-- Clients
DROP POLICY IF EXISTS "Org members can insert clients" ON public.clients;
CREATE POLICY "Org members can insert clients"
    ON public.clients FOR INSERT
    WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Org members can update clients" ON public.clients;
CREATE POLICY "Org members can update clients"
    ON public.clients FOR UPDATE
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Org Owners and Admins can delete clients" ON public.clients;
CREATE POLICY "Org Owners and Admins can delete clients"
    ON public.clients FOR DELETE
    USING (public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin'));

-- Projects
DROP POLICY IF EXISTS "Org members can manage projects" ON public.projects;
CREATE POLICY "Org members can manage projects"
    ON public.projects FOR ALL
    USING (public.is_org_member(organization_id));

-- Tasks
DROP POLICY IF EXISTS "Org members can manage tasks" ON public.tasks;
CREATE POLICY "Org members can manage tasks"
    ON public.tasks FOR ALL
    USING (public.is_org_member(organization_id));

-- Deliverables
DROP POLICY IF EXISTS "Org members can manage deliverables" ON public.deliverables;
CREATE POLICY "Org members can manage deliverables"
    ON public.deliverables FOR ALL
    USING (public.is_org_member(organization_id));

-- Communication Messages
DROP POLICY IF EXISTS "Org members can insert communication messages" ON public.communication_messages;
CREATE POLICY "Org members can insert communication messages"
    ON public.communication_messages FOR INSERT
    WITH CHECK (public.is_org_member(organization_id));
-- TASK 18 Migration 11: Add Organization Suspension Fields
-- Allows Super Admins to suspend and resume tenant access with audit trail fields

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_is_suspended ON public.organizations(is_suspended);
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
