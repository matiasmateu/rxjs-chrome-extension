import { RXJS_DEVTOOLS_FROM } from '@rxjs-devtools/core/protocol';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EVENT_TYPE,
  getEventType,
  isPageHookPayload,
  isPanelInitMessage,
  isRecord,
} from '../transport-guards';

describe('transport-guards', () => {
  it('isRecord accepts objects and rejects primitives/null', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('x')).toBe(false);
    expect(isRecord(1)).toBe(false);
  });

  it('isPanelInitMessage validates INIT payload shape', () => {
    expect(isPanelInitMessage({ type: 'INIT', tabId: 10 })).toBe(true);
    expect(isPanelInitMessage({ type: 'INIT', tabId: 10.5 })).toBe(false);
    expect(isPanelInitMessage({ type: 'ACK', tabId: 10 })).toBe(false);
    expect(isPanelInitMessage({ type: 'INIT' })).toBe(false);
    expect(isPanelInitMessage(null)).toBe(false);
  });

  it('getEventType returns custom type and defaults when missing/invalid', () => {
    expect(getEventType({ type: 'CUSTOM_EVENT' })).toBe('CUSTOM_EVENT');
    expect(getEventType({ type: '   ' })).toBe(DEFAULT_EVENT_TYPE);
    expect(getEventType({})).toBe(DEFAULT_EVENT_TYPE);
    expect(getEventType(null)).toBe(DEFAULT_EVENT_TYPE);
  });

  it('isPageHookPayload checks message origin marker', () => {
    expect(
      isPageHookPayload({
        __from: RXJS_DEVTOOLS_FROM,
        message: { kind: 'next' },
      }),
    ).toBe(true);
    expect(isPageHookPayload({ __from: 'CONTENT_SCRIPT', message: {} })).toBe(false);
    expect(isPageHookPayload({ message: {} })).toBe(false);
    expect(isPageHookPayload(null)).toBe(false);
  });
});
