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
