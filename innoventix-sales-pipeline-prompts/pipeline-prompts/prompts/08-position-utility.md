# 08 - Position ordering utility

Trello-style reordering needs a way to insert a card between two others without renumbering the whole column.

Create `lib/pipeline/position.ts` with:

- `positionBetween(before: number | null, after: number | null): number`
  - Both null: return 1000.
  - Only before: return before + 1000.
  - Only after: return after / 2.
  - Both: return (before + after) / 2.
- `needsRebalance(positions: number[]): boolean`
  - True when the gap between neighbors is smaller than 0.000001, or when any position exceeds 1e12.
- `rebalance(items: {id: string, position: number}[]): {id: string, position: number}[]`
  - Returns evenly spaced positions 1000, 2000, 3000, and so on, in the existing order.

Add unit tests covering:
- insert at top, bottom, and middle
- repeated insertion into the same gap
- rebalance trigger
- empty lists

Do not wire it to the UI yet. All tests must pass.
