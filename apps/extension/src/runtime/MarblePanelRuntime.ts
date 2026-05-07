import type { TooltipState } from '../types';
import { drawGrid, drawMarbles } from './CanvasRenderer';
import { MAX_AUTO_LANES as DEFAULT_MAX_AUTO_LANES } from './constants';
import { FilterRegistry } from './FilterRegistry';
import { InteractionController } from './InteractionController';
import { LaneActivity } from './LaneActivity';
import { LaneLayout } from './LaneLayout';
import { MarbleStore } from './MarbleStore';
import { normalizeContentEvent as normalizeContentEventPayload } from './normalizeContentEvent';
import { RuntimeTransportAdapter, type RuntimeTransportEvent } from './RuntimeTransportAdapter';
import { buildTooltipState, tooltipStateChanged } from './TooltipStateBuilder';
import { laneYForIndex, xForTime } from './ViewportMath';
import type { NormalizedContentEvent, RuntimeMarbleMessage, RuntimeOptions } from './runtime-types';

export const MAX_AUTO_LANES = DEFAULT_MAX_AUTO_LANES;

export class MarblePanelRuntime {
  canvas: HTMLCanvasElement | null;
  stageWrap: HTMLDivElement | null;
  setStatsText: (text: string) => void;
  setTooltipState: (state: TooltipState) => void;
  setPinnedId: (id: number | null) => void;
  notifyRunningChange: (running: boolean) => void;

  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  DPR: number;

  running: boolean;
  xZoom: number;
  worldOffsetPx: number;
  worldOffsetPy: number;
  timeOriginMs: number;

  filters: FilterRegistry;
  laneLayout: LaneLayout;
  laneActivity: LaneActivity;
  marbleStore: MarbleStore;

  hoverId: number | null;
  pinnedId: number | null;
  lastTooltipPayload: TooltipState | null;

  filteredLaneMap: Map<number, number>;

  interactions: InteractionController;

  transport: RuntimeTransportAdapter;

  animationFrame: number | null;
  resizeObserver: ResizeObserver | null;

  get marbles() {
    return this.marbleStore.marbles;
  }

  handleTransportEvent = (event: RuntimeTransportEvent) => {
    if (event.type === 'message') {
      this.renderMessage(event.payload);
      return;
    }
    if (event.type === 'disconnected') {
      this.pushMarble({ type: 'INFO', text: 'Port disconnected. Reconnecting…' });
      return;
    }
    if (event.type === 'navigated') {
      this.pushMarble({ type: 'NAVIGATED' });
      return;
    }
    if (event.type === 'connect-error') {
      console.error('Failed to connect', event.error);
    }
  };

  handleUnload = () => {
    this.transport.disconnect();
  };

  setZoom = (next: number) => {
    this.interactions.setZoom(next);
  };

  zoomAtX = (anchorX: number, factor: number) => {
    this.interactions.zoomAtX(anchorX, factor);
  };

  zoomByFactor = (factor: number) => {
    this.interactions.zoomByFactor(factor);
  };

  zoomIn = () => {
    this.interactions.zoomIn();
  };

  zoomOut = () => {
    this.interactions.zoomOut();
  };

  frame = () => {
    if (this.running) {
      this.timeOriginMs = Date.now();
    }

    this.layout();
    if (this.ctx) {
      drawGrid({
        ctx: this.ctx,
        width: this.width,
        height: this.height,
        timeOriginMs: this.timeOriginMs,
        xZoom: this.xZoom,
        worldOffsetPx: this.worldOffsetPx,
        worldOffsetPy: this.worldOffsetPy,
        filters: this.filters,
        laneLayout: this.laneLayout,
        laneActivity: this.laneActivity,
        marbles: this.marbles,
        laneSamplesByKey: this.marbleStore.laneSamplesByKey,
        filteredLaneMap: this.filteredLaneMap,
      });
      const marbleResult = drawMarbles({
        ctx: this.ctx,
        width: this.width,
        height: this.height,
        timeOriginMs: this.timeOriginMs,
        xZoom: this.xZoom,
        worldOffsetPx: this.worldOffsetPx,
        worldOffsetPy: this.worldOffsetPy,
        filters: this.filters,
        laneLayout: this.laneLayout,
        laneActivity: this.laneActivity,
        marbles: this.marbles,
        laneSamplesByKey: this.marbleStore.laneSamplesByKey,
        filteredLaneMap: this.filteredLaneMap,
        mouse: this.interactions.mouse,
        dragStart: this.interactions.dragStart,
        pinnedId: this.pinnedId,
      });
      this.hoverId = marbleResult.hoverId;
      this.worldOffsetPx = marbleResult.worldOffsetPx;
      this.worldOffsetPy = marbleResult.worldOffsetPy;
    }
    this.updateTooltipState();

    this.animationFrame = requestAnimationFrame(this.frame);
  };

