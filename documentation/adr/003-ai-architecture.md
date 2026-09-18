# ADR 003: AI Feature Architecture, Model Provider Abstraction & Multi-Tenant Usage Governance

## Status
Accepted

## Context
The platform requires AI-driven intelligence features across CRM, Project Management, and the Unified Communication Hub (inbox reply suggestions, lead qualification/scoring, auto-task extraction from messages, and weekly executive narrative reports).

Rather than coupling individual features to a specific commercial vendor (e.g. OpenAI) or hardcoding API endpoints, we require a shared, provider-agnostic access layer with strict multi-tenant governance, cost controls, emergency kill-switches, and zero exposure of secrets to the client.

---

## Options Considered

### 1. Direct Vendor SDK Integration per Feature
- **Pros**: Quickest to prototype single features.
- **Cons**: Vendor lock-in, fragmented prompt management, no unified cost or token accounting, impossible to swap models or run locally in test/dev environments without real API credits.

### 2. Client-Side AI Calls via Browser SDK
- **Pros**: Offloads server compute.
- **Cons**: Severe security hazard — leaks proprietary prompts, system context, and vendor API keys to the browser; bypasses tenant billing and rate limits.

### 3. Unified Server-Side Provider-Agnostic Layer with Dual Gating & Usage Accounting (SELECTED)
- **Pros**:
  - Clean abstraction supporting multiple LLM backends (OpenAI-compatible, Anthropic Claude, Google Gemini, and local mock fallback).
  - Server-only execution ensures API keys and proprietary system prompts never leak to the client.
  - Centralized, versioned prompt templates in `lib/ai/prompts/` for auditable behavior and prevention of prompt injection.
  - Dual-tier gating: Super Admin platform kill switch + organization subscription plan limits.
  - Multi-tenant usage accounting via `ai_usage_log` table tracking token consumption, latency, and estimated costs per tenant.
  - Strict data minimization: features only pass scoped, scrubbed context necessary for the task.

---

## Decision

We adopt a **Unified Server-Side Provider Abstraction Layer** located at `lib/ai/` governed by the following architectural pillars:

### 1. Provider Abstraction & Model Configuration
- The AI client layer (`lib/ai/client.ts`) exposes a standardized `generateAICompletion(request: AICompletionRequest)` interface.
- Provider selection is driven by environment variables:
  - `AI_PROVIDER`: `mock` (default for dev/testing), `openai`, `anthropic`, or `gemini`.
  - `AI_MODEL`: Specific model identifier (e.g., `gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-1.5-flash`).
  - `AI_API_KEY`: Model provider secret (server-side only).
  - `AI_BASE_URL`: Optional custom endpoint for OpenAI-compatible proxies (Groq, Ollama, DeepSeek).
- The built-in **Mock Provider** allows 100% of workflows, unit tests, and development to run reliably without live network dependencies or API keys.

### 2. Dual-Tier Access Gating
Every AI operation must pass through dual gating before invoking the LLM:
1. **Platform-Wide Super Admin Kill Switch**: Evaluates `platform_settings.global_feature_flags.ai_kill_switch` and feature-specific toggles (`ai_reply_suggestions`, `ai_lead_scoring`, `ai_task_extraction`, `ai_weekly_narrative`). If active, the request is immediately rejected.
2. **Tenant Subscription Plan Limits**: Evaluates `subscription_plans.feature_limits.ai_features_enabled` and `ai_capabilities` for the calling organization. Free/Starter tiers without AI entitlement are blocked server-side.

### 3. Centralized Prompt Repository
- All system and user prompts are maintained in `lib/ai/prompts/`:
  - `reply-suggestions.ts`: Contextual inbox response drafting.
  - `lead-scoring.ts`: CRM lead qualification, sentiment, and conversion probability.
  - `task-extraction.ts`: Extracting actionable deliverables and tasks from conversation threads.
  - `weekly-narrative.ts`: Synthesizing project milestones into client-ready weekly reports.
- Prompt injection mitigation: user input is sanitized and framed within typed data structures rather than raw text concatenation.

### 4. Usage Accounting & Cost Governance
- Every execution logs an audit record into `public.ai_usage_log`:
  - `organization_id`, `feature`, `provider`, `model`
  - `prompt_tokens`, `completion_tokens`, `tokens_used`, `estimated_cost`
  - `status` (`success`, `error`, `blocked`)
  - `metadata` (latency, response metadata)
- Provides visibility into per-tenant AI consumption for future plan-based throttling and billing overages.

### 5. Data Minimization & Privacy
- Prompts MUST NOT receive entire databases or unrelated tenant data.
- Feature invocations only receive scrubbed, contextual data fields strictly relevant to the current conversation, client, or project.

---

## Consequences
- Individual AI features (Tasks 44–47) import exclusively from `lib/ai/client.ts` and `lib/ai/prompts/`.
- Development and CI can run seamlessly using the deterministic mock provider.
- Switching LLM providers or upgrading models requires only changing environment variables without modifying application code.
