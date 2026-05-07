import { monitorRX } from '@rxjs-devtools/core';
import { useMemo, useRef, useState } from 'react';
import { concatWith, interval, map, type Subscription, take, throwError } from 'rxjs';

type Scenario = 'next-only' | 'complete' | 'error' | 'mixed';

function makePayload(streamId: number, tick: number, payloadSize: number) {
  return {
    streamId,
    tick,
    payload: 'x'.repeat(payloadSize),
    at: new Date().toISOString(),
  };
}

function buildStream(
  scenario: Scenario,
  streamId: number,
  intervalMs: number,
  payloadSize: number,
) {
  const base$ = interval(intervalMs).pipe(map((tick) => makePayload(streamId, tick, payloadSize)));

  if (scenario === 'next-only') {
    return base$;
  }

  if (scenario === 'complete') {
    return base$.pipe(take(8));
  }

  if (scenario === 'error') {
    return base$.pipe(
      take(5),
      concatWith(throwError(() => new Error(`playground stream ${streamId} failed`))),
    );
  }

  if (streamId % 3 === 0) {
    return base$.pipe(
      take(4),
      concatWith(throwError(() => new Error(`mixed stream ${streamId} failed`))),
    );
  }

  return base$.pipe(take(10));
}

export function App() {
  const [scenario, setScenario] = useState<Scenario>('mixed');
  const [streamCount, setStreamCount] = useState(4);
  const [intervalMs, setIntervalMs] = useState(300);
  const [payloadSize, setPayloadSize] = useState(24);
  const [status, setStatus] = useState('idle');

  const subscriptionsRef = useRef<Subscription[]>([]);

  const summary = useMemo(
    () => `${streamCount} streams - ${intervalMs}ms - payload ${payloadSize}`,
    [streamCount, intervalMs, payloadSize],
  );

  const stopStreams = () => {
    subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
    subscriptionsRef.current = [];
    setStatus('stopped');
  };

  const startStreams = () => {
    stopStreams();

    const subscriptions: Subscription[] = [];

    for (let streamId = 1; streamId <= streamCount; streamId += 1) {
      const stream$ = buildStream(scenario, streamId, intervalMs + streamId * 40, payloadSize).pipe(
        monitorRX({
          observableKey: `playground_stream_${streamId}`,
          label: `Playground Stream ${streamId}`,
          domain: 'playground',
          tags: ['playground', scenario],
        }),
      );

      const subscription = stream$.subscribe({
        // Execution is side-effect-driven for monitoring in the extension.
        next: () => {},
        error: () => {},
        complete: () => {},
      });
      subscriptions.push(subscription);
    }

    subscriptionsRef.current = subscriptions;
    setStatus(`running (${scenario})`);
  };

  return (
    <main className="app">
      <h1>RxJS DevTools Playground</h1>
      <p className="summary">{summary}</p>

      <section className="controls">
        <label>
          Scenario
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value as Scenario)}
          >
            <option value="mixed">mixed</option>
            <option value="next-only">next-only</option>
            <option value="complete">complete</option>
            <option value="error">error</option>
          </select>
        </label>

        <label>
          Streams
          <input
            type="number"
            min={1}
            max={32}
            value={streamCount}
            onChange={(event) => setStreamCount(Number(event.target.value) || 1)}
          />
        </label>

        <label>
          Interval (ms)
          <input
            type="number"
            min={40}
            max={5000}
            step={20}
            value={intervalMs}
            onChange={(event) => setIntervalMs(Number(event.target.value) || 40)}
          />
        </label>

        <label>
          Payload Size
          <input
            type="number"
            min={1}
            max={4096}
            step={8}
            value={payloadSize}
            onChange={(event) => setPayloadSize(Number(event.target.value) || 1)}
          />
        </label>
      </section>

      <section className="actions">
        <button onClick={startStreams}>Start</button>
        <button onClick={stopStreams}>Stop</button>
        <span>Status: {status}</span>
      </section>

      <p className="hint">
        Open this page with the extension installed and the DevTools panel open to inspect emitted
        events.
      </p>
    </main>
  );
}
