// background.js (MV3 service worker)

// Map of tabId -> Set<Port> (one or more DevTools panels can be open per tab)
const portsByTab = new Map();

// Optional: small per-tab buffer for when the panel isn't connected yet
const bufferByTab = new Map();
const BUFFER_LIMIT = 200;

// ---- DevTools panel connects with chrome.runtime.connect({ name: 'rxjs-panel' }) ----
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'rxjs-panel') return;

  let tabId = null;

  const removePort = () => {
    if (tabId == null) return;
    const set = portsByTab.get(tabId);
    if (set) {
      set.delete(port);
      if (set.size === 0) portsByTab.delete(tabId);
    }
  };

  port.onMessage.addListener((msg) => {
    // Expect an INIT from the panel that includes tabId
    if (msg?.type === 'INIT' && Number.isInteger(msg.tabId)) {
      tabId = msg.tabId;
      if (!portsByTab.has(tabId)) portsByTab.set(tabId, new Set());
      portsByTab.get(tabId).add(port);

      // Drain any buffered messages for this tab
      const buf = bufferByTab.get(tabId);
      if (buf?.length) {
        for (const payload of buf) safePost(port, payload);
        bufferByTab.delete(tabId);
      }

      safePost(port, { type: 'ACK', tabId });
    }
  });

  port.onDisconnect.addListener(removePort);
});

// ---- Content script -> background via chrome.runtime.sendMessage(...) ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender?.tab?.id;
  if (typeof tabId === 'number') {
    // Wrap or pass through the payload as you like
    const payload = {
      type: 'CONTENT_EVENT',
      tabId,
      // preserve original message under "data"
      data: msg,
      // optional metadata
      meta: { origin: 'content-script', time: Date.now() }
    };
    forwardToPanel(tabId, payload);
    // If you don't need async work, return false and respond immediately:
    try { sendResponse?.({ ok: true }); } catch {}
  }
  // Returning false indicates we won't respond asynchronously
  return false;
});

// ---- Helper: forward to all connected panels for the tab, else buffer ----
function forwardToPanel(tabId, payload) {
  const set = portsByTab.get(tabId);
  if (!set || set.size === 0) {
    // No panel yet — buffer a few recent messages
    const buf = bufferByTab.get(tabId) ?? [];
    buf.push(payload);
    if (buf.length > BUFFER_LIMIT) buf.shift();
    bufferByTab.set(tabId, buf);
    return;
  }

  for (const p of Array.from(set)) {
    const ok = safePost(p, payload);
    if (!ok) set.delete(p);
  }
  if (set.size === 0) portsByTab.delete(tabId);
}

// ---- Helper: safe post that tolerates disconnects ----
function safePost(port, payload) {
  try {
    port.postMessage(payload);
    // Some disconnects surface via lastError
    if (chrome.runtime.lastError) throw chrome.runtime.lastError;
    return true;
  } catch (_e) {
    return false;
  }
}

// ---- Cleanup when a tab closes ----
chrome.tabs.onRemoved.addListener((tabId) => {
  portsByTab.delete(tabId);
  bufferByTab.delete(tabId);
});
