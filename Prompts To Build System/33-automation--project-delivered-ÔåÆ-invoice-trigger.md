# TASK 33 — Automation — Project Delivered → Invoice Trigger

## Objective
Implement the exact N8N Flow 1 from the original assignment: Delivered status change fires the invoice generation trigger.

## Why This Task Exists
This is the most business-critical automation in the original spec, connecting Project Management to Rehmat's Invoice Generator.

## Dependencies
- TASK 32
- TASK 20

## Current State
Status-change action exists (Task 19/20); no automation firing on it yet.

## Files To Inspect
- Original assignment: N8N Flow 1
- lib/inbox/... (not used here)
- app/api/automation/events/route.ts

## Files To Create
- n8n/workflows/project-delivered-invoice.json (exported flow, documentation only, not executed by the app itself)

## Files To Modify
- Server action `updateProjectStatus` (Task 19)

## Implementation Instructions
- On transition to 'delivered' status, check organization payment_schedule config (per_project vs monthly/weekly) exactly as the original spec's decision branch describes.
- If per-project billing applies, emit an `invoice.trigger` event via the Task 32 sender containing client_id, project_id, amount, currency.
- On successful downstream invoice creation (confirmed via a callback webhook from n8n/Invoice Generator), update project status to 'invoiced' and invoice_triggered = true.
- Trigger the Slack notification to the org owner as specified in the original flow.

## UI Requirements
- Confirmation modal on Delivered transition, as noted in Task 20, showing what will be triggered.

## Backend Requirements
- Callback webhook route accepting the invoice-created confirmation from n8n.

## Database Requirements
- No schema change — uses invoice_triggered/status fields from Task 04.

## API Requirements
- POST /api/automation/callback/invoice-created — updates project status to invoiced.

## Security Requirements
- Verify callback authenticity (shared secret) before trusting an 'invoice created' confirmation.

## Testing Requirements
- Test the full loop against a mock n8n workflow: delivered → event emitted → mock callback → status becomes invoiced.

## Acceptance Criteria
- [ ] Delivering a per-project-billed project reliably emits the trigger and correctly updates to Invoiced on confirmed callback.

## Git Commit
Recommended commit:

`feat(automation): implement delivered-to-invoice trigger flow`

## Verification
- Walk a test project through Delivered with a mocked n8n callback and confirm status/flags update exactly as specified.

## Next Task
`TASK 34`
