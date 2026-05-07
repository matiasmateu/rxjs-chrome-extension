import {
  isRxDevtoolsEvent,
  type RxDevtoolsMessage,
} from '@rxjs-devtools/core/protocol';
import {
  DEFAULT_EVENT_TYPE,
  getEventType,
  isPageHookPayload,
  isPanelInitMessage,
  isRecord,
} from './transport-guards';
import type {
  PanelInitMessage,
  RuntimeBackgroundPayload,
  RuntimeContentForwardMessage,
  RuntimeContentPayload,
} from './transport-types';

export type DecodedRuntimeTransportMessage = {
  background: RuntimeBackgroundPayload;
  content: RuntimeContentPayload | null;
  devtools: RxDevtoolsMessage;
};

export function parsePanelInitMessage(input: unknown): PanelInitMessage | null {
  return isPanelInitMessage(input) ? input : null;
}

export function parsePageHookForwardMessage(
  input: unknown,
  nowMs = Date.now(),
): RuntimeContentForwardMessage | null {
  if (!isPageHookPayload(input)) return null;
  if (!isRxDevtoolsEvent(input.message)) return null;

  return {
    ...input,
    __from: 'CONTENT_SCRIPT',
    message: input.message,
    time: nowMs,
  };
}

export function createBackgroundPayload(
  message: unknown,
  tabId: number,
  nowMs = Date.now(),
): RuntimeBackgroundPayload {
  return {
    type: getEventType(message),
    tabId,
    data: message,
    meta: {
      origin: 'content-script',
      time: nowMs,
      originalType: DEFAULT_EVENT_TYPE,
    },
  };
}

export function toRuntimeBackgroundPayload(input: unknown): RuntimeBackgroundPayload | null {
  if (!isRecord(input)) return null;
  return input as RuntimeBackgroundPayload;
}

export function toRuntimeContentPayload(input: unknown): RuntimeContentPayload | null {
  if (!isRecord(input)) return null;
  return input as RuntimeContentPayload;
}

export function decodeRuntimeTransportMessage(
  input: unknown,
): DecodedRuntimeTransportMessage | null {
  const background = toRuntimeBackgroundPayload(input);
  if (!background) return null;

  const content = toRuntimeContentPayload(background.data);
  const devtoolsCandidate = content?.message ?? background.message;
  if (!isRxDevtoolsEvent(devtoolsCandidate)) return null;

  return {
    background,
    content,
    devtools: devtoolsCandidate,
  };
}
