// background.ts (MV3 service worker)

type Port = any;

const BUFFER_LIMIT = 200;

// Map of tabId -> Set<Port> (one or more DevTools panels can be open per tab)
const portsByTab = new Map<number, Set<Port>>();

// Small per-tab buffer for events when the panel isn't connected yet.
const bufferByTab = new Map<number, unknown[]>();

chrome.runtime.onConnect.addListener((port: Port) => {
  if (port.name !== 'rxjs-panel') return;

  let tabId: number | null = null;

  const removePort = () => {
    if (tabId == null) return;
    const set = portsByTab.get(tabId);
    if (!set) return;
    set.delete(port);
    if (set.size === 0) {
      portsByTab.delete(tabId);
    }
  };

  port.onMessage.addListener((msg: any) => {
    if (msg?.type !== 'INIT' || !Number.isInteger(msg.tabId)) return;
    tabId = msg.tabId;
    if (!portsByTab.has(tabId)) {
      portsByTab.set(tabId, new Set());
    }
    portsByTab.get(tabId)?.add(port);

    const buf = bufferByTab.get(tabId);
    if (buf?.length) {
      for (const payload of buf) {
        safePost(port, payload);
      }
      bufferByTab.delete(tabId);
    }

    safePost(port, { type: 'ACK', tabId });
  });

  port.onDisconnect.addListener(removePort);
});

chrome.runtime.onMessage.addListener((msg: any, sender: any, sendResponse: any) => {
  const tabId = sender?.tab?.id;
  if (typeof tabId === 'number') {
    const eventType =
      typeof msg?.type === 'string' && msg.type.trim().length > 0 ? msg.type : 'CONTENT_EVENT';

    const payload = {
      type: eventType,
      tabId,
      data: msg,
      meta: {
        origin: 'content-script',
        time: Date.now(),
        originalType: 'CONTENT_EVENT',
      },
    };

    forwardToPanel(tabId, payload);
    try {
      sendResponse?.({ ok: true });
    } catch {
      // no-op
    }
  }

  // No async response.
  return false;
});

function forwardToPanel(tabId: number, payload: unknown) {
  const set = portsByTab.get(tabId);
  if (!set || set.size === 0) {
    const buf = bufferByTab.get(tabId) ?? [];
    buf.push(payload);
    if (buf.length > BUFFER_LIMIT) {
      buf.shift();
    }
    bufferByTab.set(tabId, buf);
    return;
  }

  for (const port of Array.from(set)) {
    const ok = safePost(port, payload);
    if (!ok) {
      set.delete(port);
    }
  }

  if (set.size === 0) {
    portsByTab.delete(tabId);
  }
}

function safePost(port: Port, payload: unknown): boolean {
  try {
    port.postMessage(payload);
    if (chrome.runtime.lastError) {
      throw chrome.runtime.lastError;
    }
    return true;
  } catch {
    return false;
  }
}

chrome.tabs.onRemoved.addListener((tabId: number) => {
  portsByTab.delete(tabId);
  bufferByTab.delete(tabId);
});
