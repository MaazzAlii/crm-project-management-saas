# Innoventix — Triage Table

Items 6, 18, 32, 46 are category headers and were not treated as issues.
Items 1–5 were not included in the paste and have no prompts.

| # | Issue | Classification | Generated Prompt File Name |
|---|---|---|---|
| 7 | Client list search, filters, pagination, and communication-mode badges | BUG | `ISSUE-7-Client-List-Search-Badges.md` |
| 8 | Client detail tabs (overview, projects, communications, activity) | VERIFY | `ISSUE-8-Client-Detail-Tabs.md` |
| 9 | Client communication log timeline and manual logging | VERIFY | `ISSUE-9-Client-Communication-Log.md` |
| 10 | Client tags: create, assign, filter | VERIFY | `ISSUE-10-Client-Tags.md` |
| 11 | Pipeline kanban creates duplicate cards on drag/move | BUG | `ISSUE-11-Kanban-Duplicate-Cards.md` |
| 12 | Lead scoring: add re-score button | FEATURE | `ISSUE-12-Lead-Score-Rescore-Button.md` |
| 13 | Deal value currency formatting | BUG | `ISSUE-13-Deal-Value-Currency.md` |
| 14 | Lost reason modal when marking a deal lost | VERIFY | `ISSUE-14-Lost-Reason-Modal.md` |
| 15 | Pipeline stages: customizable (checklist says not implemented) | VERIFY | `ISSUE-15-Customizable-Pipeline-Stages.md` |
| 16 | Client portal access: invite and revoke | VERIFY | `ISSUE-16-Client-Portal-Access.md` |
| 17 | Client CSV import and export | FEATURE | `ISSUE-17-Client-CSV-Import-Export.md` |
| 19 | Projects list: filters, status badges, health indicators | VERIFY | `ISSUE-19-Projects-List-Filters-Health.md` |
| 20 | Projects kanban: drag-and-drop between statuses | VERIFY | `ISSUE-20-Projects-Kanban-DnD.md` |
| 21 | Project detail: tasks, deliverables, activity log | VERIFY | `ISSUE-21-Project-Detail-Tabs.md` |
| 22 | Deliverables: upload, link, approve, request revision | VERIFY | `ISSUE-22-Deliverables-Lifecycle.md` |
| 23 | Project templates: create, apply, manage | VERIFY | `ISSUE-23-Project-Templates.md` |
| 24 | Global tasks and workload view | VERIFY | `ISSUE-24-Global-Tasks-Workload.md` |
| 25 | Task assignment to team members | VERIFY | `ISSUE-25-Task-Assignment.md` |
| 26A | Task dependencies: data model, service, and API | BIG | `ISSUE-26A-Task-Dependencies-Backend.md` |
| 26B | Task dependencies: UI | BIG | `ISSUE-26B-Task-Dependencies-UI.md` |
| 27A | Gantt chart: data layer | BIG | `ISSUE-27A-Gantt-Chart-Data.md` |
| 27B | Gantt chart: rendering | BIG | `ISSUE-27B-Gantt-Chart-UI.md` |
| 28A | Time tracking: data model and API | BIG | `ISSUE-28A-Time-Tracking-Backend.md` |
| 28B | Time tracking: UI | BIG | `ISSUE-28B-Time-Tracking-UI.md` |
| 29 | Project budget: track spending vs budget | FEATURE | `ISSUE-29-Project-Budget-Tracking.md` |
| 30 | Project files: attachments beyond deliverables | FEATURE | `ISSUE-30-Project-File-Attachments.md` |
| 31 | Project notes: rich text editor | FEATURE | `ISSUE-31-Project-Notes-Rich-Text.md` |
| 33 | Unified inbox across channels | VERIFY | `ISSUE-33-Unified-Inbox.md` |
| 34 | Channel integrations: Slack, WhatsApp, Email, Discord, Upwork | VERIFY | `ISSUE-34-Channel-Integrations.md` |
| 35 | Webhook handling: signature verification and ingestion (SECURITY PRIORITY) | VERIFY | `ISSUE-35-Webhook-Signature-Verification.md` |
| 36 | Auto-matching messages to clients by email and phone | VERIFY | `ISSUE-36-Auto-Match-Clients.md` |
| 37 | Manual mode clients (no auto-sync) | VERIFY | `ISSUE-37-Manual-Mode-Clients.md` |
| 38 | Connected mode: one-way transition enforcement | BUG | `ISSUE-38-Connected-Mode-One-Way.md` |
| 39 | AI reply suggestions: three options, human-in-the-loop | VERIFY | `ISSUE-39-AI-Reply-Suggestions-Three-Options.md` |
| 40 | AI task extraction from messages | VERIFY | `ISSUE-40-AI-Task-Extraction.md` |
| 41 | Read and unread message state | VERIFY | `ISSUE-41-Read-Unread-State.md` |
| 42 | Message search: full text | VERIFY | `ISSUE-42-Message-Search-Full-Text.md` |
| 43 | Channel status: connected and disconnected display | VERIFY | `ISSUE-43-Channel-Status-Badge.md` |
| 44 | Send outbound messages via platform | VERIFY | `ISSUE-44-Send-Outbound-Messages.md` |
| 45A | Attachment support: storage and send path | BIG | `ISSUE-45A-Attachment-Support-Backend.md` |
| 45B | Attachment support: UI | BIG | `ISSUE-45B-Attachment-Support-UI.md` |
| 47 | Mistral AI provider integration | FEATURE | `ISSUE-47-Mistral-AI-Provider.md` |
| 48 | AI provider selection per organization | FEATURE | `ISSUE-48-Per-Org-AI-Provider-Selection.md` |
| 49 | AI usage logging and reporting | FEATURE | `ISSUE-49-AI-Usage-Reporting.md` |
| 50 | AI feature toggles per organization | VERIFY | `ISSUE-50-AI-Feature-Toggles-Per-Org.md` |
| 51 | AI kill switch (super admin) | VERIFY | `ISSUE-51-AI-Kill-Switch.md` |
| 52 | Lead Scoring Tuning | AMBIGUOUS | — (skipped, see clarification) |
| 53 | Reply suggestions: better context | FEATURE | `ISSUE-53-Reply-Suggestion-Context.md` |
| 54 | Task extraction: parsing robustness | VERIFY | `ISSUE-54-Task-Extraction-Parsing.md` |
| 55 | Weekly narrative customization | FEATURE | `ISSUE-55-Weekly-Narrative-Customization.md` |
| 56 | AI Cost Real Time Pricing | AMBIGUOUS | — (skipped, see clarification) |
| 57 | AI rate limiting per organization | FEATURE | `ISSUE-57-Per-Org-AI-Rate-Limit.md` |
| 58A | Editable AI prompts: storage, versioning, service | BIG | `ISSUE-58A-Editable-AI-Prompts-Backend.md` |
| 58B | Editable AI prompts: admin UI | BIG | `ISSUE-58B-Editable-AI-Prompts-UI.md` |

