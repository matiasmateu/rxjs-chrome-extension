import {
  firstString,
  isRxDevtoolsMessage,
  normalizeRxKind,
  pickFirstNumber,
  sanitizeLaneKeyPart,
} from '../utils';

export function normalizeContentEvent(msg: any) {
  if (!msg || typeof msg !== 'object') return null;
  const data = msg.data && typeof msg.data === 'object' ? msg.data : null;

  const devtoolsCandidate = data?.message ?? msg.message;
  if (!isRxDevtoolsMessage(devtoolsCandidate)) {
    return null;
  }

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
    tabId: msg.tabId,
    raw: { background: msg, content: data, devtools: devtoolsCandidate },
  };
}
