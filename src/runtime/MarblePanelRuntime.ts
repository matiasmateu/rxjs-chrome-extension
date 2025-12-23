import type { FilterOptions, FilterTags, TooltipState } from '../types';
import {
  drawRxKindGlyph,
  extractFilterTags,
  fmtTime,
  firstString,
  hashColor,
  isRxDevtoolsMessage,
  normalizeRxKind,
  pickFirstNumber,
  sanitizeLaneKeyPart,
  truncate,
} from '../utils';

const PX_PER_SEC = 120;
const NOW_MARKER_OFFSET = 80;
export const MAX_AUTO_LANES = 128;
const LANE_STROKE_COLOR = '#213145';
const DISABLED_LANE_STROKE = '#4b5563';
const DISABLED_MARBLE_COLOR = '#6b7280';
const LANE_PAD = 24;
const LANE_GROUP_GAP = 0.7;
const LANE_GROUP_LABEL_COLOR = '#8fb1d9';
const LANE_GROUP_LABEL_FONT = '12px ui-sans-serif, system-ui';
const LANE_GROUP_SEPARATOR = '#2a3b52';
const SELECTED_RING_COLOR = 'rgba(147, 197, 253, 0.9)';
const SELECTED_GLOW_COLOR = 'rgba(59, 130, 246, 0.6)';
const HOVER_ICON_COLOR = '#dbeafe';
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 50;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;

type RefObject<T> = { current: T | null };

type RuntimeOptions = {
  canvasRef: RefObject<HTMLCanvasElement>;
  stageRef: RefObject<HTMLDivElement>;
  setStatsText: (text: string) => void;
  setTooltipState: (state: TooltipState) => void;
  setPinnedId: (id: number | null) => void;
  notifyRunningChange: (running: boolean) => void;
  syncLaneCount?: (lanes: number) => void;
  initialLanes: number;
  initialFilter: string;
  initialDomainFilter: string;
  initialRunning: boolean;
  setFilterOptions?: (options: FilterOptions) => void;
  maxAutoLanes?: number;
};

type DomainInfo = {
  actions: Map<string, number>;
  baseOffset: number;
};

type LaneStatus = {
  activeCount: number;
  disabled: boolean;
};

type SubscriptionState = {
  laneKey: string;
  active: boolean;
};

type Marble = {
  id: number;
  timeMs: number;
  r: number;
  color: string;
  msg: any;
  laneKey: string;
  lane: number;
  filters: FilterTags;
};

type GroupBoundary = {
  key: string;
  start: number;
  end: number;
  size: number;
};

class FilterRegistry {
  filterText: string;
  filterDomain: string;
  filterDomains: Map<string, string>;
  notifyFilterOptions: ((options: FilterOptions) => void) | null;

  constructor(
    initialText: string,
    initialDomain: string,
    notifyFilterOptions?: (options: FilterOptions) => void,
  ) {
    this.filterText = (initialText || '').trim().toLowerCase();
    this.filterDomain = (initialDomain || '').toLowerCase();
    this.filterDomains = new Map();
    this.notifyFilterOptions = notifyFilterOptions || null;
  }

  setText = (value: string) => {
    this.filterText = (value || '').trim().toLowerCase();
  };

  setDomain = (value: string) => {
    this.filterDomain = (value || '').toLowerCase();
  };

  matches = (label: string, tags: FilterTags | null) => {
    const matchesText = !this.filterText || label.toLowerCase().includes(this.filterText);
    const matchesDomain =
      !this.filterDomain || (tags?.domainKey && tags.domainKey === this.filterDomain);
    return matchesText && matchesDomain;
  };

  ingest = (tags: FilterTags | null) => {
    if (!tags) return;
    let changed = false;

    if (tags.domainKey) {
      const label = tags.domainLabel || tags.domainKey;
      if (!this.filterDomains.has(tags.domainKey)) {
        this.filterDomains.set(tags.domainKey, label);
        changed = true;
      }
    }

    if (changed && this.notifyFilterOptions) {
      const domains = Array.from(this.filterDomains.entries()).map(([value, label]) => ({
        value,
        label: label || value,
      }));

      domains.sort((a, b) => a.label.localeCompare(b.label));

      this.notifyFilterOptions({ domains });
    }
  };

  clear = () => {
    this.filterDomains.clear();
    if (this.notifyFilterOptions) {
      this.notifyFilterOptions({ domains: [] });
    }
  };
}

