-- TASK 31 Migration 17: Project Activity Log Table

CREATE TABLE IF NOT EXISTS public.project_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_log_organization_id ON public.project_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_id ON public.project_activity_log(project_id);

ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view project activity log" ON public.project_activity_log;
CREATE POLICY "Org members can view project activity log"
    ON public.project_activity_log FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Org members can insert project activity log" ON public.project_activity_log;
CREATE POLICY "Org members can insert project activity log"
    ON public.project_activity_log FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));
