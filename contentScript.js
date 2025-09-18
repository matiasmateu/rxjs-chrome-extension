// contentScript.js

// --- Inject the page-world hook ---
(() => {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('injectedHook.js');
  (document.head || document.documentElement).appendChild(s);
  s.onload = () => {
    console.log('Injected hook loaded and removed from DOM');
    s.remove();
  };
  console.log('Attempting to inject hook', { src: s.src });
})();

// --- Forward page -> background (MV3-safe, no long-lived port) ---

// Simple in-memory queue to tolerate brief BG wake-ups
const queue = [];
let sending = false;

function flushQueue() {
  if (sending || queue.length === 0) return;
  sending = true;

  const msg = queue.shift();

  // Fire-and-forget; background responds immediately ({ok:true})
  chrome.runtime.sendMessage(msg, (res) => {
    // swallow benign "no response" errors from MV3 wakeups
    const err = chrome.runtime.lastError?.message;
    if (err) {
      // Put the message back at the front and retry shortly
      queue.unshift(msg);
      setTimeout(() => { sending = false; flushQueue(); }, 200);
      return;
    }
    sending = false;
    // keep draining
    setTimeout(flushQueue, 0);
  });
}

function forwardToBackground(payload) {
  // Shape is preserved by background under payload.data
  queue.push(payload);
  flushQueue();
}

// Listen for messages from the injected page-world hook
window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const msg = e.data;
  if (!msg || msg.__from !== 'RXJS_HOOK') return;

  try {
    forwardToBackground({
      // Pass through the original message; BG wraps it
      ...msg,
      __from: 'CONTENT_SCRIPT', // optional tag for debugging
      time: Date.now()
    });
    // Optional debug:
    // console.log('[CS] forwarded', { type: msg.type });
  } catch (error) {
    console.log('[CS] failed to forward', { error: String(error) });
  }
});

// (Optional) If you ever need background -> content messages,
// you can add a one-off listener here:
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  // handle commands from background if needed
  // e.g., if (msg?.type === 'DO_SOMETHING') { ... }
});