  constructor({
    canvasRef,
    stageRef,
    setStatsText,
    setTooltipState,
    setPinnedId,
    notifyRunningChange,
    syncLaneCount,
    initialLanes,
    initialFilter,
    initialDomainFilter,
    initialRunning,
    setFilterOptions,
    maxAutoLanes = MAX_AUTO_LANES,
  }: RuntimeOptions) {
    this.canvas = canvasRef.current;
    this.stageWrap = stageRef.current;
    this.setStatsText = setStatsText;
    this.setTooltipState = setTooltipState;
    this.setPinnedId = setPinnedId;
    this.notifyRunningChange = notifyRunningChange;

    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.DPR = window.devicePixelRatio || 1;

    this.running = initialRunning;
    this.xZoom = 1;
    this.worldOffsetPx = 0;
    this.worldOffsetPy = 0;
    this.timeOriginMs = Date.now();

    this.filters = new FilterRegistry(initialFilter, initialDomainFilter, setFilterOptions);
    this.laneLayout = new LaneLayout(initialLanes, maxAutoLanes, syncLaneCount);
    this.laneActivity = new LaneActivity();
    this.marbleStore = new MarbleStore({
      filters: this.filters,
      laneLayout: this.laneLayout,
      laneActivity: this.laneActivity,
      onStatsChange: (count) => this.setStatsText(`${count} event${count === 1 ? '' : 's'}`),
    });

    this.hoverId = null;
    this.pinnedId = null;
    this.lastTooltipPayload = null;
    this.filteredLaneMap = new Map();

    this.interactions = new InteractionController({
      getCanvas: () => this.canvas,
      getViewportState: () => ({
        width: this.width,
        xZoom: this.xZoom,
        worldOffsetPx: this.worldOffsetPx,
        worldOffsetPy: this.worldOffsetPy,
      }),
      updateViewportState: (patch) => {
        if (patch.xZoom != null) this.xZoom = patch.xZoom;
        if (patch.worldOffsetPx != null) this.worldOffsetPx = patch.worldOffsetPx;
        if (patch.worldOffsetPy != null) this.worldOffsetPy = patch.worldOffsetPy;
      },
      getHoverId: () => this.hoverId,
      onPin: (id) => this.setPinned(id),
      onClearTooltip: () => this.publishTooltip(null),
      onToggleRunning: () => this.toggleRunningFromRuntime(),
    });

    this.transport = new RuntimeTransportAdapter({
      getInspectedTabId: () => chrome.devtools.inspectedWindow.tabId,
      onEvent: this.handleTransportEvent,
      reconnectDelayMs: 500,
      autoReconnect: true,
    });

    this.animationFrame = null;
    this.resizeObserver = null;

    this.init();
  }

  init() {
    if (!this.canvas || !this.stageWrap) return;

    this.fitCanvas();

    this.canvas.addEventListener('mousemove', this.interactions.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.interactions.handleMouseDown);
    this.canvas.addEventListener('wheel', this.interactions.handleWheel, { passive: false });
    this.canvas.addEventListener('click', this.interactions.handleCanvasClick);
    window.addEventListener('mouseup', this.interactions.handleMouseUp);
    window.addEventListener('keydown', this.interactions.handleKeyDown);
    window.addEventListener('unload', this.handleUnload);

    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(this.stageWrap);

    this.layout();
    this.animationFrame = requestAnimationFrame(this.frame);

    this.transport.connect();
  }

