# TASK 43 — AI Feature Architecture & Model Provider Configuration

## Objective
Establish the shared AI-access layer (model provider config, prompt templates, per-org enablement) before building individual AI features.

## Why This Task Exists
Every AI feature (TASKS 44-47) should call one consistent, swappable layer rather than each hardcoding a provider.

## Dependencies
- TASK 14

## Current State
No AI integration exists yet.

## Files To Inspect
- documentation/architecture.md
- lib/billing/plan-limits.ts

## Files To Create
- documentation/adr/003-ai-architecture.md
- lib/ai/client.ts
- lib/ai/prompts/

## Files To Modify


## Implementation Instructions
- Define a provider-agnostic lib/ai/client.ts wrapping whichever LLM API is chosen (documented as a decision, configurable via environment, not hardcoded to one vendor).
- Gate all AI features behind subscription_plans.feature_limits.ai_features_enabled (TASK 14) and a super-admin platform-wide kill switch (TASK 20).
- Store prompt templates centrally in lib/ai/prompts/ so they're auditable and versionable, not scattered inline.
- Log AI usage per organization (call count, approximate token/cost) for future cost-control and plan-based throttling.

## UI Requirements
- N/A — architecture task.

## Backend Requirements
- Server-only AI calls, never exposing the model API key to the client.

## Database Requirements
- Add ai_usage_log table: organization_id, feature, tokens_used (approx), created_at.

## API Requirements
- N/A

## Security Requirements
- Never send more client data to the AI provider than the specific feature requires (e.g. lead scoring shouldn't leak full message bodies from unrelated clients).

## Testing Requirements
- Test the provider wrapper against a simple prompt and confirm the plan/kill-switch gates correctly block disabled orgs.

## Acceptance Criteria
- [ ] AI client layer works, is gated by plan and platform kill switch, and logs usage per org.

## Git Commit
Recommended commit:

`feat(ai): establish shared AI provider architecture and usage logging`

## Verification
- Disable AI for a test org via both the plan flag and the kill switch and confirm both correctly block calls.

## Next Task
`TASK 44`
