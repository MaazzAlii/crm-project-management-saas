# TASK 50 — Automation — Project Delivered → Invoice Trigger

## Objective
Implement N8N Flow 1: Delivered status change fires the invoice generation trigger.

## Why This Task Exists
Most business-critical automation, connecting Project Management to the Invoice Generator.

## Dependencies
- TASK 49
- TASK 30

## Current State
Status-change action exists; no automation firing on it yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (N8N Flow 1)
- app/api/automation/events/route.ts

## Files To Create
- n8n/workflows/project-delivered-invoice.json (exported flow, documentation)

## Files To Modify
- Server action updateProjectStatus

## Implementation Instructions
- On transition to 'delivered', check payment_schedule (per_project vs recurring) per the original spec's decision branch.
- If per-project, emit invoice.trigger with client_id/project_id/amount/currency.
- On confirmed callback, update status to 'invoiced' and invoice_triggered=true.
- Trigger the Slack notification to the org owner as specified.

## UI Requirements
- Confirmation modal on Delivered transition (from TASK 30) showing what will be triggered.

## Backend Requirements
- Callback webhook route accepting invoice-created confirmation.

## Database Requirements
- No schema change.

## API Requirements
- POST /api/automation/callback/invoice-created.

## Security Requirements
- Verify callback authenticity via shared secret before trusting it.

## Testing Requirements
- Test the full loop against a mock n8n workflow.

## Acceptance Criteria
- [ ] Delivering a per-project-billed project reliably emits the trigger and updates to Invoiced on confirmed callback.

## Git Commit
Recommended commit:

`feat(automation): implement delivered-to-invoice trigger flow`

## Verification
- Walk a test project through Delivered with a mocked callback and confirm status/flags update exactly.

## Next Task
`TASK 51`
