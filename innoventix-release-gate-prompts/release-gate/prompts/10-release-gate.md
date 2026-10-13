# 10: Release gate

Collect the results of prompts 01 to 09. For each prompt, status: pass, fail, or not run.

Gate rules:
- Any blocker in 02, 03, 05, 08, or 09 means NO-GO.
- Any unexplained error in 08 means NO-GO.
- Unapproved pushes in 01 mean NO-GO until the owner approves or reverts them.
- Unknown production error in 02 means NO-GO.

Also run and paste: npm run lint, npm test, npm run build (foreground), npx playwright test.

Output:
1. GO or NO-GO
2. Blocker list with owner, file, and reproduction steps
3. Estimated fix order
4. The next approval the owner must give

Do not push. Do not deploy.
