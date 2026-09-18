-- TASK 54 Migration 26: Client Portal Authentication & RLS
-- Implements a second, fully isolated auth boundary for external client access.
-- client_users are NOT organization_members — they get read-only scoped access
-- to only their own client record, projects, tasks, deliverables and invoices.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. client_users — links a Supabase Auth identity to a clients row
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- tracks the last magic-link invitation
    invited_at        TIMESTAMPTZ DEFAULT NOW(),
    last_login_at     TIMESTAMPTZ,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- A single auth user may only be a portal user for one client per org
    UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id      ON public.client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_user_id        ON public.client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_organization_id ON public.client_users(organization_id);

CREATE TRIGGER update_client_users_updated_at
    BEFORE UPDATE ON public.client_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. portal_magic_links — audit trail for sent magic-link invitations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portal_magic_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    token_hash      TEXT,            -- SHA-256 of the OTP token (nullable; Supabase manages the real token)
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    used_at         TIMESTAMPTZ,
    created_by      UUID REFERENCES auth.users(id)   -- org member who sent the invite
);

CREATE INDEX IF NOT EXISTS idx_portal_magic_links_client_id ON public.portal_magic_links(client_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Helper functions for portal RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns the client_id for the currently-authenticated portal user,
-- NULL when called from a non-portal (org-member) session.
CREATE OR REPLACE FUNCTION public.get_portal_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT client_id
        FROM public.client_users
        WHERE user_id = auth.uid()
          AND is_active = TRUE
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Returns TRUE when the calling identity is an active portal user.
CREATE OR REPLACE FUNCTION public.is_portal_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_portal_client_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Returns TRUE when the portal user's owning org has client_portal_enabled.
-- Blocks portal access at plan-gate level without exposing plan internals.
CREATE OR REPLACE FUNCTION public.portal_plan_enabled()
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
    v_enabled BOOLEAN := FALSE;
BEGIN
    SELECT organization_id INTO v_org_id
    FROM public.client_users
    WHERE user_id = auth.uid()
      AND is_active = TRUE
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT (sp.feature_limits->>'client_portal_enabled')::BOOLEAN INTO v_enabled
    FROM public.organization_subscriptions os
    JOIN public.subscription_plans sp ON sp.id = os.plan_id
    WHERE os.organization_id = v_org_id
      AND os.status IN ('active', 'trialing')
    LIMIT 1;

    RETURN COALESCE(v_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS: client_users table itself
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- Portal user can view their own record
CREATE POLICY "Portal user can view own client_user record"
    ON public.client_users FOR SELECT
    USING (user_id = auth.uid());

-- Org members can view / manage portal users for their org
CREATE POLICY "Org members can view client_users for their org"
    ON public.client_users FOR SELECT
    USING (public.is_org_member(organization_id) OR public.is_super_admin());

CREATE POLICY "Org admins can manage client_users"
    ON public.client_users FOR ALL
    USING (
        (public.is_org_member(organization_id) AND public.get_user_org_role(organization_id) IN ('owner', 'admin'))
        OR public.is_super_admin()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS: portal_magic_links table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.portal_magic_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage magic links for their clients"
    ON public.portal_magic_links FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = portal_magic_links.client_id
              AND (public.is_org_member(c.organization_id) OR public.is_super_admin())
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Portal READ policies on existing tables
--    Each policy: allow portal user to read rows scoped to their client_id
--    AND the portal plan must be enabled for their org.
-- ─────────────────────────────────────────────────────────────────────────────

-- clients — portal user can read their own client profile
CREATE POLICY "Portal user can view own client record"
    ON public.clients FOR SELECT
    USING (
        id = public.get_portal_client_id()
        AND public.portal_plan_enabled()
    );

-- projects — portal user can read projects where they are the client
CREATE POLICY "Portal user can view own projects"
    ON public.projects FOR SELECT
    USING (
        client_id = public.get_portal_client_id()
        AND public.portal_plan_enabled()
    );

-- tasks — portal user can read tasks on their projects
CREATE POLICY "Portal user can view tasks on own projects"
    ON public.tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = tasks.project_id
              AND p.client_id = public.get_portal_client_id()
        )
        AND public.portal_plan_enabled()
    );

-- deliverables — portal user can view deliverables on their projects
CREATE POLICY "Portal user can view deliverables on own projects"
    ON public.deliverables FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = deliverables.project_id
              AND p.client_id = public.get_portal_client_id()
        )
        AND public.portal_plan_enabled()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Patch subscription_plans to include client_portal_enabled flag
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.subscription_plans
SET feature_limits = feature_limits || '{"client_portal_enabled": false}'::jsonb
WHERE feature_limits->>'client_portal_enabled' IS NULL;

-- Enable portal on Professional and Enterprise plans (adjust slug names as needed)
UPDATE public.subscription_plans
SET feature_limits = feature_limits || '{"client_portal_enabled": true}'::jsonb
WHERE slug IN ('professional', 'enterprise', 'pro', 'business');

COMMENT ON TABLE public.client_users IS
  'Links external client contacts (auth.users) to their clients row. '
  'This is a separate, isolated auth boundary from organization_members.';

COMMENT ON TABLE public.portal_magic_links IS
  'Audit log of magic-link invitations sent to client portal users.';

COMMENT ON FUNCTION public.get_portal_client_id() IS
  'Returns the client_id for the current authenticated portal user, NULL for org-member sessions.';

COMMENT ON FUNCTION public.is_portal_user() IS
  'Returns TRUE when the current auth session belongs to a portal user.';

COMMENT ON FUNCTION public.portal_plan_enabled() IS
  'Returns TRUE when the portal user''s org has client_portal_enabled in their plan.';
