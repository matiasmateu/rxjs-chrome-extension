/**
 * Returns the first finite number from a list of candidate values.
 *
 * @param values Candidate values checked in order.
 * @returns First finite number, or `undefined` when no numeric value is found.
 */
export function pickFirstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

/**
 * Formats a Unix timestamp (milliseconds) as `HH:mm:ss.SSS`.
 *
 * @param ms Timestamp in milliseconds.
 * @returns Human-readable local time string.
 */
export function fmtTime(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const msPart = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${msPart}`;
}

/**
 * Returns the first non-empty string from candidate values.
 *
 * @param values Candidate values checked in order.
 * @returns Trimmed string, or empty string when none is available.
 */
export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * Normalizes a type-like label and strips prefix segments like `KIND • Label`.
 *
 * @param value Raw candidate value.
 * @returns Normalized label text, or empty string when invalid.
 */
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

/**
 * Converts domain keys (for example `user_profile`) into display text (`User Profile`).
 *
 * @param domain Raw domain key.
 * @returns Prettified domain label, or empty string when missing.
 */
export function prettifyDomain(domain?: string): string {
  if (!domain) return '';
  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Finds the first valid timestamp in milliseconds from mixed inputs.
 *
 * Accepts numeric timestamps directly and ISO/date strings via `Date.parse`.
 *
 * @param values Candidate timestamp values.
 * @returns Timestamp in milliseconds, or `undefined` when no valid value is found.
 */
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
