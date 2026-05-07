import {
  NOW_MARKER_OFFSET,
  ZOOM_IN_FACTOR,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_OUT_FACTOR,
} from './constants';
import type { DragState, MouseState } from './runtime-types';

type ViewportState = {
  width: number;
  xZoom: number;
  worldOffsetPx: number;
  worldOffsetPy: number;
};

type InteractionControllerOptions = {
  getCanvas: () => HTMLCanvasElement | null;
  getViewportState: () => ViewportState;
  updateViewportState: (patch: Partial<Omit<ViewportState, 'width'>>) => void;
  getHoverId: () => number | null;
  onPin: (id: number | null) => void;
  onClearTooltip: () => void;
  onToggleRunning: () => void;
};

function clampZoom(next: number) {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
}

export class InteractionController {
  mouse: MouseState;
  dragStart: DragState;
  private readonly options: InteractionControllerOptions;

  constructor(options: InteractionControllerOptions) {
    this.options = options;
    this.mouse = { x: 0, y: 0, down: false };
    this.dragStart = null;
  }

  handleMouseMove = (e: MouseEvent) => {
    const canvas = this.options.getCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  handleMouseDown = () => {
    const { worldOffsetPx, worldOffsetPy } = this.options.getViewportState();
    this.mouse.down = true;
    this.dragStart = {
      x: this.mouse.x,
      y: this.mouse.y,
      offsetX: worldOffsetPx,
      offsetY: worldOffsetPy,
    };
  };

  handleMouseUp = () => {
    this.mouse.down = false;
    this.dragStart = null;
  };

  handleWheel = (e: WheelEvent) => {
    if (e.shiftKey) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const factor = delta > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
    const { width } = this.options.getViewportState();
    this.zoomAtX(width - NOW_MARKER_OFFSET, factor);
  };

  handleCanvasClick = () => {
    const hoverId = this.options.getHoverId();
    if (hoverId != null) {
      this.options.onPin(hoverId);
      return;
    }

    this.options.onPin(null);
    this.options.onClearTooltip();
  };

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    this.options.onToggleRunning();
  };

  setZoom = (next: number) => {
    this.options.updateViewportState({ xZoom: clampZoom(next) });
  };

  zoomAtX = (anchorX: number, factor: number) => {
    const { width, xZoom, worldOffsetPx } = this.options.getViewportState();
    const nextZoom = clampZoom(xZoom * factor);
    if (nextZoom === xZoom) return;

    const anchor = Number.isFinite(anchorX) ? anchorX : width - NOW_MARKER_OFFSET;
    const anchorOffsetPx = width - NOW_MARKER_OFFSET - anchor;
    const projectedDistancePx = anchorOffsetPx + worldOffsetPx;
    const nextWorldOffsetPx = projectedDistancePx * (nextZoom / xZoom) - anchorOffsetPx;

    this.options.updateViewportState({
      xZoom: nextZoom,
      worldOffsetPx: Number.isFinite(nextWorldOffsetPx) ? nextWorldOffsetPx : worldOffsetPx,
    });
  };

  zoomByFactor = (factor: number) => {
    const { xZoom } = this.options.getViewportState();
    this.setZoom(xZoom * factor);
  };

  zoomIn = () => {
    const { width } = this.options.getViewportState();
    this.zoomAtX(width - NOW_MARKER_OFFSET, ZOOM_IN_FACTOR);
  };

  zoomOut = () => {
    const { width } = this.options.getViewportState();
    this.zoomAtX(width - NOW_MARKER_OFFSET, ZOOM_OUT_FACTOR);
  };
}
