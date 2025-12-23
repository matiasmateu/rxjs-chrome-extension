import React, { useState, useEffect, useRef, useCallback, useMemo } from './vendor/react.esm.js';
import { createRoot } from './vendor/react-dom.esm.js';

const e = React.createElement;

const ROOT_STYLE = {
  boxSizing: 'border-box',
  height: '100vh',
  width: '100vw',
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr auto',
  background: '#0b0f14',
  color: '#d6e2f0',
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
};

const TOOLBAR_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 12px',
  borderBottom: '1px solid #1d2733',
  background: '#0e141b',
};

const BASE_BTN_STYLE = {
  padding: '6px 10px',
  background: '#15202b',
  color: '#d6e2f0',
  border: '1px solid #223044',
  borderRadius: '10px',
  cursor: 'pointer',
};

const SMALL_BTN_STYLE = {
  padding: '4px 8px',
  fontSize: '12px',
  borderRadius: '8px',
  border: '1px solid #334155',
  background: '#0e141b',
  color: '#d6e2f0',
  cursor: 'pointer',
};

const STAGE_STYLE = {
  display: 'flex',
  minHeight: 0,
  overflow: 'hidden',
};

const CANVAS_STAGE_STYLE = {
  position: 'relative',
  flex: '1 1 auto',
  overflow: 'hidden',
  minWidth: 0,
};

const RIGHT_PANEL_STYLE = {
  flex: '0 0 320px',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: '1px solid #1d2733',
  background: '#0d131a',
  minWidth: '260px',
  minHeight: 0,
};

const RIGHT_PANEL_EMPTY_STYLE = {
  padding: '12px',
  fontSize: '12px',
  opacity: 0.7,
};

const LEGEND_STYLE = {
  padding: '6px 12px',
  borderTop: '1px solid #1d2733',
  fontSize: '12px',
  opacity: 0.8,
};

const TITLE_STYLE = {
  fontWeight: 600,
  letterSpacing: '0.3px',
};

const LANES_LABEL_STYLE = {
  opacity: 0.8,
};

const FILTER_INPUT_STYLE = {
  flex: 1,
  minWidth: '160px',
  padding: '6px 10px',
  borderRadius: '10px',
  border: '1px solid #243244',
  background: '#0b1117',
  color: '#d6e2f0',
};

const STATS_STYLE = {
  opacity: 0.7,
  fontVariantNumeric: 'tabular-nums',
};

const TIP_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  margin: '12px',
  background: 'rgba(16,24,32,.98)',
  border: '1px solid #334155',
  boxShadow: '0 6px 28px rgba(0,0,0,.5)',
  borderRadius: '12px',
  overflow: 'hidden',
  minHeight: 0,
};

const TIP_HEADER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '8px 10px',
  background: 'rgba(20,28,38,.9)',
  borderBottom: '1px solid #2a384b',
  fontSize: '12px',
};

const TIP_TITLE_STYLE = {
  opacity: 0.85,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const TIP_BTNS_STYLE = {
  display: 'flex',
  gap: '6px',
};

const TIP_SCROLL_STYLE = {
  flex: '1 1 auto',
  overflow: 'auto',
  padding: '10px 12px',
  minHeight: 0,
};

const TIP_CONTENT_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  lineHeight: 1.5,
};

const TIP_TREE_STYLE = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '12px',
  lineHeight: 1.4,
};

const FILTER_BAR_STYLE = {
  display: 'flex',
  gap: '14px',
  padding: '8px 12px',
  borderBottom: '1px solid #1d2733',
  background: '#0d131a',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const FILTER_GROUP_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

const FILTER_GROUP_LABEL_STYLE = {
  fontSize: '12px',
  opacity: 0.7,
  fontWeight: 600,
};

const FILTER_CHIP_STYLE = {
  padding: '6px 10px',
  borderRadius: '10px',
  border: '1px solid #243244',
  background: '#0b1117',
  color: '#d6e2f0',
  cursor: 'pointer',
  fontSize: '12px',
};

const FILTER_CHIP_ACTIVE_STYLE = {
  background: '#1b2a3b',
  borderColor: '#3b82f6',
  color: '#d6e8ff',
  boxShadow: '0 0 0 1px rgba(59,130,246,.35)',
};

const TIP_ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

const TIP_LABEL_STYLE = {
  fontSize: '12px',
  opacity: 0.8,
  fontWeight: 600,
};

const TIP_PILL_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: '10px',
  background: 'rgba(52,73,94,.35)',
  fontWeight: 600,
  letterSpacing: '0.2px',
  fontSize: '12px',
  width: 'fit-content',
  maxWidth: '100%',
  wordBreak: 'break-word',
};

