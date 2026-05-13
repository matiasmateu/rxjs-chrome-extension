import { RXJS_DEVTOOLS_FROM, type RxDevtoolsEventKind } from '@rxjs-devtools/core/protocol';
import { describe, expect, it } from 'vitest';
import { parsePageHookForwardMessage, createBackgroundPayload } from '../../transport-parser';
import { FilterRegistry } from '../FilterRegistry';
import { LaneActivity } from '../LaneActivity';
import { LaneLayout } from '../LaneLayout';
import { MarbleStore } from '../MarbleStore';
import { normalizeContentEvent } from '../normalizeContentEvent';

type PipelineEventInput = {
  kind: RxDevtoolsEventKind;
  ts: number;
  value?: unknown;
};

function toNormalizedEvent(input: PipelineEventInput) {
  const pagePayload = {
    __from: RXJS_DEVTOOLS_FROM,
    message: {
      kind: input.kind,
      observableId: 'obs_pipeline',
      instanceId: 'inst_pipeline',
      subscriptionId: 'sub_pipeline',
      ts: input.ts,
      source: {
        label: 'Pipeline Stream',
        domain: 'playground-flow',
        tags: ['flow', 'smoke'],
      },
      data: input.value,
    },
  };

  const contentPayload = parsePageHookForwardMessage(pagePayload, input.ts + 1);
  if (!contentPayload) {
    throw new Error('Expected content payload to be parsed');
  }

  const backgroundPayload = createBackgroundPayload(contentPayload, 42, input.ts + 2);
  const normalized = normalizeContentEvent(backgroundPayload);
  if (!normalized) {
    throw new Error('Expected runtime event to be normalized');
  }
  return normalized;
}

describe('transport pipeline smoke', () => {
  it('processes subscribe->next->complete events and updates runtime state', () => {
    const filters = new FilterRegistry('', '');
    const laneLayout = new LaneLayout(4, 200);
    const laneActivity = new LaneActivity();
    const store = new MarbleStore({
      filters,
      laneLayout,
      laneActivity,
    });

    const events = [
      toNormalizedEvent({ kind: 'subscribe', ts: 1000 }),
      toNormalizedEvent({ kind: 'next', ts: 1010, value: { n: 1 } }),
      toNormalizedEvent({ kind: 'complete', ts: 1020 }),
    ];

    for (const event of events) {
      store.push(event);
    }

    expect(store.totalEvents).toBe(3);
    expect(store.marbles).toHaveLength(3);
    expect(store.marbles[0]?.msg.kind).toBe('subscribe');
    expect(store.marbles[0]?.msg.eventCategory).toBe('observable');
    expect(store.marbles[1]?.msg.kind).toBe('next');
    expect(store.marbles[2]?.msg.kind).toBe('complete');
    expect(store.marbles[0]?.laneKey).toBe(store.marbles[1]?.laneKey);
    expect(store.marbles[1]?.laneKey).toBe(store.marbles[2]?.laneKey);
    expect(store.marbles[1]?.timeMs).toBe(1010);

    const laneKey = store.marbles[0]?.laneKey || '';
    expect(laneActivity.isLaneDisabled(laneKey)).toBe(true);
    expect(filters.filterDomains.has('playground-flow')).toBe(true);
  });
});
