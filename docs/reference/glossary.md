# Glossary

## TL;DR

- `marble`: one rendered RxJS lifecycle event in the panel timeline.
- `lane`: horizontal stream slot where related marbles are grouped.
- `rxKind`: normalized lifecycle kind (`subscribe`, `next`, `error`, `complete`, `unsubscribe`, `create`).

## Terms

### ACK

Background response to panel `INIT` handshake message. Used to confirm port wiring.

### Domain

Logical category for an observable stream (for example `playground`). Used for filter chips.

### Filter Tags

Normalized tags extracted for filtering (`domainKey`, `domainLabel`).

### Lane

Computed y-axis slot for a stream key. Managed by `LaneLayout`.

### Lane Key

Stable key used for grouping stream events, built from domain + observable/subscription identifiers.

### Marble

Rendered event dot/icon on canvas representing one normalized runtime event.

### monitorRX / monitorRx

Core operator that emits DevTools protocol events during observable lifecycle.

### Normalized Content Event

Runtime shape produced by `normalizeContentEvent`, used by store/layout/render flow.

### Panel Transport

Chrome DevTools port channel (`rxjs-panel`) carrying background payloads to the panel runtime.

### Playground

`apps/playground` test harness that emits deterministic RxJS scenarios.

### Runtime Background Payload

Envelope created in background script containing event type, tab id, raw data, and metadata.

### Runtime Content Forward Message

Payload forwarded by content script after validating page hook message.

### rxKind

Lower-cased lifecycle kind used across runtime logic for state transitions and glyph rendering.
