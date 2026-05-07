import { isRxDevtoolsEvent, type RxDevtoolsMessage } from '@rxjs-devtools/core/protocol';
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

/**
 * Parses a panel port message as an `INIT` handshake payload.
 *
 * @param input Unknown port message.
 * @returns Parsed init message or `null` when shape is invalid.
 */
export function parsePanelInitMessage(input: unknown): PanelInitMessage | null {
  return isPanelInitMessage(input) ? input : null;
}

/**
 * Parses and normalizes page-hook messages into a content-script forward payload.
 *
 * @param input Unknown `window.postMessage` payload.
 * @param nowMs Timestamp injected by the content script.
 * @returns Parsed forward payload or `null` when payload is invalid.
 */
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

/**
 * Wraps content-script messages into the background payload envelope consumed by the panel.
 *
 * @param message Raw content-script payload.
 * @param tabId Source tab id.
 * @param nowMs Timestamp for background metadata.
 * @returns Background payload in canonical shape.
 */
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

/**
 * Casts a raw value into `RuntimeBackgroundPayload` when object-like.
 *
 * @param input Unknown value.
 * @returns Background payload or `null`.
 */
export function toRuntimeBackgroundPayload(input: unknown): RuntimeBackgroundPayload | null {
  if (!isRecord(input)) return null;
  return input as RuntimeBackgroundPayload;
}

/**
 * Casts a raw value into `RuntimeContentPayload` when object-like.
 *
 * @param input Unknown value.
 * @returns Content payload or `null`.
 */
export function toRuntimeContentPayload(input: unknown): RuntimeContentPayload | null {
  if (!isRecord(input)) return null;
  return input as RuntimeContentPayload;
}

/**
 * Decodes the complete runtime transport payload and validates embedded devtools message.
 *
 * @param input Unknown payload delivered to the panel runtime.
 * @returns Structured message parts or `null` when validation fails.
 */
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
