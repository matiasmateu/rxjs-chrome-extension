import type { MessageInfo } from './types';
import {
  firstString,
  fmtTime,
  normalizeTimestampMs,
  normalizeTypeLabel,
  prettifyDomain,
} from './formatters';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Builds a UI-friendly summary model from a raw runtime/devtools message.
 *
 * @param message Raw message object shown in the tooltip panel.
 * @returns Normalized message info used by `TooltipPanel`.
 */
export function extractMessageInfo(message: unknown): MessageInfo {
  const msg = asRecord(message) || {};
  const source = asRecord(msg.source) || {};

  const label = firstString(source.label, msg.label, msg.observableId, msg.instanceId);

  const domainRaw = normalizeTypeLabel(firstString(source.domain, msg.domain));
  const kindRaw = normalizeTypeLabel(firstString(msg.rxKind, msg.kind));
  const operator = firstString(source.operator);
  const tags = stringArray(source.tags);

  const timeMs = normalizeTimestampMs(msg.ts, msg.time, msg.timestamp);

  return {
    domainLabel: domainRaw ? prettifyDomain(domainRaw) || domainRaw : 'Unknown domain',
    label: label || 'Unknown label',
    kindLabel: kindRaw ? kindRaw.toUpperCase() : 'UNKNOWN',
    operator: operator || '',
    observableId: firstString(msg.observableId) || 'Unknown observable',
    instanceId: firstString(msg.instanceId),
    subscriptionId: firstString(msg.subscriptionId),
    tags,
    timeLabel: timeMs ? fmtTime(timeMs) : '',
    dataPayload: msg.data ?? null,
  };
}
