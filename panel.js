// panel.js — Marble Timeline Visualization (Absolute Time Axis)
// Each vertical axis tick is a real moment in time (HH:MM:SS) shown at the top.
// Marbles are positioned by their event timestamp and stay aligned to that time.

let port;
let connecting = false;

// ====== UI Setup ======
const root = document.createElement('div');
root.style.cssText = `
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #0b0f14;
  color: #d6e2f0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
`;
document.body.style.margin = '0';
document.body.appendChild(root);

// Toolbar
const toolbar = document.createElement('div');
toolbar.style.cssText = `
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #1d2733;
  background: #0e141b;
`;
root.appendChild(toolbar);

const title = document.createElement('div');
title.textContent = 'Marble Timeline';
title.style.cssText = 'font-weight: 600; letter-spacing: .3px;';

const playBtn = document.createElement('button');
playBtn.textContent = 'Pause';
playBtn.style.cssText = baseBtn();

const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear';
clearBtn.style.cssText = baseBtn();

const lanesLabel = document.createElement('label');
lanesLabel.textContent = 'Lanes:';
lanesLabel.style.opacity = '0.8';

const lanesInput = document.createElement('input');
lanesInput.type = 'range';
lanesInput.min = '1';
lanesInput.max = '8';
lanesInput.value = '4';
lanesInput.step = '1';
lanesInput.style.width = '120px';

const filterInput = document.createElement('input');
filterInput.type = 'text';
filterInput.placeholder = 'Filter type includes… (e.g. NEXT, ERROR)';
filterInput.style.cssText = `
  flex: 1;
  min-width: 160px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #243244;
  background: #0b1117;
  color: #d6e2f0;
`;

const stats = document.createElement('div');
stats.style.cssText = 'opacity:.7; font-variant-numeric: tabular-nums;';
stats.textContent = '0 events';

// Mount toolbar (speed controls removed)
toolbar.append(title, spacer(), playBtn, clearBtn, sep(), lanesLabel, lanesInput, sep(), filterInput, sep(), stats);

// Canvas container
const stageWrap = document.createElement('div');
stageWrap.style.cssText = `
  position: relative;
  overflow: hidden;
`;
root.appendChild(stageWrap);

const canvas = document.createElement('canvas');
stageWrap.appendChild(canvas);

// ====== HTML Inspector Tooltip (Collapsible JSON) ======
const tip = document.createElement('div');
tip.style.cssText = `
  position: absolute;
  top: 0; left: 0;
  display: none;
  background: rgba(16,24,32,.98);
  border: 1px solid #334155;
  box-shadow: 0 6px 28px rgba(0,0,0,.5);
  border-radius: 12px;
  max-width: 560px;
  max-height: 70vh;
  overflow: hidden;
  z-index: 2;
  backdrop-filter: blur(4px);
`;
const tipHeader = document.createElement('div');
tipHeader.style.cssText = `
  display:flex; align-items:center; justify-content:space-between;
  gap:8px; padding:8px 10px; background: rgba(20,28,38,.9);
  border-bottom: 1px solid #2a384b; font-size: 12px;
`;
const tipTitle = document.createElement('div');
tipTitle.style.cssText = 'opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
const tipBtns = document.createElement('div');
tipBtns.style.cssText = 'display:flex; gap:6px;';

function smallBtn(text){
  const b = document.createElement('button');
  b.textContent = text;
  b.style.cssText = `
    padding: 4px 8px; font-size:12px; border-radius: 8px;
    border: 1px solid #334155; background: #0e141b; color: #d6e2f0; cursor: pointer;`;
  return b;
}
const copyBtn = smallBtn('Copy');
const downloadBtn = smallBtn('Download');
const expandAllBtn = smallBtn('Expand all');
const collapseAllBtn = smallBtn('Collapse all');
const pinBtn = smallBtn('Unpin');
const closeBtn = smallBtn('Close');

