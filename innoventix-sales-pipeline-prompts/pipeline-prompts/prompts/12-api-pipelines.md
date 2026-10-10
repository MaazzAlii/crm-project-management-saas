# 12 - API routes: pipelines and stages

Create route handlers under the existing API structure (follow the current `app/api` pattern).

Routes:
- GET /api/pipelines: list pipelines for the session org
- POST /api/pipelines: create
- GET /api/pipelines/[pipelineId]
- PATCH /api/pipelines/[pipelineId]
- DELETE /api/pipelines/[pipelineId]
- POST /api/pipelines/[pipelineId]/stages: create stage
- PATCH /api/pipelines/[pipelineId]/stages/[stageId]
- DELETE /api/pipelines/[pipelineId]/stages/[stageId]?moveTo=<stageId>
- PUT /api/pipelines/[pipelineId]/stages/order: body { orderedIds: string[] }

Rules:
- Require a valid session. Return 401 when missing, 403 when the role is not allowed, 404 for another org's resource (do not reveal that it exists).
- Validate bodies with a schema. Return 400 with field errors.
- Responses use one consistent JSON shape: { data } or { error: { code, message } }.
- Never trust orgId from the request body.

Add route tests for 401, 403, 404, and a cross-org attempt.
