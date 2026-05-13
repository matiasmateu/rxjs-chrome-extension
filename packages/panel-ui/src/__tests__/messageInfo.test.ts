import { describe, expect, it } from 'vitest';
import { normalizeTimestampMs, prettifyDomain } from '../formatters';
import { previewValue, truncate } from '../json-tree-utils';
import { extractMessageInfo } from '../messageInfo';

describe('extractMessageInfo', () => {
  it('normalizes message details for tooltip presentation', () => {
    const info = extractMessageInfo({
      rxKind: 'next',
      observableId: 'obs_1',
      instanceId: 'inst_1',
      subscriptionId: 'sub_1',
      ts: 1_700_000_000_000,
      data: { ok: true },
      source: {
        label: 'Fetch User',
        domain: 'user_profile',
        operator: 'map',
        tags: ['ui', 'load'],
      },
    });

    expect(info.domainLabel).toBe('User Profile');
    expect(info.label).toBe('Fetch User');
    expect(info.kindLabel).toBe('NEXT');
    expect(info.streamKind).toBe('OBSERVABLE');
    expect(info.isEpic).toBe(false);
    expect(info.epicName).toBe('');
    expect(info.epicInvocationId).toBe('');
    expect(info.epicScenarioId).toBe('');
    expect(info.operator).toBe('map');
    expect(info.observableId).toBe('obs_1');
    expect(info.instanceId).toBe('inst_1');
    expect(info.subscriptionId).toBe('sub_1');
    expect(info.tags).toEqual(['ui', 'load']);
    expect(info.dataPayload).toEqual({ ok: true });
    expect(info.timeLabel.length).toBeGreaterThan(0);
  });

  it('falls back to unknown labels when fields are missing', () => {
    const info = extractMessageInfo({});

    expect(info.domainLabel).toBe('Unknown domain');
    expect(info.label).toBe('Unknown label');
    expect(info.kindLabel).toBe('UNKNOWN');
    expect(info.observableId).toBe('Unknown observable');
    expect(info.dataPayload).toBeNull();
  });

  it('extracts epic invocation metadata', () => {
    const info = extractMessageInfo({
      rxKind: 'subscribe',
      observableId: 'epic_obs',
      instanceId: 'epic_inst',
      subscriptionId: 'epic_sub',
      source: {
        label: 'SearchUsersEpic #inv_1',
        domain: 'playground-epic',
        streamKind: 'epic',
        tags: ['playground', 'epic', 'epic-success'],
        epic: {
          name: 'SearchUsersEpic',
          invocationId: 'inv_1',
          scenarioId: 'epic-success',
        },
      },
      meta: {
        scenario: 'epic-success',
      },
    });

    expect(info.streamKind).toBe('EPIC');
    expect(info.isEpic).toBe(true);
    expect(info.epicName).toBe('SearchUsersEpic');
    expect(info.epicInvocationId).toBe('inv_1');
    expect(info.epicScenarioId).toBe('epic-success');
  });
});

describe('format helpers', () => {
  it('formats/previews utility values predictably', () => {
    expect(prettifyDomain('order_history')).toBe('Order History');
    expect(normalizeTimestampMs('2020-01-01T00:00:00.000Z')).toBe(1_577_836_800_000);

    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(previewValue({ alpha: 'abcdef', beta: 2, gamma: true })).toEqual({
      alpha: 'abcdef',
      beta: 2,
      gamma: true,
    });
  });
});
