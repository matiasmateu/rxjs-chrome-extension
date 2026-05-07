import type { RuntimeContentForwardMessage } from '../transport-types';
import { parsePageHookForwardMessage } from '../transport-parser';

const RETRY_DELAY_MS = 200;
const MAX_QUEUE_SIZE = 500;

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
const queue: RuntimeContentForwardMessage[] = [];
let sending = false;

function flushQueue() {
  if (sending || queue.length === 0) return;
  sending = true;

  const msg = queue.shift();
  if (!msg) {
    sending = false;
    return;
  }

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

function forwardToBackground(payload: RuntimeContentForwardMessage) {
  queue.push(payload);
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }
  flushQueue();
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  const payload = parsePageHookForwardMessage(event.data);
  if (!payload) return;

  try {
    forwardToBackground(payload);
  } catch {
    // no-op
  }
});

chrome.runtime.onMessage.addListener(() => {
  // Reserved for background -> content commands.
});
