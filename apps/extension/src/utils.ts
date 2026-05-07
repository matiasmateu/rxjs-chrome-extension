import type { FilterTags, MessageInfo } from './types';

export function hashColor(str: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = h & 0xff;
  const g = (h >>> 8) & 0xff;
  const b = (h >>> 16) & 0xff;
  return `rgb(${100 + (r % 156)}, ${100 + (g % 156)}, ${100 + (b % 156)})`;
}

export function pickFirstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

export function fmtTime(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const msPart = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${msPart}`;
}

export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function normalizeTypeLabel(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('•')) {
    const parts = trimmed.split('•');
    return parts[parts.length - 1].trim();
  }
  return trimmed;
}

export function prettifyDomain(domain?: string): string {
  if (!domain) return '';
  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeTimestampMs(...values: unknown[]): number | undefined {
  const numeric = pickFirstNumber(...values);
  if (typeof numeric === 'number') return numeric;
  for (const value of values) {
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

export function normalizeRxKind(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function sanitizeLaneKeyPart(value: unknown): string {
  if (value == null) return 'unknown';
  const str = String(value).trim();
  if (!str) return 'unknown';
  return str.replace(/\//g, '_');
}

export function isRxDevtoolsMessage(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.kind === 'string' &&
    typeof value.observableId === 'string' &&
    typeof value.instanceId === 'string' &&
    typeof value.subscriptionId === 'string' &&
    typeof value.ts === 'number' &&
    Number.isFinite(value.ts)
  );
}

export function extractFilterTags(message: any): FilterTags {
  const domainRaw = normalizeTypeLabel(firstString(message?.source?.domain, message?.domain));
  const domainKey = (domainRaw || 'unknown').toLowerCase();

  return {
    domainKey,
    domainLabel: domainRaw ? prettifyDomain(domainRaw) || domainRaw : 'Unknown',
  };
}

export function formatLeaf(v: unknown): string {
  const t = typeof v;
  if (v === null) return 'null';
  if (t === 'string') return JSON.stringify(v);
  if (t === 'number' || t === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return Object.prototype.toString.call(v);
  }
}

export function simplify(x: unknown): unknown {
  if (x && typeof x === 'object')
    return Array.isArray(x) ? `Array(${x.length})` : 'Object';
  if (typeof x === 'string') return x.length > 24 ? `${x.slice(0, 21)}…` : x;
  return x;
}

export function previewValue(v: unknown): unknown {
  if (v === null) return null;
  if (Array.isArray(v)) return v.slice(0, 3).map((x) => simplify(x));
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    let c = 0;
    for (const k of Object.keys(v)) {
      out[k] = simplify((v as Record<string, unknown>)[k]);
      if (++c >= 3) break;
    }
    return out;
  }
  return simplify(v);
}

export function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function drawRxKindGlyph(
  ctx: CanvasRenderingContext2D,
  rawKind: unknown,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  const kind = normalizeRxKind(rawKind);
  const size = r + 2;
  const shadow = 'rgba(0,0,0,.35)';

  if (kind === 'subscribe' || kind === 'create') {
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x - size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = shadow;
    ctx.stroke();
    return;
  }

  if (kind === 'complete' || kind === 'unsubscribe') {
    ctx.lineCap = 'round';
    ctx.strokeStyle = shadow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    return;
  }

  if (kind === 'error') {
    ctx.lineCap = 'round';
    ctx.strokeStyle = shadow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = shadow;
  ctx.stroke();
}

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
