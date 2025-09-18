// panel.js
let port;
let connecting = false;

// --- simple UI setup ---
const container = document.createElement('div');
container.id = 'log-container';
container.style.cssText = `
  font-family: monospace;
  padding: 8px;
  white-space: pre-wrap;
  overflow-y: auto;
  height: 100%;
`;
document.body.style.margin = '0';
document.body.appendChild(container);

function appendLog(msg) {
  const div = document.createElement('div');
  div.textContent = `[${new Date().toLocaleTimeString()}] ${JSON.stringify(msg)}`;
  container.appendChild(div);
  // keep scrolled to the bottom
  container.scrollTop = container.scrollHeight;
}

// --- connection logic ---
function connect() {
  if (connecting) return;
  connecting = true;

  port = chrome.runtime.connect({ name: 'rxjs-panel' });
  port.postMessage({ type: 'INIT', tabId: chrome.devtools.inspectedWindow.tabId });

  port.onMessage.addListener(renderMessage);

  port.onDisconnect.addListener(() => {
    appendLog({ type: 'INFO', text: 'Port disconnected. Reconnecting…' });
    connecting = false;
    setTimeout(connect, 500);
  });

  // Re-init when the inspected page navigates
  chrome.devtools.network.onNavigated.addListener(() => {
    try {
      port.postMessage({
        type: 'INIT',
        tabId: chrome.devtools.inspectedWindow.tabId
      });
    } catch {
      // no-op if port is gone
    }
  });

  connecting = false;
}

function renderMessage(msg) {
  // Display every incoming message in the log container
  appendLog(msg);
}

// Clean up when the panel is closed
window.addEventListener('unload', () => {
  try { port.disconnect(); } catch {}
});

// Start connection when panel loads
connect();
