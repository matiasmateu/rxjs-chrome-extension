/**
 * Formats a leaf value from the JSON tree into a compact printable string.
 *
 * @param v Raw leaf value.
 * @returns String representation suitable for monospace display.
 */
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

function simplify(x: unknown): unknown {
  if (x && typeof x === 'object') return Array.isArray(x) ? `Array(${x.length})` : 'Object';
  if (typeof x === 'string') return x.length > 24 ? `${x.slice(0, 21)}…` : x;
  return x;
}

/**
 * Produces a short preview shape for complex values used in collapsed tree rows.
 *
 * @param v Raw value.
 * @returns Simplified preview value.
 */
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

/**
 * Truncates long text and appends an ellipsis when the limit is exceeded.
 *
 * @param s Source string.
 * @param n Max length.
 * @returns Original or truncated string.
 */
export function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
