# Innoventix Sales Pipeline (Trello-style) - Antigravity Prompt Pack

This pack has 40 prompts that build a Trello-style sales pipeline inside the existing CRM: boards, columns (stages), draggable cards, card details, labels, checklists, comments, activity, filters, and a forecast header.

## How to use it

1. Open `00-CONTEXT.md` and paste it at the start of every new Antigravity session. It keeps the rules consistent.
2. Run the prompts in numeric order. Do not skip ahead. Each prompt depends on the previous ones.
3. Start one prompt per session (or per chat). Wait until Antigravity says it's done and has run the build.
4. After each prompt, check the result yourself:
   - `npm run build` passes
   - `npm test` passes (once tests exist)
   - The feature works in the browser at `localhost:3000`
5. Commit after each prompt. Keep commits small so you can roll back.
6. Only push to the `deploy` remote after a full phase works locally. Coolify builds from that remote.

## Phases

| Phase | Prompts | What it builds |
|---|---|---|
| 0. Audit | 01 | Reads the existing code and produces a plan. No code changes. |
| 1. Data model | 02-09 | Tables, repositories, position ordering, activity log, labels, checklists, comments |
| 2. Services and API | 10-16 | Business rules, API routes, move endpoint, permissions, tenant isolation |
| 3. Board UI | 17-29 | Drag-and-drop board, cards, columns, card detail, inline editing |
| 4. Power features | 30-36 | Keyboard, mobile, filters, undo, won/lost, forecast, multiple pipelines |
| 5. Quality and launch | 37-40 | States, tests, performance, screenshots, docs, deploy checklist |

## Notes

- Prompts describe the goal and the rules. Antigravity should inspect the real file structure first and adapt file paths. Do not let it invent a parallel structure.
- If a prompt conflicts with what the code already does, Antigravity should stop and report the conflict instead of guessing.
- The Trello feel depends most on drag-and-drop smoothness (prompts 19-21), card visuals (prompt 18), and the card detail view (prompt 24). Spend extra review time there.
- If you send a Trello screenshot, the UI prompts can be tightened to match its spacing, colors, and card layout exactly.