  dispose() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.canvas?.removeEventListener('mousemove', this.interactions.handleMouseMove);
    this.canvas?.removeEventListener('mousedown', this.interactions.handleMouseDown);
    this.canvas?.removeEventListener('wheel', this.interactions.handleWheel);
    this.canvas?.removeEventListener('click', this.interactions.handleCanvasClick);
    window.removeEventListener('mouseup', this.interactions.handleMouseUp);
    window.removeEventListener('keydown', this.interactions.handleKeyDown);
    window.removeEventListener('unload', this.handleUnload);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.transport.disconnect();
  }

  layout() {
    this.fitCanvas();
  }

  fitCanvas() {
    if (!this.stageWrap || !this.canvas) return;
    const width = this.stageWrap.clientWidth || 1;
    const height = this.stageWrap.clientHeight || 1;
    const dpr = window.devicePixelRatio || 1;

    if (this.width !== width || this.height !== height || this.DPR !== dpr) {
      this.width = width;
      this.height = height;
      this.DPR = dpr;
      this.canvas.width = Math.max(1, Math.floor(width * dpr));
      this.canvas.height = Math.max(1, Math.floor(height * dpr));
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }

  updateTooltipState() {
    const targetId = this.pinnedId ?? this.hoverId;
    const marble = this.marbleStore.getById(targetId);

    if (!marble) {
      this.publishTooltip(
        buildTooltipState({
          marble: null,
          pinnedId: this.pinnedId,
          hoverId: this.hoverId,
        }),
        !this.lastTooltipPayload?.visible,
      );
      return;
    }

    const position = {
      x: xForTime(this, marble.timeMs),
      y: laneYForIndex(this, marble.lane),
    };

    this.publishTooltip(
      buildTooltipState({
        marble,
        pinnedId: this.pinnedId,
        hoverId: this.hoverId,
        position,
      }),
    );
  }

  toggleRunningFromRuntime() {
    const next = !this.running;
    this.notifyRunningChange(next);
  }

  setRunningFromReact(flag: boolean) {
    if (this.running === flag) return;
    this.running = flag;
    if (flag) this.timeOriginMs = Date.now();
  }

  setLanes(value: number) {
    this.laneLayout.setLanes(value);
  }

  setFilterText(value: string) {
    this.filters.setText(value);
  }

  setFilterDomain(value: string) {
    this.filters.setDomain(value);
    // Reset vertical offset to center view on filtered subscriptions
    this.worldOffsetPy = 0;
  }

  clear() {
    this.marbleStore.clear();
    this.clearPinnedTooltip();
    this.hoverId = null;
    this.laneLayout.clear();
    this.laneActivity.clear();
    this.filters.clear();
    this.laneLayout.updateStructure(false, this.marbles);
  }

  togglePinFromPanel() {
    if (this.pinnedId != null) {
      this.clearPinnedTooltip();
      return;
    }

    if (this.hoverId != null) {
      this.setPinned(this.hoverId);
    }
  }

  closeTooltipFromPanel() {
    this.clearPinnedTooltip();
  }

  private clearPinnedTooltip() {
    this.setPinned(null);
    this.publishTooltip(null);
  }

  private normalizeContentEvent(msg: unknown): NormalizedContentEvent | null {
    return normalizeContentEventPayload(msg);
  }

  private renderMessage(msg: unknown) {
    const normalized = this.normalizeContentEvent(msg);
    if (normalized) {
      this.pushMarble(normalized);
    }
  }

  private pushMarble(msg: RuntimeMarbleMessage) {
    this.marbleStore.push(msg);
  }

  private publishTooltip(payload: TooltipState | null, silent = false) {
    const normalized =
      payload ||
      buildTooltipState({
        marble: null,
        pinnedId: this.pinnedId,
        hoverId: this.hoverId,
      });

    if (tooltipStateChanged(this.lastTooltipPayload, normalized)) {
      this.lastTooltipPayload = normalized;
      if (!silent) this.setTooltipState(normalized);
    }
  }

  private setPinned(id: number | null) {
    if (this.pinnedId === id) return;
    this.pinnedId = id;
    this.setPinnedId(id);
  }
}
