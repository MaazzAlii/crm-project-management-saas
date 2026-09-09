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