class LaneActivity {
  laneStatus: Map<string, LaneStatus> = new Map();
  subscriptionState: Map<string, SubscriptionState> = new Map();

  update = (laneKey: string, kind?: string, subscriptionId?: string) => {
    if (!laneKey) return;
    const rxKind = normalizeRxKind(kind);
    if (!rxKind) return;
    const subscriptionKey = subscriptionId ? `${laneKey}::${subscriptionId}` : null;

    if (rxKind === 'subscribe' || rxKind === 'create') {
      const state = this.laneStatus.get(laneKey) || { activeCount: 0, disabled: false };
      if (subscriptionKey) {
        const existing = this.subscriptionState.get(subscriptionKey);
        if (!existing || !existing.active) {
          this.subscriptionState.set(subscriptionKey, { laneKey, active: true });
          state.activeCount += 1;
        }
      } else {
        state.activeCount += 1;
      }
      state.disabled = false;
      this.laneStatus.set(laneKey, state);
      return;
    }

    const isTerminal = rxKind === 'complete' || rxKind === 'error' || rxKind === 'unsubscribe';
    if (!isTerminal) return;

    const sub = subscriptionKey ? this.subscriptionState.get(subscriptionKey) : null;
    const targetLaneKey = sub?.laneKey || laneKey;
    const state = this.laneStatus.get(targetLaneKey) || { activeCount: 0, disabled: false };

    if (subscriptionKey && sub) {
      if (sub.active) {
        state.activeCount = Math.max(0, state.activeCount - 1);
      }
      this.subscriptionState.delete(subscriptionKey);
    } else if (!subscriptionKey || rxKind !== 'unsubscribe') {
      state.activeCount = Math.max(0, state.activeCount - 1);
    }

    if (state.activeCount === 0) {
      state.disabled = true;
    }

    this.laneStatus.set(targetLaneKey, state);
  };

  isLaneDisabled = (laneKey: string) => {
    if (!laneKey) return false;
    const state = this.laneStatus.get(laneKey);
    return Boolean(state && state.disabled && state.activeCount <= 0);
  };

  isLaneDisabledForIndex = (laneIndex: number, laneIndexMap: Array<Set<string>>) => {
    const entries = laneIndexMap[laneIndex];
    if (!entries || entries.size === 0) return false;
    let hasState = false;
    for (const key of entries) {
      const state = this.laneStatus.get(key);
      if (!state) continue;
      hasState = true;
      if (state.activeCount > 0) return false;
      if (!state.disabled) return false;
    }
    return hasState;
  };

  clear = () => {
    this.laneStatus.clear();
    this.subscriptionState.clear();
  };
}

class LaneLayout {
  lanes: number;
  maxAutoLanes: number;
  syncLaneCount?: (lanes: number) => void;

  domainOrder: string[];
  domainMap: Map<string, DomainInfo>;
  laneIndexMap: Array<Set<string>>;
  groupBoundaries: GroupBoundary[];
  groupIndexByLane: number[];
  groupLabels: Map<string, string>;

  constructor(initialLanes: number, maxAutoLanes: number, syncLaneCount?: (lanes: number) => void) {
    this.lanes = initialLanes;
    this.maxAutoLanes = Math.max(1, maxAutoLanes);
    this.syncLaneCount = syncLaneCount;

    this.domainOrder = [];
    this.domainMap = new Map();
    this.laneIndexMap = [];
    this.groupBoundaries = [];
    this.groupIndexByLane = [];
    this.groupLabels = new Map();
  }

  setLanes = (value: number) => {
    const clamped = Math.max(1, Math.min(this.maxAutoLanes, value));
    this.lanes = clamped;
    if (this.syncLaneCount && clamped !== value) {
      this.syncLaneCount(clamped);
    }
    this.rebuildLaneIndexMap();
  };

  coerceLaneIndex = (index: number) => {
    if (!Number.isFinite(index) || index < 0) return 0;
    if (this.lanes <= 0) return 0;
    if (index < this.lanes) return index;
    return index % this.lanes;
  };

  extractLaneParts = (rawKey: string) => {
    const key = rawKey ? String(rawKey) : 'default';
    const slashIdx = key.indexOf('/');
    const domain = slashIdx > 0 ? key.slice(0, slashIdx) : key;
    const normalizedDomain = domain || 'default';
    return { key, domain: normalizedDomain };
  };

