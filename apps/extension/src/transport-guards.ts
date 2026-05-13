import { RXJS_DEVTOOLS_FROM } from 'rxjs-monitor/protocol';
import type { PanelInitMessage } from './transport-types';

export const DEFAULT_EVENT_TYPE = 'CONTENT_EVENT' as const;

export type PageHookPayload = {
  __from: typeof RXJS_DEVTOOLS_FROM;
  message: unknown;
  [key: string]: unknown;
};

/**
 * Checks whether a value is a non-null object.
 *
 * @param value Candidate value.
 * @returns `true` when the value is object-like.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

/**
 * Validates the panel initialization handshake message.
 *
 * @param value Unknown incoming message.
 * @returns `true` when the payload is `{ type: "INIT", tabId: number }`.
 */
export function isPanelInitMessage(value: unknown): value is PanelInitMessage {
  if (!isRecord(value)) return false;
  return value.type === 'INIT' && Number.isInteger(value.tabId);
}

/**
 * Extracts a safe event type string from a raw payload.
 *
 * @param payload Raw content-script message payload.
 * @returns Event type when present; otherwise `CONTENT_EVENT`.
 */
export function getEventType(payload: unknown): string {
  if (!isRecord(payload)) return DEFAULT_EVENT_TYPE;
  const type = payload.type;
  return typeof type === 'string' && type.trim().length > 0 ? type : DEFAULT_EVENT_TYPE;
}

/**
 * Validates that a window message was emitted by the injected RxJS hook.
 *
 * @param value Unknown `window.postMessage` payload.
 * @returns `true` when payload includes the expected `__from` marker.
 */
export function isPageHookPayload(value: unknown): value is PageHookPayload {
  if (!isRecord(value)) return false;
  return value.__from === RXJS_DEVTOOLS_FROM;
}
