// background.ts (MV3 service worker)
import { PANEL_PORT_NAME } from '../transport-types';
import type { PanelAckMessage, RuntimeBackgroundPayload } from '../transport-types';
import { createBackgroundPayload, parsePanelInitMessage } from '../transport-parser';

const BUFFER_LIMIT = 200;

// Map of tabId -> Set<port> (one or more DevTools panels can be open per tab)
const portsByTab = new Map<number, Set<ChromeRuntimePort>>();

// Small per-tab buffer for events when the panel isn't connected yet.
const bufferByTab = new Map<number, RuntimeBackgroundPayload[]>();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PANEL_PORT_NAME) return;

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

  port.onMessage.addListener((msg) => {
    const initMessage = parsePanelInitMessage(msg);
    if (!initMessage) return;
    tabId = initMessage.tabId;
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

    const ackPayload: PanelAckMessage = { type: 'ACK', tabId };
    safePost(port, ackPayload);
  });

  port.onDisconnect.addListener(removePort);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender?.tab?.id;
  if (typeof tabId === 'number') {
    const payload: RuntimeBackgroundPayload = createBackgroundPayload(msg, tabId);

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

function forwardToPanel(tabId: number, payload: RuntimeBackgroundPayload) {
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

function safePost(port: ChromeRuntimePort, payload: unknown): boolean {
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
