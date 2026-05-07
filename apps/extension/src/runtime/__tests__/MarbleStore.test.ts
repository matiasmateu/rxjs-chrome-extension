import { describe, expect, it } from 'vitest';
import { FilterRegistry } from '../FilterRegistry';
import { LaneActivity } from '../LaneActivity';
import { LaneLayout } from '../LaneLayout';
import { MarbleStore } from '../MarbleStore';

function createStore() {
  const filters = new FilterRegistry('', '');
  const laneLayout = new LaneLayout(4, 128);
  const laneActivity = new LaneActivity();

  return new MarbleStore({
    filters,
    laneLayout,
    laneActivity,
  });
}

describe('MarbleStore', () => {
  it('indexes marbles by id and clears index state', () => {
    const store = createStore();

    store.push({
      type: 'NEXT',
      rxKind: 'next',
      laneKey: 'playground/stream_1',
      subscriptionId: 'sub_1',
      time: 1700000000000,
    });

    expect(store.getById(1)?.id).toBe(1);
    expect(store.laneSamplesByKey.size).toBe(1);

    store.clear();

    expect(store.getById(1)).toBeNull();
    expect(store.laneSamplesByKey.size).toBe(0);
  });

  it('keeps first sample marble per lane key', () => {
    const store = createStore();

    store.push({
      type: 'NEXT • first',
      rxKind: 'next',
      laneKey: 'playground/stream_1',
      subscriptionId: 'sub_1',
      time: 1700000000000,
    });

    store.push({
      type: 'NEXT • second',
      rxKind: 'next',
      laneKey: 'playground/stream_1',
      subscriptionId: 'sub_1',
      time: 1700000001000,
    });

    expect(store.laneSamplesByKey.get('playground/stream_1')?.id).toBe(1);
  });
});
