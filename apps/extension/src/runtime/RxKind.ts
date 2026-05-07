/**
 * Normalizes Rx lifecycle kinds to lowercase text.
 *
 * @param value Raw kind value.
 * @returns Lowercase kind or empty string when invalid.
 */
export function normalizeRxKind(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

/**
 * Draws the marble glyph for a given Rx lifecycle kind.
 *
 * @param ctx Canvas rendering context.
 * @param rawKind Raw lifecycle kind.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @param r Base radius.
 * @param color Fill/stroke color.
 * @returns Nothing.
 */
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
