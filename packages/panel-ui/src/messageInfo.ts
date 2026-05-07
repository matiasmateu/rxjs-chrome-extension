import type { MessageInfo } from './types';
import {
  firstString,
  fmtTime,
  normalizeTimestampMs,
  normalizeTypeLabel,
  prettifyDomain,
} from './formatters';

/**
 * Builds a UI-friendly summary model from a raw runtime/devtools message.
 *
 * @param message Raw message object shown in the tooltip panel.
 * @returns Normalized message info used by `TooltipPanel`.
 */
export function extractMessageInfo(message: any): MessageInfo {
  const label = firstString(
    message?.source?.label,
    message?.label,
    message?.observableId,
    message?.instanceId,
  );

  const domainRaw = normalizeTypeLabel(firstString(message?.source?.domain, message?.domain));
  const kindRaw = normalizeTypeLabel(firstString(message?.rxKind, message?.kind));
  const operator = firstString(message?.source?.operator);
  const tags = Array.isArray(message?.source?.tags) ? message.source.tags : [];

  const timeMs = normalizeTimestampMs(message?.ts, message?.time, message?.timestamp);

  return {
    domainLabel: domainRaw ? prettifyDomain(domainRaw) || domainRaw : 'Unknown domain',
    label: label || 'Unknown label',
    kindLabel: kindRaw ? kindRaw.toUpperCase() : 'UNKNOWN',
    operator: operator || '',
    observableId: message?.observableId || 'Unknown observable',
    instanceId: message?.instanceId || '',
    subscriptionId: message?.subscriptionId || '',
    tags,
    timeLabel: timeMs ? fmtTime(timeMs) : '',
    dataPayload: message?.data ?? null,
  };
}
