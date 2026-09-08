-- TASK 04 Migration 2: Projects, Tasks, and Deliverables Tables with Cross-Tenant Isolation Triggers

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100),
    brief_source VARCHAR(100),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'brief_received' CHECK (
        status IN ('brief_received', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'on_hold')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    start_date DATE,
    deadline DATE,
    delivered_at TIMESTAMPTZ,
    invoice_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (
        status IN ('todo', 'in_progress', 'review', 'completed', 'blocked')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Deliverables Table
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT,
    drive_link TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'submitted', 'approved', 'revision_requested')
    ),
    client_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Cross-Tenant Isolation Validation Triggers

-- Validate that project client belongs to the same organization
CREATE OR REPLACE FUNCTION validate_project_client_organization()
RETURNS TRIGGER AS $$
DECLARE
    client_org_id UUID;
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        SELECT organization_id INTO client_org_id FROM public.clients WHERE id = NEW.client_id;
        IF client_org_id IS NULL OR client_org_id <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-organization client assignment prohibited: Client % does not belong to Organization %', NEW.client_id, NEW.organization_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_project_client_org
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_client_organization();

-- Validate that task project belongs to the same organization
CREATE OR REPLACE FUNCTION validate_task_project_organization()
RETURNS TRIGGER AS $$
DECLARE
    project_org_id UUID;
BEGIN
    SELECT organization_id INTO project_org_id FROM public.projects WHERE id = NEW.project_id;
    IF project_org_id IS NULL OR project_org_id <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-organization task assignment prohibited: Project % does not belong to Organization %', NEW.project_id, NEW.organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_task_project_org
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_project_organization();

-- Validate that deliverable project belongs to the same organization
CREATE OR REPLACE FUNCTION validate_deliverable_project_organization()
RETURNS TRIGGER AS $$
DECLARE
    project_org_id UUID;
BEGIN
    SELECT organization_id INTO project_org_id FROM public.projects WHERE id = NEW.project_id;
    IF project_org_id IS NULL OR project_org_id <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-organization deliverable assignment prohibited: Project % does not belong to Organization %', NEW.project_id, NEW.organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_deliverable_project_org
    BEFORE INSERT OR UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE FUNCTION validate_deliverable_project_organization();

-- 5. Indexes for Query Performance & RLS Enforcement
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_deliverables_organization_id ON public.deliverables(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.deliverables(status);

-- 6. Enable Row-Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
