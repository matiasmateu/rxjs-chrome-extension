import { RXJS_DEVTOOLS_FROM, isRxDevtoolsEvent } from '@rxjs-devtools/core/protocol';

const RETRY_DELAY_MS = 200;

// Inject the page-world hook.
(() => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('dist/injectedHook.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
})();

// Forward page -> background with a queue to tolerate background wakeups.
const queue: unknown[] = [];
let sending = false;

function flushQueue() {
  if (sending || queue.length === 0) return;
  sending = true;

  const msg = queue.shift();

  chrome.runtime.sendMessage(msg, () => {
    const err = chrome.runtime.lastError?.message;
    if (err) {
      queue.unshift(msg);
      window.setTimeout(() => {
        sending = false;
        flushQueue();
      }, RETRY_DELAY_MS);
      return;
    }

    sending = false;
    window.setTimeout(flushQueue, 0);
  });
}

function forwardToBackground(payload: unknown) {
  queue.push(payload);
  flushQueue();
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  const msg = event.data as any;
  if (!msg || msg.__from !== RXJS_DEVTOOLS_FROM) return;
  if (!isRxDevtoolsEvent(msg.message)) return;

  try {
    forwardToBackground({
      ...msg,
      __from: 'CONTENT_SCRIPT',
      time: Date.now(),
    });
  } catch {
    // no-op
  }
});

chrome.runtime.onMessage.addListener(() => {
  // Reserved for background -> content commands.
});
