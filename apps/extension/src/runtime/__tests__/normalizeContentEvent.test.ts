import { describe, expect, it } from 'vitest';
import { normalizeContentEvent } from '../normalizeContentEvent';

describe('normalizeContentEvent', () => {
  it('normalizes wrapped devtools messages from background payloads', () => {
    const devtoolsMessage = {
      kind: 'next' as const,
      observableId: 'obs/1',
      instanceId: 'inst_1',
      subscriptionId: 'sub/1',
      ts: 5000,
      source: {
        label: 'User Stream',
        domain: 'Media-Player',
        operator: 'map',
        tags: ['group-a'],
      },
      data: { value: 42 },
      meta: { stage: 'test' },
    };

    const input = {
      type: 'CONTENT_EVENT',
      tabId: 7,
      data: {
        __from: 'CONTENT_SCRIPT',
        message: devtoolsMessage,
      },
      meta: { time: 9999 },
    };

    const normalized = normalizeContentEvent(input);

    expect(normalized).not.toBeNull();
    expect(normalized).toMatchObject({
      type: 'NEXT • User Stream',
      kind: 'next',
      rxKind: 'next',
      label: 'User Stream',
      domain: 'media-player',
      observableId: 'obs/1',
      instanceId: 'inst_1',
      subscriptionId: 'sub/1',
      laneKey: 'media-player:obs_1/sub_1',
      time: 5000,
      ts: 5000,
      tabId: 7,
    });
    expect(normalized?.raw.content?.message).toEqual(devtoolsMessage);
    expect(normalized?.raw.background).toEqual(input);
  });

  it('supports direct message payloads and applies defaults', () => {
    const input = {
      message: {
        kind: 'complete' as const,
        observableId: 'obs2',
        instanceId: 'inst2',
        subscriptionId: 'sub2',
        ts: 11,
      },
    };

    const normalized = normalizeContentEvent(input);

    expect(normalized).toMatchObject({
      type: 'COMPLETE • obs2',
      kind: 'complete',
      rxKind: 'complete',
      label: 'obs2',
      domain: 'unknown',
      laneKey: 'unknown:obs2/sub2',
      time: 11,
    });
    expect(normalized?.raw.content).toBeNull();
  });

  it('returns null for payloads without a valid devtools message', () => {
    expect(normalizeContentEvent(null)).toBeNull();
    expect(normalizeContentEvent({})).toBeNull();
    expect(
      normalizeContentEvent({
        data: {
          message: {
            kind: 'next',
          },
        },
      }),
    ).toBeNull();
  });
});