const PX_PER_SEC = 120;
const NOW_MARKER_OFFSET = 80;
const MAX_AUTO_LANES = 128;
const LANE_STROKE_COLOR = '#213145';
const DISABLED_LANE_STROKE = '#4b5563';
const DISABLED_MARBLE_COLOR = '#6b7280';
const LANE_PAD = 24;
const LANE_GROUP_GAP = 0.7;
const LANE_GROUP_LABEL_COLOR = '#8fb1d9';
const LANE_GROUP_LABEL_FONT = '12px ui-sans-serif, system-ui';
const LANE_GROUP_SEPARATOR = '#2a3b52';

function hashColor(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = h & 0xff;
  const g = (h >>> 8) & 0xff;
  const b = (h >>> 16) & 0xff;
  return `rgb(${100 + (r % 156)}, ${100 + (g % 156)}, ${100 + (b % 156)})`;
}

function pickFirstNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function fmtTime(ms) {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeTypeLabel(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('•')) {
    const parts = trimmed.split('•');
    return parts[parts.length - 1].trim();
  }
  return trimmed;
}

function prettifyDomain(domain) {
  if (!domain) return '';
  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeTimestampMs(...values) {
  const numeric = pickFirstNumber(...values);
  if (typeof numeric === 'number') return numeric;
  for (const value of values) {
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizeRxKind(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function sanitizeLaneKeyPart(value) {
  if (value == null) return 'unknown';
  const str = String(value).trim();
  if (!str) return 'unknown';
  return str.replace(/\//g, '_');
}

function isRxDevtoolsMessage(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.kind === 'string' &&
    typeof value.observableId === 'string' &&
    typeof value.instanceId === 'string' &&
    typeof value.subscriptionId === 'string' &&
    typeof value.ts === 'number' &&
    Number.isFinite(value.ts)
  );
}

function extractFilterTags(message) {
  const domainRaw = normalizeTypeLabel(firstString(message?.source?.domain, message?.domain));
  const domainKey = (domainRaw || 'unknown').toLowerCase();

  return {
    domainKey,
    domainLabel: domainRaw ? prettifyDomain(domainRaw) || domainRaw : 'Unknown',
  };
}

function formatLeaf(v) {
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

function simplify(x) {
  if (x && typeof x === 'object')
    return Array.isArray(x) ? `Array(${x.length})` : 'Object';
  if (typeof x === 'string') return x.length > 24 ? `${x.slice(0, 21)}…` : x;
  return x;
}

function previewValue(v) {
  if (v === null) return null;
  if (Array.isArray(v)) return v.slice(0, 3).map((x) => simplify(x));
  if (typeof v === 'object') {
    const out = {};
    let c = 0;
    for (const k of Object.keys(v)) {
      out[k] = simplify(v[k]);
      if (++c >= 3) break;
    }
    return out;
  }
  return simplify(v);
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function drawRxKindGlyph(ctx, rawKind, x, y, r, color) {
  const kind = normalizeRxKind(rawKind);
  const size = r + 2;
  const shadow = 'rgba(0,0,0,.35)';

  if (kind === 'subscribe' || kind === 'create') {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
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
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
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

function buildJsonNodes(key, value, depth, visited) {
  const elements = [];
  const isObj = value && typeof value === 'object';
  const isArr = Array.isArray(value);

  if (!isObj) {
    const label = key ? `${JSON.stringify(key)}: ${formatLeaf(value)}` : formatLeaf(value);
    elements.push(
      e(
        'div',
        {
          key: key || 'leaf',
          style: { whiteSpace: 'pre' },
        },
        label,
      ),
    );
    return elements;
  }

  if (visited.has(value)) {
    const label = `${JSON.stringify(key)}: <circular>`;
    elements.push(
      e(
        'div',
        {
          key: `${key || 'root'}-circular`,
          style: { whiteSpace: 'pre' },
        },
        label,
      ),
    );
    return elements;
  }
  visited.add(value);

  const size = isArr ? value.length : Object.keys(value).length;
  const preview = truncate(JSON.stringify(previewValue(value)), 120);
  const summaryLabel = `${key ? `${JSON.stringify(key)}: ` : ''}${
    isArr ? `Array(${size})` : 'Object'
  } ${preview}`;

  const children = [];
  if (isArr) {
    for (let i = 0; i < value.length; i++) {
      children.push(...buildJsonNodes(String(i), value[i], depth + 1, visited));
    }
  } else {
    for (const k of Object.keys(value)) {
      children.push(...buildJsonNodes(k, value[k], depth + 1, visited));
    }
  }

  elements.push(
    e(
      'details',
      { key: key || 'root', open: depth < 1 },
      e('summary', { style: { cursor: 'pointer' } }, summaryLabel),
      e(
        'div',
        {
          style: {
            paddingLeft: '14px',
            borderLeft: '1px solid rgba(90,120,150,.25)',
            marginLeft: '6px',
          },
        },
        children,
      ),
    ),
  );

  return elements;
}

function JsonTree({ data }, ref) {
  const nodes = useMemo(() => buildJsonNodes('', data, 0, new WeakSet()), [data]);
  return e('div', { ref, style: TIP_TREE_STYLE }, nodes);
}

const ForwardJsonTree = React.forwardRef(JsonTree);

function extractMessageInfo(message) {
  const label = firstString(
    message?.source?.label,
    message?.label,
    message?.observableId,
    message?.instanceId,
  );

  const domainRaw = normalizeTypeLabel(firstString(message?.source?.domain, message?.domain));
  const kindRaw = normalizeTypeLabel(firstString(message?.rxKind, message?.kind));
  const operator = firstString(message?.source?.operator);
  const tags = Array.isArray(message?.source?.tags) ? message.source.tags : [];

  const timeMs = normalizeTimestampMs(message?.ts, message?.time, message?.timestamp);

  return {
    domainLabel: domainRaw ? prettifyDomain(domainRaw) || domainRaw : 'Unknown domain',
    label: label || 'Unknown label',
    kindLabel: kindRaw ? kindRaw.toUpperCase() : 'UNKNOWN',
    operator: operator || '',
    observableId: message?.observableId || 'Unknown observable',
    instanceId: message?.instanceId || '',
    subscriptionId: message?.subscriptionId || '',
    tags,
    timeLabel: timeMs ? fmtTime(timeMs) : '',
    dataPayload: message?.data ?? null,
  };
}

class MarblePanelRuntime {
  constructor({
    canvasRef,
    stageRef,
    tooltipRef,
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
  }) {
    this.canvas = canvasRef.current;
    this.stageWrap = stageRef.current;
    this.tooltipEl = tooltipRef.current;
    this.setStatsText = setStatsText;
    this.setTooltipState = setTooltipState;
    this.setPinnedId = setPinnedId;
    this.notifyRunningChange = notifyRunningChange;
    this.syncLaneCount = syncLaneCount;

    this.ctx = null;
    this.width = 0;
    this.height = 0;

    this.running = initialRunning;
    this.lanes = initialLanes;
    this.filterText = (initialFilter || '').trim().toLowerCase();
    this.filterDomain = (initialDomainFilter || '').toLowerCase();
    this.filterDomains = new Map();
    this.notifyFilterOptions = setFilterOptions || null;
    this.yZoom = 1;
    this.worldOffsetPx = 0;
    this.timeOriginMs = Date.now();
    this.maxAutoLanes = Math.max(1, maxAutoLanes);

    this.marbles = [];
    this.nextId = 1;
    this.totalEvents = 0;
    this.domainOrder = [];
    this.domainMap = new Map();
    this.laneStatus = new Map();
    this.subscriptionState = new Map();
    this.laneIndexMap = [];
    this.groupBoundaries = [];
    this.groupIndexByLane = [];
    this.groupLabels = new Map();

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

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleUnload = this.handleUnload.bind(this);
    this.frame = this.frame.bind(this);

    this.handlePortMessage = this.renderMessage.bind(this);
    this.handlePortDisconnect = this.handlePortDisconnect.bind(this);
    this.handleNavigated = this.handleNavigated.bind(this);

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

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  handleMouseDown() {
    this.mouse.down = true;
    this.dragStart = { x: this.mouse.x, offset: this.worldOffsetPx };
  }

  handleMouseUp() {
    this.mouse.down = false;
    this.dragStart = null;
  }

  handleWheel(e) {
    if (e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const factor = delta > 0 ? 0.9 : 1.1;
    this.yZoom = Math.max(0.5, Math.min(2.5, this.yZoom * factor));
  }

  handleCanvasClick() {
    if (this.hoverId) {
      this.setPinned(this.hoverId);
    } else {
      this.setPinned(null);
      this.publishTooltip(null);
    }
  }

  handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      this.toggleRunningFromRuntime();
    }
  }

  handleUnload() {
    try {
      this.port?.disconnect();
    } catch {}
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
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  rebuildLaneIndexMap() {
    const laneCount = Math.max(1, this.lanes);
    const nextMap = Array.from({ length: laneCount }, () => new Set());

    for (const domain of this.domainOrder) {
      const info = this.domainMap.get(domain);
      if (!info) continue;
      for (const [key, offset] of info.actions.entries()) {
        const laneIndex = this.coerceLaneIndex((info.baseOffset ?? 0) + offset);
        nextMap[laneIndex].add(key);
      }
    }

    this.laneIndexMap = nextMap;
  }

  updateLaneState(laneKey, kind, subscriptionId) {
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

    const isTerminal =
      rxKind === 'complete' || rxKind === 'error' || rxKind === 'unsubscribe';
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
  }

  isLaneDisabledForKey(laneKey) {
    if (!laneKey) return false;
    const state = this.laneStatus.get(laneKey);
    return Boolean(state && state.disabled && state.activeCount <= 0);
  }

  isLaneDisabledForIndex(laneIndex) {
    const entries = this.laneIndexMap[laneIndex];
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
  }

  laneMetrics() {
    const pad = LANE_PAD;
    const inner = Math.max(1, this.height - pad * 2);
    const groupCount = Math.max(1, this.groupBoundaries.length || 1);
    const virtualLanes =
      this.lanes + Math.max(0, groupCount - 1) * LANE_GROUP_GAP;
    const step = inner / Math.max(1, virtualLanes);
    return { pad, step };
  }

  laneY(lane) {
    const { pad, step } = this.laneMetrics();
    const groupIndex = this.groupIndexByLane[lane] ?? 0;
    const virtualIndex = lane + groupIndex * LANE_GROUP_GAP;
    return pad + (virtualIndex + 0.5) * step;
  }

  xForTime(ms) {
    const dtSec = (this.timeOriginMs - ms) / 1000;
    return this.width - NOW_MARKER_OFFSET - dtSec * PX_PER_SEC + this.worldOffsetPx;
  }

  frame() {
    if (this.running) {
      this.timeOriginMs = Date.now();
    }

    this.layout();
    this.drawGrid();
    this.drawMarbles();
    this.updateTooltipState();

    this.animationFrame = requestAnimationFrame(this.frame);
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

    for (let l = 0; l < this.lanes; l++) {
      const y = this.laneY(l);
      ctx.strokeStyle = this.isLaneDisabledForIndex(l) ? DISABLED_LANE_STROKE : LANE_STROKE_COLOR;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    if (this.groupBoundaries.length > 1) {
      ctx.strokeStyle = LANE_GROUP_SEPARATOR;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      for (let i = 1; i < this.groupBoundaries.length; i++) {
        const start = this.groupBoundaries[i].start;
        const y = (this.laneY(start - 1) + this.laneY(start)) / 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }

    if (this.groupBoundaries.length) {
      ctx.fillStyle = LANE_GROUP_LABEL_COLOR;
      ctx.font = LANE_GROUP_LABEL_FONT;
      ctx.textAlign = 'left';
      for (const group of this.groupBoundaries) {
        const label = this.groupLabels.get(group.key) || group.key;
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
      this.worldOffsetPx = this.dragStart.offset + dx;
    }

    const filterText = this.filterText;
    const filterDomain = this.filterDomain;

    for (let i = this.marbles.length - 1; i >= 0; i--) {
      const marble = this.marbles[i];
      const x = this.xForTime(marble.timeMs);
      if (x < -40 || x > this.width + 40) continue;

      const label = (marble.msg?.type || '').toString();
      const tags = marble.filters || {};

      const matchesText = !filterText || label.toLowerCase().includes(filterText);
      const matchesDomain = !filterDomain || (tags.domainKey && tags.domainKey === filterDomain);

      if (!(matchesText && matchesDomain)) continue;

      const baseY = this.laneY(marble.lane);
      const y = baseY * this.yZoom + (1 - this.yZoom) * this.height * 0.5;

      const laneDisabled = this.isLaneDisabledForKey(marble.laneKey);
      const color = laneDisabled ? DISABLED_MARBLE_COLOR : marble.color;
      drawRxKindGlyph(ctx, marble.msg?.rxKind ?? marble.msg?.kind, x, y, marble.r, color);

      const dx = this.mouse.x - x;
      const dy = this.mouse.y - y;
      if (dx * dx + dy * dy < (marble.r + 6) * (marble.r + 6)) {
        this.hoverId = marble.id;
      }
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

    const baseY = this.laneY(marble.lane);
    const y = baseY * this.yZoom + (1 - this.yZoom) * this.height * 0.5;
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

  publishTooltip(payload, silent = false) {
    const normalized =
      payload || ({
        visible: false,
        pinned: this.pinnedId != null,
        canPin: this.pinnedId != null || this.hoverId != null,
        message: null,
        position: { x: 0, y: 0 },
      });

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

  setPinned(id) {
    if (this.pinnedId === id) return;
    this.pinnedId = id;
    this.setPinnedId(id);
  }

  toggleRunningFromRuntime() {
    const next = !this.running;
    this.notifyRunningChange(next);
  }

  setRunningFromReact(flag) {
    if (this.running === flag) return;
    this.running = flag;
    if (flag) this.timeOriginMs = Date.now();
  }

  setLanes(value) {
    const clamped = Math.max(1, Math.min(this.maxAutoLanes, value));
    this.lanes = clamped;
    if (this.syncLaneCount && clamped !== value) {
      this.syncLaneCount(clamped);
    }
    this.rebuildLaneIndexMap();
  }

  setFilterText(value) {
    this.filterText = (value || '').trim().toLowerCase();
  }

  setFilterDomain(value) {
    this.filterDomain = (value || '').toLowerCase();
  }

  ingestFilterTags(tags) {
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
  }

  resolveLaneKey(rawKey) {
    return this.coerceLaneIndex(this.getLaneIndexForKey(rawKey, true));
  }

  coerceLaneIndex(index) {
    if (!Number.isFinite(index) || index < 0) return 0;
    if (this.lanes <= 0) return 0;
    if (index < this.lanes) return index;
    return index % this.lanes;
  }

  extractLaneParts(rawKey) {
    const key = rawKey ? String(rawKey) : 'default';
    const slashIdx = key.indexOf('/');
    const domain = slashIdx > 0 ? key.slice(0, slashIdx) : key;
    const normalizedDomain = domain || 'default';
    return { key, domain: normalizedDomain };
  }

  registerGroupLabel(laneKey, msg) {
    const { domain } = this.extractLaneParts(laneKey);
    if (!domain) return;
    const existing = this.groupLabels.get(domain);
    if (existing && existing !== domain) return;
    const label = firstString(
      msg?.observableId,
      msg?.label,
      msg?.instanceId,
      domain,
    );
    if (label) {
      this.groupLabels.set(domain, label);
    }
  }

  getLaneIndexForKey(rawKey, createIfMissing) {
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
      this.updateLaneStructure(true);
      info = this.domainMap.get(domain) || info;
    }

    const laneWithin = info.actions.get(key) ?? 0;
    const laneIndex = (info.baseOffset ?? 0) + laneWithin;
    return laneIndex;
  }

  updateLaneStructure(reassign) {
    let offset = 0;
    const boundaries = [];
    const groupIndexByLane = [];
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
      this.reassignMarbleLanes();
    }
    this.rebuildLaneIndexMap();
  }

  reassignMarbleLanes() {
    if (!this.marbles.length) return;
    for (const marble of this.marbles) {
      const laneKey =
        marble.laneKey ??
        marble.msg?.laneKey ??
        marble.msg?.observableId ??
        marble.msg?.label ??
        marble.msg?.type;
      const laneIndex = this.getLaneIndexForKey(laneKey, false);
      marble.lane = this.coerceLaneIndex(laneIndex);
    }
  }

  clear() {
    this.marbles.length = 0;
    this.totalEvents = 0;
    this.publishStats();
    this.setPinned(null);
    this.hoverId = null;
    this.publishTooltip(null);
    this.domainOrder.length = 0;
    this.domainMap.clear();
    this.laneStatus.clear();
    this.subscriptionState.clear();
    this.laneIndexMap = [];
    this.groupBoundaries = [];
    this.groupIndexByLane = [];
    this.groupLabels.clear();
    this.filterDomains.clear();
    if (this.notifyFilterOptions) {
      this.notifyFilterOptions({ domains: [] });
    }
    this.updateLaneStructure(false);
  }

  publishStats() {
    const count = this.totalEvents;
    this.setStatsText(`${count} event${count === 1 ? '' : 's'}`);
  }

  normalizeContentEvent(msg) {
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

  renderMessage(msg) {
    const normalized = this.normalizeContentEvent(msg);
    if (normalized) {
      this.pushMarble(normalized);
    }
  }

  handlePortDisconnect() {
    this.pushMarble({ type: 'INFO', text: 'Port disconnected. Reconnecting…' });
    this.connecting = false;
    this.reconnectTimer = setTimeout(() => this.connect(), 500);
  }

  handleNavigated() {
    try {
      this.port?.postMessage({ type: 'INIT', tabId: chrome.devtools.inspectedWindow.tabId });
      this.pushMarble({ type: 'NAVIGATED' });
    } catch {}
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
    this.demoTimer = setInterval(() => {
      if (this.totalEvents > 0) {
        clearInterval(this.demoTimer);
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

  pushMarble(msg) {
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
    this.registerGroupLabel(laneKey, msg);
    this.updateLaneState(laneKey, msg?.rxKind, msg?.subscriptionId);
    const lane = this.resolveLaneKey(laneKey);

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

    const marble = {
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
    this.ingestFilterTags(filters);
    this.totalEvents++;
    this.publishStats();
  }
}

function PanelApp() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const runtimeRef = useRef(null);

  const [running, setRunning] = useState(true);
  const [lanes, setLanes] = useState(4);
  const [filterText, setFilterText] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterOptions, setFilterOptions] = useState({ domains: [] });
  const [statsText, setStatsText] = useState('0 events');
  const [tooltipState, setTooltipState] = useState({ visible: false, position: { x: 0, y: 0 } });
  const [pinnedId, setPinnedId] = useState(null);
  const [copyLabel, setCopyLabel] = useState('Copy');
  const copyTimerRef = useRef(null);

  const handleSyncLaneCount = useCallback((nextLanes) => {
    if (typeof nextLanes !== 'number' || Number.isNaN(nextLanes)) return;
    setLanes((prev) => {
      const clamped = Math.max(1, Math.min(MAX_AUTO_LANES, Math.round(nextLanes)));
      return clamped === prev ? prev : clamped;
    });
  }, []);

  useEffect(() => {
    const runtime = new MarblePanelRuntime({
      canvasRef,
      stageRef,
      tooltipRef,
      setStatsText,
      setTooltipState: (payload) => setTooltipState(payload),
      setPinnedId,
      notifyRunningChange: (value) => setRunning(value),
      syncLaneCount: handleSyncLaneCount,
      initialLanes: lanes,
      initialFilter: filterText,
      initialDomainFilter: filterDomain,
      initialRunning: running,
      setFilterOptions,
      maxAutoLanes: MAX_AUTO_LANES,
    });
    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    runtimeRef.current?.setRunningFromReact(running);
  }, [running]);

  useEffect(() => {
    runtimeRef.current?.setLanes(lanes);
  }, [lanes]);

  useEffect(() => {
    runtimeRef.current?.setFilterText(filterText);
  }, [filterText]);

  useEffect(() => {
    runtimeRef.current?.setFilterDomain(filterDomain);
  }, [filterDomain]);


  useEffect(() => () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, []);

  const handleToggleRunning = () => setRunning((prev) => !prev);

  const handleClear = () => {
    runtimeRef.current?.clear();
    setFilterDomain('');
  };

  const handleCopy = async () => {
    if (!tooltipState.message) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(tooltipState.message, null, 2),
      );
      setCopyLabel('Copied!');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopyLabel('Copy');
        copyTimerRef.current = null;
      }, 900);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!tooltipState.message) return;
    const blob = new Blob([
      JSON.stringify(tooltipState.message, null, 2),
    ], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marble.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handlePin = () => {
    if (!runtimeRef.current) return;
    if (pinnedId != null) {
      runtimeRef.current.setPinned(null);
      runtimeRef.current.publishTooltip(null);
    } else if (tooltipState.canPin && runtimeRef.current.hoverId) {
      runtimeRef.current.setPinned(runtimeRef.current.hoverId);
    }
  };

  const handleClose = () => {
    if (!runtimeRef.current) return;
    runtimeRef.current.setPinned(null);
    runtimeRef.current.publishTooltip(null);
  };

  const toggleFilterValue = (setter) => (value) => {
    setter((prev) => (prev === value ? '' : value));
  };

  const handleSelectDomain = toggleFilterValue(setFilterDomain);

  const renderFilterGroup = (label, options, activeValue, onSelect) =>
    e(
      'div',
      { style: FILTER_GROUP_STYLE, key: `${label}-group` },
      e('span', { style: FILTER_GROUP_LABEL_STYLE }, label),
      e(
        'button',
        {
          style: {
            ...FILTER_CHIP_STYLE,
            ...(activeValue ? {} : FILTER_CHIP_ACTIVE_STYLE),
          },
          onClick: () => onSelect(''),
        },
        'Any',
      ),
      ...(options || []).map((option) =>
        e(
          'button',
          {
            key: `${label}-${option.value}`,
            style: {
              ...FILTER_CHIP_STYLE,
              ...(activeValue === option.value ? FILTER_CHIP_ACTIVE_STYLE : null),
            },
            onClick: () => onSelect(option.value),
            title: option.label,
          },
          option.label || option.value || 'Unknown',
        ),
      ),
    );

  const toolbarChildren = [
    e('div', { key: 'title', style: TITLE_STYLE }, 'Marble Timeline'),
    e('div', { key: 'spacer1', style: { flex: '0 0 8px' } }),
    e(
      'button',
      {
        key: 'play',
        style: BASE_BTN_STYLE,
        onClick: handleToggleRunning,
      },
      running ? 'Pause' : 'Play',
    ),
    e(
      'button',
      {
        key: 'clear',
        style: BASE_BTN_STYLE,
        onClick: handleClear,
      },
      'Clear',
    ),
    e('div', { key: 'sep1', style: { width: '1px', height: '20px', background: '#1f2a38' } }),
    e('label', { key: 'lanesLabel', style: LANES_LABEL_STYLE }, 'Lanes:'),
    e('input', {
      key: 'lanes',
      type: 'range',
      min: 1,
      max: MAX_AUTO_LANES,
      step: 1,
      value: lanes,
      onChange: (event) => setLanes(Number(event.target.value)),
      style: { width: '120px' },
    }),
    e('div', { key: 'sep2', style: { width: '1px', height: '20px', background: '#1f2a38' } }),
    e('input', {
      key: 'filter',
      type: 'text',
      placeholder: 'Filter label or kind includes (e.g. next, subscribe)',
      value: filterText,
      onChange: (event) => setFilterText(event.target.value),
      style: FILTER_INPUT_STYLE,
    }),
    e('div', { key: 'sep3', style: { width: '1px', height: '20px', background: '#1f2a38' } }),
    e('div', { key: 'stats', style: STATS_STYLE }, statsText),
  ];

  const messageInfo = tooltipState.message ? extractMessageInfo(tooltipState.message) : null;
  const tooltipTitle = tooltipState.visible
    ? tooltipState.title || 'Event details'
    : 'Event details';

  const tooltipButtons = [
    e(
      'button',
      {
        key: 'copy',
        style: SMALL_BTN_STYLE,
        onClick: handleCopy,
        disabled: !tooltipState.visible || !tooltipState.message,
      },
      copyLabel,
    ),
    e(
      'button',
      {
        key: 'download',
        style: SMALL_BTN_STYLE,
        onClick: handleDownload,
        disabled: !tooltipState.visible || !tooltipState.message,
      },
      'Download',
    ),
    e(
      'button',
      {
        key: 'pin',
        style: SMALL_BTN_STYLE,
        onClick: handlePin,
        disabled: !tooltipState.visible || (!tooltipState.canPin && pinnedId == null),
      },
      pinnedId != null ? 'Unpin' : 'Pin',
    ),
    e(
      'button',
      {
        key: 'close',
        style: SMALL_BTN_STYLE,
        onClick: handleClose,
        disabled: !tooltipState.visible,
      },
      'Close',
    ),
  ];

  return e(
    'div',
    { style: ROOT_STYLE },
    e('div', { style: TOOLBAR_STYLE }, toolbarChildren),
    e(
      'div',
      { style: FILTER_BAR_STYLE },
      renderFilterGroup('Domain', filterOptions.domains, filterDomain, handleSelectDomain),
    ),
    e(
      'div',
      { style: STAGE_STYLE },
      e(
        'div',
        { ref: stageRef, style: CANVAS_STAGE_STYLE },
        e('canvas', { ref: canvasRef }),
      ),
      e(
        'div',
        { style: RIGHT_PANEL_STYLE },
        e(
          'div',
          {
            ref: tooltipRef,
            style: TIP_STYLE,
          },
          e(
            'div',
            { style: TIP_HEADER_STYLE },
            e('div', { style: TIP_TITLE_STYLE }, tooltipTitle),
            e('div', { style: TIP_BTNS_STYLE }, tooltipButtons),
          ),
          e(
            'div',
            { style: TIP_SCROLL_STYLE },
            tooltipState.visible && tooltipState.message
              ? e(
                  'div',
                  { style: TIP_CONTENT_STYLE },
                  e(
                    'div',
                    { style: TIP_ROW_STYLE },
                    e('span', { style: TIP_LABEL_STYLE }, 'Domain:'),
                    e(
                      'span',
                      { style: TIP_PILL_STYLE },
                      messageInfo?.domainLabel || 'Unknown domain',
                    ),
                  ),
                  e(
                    'div',
                    { style: TIP_ROW_STYLE },
                    e('span', { style: TIP_LABEL_STYLE }, 'Label:'),
                    e(
                      'span',
                      { style: TIP_PILL_STYLE },
                      messageInfo?.label || 'Unknown label',
                    ),
                  ),
                  e(
                    'div',
                    { style: TIP_ROW_STYLE },
                    e('span', { style: TIP_LABEL_STYLE }, 'Kind:'),
                    e(
                      'span',
                      { style: TIP_PILL_STYLE },
                      messageInfo?.kindLabel || 'Unknown kind',
                    ),
                  ),
                  e(
                    'div',
                    { style: TIP_ROW_STYLE },
                    e('span', { style: TIP_LABEL_STYLE }, 'Observable:'),
                    e(
                      'span',
                      { style: TIP_PILL_STYLE },
                      messageInfo?.observableId || 'Unknown observable',
                    ),
                  ),
                  messageInfo?.instanceId
                    ? e(
                        'div',
                        { style: TIP_ROW_STYLE },
                        e('span', { style: TIP_LABEL_STYLE }, 'Instance:'),
                        e(
                          'span',
                          { style: TIP_PILL_STYLE },
                          messageInfo.instanceId,
                        ),
                      )
                    : null,
                  messageInfo?.subscriptionId
                    ? e(
                        'div',
                        { style: TIP_ROW_STYLE },
                        e('span', { style: TIP_LABEL_STYLE }, 'Subscription:'),
                        e(
                          'span',
                          { style: TIP_PILL_STYLE },
                          messageInfo.subscriptionId,
                        ),
                      )
                    : null,
                  messageInfo?.operator
                    ? e(
                        'div',
                        { style: TIP_ROW_STYLE },
                        e('span', { style: TIP_LABEL_STYLE }, 'Operator:'),
                        e(
                          'span',
                          { style: TIP_PILL_STYLE },
                          messageInfo.operator,
                        ),
                      )
                    : null,
                  messageInfo?.tags && messageInfo.tags.length
                    ? e(
                        'div',
                        { style: TIP_ROW_STYLE },
                        e('span', { style: TIP_LABEL_STYLE }, 'Tags:'),
                        e(
                          'span',
                          { style: TIP_PILL_STYLE },
                          messageInfo.tags.join(', '),
                        ),
                      )
                    : null,
                  e(
                    'div',
                    { style: TIP_ROW_STYLE },
                    e('span', { style: TIP_LABEL_STYLE }, 'Time:'),
                    e(
                      'span',
                      { style: TIP_PILL_STYLE },
                      messageInfo?.timeLabel || 'Unknown time',
                    ),
                  ),
                  e(
                    'div',
                    null,
                    e('div', { style: TIP_LABEL_STYLE }, 'Data payload:'),
                    messageInfo && messageInfo.dataPayload !== null && messageInfo.dataPayload !== undefined
                      ? e(
                          'div',
                          { style: { marginTop: '4px' } },
                          e(ForwardJsonTree, { data: messageInfo.dataPayload }),
                        )
                      : e('div', { style: TIP_LABEL_STYLE }, 'None'),
                  ),
                )
              : e(
                  'div',
                  { style: RIGHT_PANEL_EMPTY_STYLE },
                  'Hover a marble to see details.',
                ),
          ),
        ),
      ),
    ),
    e(
      'div',
      { style: LEGEND_STYLE },
      'Tip: hover for data • click to pin • wheel to zoom Y • drag to pan • Space Play/Pause • Shapes: triangle=subscribe/create, circle=next, line=complete/unsubscribe, x=error',
    ),
  );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(e(PanelApp));
