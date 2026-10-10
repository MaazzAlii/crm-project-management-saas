# 03: Team Members and Invite

Screen: /team (Workspace Settings > Team Members). Checklist: checklists/03-team-members.md

Fix:
1. The member list shows only members of the current organization, with the correct count in the heading.
2. Invite Member: the button opens an invite dialog. Fix the 404 by making the link target an existing route, or by building the route. Check the live route in the deployed build, not only locally.
3. Invite flow: enter an email and role, create a pending invite, show it in the list as "Pending". Do not send email unless email is configured; if not configured, show a copy-link option instead and say so in the UI.
4. Invite acceptance: the invited person opens the link, signs up or logs in, and joins that organization with the chosen role. Expired or reused links are rejected.
5. Role changes and removal: owner and admin only. A member cannot remove the owner. Removing a member does not delete their past tasks or projects.
6. Plan limit: the number of members counts against the plan (for example, 1 of 5). Show a clear message when the limit is reached.

Test (Playwright): owner invites a second email, sees it pending, accepts in a second browser context, both appear as members, owner removes the second member. Member role cannot see Invite.

Verify: npm run build, npm test, npm run test:e2e -- team. Report counts. Do not push.
