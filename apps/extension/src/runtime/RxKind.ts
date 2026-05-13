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

function drawRoundedSquare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
) {
  const left = x - size;
  const top = y - size;
  const width = size * 2;
  const height = size * 2;

  ctx.beginPath();
  ctx.moveTo(left + radius, top);
  ctx.lineTo(left + width - radius, top);
  ctx.quadraticCurveTo(left + width, top, left + width, top + radius);
  ctx.lineTo(left + width, top + height - radius);
  ctx.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
  ctx.lineTo(left + radius, top + height);
  ctx.quadraticCurveTo(left, top + height, left, top + height - radius);
  ctx.lineTo(left, top + radius);
  ctx.quadraticCurveTo(left, top, left + radius, top);
  ctx.closePath();
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

/**
 * Draws a distinctive glyph set for epic invocation events.
 *
 * @param ctx Canvas rendering context.
 * @param rawKind Raw lifecycle kind.
 * @param x X coordinate.
 * @param y Y coordinate.
 * @param r Base radius.
 * @param color Fill/stroke color.
 */
export function drawEpicRxKindGlyph(
  ctx: CanvasRenderingContext2D,
  rawKind: unknown,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  const kind = normalizeRxKind(rawKind);
  const size = r + 2;
  const shadow = 'rgba(0,0,0,.4)';

  if (kind === 'subscribe' || kind === 'create') {
    ctx.beginPath();
    ctx.moveTo(x, y - size - 1);
    ctx.lineTo(x + size + 1, y);
    ctx.lineTo(x, y + size + 1);
    ctx.lineTo(x - size - 1, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = shadow;
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#0d131a';
    ctx.arc(x, y, Math.max(1.8, r * 0.3), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (kind === 'complete' || kind === 'unsubscribe') {
    drawRoundedSquare(ctx, x, y, size, 2);
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(17, 24, 39, 0.75)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(x - size + 2, y);
    ctx.lineTo(x + size - 2, y);
    ctx.stroke();
    return;
  }

  if (kind === 'error') {
    ctx.beginPath();
    ctx.moveTo(x, y - size - 1);
    ctx.lineTo(x + size + 1, y);
    ctx.lineTo(x, y + size + 1);
    ctx.lineTo(x - size - 1, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(127, 29, 29, 0.9)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.moveTo(x - size + 3, y - size + 3);
    ctx.lineTo(x + size - 3, y + size - 3);
    ctx.moveTo(x + size - 3, y - size + 3);
    ctx.lineTo(x - size + 3, y + size - 3);
    ctx.stroke();
    return;
  }

  drawRoundedSquare(ctx, x, y, size, 3);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = shadow;
  ctx.stroke();
}
