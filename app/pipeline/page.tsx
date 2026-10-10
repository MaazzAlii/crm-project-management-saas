import { redirect } from 'next/navigation';
import { getCurrentSessionContext } from '@/lib/auth/session';
import { pipelineRepo } from '@/lib/db/repositories/pipeline-repo';
import { PipelinePageClient } from '@/components/pipeline/PipelinePageClient';
import { DashboardShell } from '@/components/shell/DashboardShell';

export const metadata = {
  title: 'Sales Pipeline & Deal Flow | Innoventix CRM',
  description: 'Interactive Trello-style sales pipeline with draggable deal stages, forecast tracking, and multi-tenant workflows.',
};

export default async function PipelinePage() {
  const session = await getCurrentSessionContext();
  if (!session) {
    redirect('/login?redirectTo=/pipeline');
  }

  const orgId = session.orgId;
  if (!orgId) {
    redirect('/dashboard');
  }

  // Ensure default 6-stage sales pipeline exists for this organization
  const defaultPipeline = await pipelineRepo.ensureDefaultPipeline(orgId, session.userId);
  const pipelines = await pipelineRepo.listPipelines(orgId);

  return (
    <DashboardShell sessionContext={session}>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden">
        <PipelinePageClient
          initialPipelines={pipelines}
          defaultPipelineId={defaultPipeline.id}
          currentUserId={session.userId}
        />
      </div>
    </DashboardShell>
  );
}
