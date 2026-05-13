import { monitorRX } from '@rxjs-devtools/core';
import { useMemo, useRef, useState } from 'react';
import {
  concatWith,
  interval,
  map,
  mergeMap,
  type Observable,
  type Subscription,
  take,
  takeUntil,
  throwError,
  timer,
} from 'rxjs';

type Scenario =
  | 'next-only'
  | 'complete'
  | 'error'
  | 'mixed'
  | 'epic-success'
  | 'epic-cancel'
  | 'epic-error';

type EpicScenario = Extract<Scenario, 'epic-success' | 'epic-cancel' | 'epic-error'>;

type EpicInvocationMode = 'success' | 'cancel' | 'error';

type EpicInvocationPlan = {
  epicName: string;
  invocationId: string;
  startMs: number;
  responseMs: number;
  mode: EpicInvocationMode;
  scenarioId: EpicScenario;
};

function makePayload(streamId: number, tick: number, payloadSize: number) {
  return {
    streamId,
    tick,
    payload: 'x'.repeat(payloadSize),
    at: new Date().toISOString(),
  };
}

function buildStream(
  scenario: Exclude<Scenario, EpicScenario>,
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

function isEpicScenario(scenario: Scenario): scenario is EpicScenario {
  return scenario === 'epic-success' || scenario === 'epic-cancel' || scenario === 'epic-error';
}

function buildEpicInvocationPlan(scenario: EpicScenario, streamId: number): EpicInvocationPlan {
  const modeByScenario: Record<EpicScenario, EpicInvocationMode> = {
    'epic-success': 'success',
    'epic-cancel': 'cancel',
    'epic-error': 'error',
  };

  return {
    scenarioId: scenario,
    mode: modeByScenario[scenario],
    epicName: streamId % 2 === 0 ? 'FetchUserEpic' : 'SaveDraftEpic',
    invocationId: `inv_${scenario}_${streamId}`,
    startMs: 40 + (streamId - 1) * 120,
    responseMs: 160 + (streamId % 3) * 60,
  };
}

function buildEpicInvocationStream(
  plan: EpicInvocationPlan,
  payloadSize: number,
): Observable<Record<string, unknown>> {
  const invokePayload = {
    phase: 'invoke',
    epic: plan.epicName,
    invocationId: plan.invocationId,
    scenarioId: plan.scenarioId,
    waitMs: plan.responseMs,
    payload: 'y'.repeat(payloadSize),
  };

  const successPayload = {
    phase: 'success',
    epic: plan.epicName,
    invocationId: plan.invocationId,
    scenarioId: plan.scenarioId,
    durationMs: plan.responseMs,
    result: {
      ok: true,
      entityId: `${plan.epicName.toLowerCase()}_${plan.invocationId}`,
    },
  };

  const base$ = timer(plan.startMs).pipe(
    map(() => invokePayload),
    concatWith(
      plan.mode === 'error'
        ? timer(plan.responseMs).pipe(
            mergeMap(() =>
              throwError(
                () =>
                  new Error(
                    `${plan.epicName} invocation ${plan.invocationId} failed (${plan.scenarioId})`,
                  ),
              ),
            ),
          )
        : timer(plan.responseMs).pipe(map(() => successPayload)),
    ),
  );

  if (plan.mode !== 'cancel') {
    return base$;
  }

  const cancelAtMs = plan.startMs + Math.max(24, Math.floor(plan.responseMs * 0.55));
  return base$.pipe(takeUntil(timer(cancelAtMs)));
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
      if (isEpicScenario(scenario)) {
        const plan = buildEpicInvocationPlan(scenario, streamId);
        const stream$ = buildEpicInvocationStream(plan, payloadSize).pipe(
          monitorRX({
            observableKey: `playground_epic_${plan.invocationId}`,
            label: `${plan.epicName} #${plan.invocationId}`,
            domain: 'playground-epic',
            tags: ['playground', 'epic', plan.scenarioId, plan.mode],
            streamKind: 'epic',
            epic: {
              name: plan.epicName,
              invocationId: plan.invocationId,
              scenarioId: plan.scenarioId,
            },
            meta: {
              epicName: plan.epicName,
              invocationId: plan.invocationId,
              scenario: plan.scenarioId,
              streamKind: 'epic',
            },
          }),
        );

        const subscription = stream$.subscribe({
          next: () => {},
          error: () => {},
          complete: () => {},
        });
        subscriptions.push(subscription);
        continue;
      }

      const stream$ = buildStream(scenario, streamId, intervalMs + streamId * 40, payloadSize).pipe(
        monitorRX({
          observableKey: `playground_stream_${streamId}`,
          label: `Playground Stream ${streamId}`,
          domain: 'playground',
          tags: ['playground', scenario, 'observable'],
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
            <option value="epic-success">epic-success</option>
            <option value="epic-cancel">epic-cancel</option>
            <option value="epic-error">epic-error</option>
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