  registerGroupLabel = (laneKey: string, msg: any) => {
    const { domain } = this.extractLaneParts(laneKey);
    if (!domain) return;
    const existing = this.groupLabels.get(domain);
    if (existing && existing !== domain) return;
    const label = firstString(msg?.observableId, msg?.label, msg?.instanceId, domain);
    if (label) {
      this.groupLabels.set(domain, label);
    }
  };

  resolveLaneKey = (rawKey: string, marbles: Marble[]) => {
    return this.coerceLaneIndex(this.getLaneIndexForKey(rawKey, true, marbles));
  };

  getLaneIndexForKey = (rawKey: string, createIfMissing: boolean, marbles: Marble[] = []) => {
    const { key, domain } = this.extractLaneParts(rawKey);
    let info = this.domainMap.get(domain);
    let changed = false;

    if (!info) {
      if (!createIfMissing) return 0;
      info = { actions: new Map(), baseOffset: 0 };
      this.domainMap.set(domain, info);
      this.domainOrder.push(domain);
      changed = true;
    }

    if (!info.actions.has(key)) {
      if (!createIfMissing) return info.baseOffset;
      info.actions.set(key, info.actions.size);
      changed = true;
    }

    if (changed && createIfMissing) {
      this.updateStructure(true, marbles);
      info = this.domainMap.get(domain) || info;
    }

    const laneWithin = info.actions.get(key) ?? 0;
    const laneIndex = (info.baseOffset ?? 0) + laneWithin;
    return laneIndex;
  };

  updateStructure = (reassign: boolean, marbles: Marble[]) => {
    let offset = 0;
    const boundaries: GroupBoundary[] = [];
    const groupIndexByLane: number[] = [];
    let groupIndex = 0;
    for (const domain of this.domainOrder) {
      const info = this.domainMap.get(domain);
      if (!info) continue;
      const size = Math.max(1, info.actions.size || 0);
      info.baseOffset = offset;
      boundaries.push({ key: domain, start: offset, end: offset + size, size });
      for (let i = 0; i < size; i++) {
        groupIndexByLane[offset + i] = groupIndex;
      }
      offset += size;
      groupIndex += 1;
    }

    this.groupBoundaries = boundaries;
    this.groupIndexByLane = groupIndexByLane;

    const prevLanes = this.lanes;
    const totalLanes = offset > 0 ? offset : prevLanes || 1;
    const clamped = Math.max(1, Math.min(this.maxAutoLanes, totalLanes));
    this.lanes = clamped;
    if (this.syncLaneCount && clamped !== prevLanes) {
      this.syncLaneCount(clamped);
    }

    if (reassign) {
      this.reassignMarbleLanes(marbles);
    }
    this.rebuildLaneIndexMap();
  };

  rebuildLaneIndexMap = () => {
    const laneCount = Math.max(1, this.lanes);
    const nextMap = Array.from({ length: laneCount }, () => new Set<string>());

    for (const domain of this.domainOrder) {
      const info = this.domainMap.get(domain);
      if (!info) continue;
      for (const [key, offset] of info.actions.entries()) {
        const laneIndex = this.coerceLaneIndex((info.baseOffset ?? 0) + offset);
        nextMap[laneIndex].add(key);
      }
    }

    this.laneIndexMap = nextMap;
  };

  reassignMarbleLanes = (marbles: Marble[]) => {
    if (!marbles.length) return;
    for (const marble of marbles) {
      const laneKey =
        marble.laneKey ??
        marble.msg?.laneKey ??
        marble.msg?.observableId ??
        marble.msg?.label ??
        marble.msg?.type;
      const laneIndex = this.getLaneIndexForKey(laneKey, false);
      marble.lane = this.coerceLaneIndex(laneIndex);
    }
  };

  laneMetrics = (height: number) => {
    const pad = LANE_PAD;
    const inner = Math.max(1, height - pad * 2);
    const groupCount = Math.max(1, this.groupBoundaries.length || 1);
    const virtualLanes = this.lanes + Math.max(0, groupCount - 1) * LANE_GROUP_GAP;
    const step = inner / Math.max(1, virtualLanes);
    return { pad, step };
  };

  laneY = (lane: number, height: number) => {
    const { pad, step } = this.laneMetrics(height);
    const groupIndex = this.groupIndexByLane[lane] ?? 0;
    const virtualIndex = lane + groupIndex * LANE_GROUP_GAP;
    return pad + (virtualIndex + 0.5) * step;
  };

