(function () {
  const ORIGIN = 'RXJS_HOOK';

  // Simple debug helper
  const __DEBUG__ = true;
  const dbg = (...args) => {
    if (!__DEBUG__) return;
    try { console.debug('[RXJS-EXT][hook]', ...args); } catch (_) { /* noop */ }
  };

  function send(payload) {
    try {
      window.postMessage({ __from: ORIGIN, type: 'RXJS_EVENT', payload }, '*');
      dbg('Sent message to contentScript', { payloadType: payload?.type, keys: payload && Object.keys(payload) });
    } catch (err) {
      dbg('Failed to send message', { error: String(err) });
    }
  }

  // Simple hash for color bucketing on the panel (optional)
  const hash = (s) => [...s].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0)>>>0;

  // Registers any Observable and emits materialized notifications
  function register(observable, { key, label }) {
    dbg('Register called', { key, label });
    // Lazy import from page if rxjs is present
    const { materialize } = window.rxjs.operators || {};
    if (!materialize) {
      console.warn('RxJS operators not found for DevTools');
      dbg('RxJS operators.materialize missing');
      return;
    }

    const start = performance.now();
    const sub = observable.pipe(window.rxjs.operators.materialize()).subscribe(n => {
      let value = n.value;
      // Keep payloads small & safe
      if (value && value.type) value = { type: value.type, meta: value.meta?.traceId };
      dbg('Notification', { key, label, kind: n.kind, valueType: value && value.type, dt: performance.now() - start });
      send({
        key, label,
        kind: n.kind,      // 'N' | 'E' | 'C'
        value,
        t: performance.now(),
        color: hash(label) % 360
      });
    });
    return () => {
      try {
        sub.unsubscribe();
        dbg('Unsubscribed', { key, label, elapsed: performance.now() - start });
      } catch (err) {
        dbg('Failed to unsubscribe', { error: String(err) });
      }
    };
  }

  window.__RXJS_DEVTOOLS__ = { register };
})();
