import { describe, it, expect } from 'vitest';
import { positionBetween, needsRebalance, rebalance } from '../lib/pipeline/position';

describe('Pipeline Position Utility', () => {
  it('handles insert on empty list (both null)', () => {
    expect(positionBetween(null, null)).toBe(1000);
  });

  it('handles insert at bottom (only before given)', () => {
    expect(positionBetween(1000, null)).toBe(2000);
    expect(positionBetween(5500, null)).toBe(6500);
  });

  it('handles insert at top (only after given)', () => {
    expect(positionBetween(null, 1000)).toBe(500);
    expect(positionBetween(null, 500)).toBe(250);
  });

  it('handles insert between two items', () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
    expect(positionBetween(1000, 1500)).toBe(1250);
  });

  it('detects when rebalance is needed due to tight gap (< 0.000001)', () => {
    expect(needsRebalance([1000, 2000, 3000])).toBe(false);
    expect(needsRebalance([1000.0000001, 1000.0000002])).toBe(true);
    expect(needsRebalance([1e13, 1e13 + 1000])).toBe(true);
  });

  it('rebalances items to clean 1000, 2000, 3000 increments', () => {
    const crowded = [
      { id: '1', position: 1000.0001 },
      { id: '2', position: 1000.0002 },
      { id: '3', position: 1000.0003 },
    ];

    const balanced = rebalance(crowded);
    expect(balanced).toEqual([
      { id: '1', position: 1000 },
      { id: '2', position: 2000 },
      { id: '3', position: 3000 },
    ]);
  });

  it('handles empty lists gracefully', () => {
    expect(needsRebalance([])).toBe(false);
    expect(rebalance([])).toEqual([]);
  });
});
