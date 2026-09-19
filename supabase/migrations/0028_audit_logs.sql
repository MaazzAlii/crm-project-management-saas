-- TASK 63 Migration 28: Comprehensive Audit Logging Table & Immutability RLS

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    actor_email VARCHAR(255),
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    target_type VARCHAR(100),
    target_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast search, filter by org, actor, action, and time range
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy for Super Admins (Platform-wide visibility)
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_super_admin());

-- 2. SELECT Policy for Org Owners and Admins (Scoped strictly to their organization)
DROP POLICY IF EXISTS "Org Owners and Admins can view org audit logs" ON public.audit_logs;
CREATE POLICY "Org Owners and Admins can view org audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        organization_id IS NOT NULL 
        AND public.is_org_member(organization_id) 
        AND public.get_user_org_role(organization_id) IN ('owner', 'admin')
    );

-- 3. INSERT Policy (Authenticated users and system workers can append logs)
DROP POLICY IF EXISTS "Authenticated users and system can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users and system can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' 
        OR public.is_super_admin()
    );

-- 4. UPDATE Policy: IMMUTABILITY GUARANTEE
-- Reject all UPDATE attempts from any standard role (append-only)
DROP POLICY IF EXISTS "Audit logs cannot be updated" ON public.audit_logs;
CREATE POLICY "Audit logs cannot be updated"
    ON public.audit_logs FOR UPDATE
    USING (FALSE);

-- 5. DELETE Policy: IMMUTABILITY GUARANTEE
-- Reject all DELETE attempts from any standard role (append-only)
DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON public.audit_logs;
CREATE POLICY "Audit logs cannot be deleted"
    ON public.audit_logs FOR DELETE
    USING (FALSE);
