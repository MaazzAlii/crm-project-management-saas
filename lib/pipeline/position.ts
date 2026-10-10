/**
 * Fractional positioning utility for Trello-style drag and drop.
 * Avoids renumbering all cards in a column on move.
 */

export function positionBetween(before: number | null | undefined, after: number | null | undefined): number {
  const b = before !== null && before !== undefined ? before : null;
  const a = after !== null && after !== undefined ? after : null;

  // 1. Both null: empty list or first item
  if (b === null && a === null) {
    return 1000.0;
  }

  // 2. Only before provided (insert at bottom)
  if (b !== null && a === null) {
    return b + 1000.0;
  }

  // 3. Only after provided (insert at top)
  if (b === null && a !== null) {
    return a > 0 ? a / 2.0 : a - 1000.0;
  }

  // 4. Both provided (insert in between)
  if (b !== null && a !== null) {
    return (b + a) / 2.0;
  }

  return 1000.0;
}

export function needsRebalance(
  arg1?: number[] | number | null,
  arg2?: number | null
): boolean {
  if (Array.isArray(arg1)) {
    const positions = arg1;
    if (positions.length < 2) return false;
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      if (pos > 1e12 || pos < -1e12) return true;
      if (i > 0) {
        const gap = Math.abs(positions[i] - positions[i - 1]);
        if (gap < 0.000001) return true;
      }
    }
    return false;
  }

  const b = arg1 !== null && arg1 !== undefined ? arg1 : null;
  const a = arg2 !== null && arg2 !== undefined ? arg2 : null;
  if (b !== null && a !== null) {
    const gap = Math.abs(a - b);
    return gap < 0.000001;
  }
  return false;
}

export function rebalance<T extends { id: string; position: number }>(items: T[]): T[] {
  if (!items || items.length === 0) {
    return [];
  }

  const sorted = [...items].sort((a, b) => a.position - b.position);

  return sorted.map((item, idx) => ({
    ...item,
    position: (idx + 1) * 1000.0,
  }));
}
