const { useState, useEffect, useLayoutEffect, useMemo, useRef } = React;
const e = React.createElement;

const ROOT_STYLE = {
  boxSizing: 'border-box',
  height: '100vh',
  width: '100vw',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
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
  position: 'relative',
  overflow: 'hidden',
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
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'none',
  background: 'rgba(16,24,32,.98)',
  border: '1px solid #334155',
  boxShadow: '0 6px 28px rgba(0,0,0,.5)',
  borderRadius: '12px',
  maxWidth: '560px',
  maxHeight: '70vh',
  overflow: 'hidden',
  zIndex: 2,
  backdropFilter: 'blur(4px)',
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
  maxHeight: 'calc(70vh - 38px)',
  overflow: 'auto',
  padding: '10px 12px',
};

const TIP_TREE_STYLE = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '12px',
  lineHeight: 1.4,
};

const PX_PER_SEC = 120;

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

function hashLane(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
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

function JsonTree({ data }, ref) {
  const nodes = useMemo(() => buildJsonNodes('', data, 0, new WeakSet()), [data]);
  return e('div', { ref, style: TIP_TREE_STYLE }, nodes);
}

const ForwardJsonTree = React.forwardRef(JsonTree);

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

class MarblePanelRuntime {
  constructor({
    canvasRef,
    stageRef,
    tooltipRef,
    setStatsText,
    setTooltipState,
    setPinnedId,
    notifyRunningChange,
    initialLanes,
    initialFilter,
    initialRunning,
  }) {
    this.canvas = canvasRef.current;
    this.stageWrap = stageRef.current;
    this.tooltipEl = tooltipRef.current;
    this.setStatsText = setStatsText;
    this.setTooltipState = setTooltipState;
    this.setPinnedId = setPinnedId;
    this.notifyRunningChange = notifyRunningChange;

    this.ctx = null;
    this.width = 0;
    this.height = 0;

    this.running = initialRunning;
    this.lanes = initialLanes;
    this.filter = initialFilter;
    this.yZoom = 1;
    this.worldOffsetPx = 0;
    this.timeOriginMs = Date.now();

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

  laneY(lane) {
    const pad = 24;
    const inner = Math.max(1, this.height - pad * 2);
    const step = inner / Math.max(1, this.lanes);
    return pad + (lane + 0.5) * step;
  }

  xForTime(ms) {
    const dtSec = (this.timeOriginMs - ms) / 1000;
    return this.width - 22 - dtSec * PX_PER_SEC + this.worldOffsetPx;
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

    ctx.strokeStyle = '#213145';
    ctx.beginPath();
    for (let l = 0; l < this.lanes; l++) {
      const y = this.laneY(l);
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#7aa2d3';
    ctx.fillRect(this.width - 22, 0, 2, this.height);
    ctx.textAlign = 'right';
    ctx.fillText(`now ${fmtTime(rightMs)}`, this.width - 26, 12);
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

    const filter = this.filter;

    for (let i = this.marbles.length - 1; i >= 0; i--) {
      const marble = this.marbles[i];
      const x = this.xForTime(marble.timeMs);
      if (x < -40 || x > this.width + 40) continue;

      const label = (marble.msg?.type || '').toString();
      const visible = !filter || label.toLowerCase().includes(filter);
      if (!visible) continue;

      const baseY = this.laneY(marble.lane);
      const y = baseY * this.yZoom + (1 - this.yZoom) * this.height * 0.5;

      ctx.beginPath();
      ctx.fillStyle = marble.color;
      ctx.arc(x, y, marble.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.stroke();

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
    this.lanes = Math.max(1, value);
  }

  setFilter(value) {
    this.filter = (value || '').trim().toLowerCase();
  }

  clear() {
    this.marbles.length = 0;
    this.totalEvents = 0;
    this.publishStats();
    this.setPinned(null);
    this.hoverId = null;
    this.publishTooltip(null);
  }

  publishStats() {
    const count = this.totalEvents;
    this.setStatsText(`${count} event${count === 1 ? '' : 's'}`);
  }

  normalizeContentEvent(msg) {
    if (!msg || msg.type !== 'CONTENT_EVENT') return null;
    const data = msg.data;
    if (!data || data.type !== 'RXJS_EVENT') return null;
    const payload = data.payload;
    if (!payload || typeof payload !== 'object') return null;

    const KIND_LABELS = { N: 'NEXT', E: 'ERROR', C: 'COMPLETE' };
    const kind = KIND_LABELS[payload.kind] || (payload.kind ? String(payload.kind) : 'EVENT');
    const label = payload.label || payload.key || '';
    const laneKey = payload.key || payload.label || kind;

    const timestamp =
      pickFirstNumber(data?.time, msg.meta?.time, msg.time, payload.time, payload.t) ?? Date.now();

    return {
      type: label ? `${kind} • ${label}` : kind,
      kind,
      label,
      key: payload.key,
      value: payload.value,
      time: timestamp,
      laneKey,
      color: payload.color,
      payload,
      tabId: msg.tabId,
      meta: msg.meta,
      raw: { background: msg, content: data },
    };
  }

  renderMessage(msg) {
    const normalized = this.normalizeContentEvent(msg);
    if (normalized) {
      this.pushMarble(normalized);
      return;
    }

    this.pushMarble(msg);
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
    this.demoTimer = setInterval(() => {
      if (this.totalEvents > 0) {
        clearInterval(this.demoTimer);
        this.demoTimer = null;
        return;
      }
      const types = ['NEXT', 'COMPLETE', 'SUBSCRIBE', 'ERROR'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.pushMarble({ type, id: Math.floor(Math.random() * 9999) });
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
    const lane = Math.abs(hashLane(laneKey)) % Math.max(1, this.lanes);

    let color = hashColor(type);
    if (msg && msg.color != null) {
      if (typeof msg.color === 'string') {
        color = msg.color;
      } else if (typeof msg.color === 'number' && Number.isFinite(msg.color)) {
        const hue = ((msg.color % 360) + 360) % 360;
        color = `hsl(${hue}, 70%, 55%)`;
      }
    }

    const marble = {
      id: this.nextId++,
      timeMs: time,
      r: 7,
      color,
      msg,
      lane,
    };
    this.marbles.push(marble);
    this.totalEvents++;
    this.publishStats();
  }
}

function PanelApp() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const tipTreeRef = useRef(null);
  const runtimeRef = useRef(null);

  const [running, setRunning] = useState(true);
  const [lanes, setLanes] = useState(4);
  const [filter, setFilter] = useState('');
  const [statsText, setStatsText] = useState('0 events');
  const [tooltipState, setTooltipState] = useState({ visible: false, position: { x: 0, y: 0 } });
  const [pinnedId, setPinnedId] = useState(null);
  const [copyLabel, setCopyLabel] = useState('Copy');
  const copyTimerRef = useRef(null);
  const [stageSizeVersion, setStageSizeVersion] = useState(0);
  const [tooltipRenderStyle, setTooltipRenderStyle] = useState({ display: 'none', transform: 'translate(0px,0px)' });

  useEffect(() => {
    const runtime = new MarblePanelRuntime({
      canvasRef,
      stageRef,
      tooltipRef,
      setStatsText,
      setTooltipState: (payload) => setTooltipState(payload),
      setPinnedId,
      notifyRunningChange: (value) => setRunning(value),
      initialLanes: lanes,
      initialFilter: filter,
      initialRunning: running,
    });
    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(() => {
      setStageSizeVersion((v) => v + 1);
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    runtimeRef.current?.setRunningFromReact(running);
  }, [running]);

  useEffect(() => {
    runtimeRef.current?.setLanes(lanes);
  }, [lanes]);

  useEffect(() => {
    runtimeRef.current?.setFilter(filter);
  }, [filter]);

  useLayoutEffect(() => {
    const tipEl = tooltipRef.current;
    const stageEl = stageRef.current;
    if (!tipEl || !stageEl) return;

    if (!tooltipState.visible) {
      setTooltipRenderStyle((prev) =>
        prev.display === 'none'
          ? prev
          : { display: 'none', transform: 'translate(0px,0px)' },
      );
      return;
    }

    const stageRect = stageEl.getBoundingClientRect();
    const tipW = tipEl.offsetWidth || 0;
    const tipH = tipEl.offsetHeight || 0;
    const rawX = tooltipState.position?.x ?? 0;
    const rawY = tooltipState.position?.y ?? 0;

    const px = Math.min(stageRect.width - 20 - tipW, Math.max(20, rawX + 16));
    const py = Math.max(10, Math.min(stageRect.height - tipH - 10, rawY - 40));
    const transform = `translate(${px}px, ${py}px)`;

    setTooltipRenderStyle((prev) =>
      prev.display === 'block' && prev.transform === transform
        ? prev
        : { display: 'block', transform },
    );
  }, [tooltipState, stageSizeVersion]);

  useEffect(() => () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, []);

  const handleToggleRunning = () => setRunning((prev) => !prev);

  const handleClear = () => runtimeRef.current?.clear();

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

  const handleExpandCollapse = (open) => {
    const tree = tipTreeRef.current;
    if (!tree) return;
    tree.querySelectorAll('details').forEach((el) => {
      el.open = open;
    });
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
      max: 8,
      step: 1,
      value: lanes,
      onChange: (event) => setLanes(Number(event.target.value)),
      style: { width: '120px' },
    }),
    e('div', { key: 'sep2', style: { width: '1px', height: '20px', background: '#1f2a38' } }),
    e('input', {
      key: 'filter',
      type: 'text',
      placeholder: 'Filter type includes… (e.g. NEXT, ERROR)',
      value: filter,
      onChange: (event) => setFilter(event.target.value),
      style: FILTER_INPUT_STYLE,
    }),
    e('div', { key: 'sep3', style: { width: '1px', height: '20px', background: '#1f2a38' } }),
    e('div', { key: 'stats', style: STATS_STYLE }, statsText),
  ];

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
        key: 'expand',
        style: SMALL_BTN_STYLE,
        onClick: () => handleExpandCollapse(true),
        disabled: !tooltipState.visible,
      },
      'Expand all',
    ),
    e(
      'button',
      {
        key: 'collapse',
        style: SMALL_BTN_STYLE,
        onClick: () => handleExpandCollapse(false),
        disabled: !tooltipState.visible,
      },
      'Collapse all',
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
      { ref: stageRef, style: STAGE_STYLE },
      e('canvas', { ref: canvasRef }),
      e(
        'div',
        {
          ref: tooltipRef,
          style: { ...TIP_STYLE, ...tooltipRenderStyle },
        },
        e(
          'div',
          { style: TIP_HEADER_STYLE },
          e('div', { style: TIP_TITLE_STYLE }, tooltipState.title || ''),
          e('div', { style: TIP_BTNS_STYLE }, tooltipButtons),
        ),
        e(
          'div',
          { style: TIP_SCROLL_STYLE },
          tooltipState.visible && tooltipState.message
            ? e(ForwardJsonTree, { data: tooltipState.message, ref: tipTreeRef })
            : e('div', null, 'No data'),
        ),
      ),
    ),
    e(
      'div',
      { style: LEGEND_STYLE },
      'Tip: hover for data • click to pin • Expand/Collapse • wheel to zoom Y • drag to pan • Space Play/Pause',
    ),
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(e(PanelApp));
