# System Overview

## TL;DR

- `apps/extension` owns runtime orchestration and Chrome integration.
- `packages/panel-ui` owns reusable presentational UI only.
- `packages/core` owns protocol/schema and `monitorRx` emission API.
- `apps/playground` is the test harness that produces deterministic RxJS streams.

## When to use

- Before moving code between packages.
- Before adding new modules.
- When deciding ownership of new functionality.

## Workspace Layout

- `apps/extension`: Chrome MV3 extension app, panel runtime, transport, interaction, rendering.
- `apps/playground`: manual test app that emits RxJS events with `monitorRX`.
- `packages/core`: protocol contracts and instrumentation (`monitor-rx.ts`).
- `packages/panel-ui`: shared UI components and display helpers.

## Dependency Direction

```text
apps/playground  ---> packages/core
apps/extension   ---> packages/core
apps/extension   ---> packages/panel-ui
packages/panel-ui ---X--> apps/*
```

Rule:

- Packages can be reused by apps.
- Apps must not be imported by packages.

## Extension Runtime Shape

Main coordinator:

- `apps/extension/src/runtime/MarblePanelRuntime.ts`

Supporting runtime modules:

- transport adapter: `RuntimeTransportAdapter.ts`, `PanelTransport.ts`
- event normalization: `normalizeContentEvent.ts`
- event storage/state: `MarbleStore.ts`, `LaneActivity.ts`, `LaneLayout.ts`, `FilterRegistry.ts`
- rendering: `CanvasRenderer.ts`, `ViewportMath.ts`
- interaction: `InteractionController.ts`
- tooltip state: `TooltipStateBuilder.ts`

## UI Boundary

UI composition entry:

- `apps/extension/src/panel-app.tsx`

Shared UI package:

- `packages/panel-ui/src/*`

Boundary contract:

- `panel-ui` can contain components, styles, view-model display helpers.
- `panel-ui` cannot call `chrome.*`, cannot manage runtime transport, cannot own event normalization.

## Architectural Guardrails

- Keep transport parsing centralized in `apps/extension/src/transport-parser.ts`.
- Keep low-level shape guards in `apps/extension/src/transport-guards.ts`.
- Keep event schema source-of-truth in `packages/core/src/protocol.ts`.
- Prefer adding small focused modules instead of expanding god files.