## Skipped (ambiguous)

| # | Issue | Reason |
|---|---|---|
| 52 | Lead-Scoring-Tuning | What is the target metric (conversion rate, sales accuracy, reviewer agreement), and is there a labeled evaluation set? Without these, tuning cannot be verified. |
| 56 | AI-Cost-Real-Time-Pricing | 'Real-time pricing' has no defined source. Should pricing be a versioned config table updated by a super admin, or a live provider price feed? A live feed would need a new external dependency. |

## Recommended Sequence

1. **Security first**: 35 Webhook signature verification (VERIFY, P0).
2. **Critical functional bugs**: 11 Kanban duplicate cards, 13 Deal value currency, 7 Client list badges, 38 Connected-mode one-way.
3. **Verification sweep** (cheap, may close many items): 8, 9, 10, 14, 15, 16, 19–25, 33, 34, 36, 37, 39–41, 43, 44, 50, 51.
4. **Small features**: 12 Re-score, 47 Mistral, 49 Usage reporting, 57 Per-org rate limit, 53, 55, 54.
5. **Medium features**: 17 Client CSV import/export, 48 Per-org provider selection, 42 Full-text search, 29 Budget (after spending-source decision), 30 Attachments, 31 Rich text (after dependency approval).
6. **BIG features, A before B**: 26A→26B Task dependencies, 27A→27B Gantt (needs 26A), 28A→28B Time tracking, 45A→45B Attachments, 58A→58B Editable AI prompts.

Pending approvals before running: any SCHEMA migration, any new dependency (31, possibly 12), any push (every prompt).
