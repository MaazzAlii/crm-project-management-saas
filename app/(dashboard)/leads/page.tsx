import { redirect } from 'next/navigation';
import { getCurrentSessionContext } from '@/lib/auth/session';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { PipelinePageClient } from '@/components/pipeline/PipelinePageClient';

export const metadata = {
  title: 'Sales Pipeline & Deal Flow | Innoventix CRM',
  description: 'Interactive Trello-style sales pipeline with draggable deal stages, forecast tracking, and multi-tenant workflows.',
};

export default async function LeadsPage() {
  const session = await getCurrentSessionContext();
  if (!session || !session.user) {
    redirect('/login?redirectTo=/leads');
  }

  const orgId = session.orgId || session.organization?.id;
  if (!orgId) {
    redirect('/onboarding');
  }

  // Ensure default 6-stage sales pipeline exists for this organization (lazy fallback)
  const defaultPipeline = await pipelineRepo.ensureDefaultPipeline(orgId, session.userId);
  const pipelines = await pipelineRepo.listPipelines(orgId);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] w-full overflow-hidden">
      <PipelinePageClient
        initialPipelines={pipelines}
        defaultPipelineId={defaultPipeline.id}
        currentUserId={session.userId}
      />
    </div>
  );
}