  clear = () => {
    this.domainOrder.length = 0;
    this.domainMap.clear();
    this.laneIndexMap = [];
    this.groupBoundaries = [];
    this.groupIndexByLane = [];
    this.groupLabels.clear();
  };
}

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

  marbles: Marble[];
  nextId: number;
  totalEvents: number;

  hoverId: number | null;
  pinnedId: number | null;
  lastTooltipPayload: TooltipState | null;

  mouse: { x: number; y: number; down: boolean };
  dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null;

  connecting: boolean;
  port: any;
  reconnectTimer: number | null;
  demoTimer: number | null;

  animationFrame: number | null;
  resizeObserver: ResizeObserver | null;

  handlePortMessage = (msg: any) => {
    this.renderMessage(msg);
  };

  handleMouseMove = (e: MouseEvent) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  handleMouseDown = () => {
    this.mouse.down = true;
    this.dragStart = {
      x: this.mouse.x,
      y: this.mouse.y,
      offsetX: this.worldOffsetPx,
      offsetY: this.worldOffsetPy,
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
    const anchorX = this.getAnchorXFromEvent(e);
    this.zoomAtX(anchorX, factor);
  };

  handleCanvasClick = () => {
    if (this.hoverId) {
      this.setPinned(this.hoverId);
    } else {
      this.setPinned(null);
      this.publishTooltip(null);
    }
  };

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.toggleRunningFromRuntime();
    }
  };

  handleUnload = () => {
    try {
      this.port?.disconnect();
    } catch {}
  };

  setZoom = (next: number) => {
    this.xZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
  };

  zoomAtX = (anchorX: number, factor: number) => {
    const prevZoom = this.xZoom;
    const nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prevZoom * factor));
    if (nextZoom === prevZoom) return;
    const anchor = Number.isFinite(anchorX) ? anchorX : this.width * 0.5;
    const anchorOffset = this.width - NOW_MARKER_OFFSET - anchor;
    const dtSec = (anchorOffset + this.worldOffsetPx) / (PX_PER_SEC * prevZoom);
    this.xZoom = nextZoom;
    this.worldOffsetPx = -anchorOffset + dtSec * PX_PER_SEC * nextZoom;
  };

  zoomByFactor = (factor: number) => {
    this.setZoom(this.xZoom * factor);
  };

  zoomIn = () => {
    this.zoomAtX(this.width * 0.5, ZOOM_IN_FACTOR);
  };

  zoomOut = () => {
    this.zoomAtX(this.width * 0.5, ZOOM_OUT_FACTOR);
  };

  getAnchorXFromEvent = (e: WheelEvent) => {
    if (!this.canvas) return this.width * 0.5;
    const rect = this.canvas.getBoundingClientRect();
    const anchorX = e.clientX - rect.left;
    const maxX = Math.max(1, this.width);
    return Math.max(0, Math.min(maxX, anchorX));
  };

  frame = () => {
    if (this.running) {
      this.timeOriginMs = Date.now();
    }

    this.layout();
    this.drawGrid();
    this.drawMarbles();
    this.updateTooltipState();

    this.animationFrame = requestAnimationFrame(this.frame);
  };

  handlePortDisconnect = () => {
    this.pushMarble({ type: 'INFO', text: 'Port disconnected. Reconnecting…' });
    this.connecting = false;
    this.reconnectTimer = window.setTimeout(() => this.connect(), 500);
  };

  handleNavigated = () => {
    try {
      this.port?.postMessage({ type: 'INIT', tabId: chrome.devtools.inspectedWindow.tabId });
      this.pushMarble({ type: 'NAVIGATED' });
    } catch {}
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

    this.marbles = [];
    this.nextId = 1;
    this.totalEvents = 0;

    this.hoverId = null;
    this.pinnedId = null;
    this.lastTooltipPayload = null;

    this.mouse = { x: 0, y: 0, down: false };
    this.dragStart = null;

    this.connecting = false;
    this.port = null;
    this.reconnectTimer = null;
    this.demoTimer = null;

    this.animationFrame = null;
    this.resizeObserver = null;

    this.init();
  }

  init() {
    if (!this.canvas || !this.stageWrap) return;

    this.fitCanvas();

    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('click', this.handleCanvasClick);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('unload', this.handleUnload);

    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(this.stageWrap);

    this.layout();
    this.animationFrame = requestAnimationFrame(this.frame);

    this.connect();
    this.startDemoMode();
  }

  dispose() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas?.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas?.removeEventListener('wheel', this.handleWheel);
    this.canvas?.removeEventListener('click', this.handleCanvasClick);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('unload', this.handleUnload);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.port) {
      try {
        this.port.disconnect();
      } catch {}
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }

    if (chrome?.devtools?.network?.onNavigated && this.handleNavigated) {
      chrome.devtools.network.onNavigated.removeListener(this.handleNavigated);
    }
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

  applyYTransform = (y: number) => {
    return y + this.worldOffsetPy;
  };

  laneY(lane: number) {
    const baseY = this.laneLayout.laneY(lane, this.height);
    return this.applyYTransform(baseY);
  }

  xForTime(ms: number) {
    const dtSec = (this.timeOriginMs - ms) / 1000;
    return this.width - NOW_MARKER_OFFSET - dtSec * PX_PER_SEC * this.xZoom + this.worldOffsetPx;
  }

  drawGrid() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.lineCap = 'butt';
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0b0f14');
    gradient.addColorStop(1, '#0a131d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = '#1e2a38';
    ctx.fillStyle = '#9fb6cf';
    ctx.font = '11px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';

    const rightMs = this.timeOriginMs;
    const rightSec = Math.floor(rightMs / 1000) * 1000;

    ctx.beginPath();
    for (let t = rightSec; ; t -= 1000) {
      const x = this.xForTime(t);
      if (x < -50) break;
      if (x <= this.width + 50) {
        ctx.moveTo(x, 18);
        ctx.lineTo(x, this.height);
        ctx.fillText(fmtTime(t), x, 12);
      }
    }
    ctx.stroke();

    for (let l = 0; l < this.laneLayout.lanes; l++) {
      const y = this.laneY(l);
      ctx.strokeStyle = this.laneActivity.isLaneDisabledForIndex(
        l,
        this.laneLayout.laneIndexMap,
      )
        ? DISABLED_LANE_STROKE
        : LANE_STROKE_COLOR;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    if (this.laneLayout.groupBoundaries.length > 1) {
      ctx.strokeStyle = LANE_GROUP_SEPARATOR;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      for (let i = 1; i < this.laneLayout.groupBoundaries.length; i++) {
        const start = this.laneLayout.groupBoundaries[i].start;
        const y = (this.laneY(start - 1) + this.laneY(start)) / 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }

    if (this.laneLayout.groupBoundaries.length) {
      ctx.fillStyle = LANE_GROUP_LABEL_COLOR;
      ctx.font = LANE_GROUP_LABEL_FONT;
      ctx.textAlign = 'left';
      for (const group of this.laneLayout.groupBoundaries) {
        const label = this.laneLayout.groupLabels.get(group.key) || group.key;
        const display = `Observable: ${truncate(label, 26)}`;
        const startY = this.laneY(group.start);
        const endY = this.laneY(Math.max(group.start, group.end - 1));
        let y = (startY + endY) / 2;
        if (group.size <= 1) y -= 8;
        ctx.fillText(display, 8, y);
      }
    }

    ctx.fillStyle = '#7aa2d3';
    ctx.fillRect(this.width - NOW_MARKER_OFFSET, 0, 2, this.height);
    ctx.textAlign = 'right';
    ctx.fillText(`now ${fmtTime(rightMs)}`, this.width - (NOW_MARKER_OFFSET + 4), 12);
    ctx.textAlign = 'left';
  }

  drawMarbles() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    this.hoverId = null;

    if (this.mouse.down && this.dragStart) {
      const dx = this.mouse.x - this.dragStart.x;
      const dy = this.mouse.y - this.dragStart.y;
      this.worldOffsetPx = this.dragStart.offsetX + dx;
      this.worldOffsetPy = this.dragStart.offsetY + dy;
    }

    for (let i = this.marbles.length - 1; i >= 0; i--) {
      const marble = this.marbles[i];
      const x = this.xForTime(marble.timeMs);
      if (x < -40 || x > this.width + 40) continue;

      const label = (marble.msg?.type || '').toString();
      const tags = marble.filters || null;

      if (!this.filters.matches(label, tags)) continue;

      const y = this.laneY(marble.lane);

      const laneDisabled = this.laneActivity.isLaneDisabled(marble.laneKey);
      const dx = this.mouse.x - x;
      const dy = this.mouse.y - y;
      const isHover = dx * dx + dy * dy < (marble.r + 6) * (marble.r + 6);
      if (isHover) {
        this.hoverId = marble.id;
      }
      const isPinned = this.pinnedId === marble.id;
      if (isPinned) {
        const ringRadius = marble.r + 7;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = SELECTED_RING_COLOR;
        ctx.lineWidth = 2;
        ctx.shadowColor = SELECTED_GLOW_COLOR;
        ctx.shadowBlur = 12;
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      const baseColor = laneDisabled ? DISABLED_MARBLE_COLOR : marble.color;
      const color = isHover && !isPinned ? HOVER_ICON_COLOR : baseColor;
      drawRxKindGlyph(ctx, marble.msg?.rxKind ?? marble.msg?.kind, x, y, marble.r, color);
    }
  }

  updateTooltipState() {
    const targetId = this.pinnedId ?? this.hoverId;
    const marble = targetId ? this.marbles.find((m) => m.id === targetId) : null;

    if (!marble) {
      if (this.lastTooltipPayload?.visible) {
        this.publishTooltip(null);
      } else {
        this.publishTooltip(null, true);
      }
      return;
    }

    const y = this.laneY(marble.lane);
    const x = this.xForTime(marble.timeMs);

    this.publishTooltip({
      visible: true,
      id: marble.id,
      pinned: this.pinnedId != null,
      canPin: this.pinnedId != null || this.hoverId != null,
      title: `${marble.msg?.type ?? 'Event'} • id:${marble.id} • ${fmtTime(marble.timeMs)}`,
      message: marble.msg,
      position: { x, y },
    });
  }

  publishTooltip(payload: TooltipState | null, silent = false) {
    const normalized =
      payload || ({
        visible: false,
        pinned: this.pinnedId != null,
        canPin: this.pinnedId != null || this.hoverId != null,
        message: null,
        position: { x: 0, y: 0 },
      } as TooltipState);

    const prev = this.lastTooltipPayload;
    const changed =
      !prev ||
      prev.visible !== normalized.visible ||
      prev.id !== normalized.id ||
      prev.pinned !== normalized.pinned ||
      prev.canPin !== normalized.canPin ||
      prev.message !== normalized.message ||
      prev.position?.x !== normalized.position?.x ||
      prev.position?.y !== normalized.position?.y ||
      prev.title !== normalized.title;

    if (changed) {
      this.lastTooltipPayload = normalized;
      if (!silent) this.setTooltipState(normalized);
    }
  }

  setPinned(id: number | null) {
    if (this.pinnedId === id) return;
    this.pinnedId = id;
    this.setPinnedId(id);
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
  }

  clear() {
    this.marbles.length = 0;
    this.totalEvents = 0;
    this.publishStats();
    this.setPinned(null);
    this.hoverId = null;
    this.publishTooltip(null);
    this.laneLayout.clear();
    this.laneActivity.clear();
    this.filters.clear();
    this.laneLayout.updateStructure(false, this.marbles);
  }

  publishStats() {
    const count = this.totalEvents;
    this.setStatsText(`${count} event${count === 1 ? '' : 's'}`);
  }

  normalizeContentEvent(msg: any) {
    if (!msg || typeof msg !== 'object') return null;
    const data = msg.data && typeof msg.data === 'object' ? msg.data : null;

    const devtoolsCandidate = data?.message ?? msg.message;
    if (isRxDevtoolsMessage(devtoolsCandidate)) {
      const rxKind = normalizeRxKind(devtoolsCandidate.kind);
      const kindLabel = rxKind ? rxKind.toUpperCase() : 'EVENT';
      const source = devtoolsCandidate.source || {};
      const label = firstString(
        source.label,
        devtoolsCandidate.observableId,
        devtoolsCandidate.instanceId,
      );
      const domainRaw = firstString(source.domain);
      const domain = (domainRaw || 'unknown').toLowerCase();
      const observableLabel =
        devtoolsCandidate.observableId || label || devtoolsCandidate.instanceId || kindLabel;
      const observableKey = sanitizeLaneKeyPart(
        domain ? `${domain}:${observableLabel}` : observableLabel,
      );
      const subscriptionLabel =
        devtoolsCandidate.subscriptionId || devtoolsCandidate.instanceId || 'default';
      const subscriptionKey = sanitizeLaneKeyPart(subscriptionLabel);
      const laneKey = `${observableKey}/${subscriptionKey}`;
      const timestamp =
        pickFirstNumber(
          devtoolsCandidate.ts,
          msg.meta?.time,
          msg.time,
          msg.ts,
          msg.timestamp,
        ) ?? Date.now();

      return {
        type: label ? `${kindLabel} • ${label}` : kindLabel,
        kind: rxKind || 'event',
        rxKind,
        label,
        domain,
        observableId: devtoolsCandidate.observableId,
        instanceId: devtoolsCandidate.instanceId,
        subscriptionId: devtoolsCandidate.subscriptionId,
        time: timestamp,
        ts: devtoolsCandidate.ts,
        data: devtoolsCandidate.data,
        meta: devtoolsCandidate.meta,
        source: devtoolsCandidate.source,
        laneKey,
        tabId: msg.tabId,
        raw: { background: msg, content: data, devtools: devtoolsCandidate },
      };
    }
    return null;
  }

  renderMessage(msg: any) {
    const normalized = this.normalizeContentEvent(msg);
    if (normalized) {
      this.pushMarble(normalized);
    }
  }

  connect() {
    if (this.connecting) return;
    this.connecting = true;

    try {
      this.port = chrome.runtime.connect({ name: 'rxjs-panel' });
      this.port.onMessage.addListener(this.handlePortMessage);
      this.port.onDisconnect.addListener(this.handlePortDisconnect);

      try {
        this.port.postMessage({
          type: 'INIT',
          tabId: chrome.devtools.inspectedWindow.tabId,
        });
      } catch {}

      if (chrome?.devtools?.network?.onNavigated) {
        chrome.devtools.network.onNavigated.removeListener(this.handleNavigated);
        chrome.devtools.network.onNavigated.addListener(this.handleNavigated);
      }
    } catch (err) {
      console.error('Failed to connect', err);
    }

    this.connecting = false;
  }

  startDemoMode() {
    const demoObservables = ['demo_obs_1', 'demo_obs_2', 'demo_obs_3'];
    this.demoTimer = window.setInterval(() => {
      if (this.totalEvents > 0) {
        clearInterval(this.demoTimer!);
        this.demoTimer = null;
        return;
      }
      const kinds = ['subscribe', 'next', 'complete', 'error', 'unsubscribe'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const idx = Math.floor(Math.random() * demoObservables.length);
      const ts = Date.now();
      const message = {
        kind,
        observableId: demoObservables[idx],
        instanceId: `demo_inst_${idx + 1}`,
        subscriptionId: `demo_sub_${idx + 1}`,
        ts,
        data: kind === 'next' ? { value: Math.round(Math.random() * 100) } : null,
        source: {
          domain: 'demo',
          label: `Demo ${idx + 1}`,
          operator: 'demo',
        },
      };
      this.renderMessage({ data: { message } });
    }, 600);
  }

  pushMarble(msg: any) {
    let time = Date.now();
    const candidate = msg && (msg.time ?? msg.ts ?? msg.timestamp ?? msg.date ?? msg.t);
    if (typeof candidate === 'number') {
      time = candidate;
    } else if (typeof candidate === 'string') {
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) time = parsed;
    }

    const type = msg && msg.type ? String(msg.type) : 'UNKNOWN';
    const laneSource = msg?.laneKey ?? msg?.label ?? type;
    const laneKey = laneSource == null ? type : String(laneSource);
    this.laneLayout.registerGroupLabel(laneKey, msg);
    this.laneActivity.update(laneKey, msg?.rxKind, msg?.subscriptionId);
    const lane = this.laneLayout.resolveLaneKey(laneKey, this.marbles);

    let color = hashColor(type);
    if (msg && msg.color != null) {
      if (typeof msg.color === 'string') {
        color = msg.color;
      } else if (typeof msg.color === 'number' && Number.isFinite(msg.color)) {
        const hue = ((msg.color % 360) + 360) % 360;
        color = `hsl(${hue}, 70%, 55%)`;
      }
    }

    const filters = extractFilterTags(msg || {});

    const marble: Marble = {
      id: this.nextId++,
      timeMs: time,
      r: 7,
      color,
      msg,
      laneKey,
      lane,
      filters,
    };
    this.marbles.push(marble);
    this.filters.ingest(filters);
    this.totalEvents++;
    this.publishStats();
  }
}
