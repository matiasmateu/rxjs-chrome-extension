import { describe, expect, it } from 'vitest';
import { LaneActivity } from '../LaneActivity';

describe('LaneActivity', () => {
  it('tracks active subscriptions and disables lane when all subscriptions terminate', () => {
    const activity = new LaneActivity();

    activity.update('lane/main', 'subscribe', 'sub-1');
    activity.update('lane/main', 'subscribe', 'sub-1');
    activity.update('lane/main', 'subscribe', 'sub-2');

    expect(activity.isLaneDisabled('lane/main')).toBe(false);

    activity.update('lane/main', 'unsubscribe', 'sub-1');
    expect(activity.isLaneDisabled('lane/main')).toBe(false);

    activity.update('lane/main', 'complete', 'sub-2');
    expect(activity.isLaneDisabled('lane/main')).toBe(true);
  });

  it('supports terminal lifecycle without explicit subscription id', () => {
    const activity = new LaneActivity();

    activity.update('lane/fallback', 'create');
    expect(activity.isLaneDisabled('lane/fallback')).toBe(false);

    activity.update('lane/fallback', 'complete');
    expect(activity.isLaneDisabled('lane/fallback')).toBe(true);
  });

  it('reports disabled lane state by lane index map', () => {
    const activity = new LaneActivity();
    const laneIndexMap = [new Set<string>(['lane/a']), new Set<string>(['lane/b'])];

    activity.update('lane/a', 'subscribe', 'sub-1');
    activity.update('lane/b', 'subscribe', 'sub-2');
    activity.update('lane/b', 'error', 'sub-2');

    expect(activity.isLaneDisabledForIndex(0, laneIndexMap)).toBe(false);
    expect(activity.isLaneDisabledForIndex(1, laneIndexMap)).toBe(true);
  });
});