const tipScroll = document.createElement('div');
tipScroll.style.cssText = 'max-height: calc(70vh - 38px); overflow:auto; padding:10px 12px;';
const tipTree = document.createElement('div');
tipTree.style.cssText = 'font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; line-height:1.4;'

tipScroll.appendChild(tipTree);
tipBtns.append(copyBtn, downloadBtn, expandAllBtn, collapseAllBtn, pinBtn, closeBtn);
tipHeader.append(tipTitle, tipBtns);
tip.append(tipHeader, tipScroll);
stageWrap.appendChild(tip);

// Footer legend
const legend = document.createElement('div');
legend.style.cssText = `
  padding: 6px 12px;
  border-top: 1px solid #1d2733;
  font-size: 12px;
  opacity: .8;
`;
legend.textContent = 'Tip: hover for data • click to pin • Expand/Collapse • wheel to zoom Y • drag to pan • Space Play/Pause';
root.appendChild(legend);

// ====== State ======
const DPR = window.devicePixelRatio || 1;
let ctx;
let width = 0, height = 0;
let running = true;              // controls whether the RIGHT EDGE time advances
let lanes = Number(lanesInput.value);
let worldOffsetPx = 0;           // horizontal pan in pixels (left/right)
let yZoom = 1;                   // vertical scaling

// Absolute time handling
const PX_PER_SEC = 120;          // fixed scale: pixels per second on X (change here if desired)
let timeOriginMs = Date.now();   // time represented at the right-edge "now" line (frozen when paused)

// Event model
/** @typedef {{id:number, timeMs:number, x?:number, y?:number, r:number, color:string, msg:any, lane:number}} Marble */
/** @type {Marble[]} */
const marbles = [];
let nextId = 1;
let totalEvents = 0;

// Tooltip state
let hoverId = null;
let pinnedId = null; // when set, tooltip stays attached to that marble id
let lastTooltipObj = null; // raw object for copy/download

// ====== Helpers ======
function baseBtn(){
  return `
    padding: 6px 10px;
    background: #15202b;
    color: #d6e2f0;
    border: 1px solid #223044;
    border-radius: 10px;
    cursor: pointer;
  `;
}
function spacer(){
  const s = document.createElement('div');
  s.style.flex = '0 0 8px';
  return s;
}
function sep(){
  const s = document.createElement('div');
  s.style.cssText = 'width:1px;height:20px;background:#1f2a38;';
  return s;
}
function hashColor(str){
  let h = 2166136261 >>> 0;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = (h & 0xff);
  const g = (h>>>8) & 0xff;
  const b = (h>>>16) & 0xff;
  return `rgb(${100 + (r%156)}, ${100 + (g%156)}, ${100 + (b%156)})`;
}
function fitCanvas(){
  width = stageWrap.clientWidth;
  height = stageWrap.clientHeight;
  canvas.width = Math.max(1, Math.floor(width * DPR));
  canvas.height = Math.max(1, Math.floor(height * DPR));
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function fmtTime(ms){
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  const s = String(d.getSeconds()).padStart(2,'0');
  return `${h}:${m}:${s}`;
}

// ====== Interaction ======
let mouse = {x:0,y:0, down:false};
let dragStart = null;

canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', ()=>{
  mouse.down = true;
  dragStart = {x: mouse.x, offset: worldOffsetPx};
});
window.addEventListener('mouseup', ()=>{ mouse.down = false; dragStart = null; });
canvas.addEventListener('wheel', (e)=>{
  if (e.ctrlKey || e.shiftKey) return; // allow devtools zoom
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  yZoom = Math.max(0.5, Math.min(2.5, yZoom * (delta>0? 0.9:1.1)));
}, {passive:false});

// Hover/Pin logic
canvas.addEventListener('click', ()=>{
  if (hoverId){
    pinnedId = hoverId;
    const m = marbles.find(x=>x.id===pinnedId);
    if (m) showTooltipForMarble(m);
  } else {
    pinnedId = null;
    hideTooltip();
  }
});

