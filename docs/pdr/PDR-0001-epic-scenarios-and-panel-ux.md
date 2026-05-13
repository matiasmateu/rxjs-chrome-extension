# PDR-0001: Deterministic Epic Scenarios And Distinct Epic Invocation UI

- Status: Accepted
- Date: 2026-05-08
- Owners: RxJS DevTools maintainers

## Context

The current playground emits generic observable scenarios (`next-only`, `complete`, `error`, `mixed`) and is useful for baseline transport/runtime validation.

It does not provide deterministic epic-focused scenarios that let contributors repeatedly validate epic invocation behavior. In the panel, epic invocation events are currently indistinguishable from normal observable events because they use the same visual grammar.

This makes it difficult to:

- validate epic invocation lifecycle behavior repeatedly
- debug invocation-level regressions quickly
- communicate epic behavior in demos and onboarding

## Problem Statement

We need a deterministic way to generate epic invocation scenarios in `apps/playground`, and we need the panel to visually distinguish epic invocation events from standard observable events.

## Goals

1. Add deterministic epic scenarios to playground for repeatable local verification.
2. Represent epic invocation metadata in the event contract without breaking existing producers/consumers.
3. Render epic invocation events in the panel with a distinctive UI treatment.
4. Surface epic invocation context in tooltip/details UX.

## Non-Goals

- Introduce Redux/Redux-Observable middleware into playground runtime.
- Change transport topology between injected hook, content script, background, and panel.
- Replace existing observable scenarios.

## Decision

1. Extend `RxDevtoolsSource` with optional epic classification metadata:
   - `streamKind?: 'observable' | 'epic'`
   - `epic?: { name: string; invocationId: string; scenarioId?: string }`

2. Keep event kind semantics unchanged (`subscribe`, `next`, `error`, `complete`, `unsubscribe`, `create`).

3. Add deterministic epic scenarios in `apps/playground`:
   - `epic-success`
   - `epic-cancel`
   - `epic-error`

4. Mark epic events at emission time with `monitorRX` options and propagate metadata through existing transport and normalization paths.

5. Update panel render path to use distinct epic glyphs so epic invocations are not visually equivalent to normal observables.

6. Update tooltip/details UI to show stream classification and epic invocation metadata.

## Alternatives Considered

1. Add a new event kind for epic lifecycle.
   - Rejected: increases protocol complexity and duplicates existing lifecycle semantics.

2. Infer epic events only from `tags`.
   - Rejected: too implicit, brittle, and weaker typing guarantees.

3. Add distinct lane grouping only, keep same glyphs.
   - Rejected: does not satisfy the requirement that epic invocations look distinct.

## Consequences

Positive:

- Deterministic, repeatable epic behavior checks in local dev.
- Clearer visual parsing of event timelines in mixed streams.
- Backward compatibility preserved for existing observable instrumentation.

Tradeoffs:

- Slightly expanded protocol/source model.
- Additional rendering and UI logic branches for epic-specific presentation.

## Validation Plan

Automated:

- Update/add tests in:
  - `packages/core/src/__tests__/monitor-rx.test.ts`
  - `apps/extension/src/runtime/__tests__/normalizeContentEvent.test.ts`
  - `apps/extension/src/runtime/__tests__/transportPipeline.smoke.test.ts`
  - `packages/panel-ui/src/__tests__/messageInfo.test.ts`

Manual:

1. Run `pnpm build:extension`.
2. Run `pnpm dev:playground`.
3. In playground, run each epic scenario.
4. Confirm epic invocation marbles have distinct glyphs and tooltip metadata.

## Rollout

1. Ship protocol + monitor extensions.
2. Ship playground deterministic epic scenarios.
3. Ship panel epic-specific rendering and tooltip treatment.
4. Update docs index and retain existing quickstart flow.
