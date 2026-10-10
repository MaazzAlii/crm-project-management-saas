# 01: Fix the duplicate-on-move bug

Problem: after dragging "Enterprise Cloud SLA" from Lead to Proposal, the card also remained in Qualified. The header counted 3 deals instead of 2. A move should change the card's stage, never create a second card.

Steps:
1. Write a failing test first. Use the move endpoint: create a deal in stage A, move it to stage B, then assert that exactly one row exists for that deal ID and its stage_id is B. Run it and show it failing.
2. Find the cause. Check, in order:
   - `app/api/deals/[dealId]/move/route.ts` and `deal-repo.ts`: does the move UPDATE the existing row, or INSERT a new one?
   - `components/pipeline/Board.tsx`: does the optimistic update remove the card from the source column, or only add it to the destination?
   - Whether the 15-second polling merges server data with local state using a key that doesn't match (for example, merging by index instead of by deal ID).
   - Whether DealCard renders from a stale copy in state after a drop.
3. Fix the root cause. Do not hide the symptom with a de-duplication filter.
4. Make the optimistic update and the rollback path both remove the card from the source column.
5. Confirm the test now passes, and add a second test for the reload case: after a move, the deal appears once after a page reload.

Report the root cause in one or two sentences and the test results.
