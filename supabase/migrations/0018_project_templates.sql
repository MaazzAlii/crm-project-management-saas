-- TASK 33 Migration 18: Project Templates & Template Tasks Tables

CREATE TABLE IF NOT EXISTS public.project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100), -- UGC Media/AI Voice Agent/Automation/Combined
    default_amount DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    default_deliverables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    day_offset INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_templates_org ON public.project_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_template_tasks_template ON public.project_template_tasks(template_id);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_template_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view project templates" ON public.project_templates;
CREATE POLICY "Org members can view project templates"
    ON public.project_templates FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Org members can manage project templates" ON public.project_templates;
CREATE POLICY "Org members can manage project templates"
    ON public.project_templates FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Org members can view template tasks" ON public.project_template_tasks;
CREATE POLICY "Org members can view template tasks"
    ON public.project_template_tasks FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Org members can manage template tasks" ON public.project_template_tasks;
CREATE POLICY "Org members can manage template tasks"
    ON public.project_template_tasks FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));
