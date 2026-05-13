import { type MonoTypeOperatorFunction, Observable } from 'rxjs';

import {
  RXJS_DEVTOOLS_FROM,
  type RxDevtoolsEpicSource,
  type RxDevtoolsMessage,
  type RxDevtoolsStreamKind,
} from './protocol';

export type NotifyRxjsDevtoolsOptions = {
  targetOrigin?: string;
  appId?: string;
};

/**
 * Sends a protocol message to the browser window transport used by the extension.
 *
 * @param msg Protocol message to publish.
 * @param options Optional transport overrides.
 * @returns Nothing. Fails silently in non-browser environments.
 */
export function notifyRxjsDevtools(
  msg: RxDevtoolsMessage,
  options: NotifyRxjsDevtoolsOptions = {},
): void {
  if (typeof window === 'undefined' || typeof window.postMessage !== 'function') {
    return;
  }

  window.postMessage(
    {
      __from: RXJS_DEVTOOLS_FROM,
      __appId: options.appId,
      message: msg,
    },
    options.targetOrigin ?? '*',
  );
}

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

const safeNotify = (msg: RxDevtoolsMessage): void => {
  try {
    notifyRxjsDevtools(msg);
  } catch {
    // Never break stream execution due to monitoring transport failures.
  }
};

export type SerializeOptions = {
  maxDepth?: number;
  maxKeys?: number;
  maxString?: number;
};

/**
 * Serializes arbitrary values into a safe, bounded structure for transport.
 *
 * Handles circular references, depth/key limits, and long string truncation.
 *
 * @param value Raw value to serialize.
 * @param opts Serialization limits.
 * @returns Transport-safe value representation.
 */
export const safeSerialize = (value: unknown, opts: SerializeOptions = {}): unknown => {
  const { maxDepth = 6, maxKeys = 200, maxString = 20_000 } = opts;
  const seen = new WeakSet<object>();

  const walk = (input: unknown, depth: number): unknown => {
    if (input == null) return input;

    const inputType = typeof input;
    if (inputType === 'string') {
      const text = input as string;
      return text.length > maxString ? `${text.slice(0, maxString)}...(truncated)` : text;
    }
    if (inputType === 'number' || inputType === 'boolean' || inputType === 'bigint') {
      return input;
    }
    if (inputType === 'function') {
      const fn = input as (...args: unknown[]) => unknown;
      return `[Function ${fn.name || 'anonymous'}]`;
    }
    if (inputType === 'symbol') {
      return String(input);
    }

    if (depth <= 0) return '[MaxDepth]';

    if (input instanceof Date) {
      return { $type: 'Date', value: input.toISOString() };
    }
    if (input instanceof Error) {
      return {
        $type: 'Error',
        name: input.name,
        message: input.message,
        stack: input.stack,
      };
    }

    if (typeof input === 'object') {
      if (seen.has(input)) return '[Circular]';
      seen.add(input);

      if (Array.isArray(input)) {
        const limit = Math.min(input.length, maxKeys);
        const out: unknown[] = [];
        for (let i = 0; i < limit; i += 1) {
          out.push(walk(input[i], depth - 1));
        }
        if (input.length > limit) {
          out.push(`...(${input.length - limit} more)`);
        }
        return out;
      }

      const record = input as Record<string, unknown>;
      const keys = Object.keys(record);
      const limit = Math.min(keys.length, maxKeys);
      const out: Record<string, unknown> = {};

      for (const key of keys.slice(0, limit)) {
        out[key] = walk(record[key], depth - 1);
      }

      if (keys.length > limit) {
        out.$truncatedKeys = keys.length - limit;
      }
      return out;
    }

    return String(input);
  };

  return walk(value, maxDepth);
};

export type MonitorRxOptions = {
  instanceId?: string;
  domain?: string;
  label?: string;
  tags?: string[];
  streamKind?: RxDevtoolsStreamKind;
  epic?: RxDevtoolsEpicSource;
  meta?: Record<string, unknown>;
  observableKey?: string;
  serialize?: (value: unknown) => unknown;
  notify?: (msg: RxDevtoolsMessage) => void;
};

/**
 * RxJS operator that reports lifecycle events (`subscribe`, `next`, `error`, `complete`,
 * `unsubscribe`) to the devtools transport while preserving original stream behavior.
 *
 * @typeParam T Source observable value type.
 * @param options Monitoring metadata and transport/serialization overrides.
 * @returns `MonoTypeOperatorFunction<T>` that instruments the source observable.
 */
export const monitorRx =
  <T>(options: MonitorRxOptions = {}): MonoTypeOperatorFunction<T> =>
  (source: Observable<T>) => {
    const instanceId = options.instanceId ?? `mon_${++instanceSeq}`;
    const notify = options.notify ?? safeNotify;
    const serialize = options.serialize ?? safeSerialize;
    const label = options.label ?? options.observableKey;
    const observableId =
      options.observableKey ?? options.label ?? getObservableId(source as object);
    const streamKind = options.streamKind ?? 'observable';

    const meta = label ? { ...(options.meta ?? {}), observable: label } : options.meta;

    return new Observable<T>((subscriber) => {
      const subscriptionId = `sub_${++subscriptionSeq}`;

      const base: Omit<RxDevtoolsMessage, 'kind' | 'ts' | 'data'> = {
        observableId,
        instanceId,
        subscriptionId,
        meta,
        source: {
          domain: options.domain,
          label,
          tags: options.tags,
          operator: 'monitorRx',
          streamKind,
          epic: options.epic,
        },
      };

      notify({ kind: 'subscribe', ts: Date.now(), ...base });

      const innerSub = source.subscribe({
        next: (value: T) => {
          notify({
            kind: 'next',
            ts: Date.now(),
            ...base,
            data: serialize(value),
          });
          subscriber.next(value);
        },
        error: (err: unknown) => {
          notify({
            kind: 'error',
            ts: Date.now(),
            ...base,
            data: serialize(err),
          });
          subscriber.error(err);
        },
        complete: () => {
          notify({ kind: 'complete', ts: Date.now(), ...base });
          subscriber.complete();
        },
      });

      return () => {
        notify({ kind: 'unsubscribe', ts: Date.now(), ...base });
        innerSub.unsubscribe();
      };
    });
  };

/**
 * Alias for `monitorRx` kept for compatibility.
 */
export const monitorRX = monitorRx;
