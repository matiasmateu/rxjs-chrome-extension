/**
 * Generates a deterministic bright RGB color from a string key.
 *
 * @param str Source key (for example event type/lane id).
 * @returns Stable RGB color string.
 */
export function hashColor(str: string): string {
  const h = hashUint(str);
  const r = h & 0xff;
  const g = (h >>> 8) & 0xff;
  const b = (h >>> 16) & 0xff;
  return `rgb(${100 + (r % 156)}, ${100 + (g % 156)}, ${100 + (b % 156)})`;
}

type KindColor = {
  h: number;
  s: number;
  l: number;
};

const KIND_COLORS: Record<string, KindColor> = {
  next: { h: 154, s: 72, l: 56 },
  error: { h: 5, s: 78, l: 58 },
  complete: { h: 208, s: 24, l: 66 },
  unsubscribe: { h: 26, s: 72, l: 58 },
  subscribe: { h: 201, s: 78, l: 58 },
  create: { h: 223, s: 70, l: 60 },
  info: { h: 278, s: 54, l: 62 },
  navigated: { h: 288, s: 64, l: 62 },
  default: { h: 214, s: 64, l: 60 },
};

function hashUint(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeKind(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function formatHslColor(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Creates a stable semantic marble color.
 *
 * Base hue maps to Rx lifecycle kind; domain key introduces small deterministic tint shifts
 * so streams in different domains are still easy to distinguish.
 */
export function semanticMarbleColor({
  kind,
  type,
  domainKey,
}: {
  kind: unknown;
  type: string;
  domainKey: string;
}): string {
  const normalizedKind = normalizeKind(kind || type);
  const base = KIND_COLORS[normalizedKind] || KIND_COLORS.default;

  const domainSeed = domainKey || type || normalizedKind || 'default';
  const domainHash = hashUint(domainSeed);
  const hueShift = (domainHash % 19) - 9;
  const saturationShift = ((domainHash >>> 5) % 9) - 4;
  const lightnessShift = ((domainHash >>> 9) % 9) - 4;

  const hue = (base.h + hueShift + 360) % 360;
  const saturation = clamp(base.s + saturationShift, 44, 88);
  const lightness = clamp(base.l + lightnessShift, 45, 70);

  return formatHslColor(hue, saturation, lightness);
}
