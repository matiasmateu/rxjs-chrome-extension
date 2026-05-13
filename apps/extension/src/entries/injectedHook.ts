import { RXJS_DEVTOOLS_FROM, type RxDevtoolsMessage } from 'rxjs-devtools/protocol';
import { safeSerialize } from 'rxjs-devtools/monitor-rx';

(() => {
  const DEBUG_FLAG_KEY = '__RXJS_DEVTOOLS_DEBUG__';
  const DEBUG_STORAGE_KEY = 'rxjs-devtools:debug';

  const readDebugFlag = (): boolean => {
    try {
      const globalDebugValue = (window as unknown as Record<string, unknown>)[DEBUG_FLAG_KEY];
      if (typeof globalDebugValue === 'boolean') {
        return globalDebugValue;
      }
    } catch {
      // no-op
    }

    try {
      const persisted = window.localStorage?.getItem(DEBUG_STORAGE_KEY);
      return persisted === '1' || persisted === 'true';
    } catch {
      return false;
    }
  };

  const DEBUG = readDebugFlag();

  type RegisterOptions = {
    key?: string;
    label?: string;
    domain?: string;
    tags?: string[];
  };

  type RxNotification = {
    kind: 'N' | 'E' | 'C';
    value?: unknown;
    error?: unknown;
  };

  type RxjsRuntime = {
    operators?: {
      materialize?: () => unknown;
    };
  };

  type SubscriptionLike = {
    unsubscribe: () => void;
  };

  type MaterializedObservableLike = {
    subscribe: (handler: (notification: RxNotification) => void) => SubscriptionLike;
  };

  type ObservableLike = {
    pipe: (operator: unknown) => MaterializedObservableLike;
  };

  type DevtoolsApi = {
    register: (observable: ObservableLike, options?: RegisterOptions) => (() => void) | undefined;
  };

  type DevtoolsWindow = Window & {
    rxjs?: RxjsRuntime;
    __RXJS_DEVTOOLS__?: DevtoolsApi;
  };

  const windowWithDevtools = window as DevtoolsWindow;

  const dbg = (...args: unknown[]) => {
    if (!DEBUG) return;
    try {
      console.debug('[RXJS-EXT][hook]', ...args);
    } catch {
      // no-op
    }
  };

  let instanceSeq = 0;
  let subscriptionSeq = 0;
  let observableSeq = 0;

  const observableIds = new WeakMap<object, string>();

  const getObservableId = (ref: object): string => {
    const existing = observableIds.get(ref);
    if (existing) return existing;
    const next = `obs_${++observableSeq}`;
    observableIds.set(ref, next);
    return next;
  };

  const serializeForHook = (value: unknown): unknown =>
    safeSerialize(value, {
      maxDepth: 5,
      maxKeys: 50,
      maxString: 20_000,
    });

  function send(message: RxDevtoolsMessage) {
    try {
      window.postMessage({ __from: RXJS_DEVTOOLS_FROM, message }, '*');
      dbg('Sent message to content script', {
        kind: message.kind,
        observableId: message.observableId,
      });
    } catch (error) {
      dbg('Failed to send message', { error: String(error) });
    }
  }

  function register(observable: ObservableLike, options: RegisterOptions = {}) {
    const { key, label, domain, tags } = options;
    dbg('Register called', { key, label, domain });

    const runtime = windowWithDevtools.rxjs;
    const materialize = runtime?.operators?.materialize;
    if (!materialize) {
      console.warn('RxJS operators not found for DevTools');
      dbg('RxJS operators.materialize missing');
      return;
    }

    const instanceId = `hook_${++instanceSeq}`;
    const observableId = key || getObservableId(observable);
    const sourceLabel = label || key || observableId;
    const source: NonNullable<RxDevtoolsMessage['source']> = {
      label: sourceLabel,
      operator: 'hook',
    };
    if (domain) source.domain = domain;
    if (Array.isArray(tags) && tags.length > 0) source.tags = tags;

    const subscriptionId = `sub_${++subscriptionSeq}`;
    const base = {
      observableId,
      instanceId,
      subscriptionId,
      source,
    };

    const start = performance.now();
    send({ kind: 'subscribe', ts: Date.now(), ...base });

    const sub = observable.pipe(materialize()).subscribe((notification: RxNotification) => {
      if (notification.kind === 'N') {
        send({
          kind: 'next',
          ts: Date.now(),
          ...base,
          data: serializeForHook(notification.value),
        });
        dbg('Notification', { label: sourceLabel, kind: 'next', dt: performance.now() - start });
        return;
      }

      if (notification.kind === 'E') {
        send({
          kind: 'error',
          ts: Date.now(),
          ...base,
          data: serializeForHook(notification.error),
        });
        dbg('Notification', { label: sourceLabel, kind: 'error', dt: performance.now() - start });
        return;
      }

      if (notification.kind === 'C') {
        send({ kind: 'complete', ts: Date.now(), ...base });
        dbg('Notification', {
          label: sourceLabel,
          kind: 'complete',
          dt: performance.now() - start,
        });
      }
    });

    return () => {
      try {
        send({ kind: 'unsubscribe', ts: Date.now(), ...base });
        sub.unsubscribe();
        dbg('Unsubscribed', { key, label, elapsed: performance.now() - start });
      } catch (error) {
        dbg('Failed to unsubscribe', { error: String(error) });
      }
    };
  }

  windowWithDevtools.__RXJS_DEVTOOLS__ = { register };
})();