// Keyboard: Space toggles play/pause
window.addEventListener('keydown', (e)=>{
  if (e.code === 'Space'){
    e.preventDefault();
    toggleRunning();
  }
});

// Tooltip buttons
copyBtn.onclick = async ()=>{
  if (!lastTooltipObj) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastTooltipObj, null, 2));
    copyBtn.textContent = 'Copied!';
    setTimeout(()=> copyBtn.textContent = 'Copy', 900);
  } catch {}
};

downloadBtn.onclick = ()=>{
  if (!lastTooltipObj) return;
  const blob = new Blob([JSON.stringify(lastTooltipObj, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marble.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 0);
};

expandAllBtn.onclick = ()=> toggleAllDetails(true);
collapseAllBtn.onclick = ()=> toggleAllDetails(false);

pinBtn.onclick = ()=>{
  if (pinnedId){ pinnedId = null; pinBtn.textContent = 'Pin'; }
  else if (hoverId){ pinnedId = hoverId; pinBtn.textContent = 'Unpin'; }
  if (!pinnedId) hideTooltip();
};

closeBtn.onclick = ()=>{ pinnedId = null; hideTooltip(); };

function toggleAllDetails(open){
  tipTree.querySelectorAll('details').forEach(d => d.open = open);
}

// ====== Controls ======
playBtn.onclick = ()=> toggleRunning();
clearBtn.onclick = ()=>{
  marbles.length = 0;
  totalEvents = 0;
  stats.textContent = '0 events';
  pinnedId = null; hoverId = null; hideTooltip();
};
lanesInput.oninput = ()=>{ lanes = Number(lanesInput.value); };

function toggleRunning(){
  running = !running;
  playBtn.textContent = running ? 'Pause' : 'Play';
  if (running) timeOriginMs = Date.now();
}

// ====== Rendering ======
function layout(){
  fitCanvas();
}

function laneY(l){
  const pad = 24;
  const inner = Math.max(1, height - pad*2);
  const step = inner / Math.max(1, lanes);
  return pad + (l+0.5)*step;
}

function xForTime(ms){
  const dtSec = (timeOriginMs - ms) / 1000;
  return (width - 22) - dtSec * PX_PER_SEC + worldOffsetPx;
}

function drawGrid(){
  // background
  const g = ctx.createLinearGradient(0,0,0,height);
  g.addColorStop(0,'#0b0f14');
  g.addColorStop(1,'#0a131d');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,width,height);

  // time ticks at whole seconds with labels on top
  ctx.strokeStyle = '#1e2a38';
  ctx.fillStyle = '#9fb6cf';
  ctx.font = '11px ui-sans-serif, system-ui';
  ctx.textAlign = 'center';

  const rightMs = timeOriginMs; // time at right edge
  const rightSec = Math.floor(rightMs/1000)*1000;
  const pxPerSec = PX_PER_SEC;

  // draw ticks to the left across the width
  ctx.beginPath();
  for (let t = rightSec; ; t -= 1000){
    const x = xForTime(t);
    if (x < -50) break;
    if (x <= width + 50){
      ctx.moveTo(x, 18);
      ctx.lineTo(x, height);
      // label at top
      ctx.fillText(fmtTime(t), x, 12);
    }
  }
  ctx.stroke();

  // lane lines
  ctx.strokeStyle = '#213145';
  ctx.beginPath();
  for(let l=0;l<lanes;l++){
    const y = laneY(l);
    ctx.moveTo(0,y);
    ctx.lineTo(width,y);
  }
  ctx.stroke();

  // right-edge now line + label
  ctx.fillStyle = '#7aa2d3';
  ctx.fillRect(width-22,0,2,height);
  ctx.textAlign = 'right';
  ctx.fillText('now ' + fmtTime(rightMs), width-26, 12);
  ctx.textAlign = 'left';
}

function drawMarbles(){
  hoverId = null;
  const filter = (filterInput.value||'').trim().toLowerCase();

  // Pan with drag
  if (mouse.down && dragStart){
    const dx = mouse.x - dragStart.x;
    worldOffsetPx = dragStart.offset + dx;
  }

  for (let i=marbles.length-1; i>=0; i--){
    const m = marbles[i];
    const x = xForTime(m.timeMs);
    if (x < -40 || x > width + 40) { continue; } // cull offscreen for drawing, but keep data

    const label = (m.msg?.type||'').toString();
    const visible = !filter || label.toLowerCase().includes(filter);

    const y = (laneY(m.lane) - 0) * yZoom + (1-yZoom)*height/2;

    if (visible){
      ctx.beginPath();
      ctx.fillStyle = m.color;
      ctx.arc(x, y, m.r, 0, Math.PI*2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.stroke();

      const dx = mouse.x - x;
      const dy = mouse.y - y;
      if (dx*dx + dy*dy < (m.r+6)*(m.r+6)) hoverId = m.id;
    }
  }
}

function drawTooltip(){
  const id = pinnedId || hoverId;
  const m = marbles.find(x=>x.id===id);
  if (!m){ hideTooltip(); return; }
  showTooltipForMarble(m);
}

function showTooltipForMarble(m){
  tipTitle.textContent = `${(m.msg?.type ?? 'Event')} • id:${m.id} • ${fmtTime(m.timeMs)}`;
  lastTooltipObj = m.msg;
  pinBtn.textContent = pinnedId ? 'Unpin' : 'Pin';
  tip.style.display = 'block';

  // Render tree
  tipTree.innerHTML = '';
  renderJSONTree(tipTree, m.msg);

  // Position near marble, keep inside stage bounds
  const y = (laneY(m.lane) - 0) * yZoom + (1-yZoom)*height/2;
  const x = xForTime(m.timeMs);
  const px = Math.min(width - 20, Math.max(20, x + 16));
  const py = Math.max(10, Math.min(height - tip.offsetHeight - 10, y - 40));
  tip.style.transform = `translate(${px}px, ${py}px)`;
}

function hideTooltip(){
  tip.style.display = 'none';
}

// ====== Collapsible JSON Tree ======
function renderJSONTree(container, data){
  const visited = new WeakSet();
  const root = createNode('', data, 0, visited);
  container.appendChild(root);
}

function createNode(key, value, depth, visited){
  const node = document.createElement('div');
  node.style.cssText = 'white-space:pre;';

  const isObj = value && typeof value === 'object';
  const isArr = Array.isArray(value);

  const line = document.createElement('div');
  line.style.cssText = 'display:flex; gap:6px; align-items:flex-start;';

  if (!isObj){
    const k = key ? `${JSON.stringify(key)}: ` : '';
    line.textContent = k + formatLeaf(value);
    node.appendChild(line);
    return node;
  }

  if (visited.has(value)){
    line.textContent = `${JSON.stringify(key)}: <circular>`;
    node.appendChild(line);
    return node;
  }
  visited.add(value);

  const details = document.createElement('details');
  details.open = depth < 1; // collapse by default beyond depth 0
  const summary = document.createElement('summary');
  summary.style.cssText = 'cursor:pointer;';
  const size = isArr ? value.length : Object.keys(value).length;
  const preview = truncate(JSON.stringify(previewValue(value)), 120);
  summary.textContent = (key ? `${JSON.stringify(key)}: ` : '') + (isArr ? `Array(${size})` : 'Object') + ` ${preview}`;
  details.appendChild(summary);

  const childWrap = document.createElement('div');
  childWrap.style.cssText = 'padding-left:14px; border-left:1px solid rgba(90,120,150,.25); margin-left:6px;';

  if (isArr){
    for (let i=0;i<value.length;i++){
      childWrap.appendChild(createNode(String(i), value[i], depth+1, visited));
    }
  } else {
    for (const k of Object.keys(value)){
      childWrap.appendChild(createNode(k, value[k], depth+1, visited));
    }
  }
  details.appendChild(childWrap);
  node.appendChild(details);
  return node;
}

function formatLeaf(v){
  const t = typeof v;
  if (v === null) return 'null';
  if (t === 'string') return JSON.stringify(v);
  if (t === 'number' || t === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return Object.prototype.toString.call(v); }
}

function previewValue(v){
  if (v === null) return null;
  if (Array.isArray(v)) return v.slice(0,3).map(x=> simplify(x));
  if (typeof v === 'object'){
    const out = {}; let c=0;
    for (const k of Object.keys(v)){
      out[k] = simplify(v[k]);
      if (++c>=3) break;
    }
    return out;
  }
  return simplify(v);
}

function simplify(x){
  if (x && typeof x === 'object') return Array.isArray(x) ? `Array(${x.length})` : 'Object';
  if (typeof x === 'string') return x.length>24 ? x.slice(0,21)+'…' : x;
  return x;
}

function truncate(s, n){
  if (!s) return '';
  return s.length>n ? s.slice(0,n-1)+'…' : s;
}

function frame(){
  if (running) {
    timeOriginMs = Date.now();
  }
  layout();
  drawGrid();
  drawMarbles();
  drawTooltip();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ====== Message Handling ======
function pushMarble(msg){
  // Try to use a timestamp from the message if available; otherwise use Date.now()
  // Accept common fields: time, ts, timestamp (ms). If a Date string is provided, parse it.
  let t = Date.now();
  const cand = msg && (msg.time ?? msg.ts ?? msg.timestamp ?? msg.date ?? msg.t);
  if (typeof cand === 'number') t = cand;
  else if (typeof cand === 'string') {
    const parsed = Date.parse(cand);
    if (!Number.isNaN(parsed)) t = parsed;
  }

  const type = (msg && msg.type) ? String(msg.type) : 'UNKNOWN';
  const lane = Math.abs(hashLane(type)) % Math.max(1, lanes);
  const m = {
    id: nextId++,
    timeMs: t,
    r: 7,
    color: hashColor(type),
    msg,
    lane
  };
  marbles.push(m);
  totalEvents++;
  stats.textContent = `${totalEvents} event${totalEvents===1?'':'s'}`;
}

function hashLane(str){
  let h = 0;
  for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i))|0;
  return h;
}

function renderMessage(msg){
  pushMarble(msg);
}

// ====== Connection Logic ======
function connect(){
  if (connecting) return;
  connecting = true;

  port = chrome.runtime.connect({ name: 'rxjs-panel' });
  try {
    port.postMessage({ type: 'INIT', tabId: chrome.devtools.inspectedWindow.tabId });
  } catch {}

  port.onMessage.addListener(renderMessage);

  port.onDisconnect.addListener(() => {
    pushMarble({ type: 'INFO', text: 'Port disconnected. Reconnecting…' });
    connecting = false;
    setTimeout(connect, 500);
  });

  chrome.devtools.network.onNavigated.addListener(() => {
    try {
      port.postMessage({ type: 'INIT', tabId: chrome.devtools.inspectedWindow.tabId });
      pushMarble({ type: 'NAVIGATED' });
    } catch {}
  });

  connecting = false;
}

window.addEventListener('unload', () => {
  try { port.disconnect(); } catch {}
});

new ResizeObserver(layout).observe(stageWrap);
layout();
connect();

// ====== Demo Mode (optional) ======
let demoTimer = setInterval(()=>{
  if (totalEvents>0){ clearInterval(demoTimer); return; }
  const types = ['NEXT', 'COMPLETE', 'SUBSCRIBE', 'ERROR'];
  const type = types[Math.floor(Math.random()*types.length)];
  pushMarble({ type, id: Math.floor(Math.random()*9999) });
}, 600);
