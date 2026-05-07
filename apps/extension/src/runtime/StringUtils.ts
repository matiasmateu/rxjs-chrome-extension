/**
 * Returns the first non-empty trimmed string from candidate values.
 *
 * @param values Candidate values checked in order.
 * @returns Trimmed string or empty string.
 */
export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * Sanitizes a lane-key fragment for safe composite key generation.
 *
 * @param value Raw fragment value.
 * @returns Normalized string with `/` replaced by `_`, or `unknown`.
 */
export function sanitizeLaneKeyPart(value: unknown): string {
  if (value == null) return 'unknown';
  const str = String(value).trim();
  if (!str) return 'unknown';
  return str.replace(/\//g, '_');
}

/**
 * Truncates a string to a max size and appends an ellipsis.
 *
 * @param s Source string.
 * @param n Max length.
 * @returns Original or truncated text.
 */
export function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
