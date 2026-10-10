# Innoventix Screen-by-Screen Fix Pack

Goal: every screen works correctly for each organization, on the live domain, before moving on.

## Order (do not skip)
1. 00-CONTEXT.md is pasted at the start of every session. Not a prompt.
2. prompts/01-audit.md: read-only audit. No code changes. Send the report to me before continuing.
3. prompts/02-tenant-isolation.md: fix every data leak found in the audit. Must pass before any screen work.
4. prompts/03 to 08: one screen per prompt, in this order:
   - 03 Team Members and Invite
   - 04 Projects
   - 05 Clients
   - 06 Tasks
   - 07 Dashboard and Analytics
   - 08 Sales Pipeline
5. prompts/09-deploy-and-verify.md: the deploy routine used after each screen.

## The loop for each screen
1. Run the checklist in checklists/ on the live domain. Record pass or fail for each line. This is the "before" state.
2. Paste 00-CONTEXT.md, then the screen's prompt. Let Antigravity fix locally.
3. Antigravity runs the screen's Playwright test. It must pass.
4. Deploy using prompt 09. Do not batch more than two screens per deploy.
5. Run the same checklist live. Every line must pass before you move on.

## Test accounts
- Use two separate organizations: your owner account and a tester account. Never share one login.
- Do not use real client, payment, or contact data in the tester account.
- Use a new password for every account. Never put passwords in files, prompts, or chat.

## Stop conditions
- Any screen shows another organization's data: stop, go back to prompt 02.
- Any login or cookie failure: stop, check the Coolify runtime log.
- Tester signup is paused until prompt 02 passes.
