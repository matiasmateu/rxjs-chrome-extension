import { pickFirstNumber } from './RuntimeTime';
import { normalizeRxKind } from './RxKind';
import { firstString, sanitizeLaneKeyPart } from './StringUtils';
import type { RuntimeBackgroundPayload, RuntimeContentPayload } from '../transport-types';
import { decodeRuntimeTransportMessage } from '../transport-parser';
import type {
  NormalizedContentEvent,
} from './runtime-types';

export function normalizeContentEvent(input: unknown): NormalizedContentEvent | null {
  const decoded = decodeRuntimeTransportMessage(input);
  if (!decoded) {
    return null;
  }
  const msg: RuntimeBackgroundPayload = decoded.background;
  const content: RuntimeContentPayload | null = decoded.content;
  const devtoolsCandidate = decoded.devtools;

  const rxKind = normalizeRxKind(devtoolsCandidate.kind);
  const kindLabel = rxKind ? rxKind.toUpperCase() : 'EVENT';
  const source = devtoolsCandidate.source || {};
  const label = firstString(source.label, devtoolsCandidate.observableId, devtoolsCandidate.instanceId);
  const domainRaw = firstString(source.domain);
  const domain = (domainRaw || 'unknown').toLowerCase();
  const observableLabel =
    devtoolsCandidate.observableId || label || devtoolsCandidate.instanceId || kindLabel;
  const observableKey = sanitizeLaneKeyPart(domain ? `${domain}:${observableLabel}` : observableLabel);
  const subscriptionLabel = devtoolsCandidate.subscriptionId || devtoolsCandidate.instanceId || 'default';
  const subscriptionKey = sanitizeLaneKeyPart(subscriptionLabel);
  const laneKey = `${observableKey}/${subscriptionKey}`;
  const timestamp =
    pickFirstNumber(devtoolsCandidate.ts, msg.meta?.time, msg.time, msg.ts, msg.timestamp) ??
    Date.now();
  const tabId = typeof msg.tabId === 'number' ? msg.tabId : undefined;

  return {
    type: label ? `${kindLabel} • ${label}` : kindLabel,
    kind: rxKind || 'event',
    rxKind,
    label,
    domain,
    observableId: devtoolsCandidate.observableId,
    instanceId: devtoolsCandidate.instanceId,
    subscriptionId: devtoolsCandidate.subscriptionId,
    time: timestamp,
    ts: devtoolsCandidate.ts,
    data: devtoolsCandidate.data,
    meta: devtoolsCandidate.meta,
    source: devtoolsCandidate.source,
    laneKey,
    tabId,
    raw: { background: msg, content, devtools: devtoolsCandidate },
  };
}
