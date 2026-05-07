import type { TooltipState } from '../types';
import { drawRxKindGlyph, extractFilterTags, fmtTime, hashColor, truncate } from '../utils';
import { DISABLED_LANE_STROKE, DISABLED_MARBLE_COLOR, HOVER_ICON_COLOR, MAX_AUTO_LANES as DEFAULT_MAX_AUTO_LANES, NOW_MARKER_OFFSET, PX_PER_SEC, SELECTED_GLOW_COLOR, SELECTED_RING_COLOR, ZOOM_IN_FACTOR, ZOOM_MAX, ZOOM_MIN, ZOOM_OUT_FACTOR } from './constants';
import { FilterRegistry } from './FilterRegistry';
import { LaneActivity } from './LaneActivity';
import { LaneLayout } from './LaneLayout';
import { normalizeContentEvent as normalizeContentEventPayload } from './normalizeContentEvent';
import { PanelTransport } from './PanelTransport';
import type { Marble, RuntimeOptions } from './runtime-types';

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

  marbles: Marble[];
  nextId: number;
  totalEvents: number;

  hoverId: number | null;
  pinnedId: number | null;
  lastTooltipPayload: TooltipState | null;
  
  filteredLaneMap: Map<number, number>;

  mouse: { x: number; y: number; down: boolean };
  dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null;

  transport: PanelTransport;
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
    this.zoomAtX(this.width - NOW_MARKER_OFFSET, factor);
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
    this.transport.disconnect();
  };

  setZoom = (next: number) => {
    this.xZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
  };

  zoomAtX = (anchorX: number, factor: number) => {
    const prevZoom = this.xZoom;
    const nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prevZoom * factor));
    if (nextZoom === prevZoom) return;
    const anchor = Number.isFinite(anchorX) ? anchorX : this.width - NOW_MARKER_OFFSET;
    const anchorOffset = this.width - NOW_MARKER_OFFSET - anchor;
    const dtSec = (anchorOffset + this.worldOffsetPx) / (PX_PER_SEC * prevZoom);
    this.xZoom = nextZoom;
    this.worldOffsetPx = 0; // keep the "now" marker anchored when zooming
  };

  zoomByFactor = (factor: number) => {
    this.setZoom(this.xZoom * factor);
  };

  zoomIn = () => {
    this.zoomAtX(this.width - NOW_MARKER_OFFSET, ZOOM_IN_FACTOR);
  };

  zoomOut = () => {
    this.zoomAtX(this.width - NOW_MARKER_OFFSET, ZOOM_OUT_FACTOR);
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
  };

  handleNavigated = () => {
    this.pushMarble({ type: 'NAVIGATED' });
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
    this.filteredLaneMap = new Map();

    this.mouse = { x: 0, y: 0, down: false };
    this.dragStart = null;

    this.transport = new PanelTransport({
      getInspectedTabId: () => chrome.devtools.inspectedWindow.tabId,
      onPortMessage: this.handlePortMessage,
      onPortDisconnected: this.handlePortDisconnect,
      onPanelNavigated: this.handleNavigated,
      onConnectError: (error) => console.error('Failed to connect', error),
      reconnectDelayMs: 500,
      autoReconnect: true,
    });
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

    this.transport.disconnect();

    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
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

    // Draw alternating background colors for each observable group
    if (this.laneLayout.groupBoundaries.length) {
      const colors = ['rgba(30, 58, 138, 0.08)', 'rgba(17, 24, 39, 0.08)']; // Subtle blue and dark
      for (let i = 0; i < this.laneLayout.groupBoundaries.length; i++) {
        const group = this.laneLayout.groupBoundaries[i];
        const startY = this.laneY(group.start);
        const endY = this.laneY(Math.max(group.start, group.end - 1));
        const height = endY - startY + (this.laneLayout.laneMetrics(this.height).step);
        
        ctx.fillStyle = colors[i % 2];
        ctx.fillRect(0, startY - (this.laneLayout.laneMetrics(this.height).step / 2), this.width, height);
      }
    }

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

    // Draw thin dashed lines and labels for each subscription
    const labelWidth = 200; // Reserve space on the left for labels
    
    if (this.laneLayout.groupBoundaries.length) {
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 0.5;
      ctx.font = '11px ui-sans-serif, system-ui';
      ctx.textAlign = 'left';
      
      // Create a filtered lane mapping when domain filter is active
      this.filteredLaneMap.clear();
      let filteredLaneIndex = 0;
      
      if (this.filters.filterDomain) {
        for (let lane = 0; lane < this.laneLayout.lanes; lane++) {
          const laneKeys = this.laneLayout.laneIndexMap[lane];
          if (!laneKeys || laneKeys.size === 0) continue;
          
          // Check if this lane has any marbles that match the filter
          let hasMatch = false;
          for (const key of laneKeys) {
            const sampleMarble = this.marbles.find(m => m.laneKey === key);
            if (sampleMarble && this.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters)) {
              hasMatch = true;
              break;
            }
          }
          
          if (hasMatch) {
            this.filteredLaneMap.set(lane, filteredLaneIndex);
            filteredLaneIndex++;
          }
        }
      }
      
      for (const group of this.laneLayout.groupBoundaries) {
        // For single-lane groups, use the group label directly
        if (group.size === 1) {
          // Check if this lane has any marbles that match the filter
          const laneKeys = this.laneLayout.laneIndexMap[group.start];
          if (!laneKeys || laneKeys.size === 0) continue;
          
          // Check if any marble on this lane matches the domain filter
          let hasMatchingMarble = false;
          for (const key of laneKeys) {
            const sampleMarble = this.marbles.find(m => m.laneKey === key);
            if (sampleMarble && this.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters)) {
              hasMatchingMarble = true;
              break;
            }
          }
          
          if (!hasMatchingMarble && this.filters.filterDomain) continue;
          
          // Use filtered lane index if domain filter is active
          const displayLane = this.filters.filterDomain && this.filteredLaneMap.has(group.start) 
            ? this.filteredLaneMap.get(group.start)! 
            : group.start;
          const laneY = this.laneY(displayLane);
          const label = this.laneLayout.groupLabels.get(group.key) || group.key;
          const isDisabled = this.laneActivity.isLaneDisabledForIndex(group.start, this.laneLayout.laneIndexMap);
          
          // Draw dashed line
          ctx.strokeStyle = isDisabled ? DISABLED_LANE_STROKE : 'rgba(100, 116, 139, 0.3)';
          ctx.beginPath();
          ctx.moveTo(labelWidth, laneY);
          ctx.lineTo(this.width, laneY);
          ctx.stroke();
          
          // Draw label
          ctx.fillStyle = isDisabled ? '#6b7280' : '#94a3b8';
          ctx.fillText(truncate(label, 35), 8, laneY - 2);
        } else {
          // For multi-lane groups, iterate through each subscription
          // Get all observables for this group
          const allObservablesInGroup: Array<{ domain: string; key: string; absoluteLane: number }> = [];
          
          for (const domain of this.laneLayout.domainOrder) {
            const info = this.laneLayout.domainMap.get(domain);
            if (!info) continue;
            
            for (const [key, absoluteLane] of info.actions.entries()) {
              if (absoluteLane >= group.start && absoluteLane < group.end) {
                allObservablesInGroup.push({ domain, key, absoluteLane });
              }
            }
          }
          
          // Sort by absolute lane
          allObservablesInGroup.sort((a, b) => a.absoluteLane - b.absoluteLane);
          
          // Draw each subscription
          for (const { key, absoluteLane } of allObservablesInGroup) {
            // Check if this lane has any marbles that match the filter
            const sampleMarble = this.marbles.find(m => m.laneKey === key);
            if (this.filters.filterDomain && (!sampleMarble || !this.filters.matches(sampleMarble.msg?.label || '', sampleMarble.filters))) {
              continue;
            }
            
            // Use filtered lane index if domain filter is active
            const displayLane = this.filters.filterDomain && this.filteredLaneMap.has(absoluteLane)
              ? this.filteredLaneMap.get(absoluteLane)!
              : absoluteLane;
            const laneY = this.laneY(displayLane);
            const isDisabled = this.laneActivity.isLaneDisabledForIndex(absoluteLane, this.laneLayout.laneIndexMap);
            
            // Draw dashed line
            ctx.strokeStyle = isDisabled ? DISABLED_LANE_STROKE : 'rgba(100, 116, 139, 0.3)';
            ctx.beginPath();
            ctx.moveTo(labelWidth, laneY);
            ctx.lineTo(this.width, laneY);
            ctx.stroke();
            
            // Get the label from metadata
            const info = this.laneLayout.domainMap.get(this.laneLayout.extractLaneParts(key).domain);
            const metadata = info?.metadata.get(key);
            const label = metadata?.label || key.split('/').pop() || key;
            
            // Draw label
            ctx.fillStyle = isDisabled ? '#6b7280' : '#94a3b8';
            ctx.fillText(truncate(label, 35), 8, laneY - 2);
          }
        }
      }
      
      // Reset line dash
      ctx.setLineDash([]);
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
      const dy = this.mouse.y - this.dragStart.y;
      this.worldOffsetPy = this.dragStart.offsetY + dy;
      this.worldOffsetPx = 0; // lock horizontal position so marbles stay on the "now" line
    }

    for (let i = this.marbles.length - 1; i >= 0; i--) {
      const marble = this.marbles[i];
      const x = this.xForTime(marble.timeMs);
      if (x < -40 || x > this.width + 40) continue;

      const label = (marble.msg?.type || '').toString();
      const tags = marble.filters || null;

      if (!this.filters.matches(label, tags)) continue;

      // Use filtered lane position if domain filter is active
      const displayLane = this.filters.filterDomain && this.filteredLaneMap.has(marble.lane)
        ? this.filteredLaneMap.get(marble.lane)!
        : marble.lane;
      const y = this.laneY(displayLane);

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
    // Reset vertical offset to center view on filtered subscriptions
    this.worldOffsetPy = 0;
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
    return normalizeContentEventPayload(msg);
  }

  renderMessage(msg: any) {
    const normalized = this.normalizeContentEvent(msg);
    if (normalized) {
      this.pushMarble(normalized);
    }
  }

  connect() {
    this.transport.connect();
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
    const lane = this.laneLayout.resolveLaneKey(laneKey, this.marbles, msg);

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
