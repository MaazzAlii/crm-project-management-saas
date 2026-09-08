# TASK 23 — Project Templates

## Objective
Allow organizations to save a project structure (default tasks) as a reusable template for their common project types.

## Why This Task Exists
Innoventix's own project types (UGC Media, AI Voice Agents, Automation) recur constantly — templates save real time and are a natural SaaS differentiator for other agencies too.

## Dependencies
- TASK 21

## Current State
No template concept exists; every project starts blank.

## Files To Inspect
- app/(dashboard)/projects/new/page.tsx

## Files To Create
- supabase/migrations/0010_project_templates.sql
- app/(dashboard)/settings/templates/page.tsx

## Files To Modify
- app/(dashboard)/projects/new/page.tsx

## Implementation Instructions
- Add `project_templates` and `project_template_tasks` tables, organization-scoped.
- Allow saving an existing project's task list as a new template.
- On new-project creation, optionally select a template to pre-populate default tasks.

## UI Requirements
- Template management page under settings.
- Template picker on new-project form.

## Backend Requirements
- Server actions for template CRUD and template-based project creation.

## Database Requirements
- project_templates: id, organization_id, name, project_type
- project_template_tasks: id, template_id, title, default_due_offset_days

## API Requirements
- N/A

## Security Requirements
- Template CRUD respects organization RLS.

## Testing Requirements
- Test saving a template and creating a new project from it, confirming tasks are correctly pre-populated.

## Acceptance Criteria
- [ ] Templates can be created, edited, and applied, correctly generating pre-set tasks on new projects.

## Git Commit
Recommended commit:

`feat(projects): add reusable project templates`

## Verification
- Create a project from a template and confirm all default tasks appear with correct due-date offsets.

## Next Task
`TASK 24`
