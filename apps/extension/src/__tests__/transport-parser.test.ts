import { RXJS_DEVTOOLS_FROM } from 'rxjs-devtools/protocol';
import { describe, expect, it } from 'vitest';
import {
  createBackgroundPayload,
  decodeRuntimeTransportMessage,
  parsePageHookForwardMessage,
  parsePanelInitMessage,
} from '../transport-parser';

const DEVTOOLS_MESSAGE = {
  kind: 'next' as const,
  observableId: 'obs-1',
  instanceId: 'inst-1',
  subscriptionId: 'sub-1',
  ts: 1234,
};

describe('transport-parser', () => {
  it('parsePanelInitMessage narrows valid INIT payloads', () => {
    expect(parsePanelInitMessage({ type: 'INIT', tabId: 7 })).toEqual({
      type: 'INIT',
      tabId: 7,
    });
    expect(parsePanelInitMessage({ type: 'INIT', tabId: 7.2 })).toBeNull();
    expect(parsePanelInitMessage({ type: 'ACK', tabId: 7 })).toBeNull();
  });

  it('parsePageHookForwardMessage decodes page-hook payloads into content-forward payloads', () => {
    const parsed = parsePageHookForwardMessage(
      {
        __from: RXJS_DEVTOOLS_FROM,
        message: DEVTOOLS_MESSAGE,
        extra: 'field',
      },
      999,
    );

    expect(parsed).toEqual({
      __from: 'CONTENT_SCRIPT',
      message: DEVTOOLS_MESSAGE,
      time: 999,
      extra: 'field',
    });
    expect(parsePageHookForwardMessage({ __from: RXJS_DEVTOOLS_FROM, message: {} })).toBeNull();
  });

  it('createBackgroundPayload builds canonical runtime payload envelope', () => {
    const payload = createBackgroundPayload({ foo: 'bar' }, 3, 555);

    expect(payload).toEqual({
      type: 'CONTENT_EVENT',
      tabId: 3,
      data: { foo: 'bar' },
      meta: {
        origin: 'content-script',
        time: 555,
        originalType: 'CONTENT_EVENT',
      },
    });
  });

  it('decodeRuntimeTransportMessage extracts devtools message from background envelope', () => {
    const decoded = decodeRuntimeTransportMessage({
      type: 'CONTENT_EVENT',
      tabId: 2,
      data: {
        __from: 'CONTENT_SCRIPT',
        message: DEVTOOLS_MESSAGE,
      },
    });

    expect(decoded).toMatchObject({
      background: {
        type: 'CONTENT_EVENT',
        tabId: 2,
      },
      content: {
        __from: 'CONTENT_SCRIPT',
      },
      devtools: DEVTOOLS_MESSAGE,
    });
    expect(decodeRuntimeTransportMessage({})).toBeNull();
  });
});
