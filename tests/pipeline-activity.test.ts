import { describe, it, expect } from 'vitest';
import { calculateDealDiff } from '../lib/pipeline/activity';

describe('Pipeline Activity Diff Calculator', () => {
  it('calculates diff accurately when values change', () => {
    const oldState = {
      title: 'Initial Contract',
      value: 10000,
      status: 'open',
    };

    const newState = {
      title: 'Revised Enterprise Agreement',
      value: 25000,
      status: 'open',
    };

    const diff = calculateDealDiff(oldState, newState);

    expect(diff).toEqual({
      title: { from: 'Initial Contract', to: 'Revised Enterprise Agreement' },
      value: { from: 10000, to: 25000 },
    });
  });

  it('ignores unchanged fields', () => {
    const oldState = { title: 'Same Title', value: 5000 };
    const newState = { title: 'Same Title', value: 5000 };

    const diff = calculateDealDiff(oldState, newState);
    expect(diff).toEqual({});
  });

  it('handles fields not previously present', () => {
    const oldState = {};
    const newState = { probability: 75 };

    const diff = calculateDealDiff(oldState, newState);
    expect(diff).toEqual({
      probability: { from: null, to: 75 },
    });
  });
});
