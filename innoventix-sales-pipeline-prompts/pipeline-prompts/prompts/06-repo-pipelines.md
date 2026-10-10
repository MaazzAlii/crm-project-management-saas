# 06 - Repository layer: pipelines and stages

Create repository functions for pipelines and stages, following the existing repository pattern.

Pipelines:
- listPipelines(orgId)
- getPipeline(orgId, pipelineId)
- createPipeline(orgId, input)
- updatePipeline(orgId, pipelineId, input)
- deletePipeline(orgId, pipelineId) (refuse if it's the only pipeline)

Stages:
- listStages(orgId, pipelineId), ordered by position
- createStage(orgId, pipelineId, input), appended at the end with position = max + 1000
- updateStage(orgId, stageId, input)
- deleteStage(orgId, stageId, moveDealsToStageId) (deals must move to another stage first; never delete cards silently)
- reorderStages is handled in prompt 13 through the service layer

Rules:
- Every query includes org_id in the WHERE clause.
- Return typed objects, never raw rows.
- Write unit tests for the org scoping (one org cannot read or change another org's stages).
