# 22: Free tier rules (full platform, limited team)

Write docs/plan-rules.md and enforce in code:
- Free workspaces can use every feature (clients, projects, tasks, pipeline, inbox, analytics). Do not add feature gates to these.
- Free limits only apply to team size (maxMembers) and pending invites (maxPendingInvites).
- Free workspaces see one upgrade message on the team page when the limit is reached. No other screen is blocked or greyed out.
- Free workspaces cannot claim a verified domain (prompt 09) unless they are on pro. Say so in the UI.

Tests: a free organization can create clients, projects, and tasks past the seat limit without error.
