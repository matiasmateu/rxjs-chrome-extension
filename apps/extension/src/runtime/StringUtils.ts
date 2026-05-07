export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function sanitizeLaneKeyPart(value: unknown): string {
  if (value == null) return 'unknown';
  const str = String(value).trim();
  if (!str) return 'unknown';
  return str.replace(/\//g, '_');
}

export function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
