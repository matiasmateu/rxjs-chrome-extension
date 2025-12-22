(function () {
  const ORIGIN = 'RXJS_HOOK';

  // Simple debug helper
  const __DEBUG__ = true;
  const dbg = (...args) => {
    if (!__DEBUG__) return;
    try { console.debug('[RXJS-EXT][hook]', ...args); } catch (_) { /* noop */ }
  };

  let instanceSeq = 0;
  let subscriptionSeq = 0;

  const obsIds = new WeakMap();
  let obsSeq = 0;

  const getObservableId = (ref) => {
    const existing = obsIds.get(ref);
    if (existing) return existing;
    const next = `obs_${++obsSeq}`;
    obsIds.set(ref, next);
    return next;
  };

  function safeSerialize(value, depth = 5, seen = new WeakSet()) {
    if (value == null) return value;
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') return value;
    if (t === 'bigint') return value.toString();
    if (t === 'function') return `[Function ${value.name || 'anonymous'}]`;
    if (t === 'symbol') return String(value);
    if (depth <= 0) return '[MaxDepth]';
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Error)
      return { name: value.name, message: value.message, stack: value.stack };

    if (typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
      if (Array.isArray(value)) {
        return value.slice(0, 50).map((item) => safeSerialize(item, depth - 1, seen));
      }
      const out = {};
      const keys = Object.keys(value).slice(0, 50);
      for (const key of keys) {
        out[key] = safeSerialize(value[key], depth - 1, seen);
      }
      return out;
    }
    return String(value);
  }

  function send(message) {
    try {
      window.postMessage({ __from: ORIGIN, message }, '*');
      dbg('Sent message to contentScript', { kind: message?.kind, observableId: message?.observableId });
    } catch (err) {
      dbg('Failed to send message', { error: String(err) });
    }
  }

  // Registers any Observable and emits materialized notifications
  function register(observable, options = {}) {
    const { key, label, domain, tags } = options || {};
    dbg('Register called', { key, label, domain });
    // Lazy import from page if rxjs is present
    const { materialize } = (window.rxjs && window.rxjs.operators) || {};
    if (!materialize) {
      console.warn('RxJS operators not found for DevTools');
      dbg('RxJS operators.materialize missing');
      return;
    }

    const instanceId = `hook_${++instanceSeq}`;
    const observableId = key || getObservableId(observable);
    const sourceLabel = label || key || observableId;
    const source = { label: sourceLabel, operator: 'hook' };
    if (domain) source.domain = domain;
    if (Array.isArray(tags) && tags.length) source.tags = tags;

    const subscriptionId = `sub_${++subscriptionSeq}`;
    const base = {
      observableId,
      instanceId,
      subscriptionId,
      source,
    };

    const start = performance.now();
    send({ kind: 'subscribe', ts: Date.now(), ...base });

    const sub = observable.pipe(materialize()).subscribe((n) => {
      if (n.kind === 'N') {
        send({
          kind: 'next',
          ts: Date.now(),
          ...base,
          data: safeSerialize(n.value),
        });
        dbg('Notification', { label: sourceLabel, kind: 'next', dt: performance.now() - start });
        return;
      }

      if (n.kind === 'E') {
        send({
          kind: 'error',
          ts: Date.now(),
          ...base,
          data: safeSerialize(n.error),
        });
        dbg('Notification', { label: sourceLabel, kind: 'error', dt: performance.now() - start });
        return;
      }

      if (n.kind === 'C') {
        send({ kind: 'complete', ts: Date.now(), ...base });
        dbg('Notification', { label: sourceLabel, kind: 'complete', dt: performance.now() - start });
      }
    });
    return () => {
      try {
        send({ kind: 'unsubscribe', ts: Date.now(), ...base });
        sub.unsubscribe();
        dbg('Unsubscribed', { key, label, elapsed: performance.now() - start });
      } catch (err) {
        dbg('Failed to unsubscribe', { error: String(err) });
      }
    };
  }

  window.__RXJS_DEVTOOLS__ = { register };
})();
