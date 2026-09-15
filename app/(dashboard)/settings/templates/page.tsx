import { fetchProjectTemplatesAction } from './actions'
import { TemplateList } from '@/components/templates/TemplateList'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Project Templates | Settings | INNOVENTIX Hub',
    description: 'Manage reusable project templates with default task scaffolding and deliverables.'
  }
}

export default async function SettingsTemplatesPage() {
  const templates = await fetchProjectTemplatesAction()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TemplateList initialTemplates={templates} />
    </div>
  )
}
