import { RXJS_DEVTOOLS_FROM } from '@rxjs-devtools/core/protocol';
import type { PanelInitMessage } from './transport-types';

export const DEFAULT_EVENT_TYPE = 'CONTENT_EVENT' as const;

export type PageHookPayload = {
  __from: typeof RXJS_DEVTOOLS_FROM;
  message: unknown;
  [key: string]: unknown;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function isPanelInitMessage(value: unknown): value is PanelInitMessage {
  if (!isRecord(value)) return false;
  return value.type === 'INIT' && Number.isInteger(value.tabId);
}

export function getEventType(payload: unknown): string {
  if (!isRecord(payload)) return DEFAULT_EVENT_TYPE;
  const type = payload.type;
  return typeof type === 'string' && type.trim().length > 0 ? type : DEFAULT_EVENT_TYPE;
}

export function isPageHookPayload(value: unknown): value is PageHookPayload {
  if (!isRecord(value)) return false;
  return value.__from === RXJS_DEVTOOLS_FROM;
}
