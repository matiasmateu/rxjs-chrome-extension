# Event Pipeline

## TL;DR

Flow:

1. `monitorRX` emits protocol messages from app code.
2. In-page hook posts messages to `window`.
3. Content script validates and forwards to background.
4. Background wraps payload with tab/meta and forwards to panel port.
5. Runtime parses + normalizes into marble events.
6. Runtime store updates lanes/marbles and renderer draws.

## When to use

- You need to add/remove payload fields.
- Events are missing or malformed.
- You need to debug where events are dropped.

## Detailed Path

### 1) Event emission in app code

- Source: `packages/core/src/monitor-rx.ts`
- Function: `monitorRX` / `monitorRx`
- Output: `RxDevtoolsMessage` with `kind`, ids, `ts`, optional `data/meta/source`.

### 2) In-page hook transport

- Source: `apps/extension/src/entries/injectedHook.ts`
- Action: posts `{ __from: RXJS_DEVTOOLS_FROM, message }` via `window.postMessage`.

### 3) Content script forwarding

- Source: `apps/extension/src/entries/contentScript.ts`
- Parser: `parsePageHookForwardMessage` from `transport-parser.ts`
- Output: `RuntimeContentForwardMessage` (`__from: CONTENT_SCRIPT`, `time`, message).

### 4) Background envelope and panel forwarding

- Source: `apps/extension/src/entries/background.ts`
- Parser/constructor:
  - `parsePanelInitMessage`
  - `createBackgroundPayload`
- Output: `RuntimeBackgroundPayload` sent on `rxjs-panel` port.

### 5) Panel runtime parse + normalize

- Source: `apps/extension/src/runtime/normalizeContentEvent.ts`
- Parse: `decodeRuntimeTransportMessage` from `transport-parser.ts`
- Normalize output: `NormalizedContentEvent`
  - includes `kind/rxKind`, lane key, timestamps, raw references.

### 6) Runtime state + render

- Store ingestion: `MarbleStore.push`
- Lane lifecycle: `LaneActivity.update`
- Lane layout allocation: `LaneLayout.resolveLaneKey`
- Canvas draw: `CanvasRenderer.drawGrid/drawMarbles`

## Where To Add A New Field

1. Add field to protocol if it belongs to producer contract:
   - `packages/core/src/protocol.ts`
2. Ensure field survives transport:
   - `transport-types.ts` and `transport-parser.ts` if needed.
3. Add mapping into normalized event:
   - `runtime/normalizeContentEvent.ts`
4. Render/use field:
   - runtime modules and/or `packages/panel-ui`.
5. Add or update tests:
   - `transport-parser.test.ts`
   - `normalizeContentEvent.test.ts`
   - smoke test: `transportPipeline.smoke.test.ts`

## Fast Debug Points

- No message in panel:
  - content parser path in `contentScript.ts`
  - background forwarding in `background.ts`
- Message arrives but not rendered:
  - `normalizeContentEvent` returning `null`
  - filter state in `FilterRegistry`
  - lane assignment in `LaneLayout`
