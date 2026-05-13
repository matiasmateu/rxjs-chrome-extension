import { describe, expect, it } from 'vitest';
import { of, throwError } from 'rxjs';
import { monitorRx, safeSerialize } from '../monitor-rx';
import type { RxDevtoolsMessage } from '../protocol';

describe('safeSerialize', () => {
  it('handles circular objects and respects truncation limits', () => {
    const value: Record<string, unknown> = {
      alpha: 'abcdef',
      beta: 2,
      gamma: true,
    };
    value.self = value;

    const serialized = safeSerialize(value, {
      maxDepth: 4,
      maxKeys: 2,
      maxString: 5,
    }) as Record<string, unknown>;

    expect(serialized.alpha).toBe('abcde...(truncated)');
    expect(serialized.$truncatedKeys).toBe(2);
    expect(serialized.self).toBeUndefined();
  });

  it('serializes nested circular values when key budget allows', () => {
    const value: Record<string, unknown> = {
      root: { a: 1 },
    };
    (value.root as Record<string, unknown>).self = value.root;

    const serialized = safeSerialize(value, {
      maxDepth: 6,
      maxKeys: 10,
      maxString: 50,
    }) as Record<string, unknown>;

    const nested = serialized.root as Record<string, unknown>;
    expect(nested.self).toBe('[Circular]');
  });
});

describe('monitorRx', () => {
  it('emits lifecycle messages while preserving values', () => {
    const events: RxDevtoolsMessage[] = [];
    const values: number[] = [];

    of(1, 2)
      .pipe(
        monitorRx<number>({
          observableKey: 'test/stream',
          label: 'Test Stream',
          domain: 'core-tests',
          notify: (msg) => events.push(msg),
          serialize: (v) => v,
        }),
      )
      .subscribe({
        next: (value) => values.push(value),
        complete: () => {},
      });

    expect(values).toEqual([1, 2]);
    expect(events.map((event) => event.kind)).toEqual([
      'subscribe',
      'next',
      'next',
      'complete',
      'unsubscribe',
    ]);
    expect(events.every((event) => event.observableId.length > 0)).toBe(true);
    expect(events.every((event) => event.source?.streamKind === 'observable')).toBe(true);
  });

  it('emits error lifecycle and preserves source error', () => {
    const events: RxDevtoolsMessage[] = [];
    const sourceError = new Error('boom');
    let receivedError: unknown = null;

    throwError(() => sourceError)
      .pipe(
        monitorRx({
          observableKey: 'test/error',
          notify: (msg) => events.push(msg),
        }),
      )
      .subscribe({
        error: (err) => {
          receivedError = err;
        },
      });

    expect(receivedError).toBe(sourceError);
    expect(events.map((event) => event.kind)).toEqual(['subscribe', 'error', 'unsubscribe']);
  });

  it('adds epic source metadata when stream kind is epic', () => {
    const events: RxDevtoolsMessage[] = [];

    of({ ok: true })
      .pipe(
        monitorRx({
          observableKey: 'epic:search:inv_1',
          label: 'SearchUsersEpic #inv_1',
          domain: 'playground-epic',
          streamKind: 'epic',
          epic: {
            name: 'SearchUsersEpic',
            invocationId: 'inv_1',
            scenarioId: 'epic-success',
          },
          notify: (msg) => events.push(msg),
        }),
      )
      .subscribe({
        next: () => {},
        complete: () => {},
      });

    expect(events).not.toHaveLength(0);
    expect(events.every((event) => event.source?.streamKind === 'epic')).toBe(true);
    expect(events.every((event) => event.source?.epic?.name === 'SearchUsersEpic')).toBe(true);
    expect(events.every((event) => event.source?.epic?.invocationId === 'inv_1')).toBe(true);
    expect(events.every((event) => event.source?.epic?.scenarioId === 'epic-success')).toBe(true);
  });
});
