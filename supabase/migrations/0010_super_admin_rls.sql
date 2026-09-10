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
