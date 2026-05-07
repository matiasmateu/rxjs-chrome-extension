# Debugging Runbook

## TL;DR

If the panel is empty:

1. Rebuild extension and reload it.
2. Start playground and click `Start`.
3. Confirm DevTools `RxJS` panel is open on the same tab.
4. Run `pnpm --filter @rxjs-devtools/extension test`.

## When to use

- No events in panel.
- Events malformed/missing fields.
- Filters hide expected events.

## Symptom: No Events In Panel

Checks:

1. Extension loaded from `apps/extension` and recently rebuilt:

```bash
pnpm build:extension
```

2. Playground running:

```bash
pnpm dev:playground
```

3. Playground `Start` clicked and status shows running.
4. DevTools opened for the playground tab, not another tab.
5. `RxJS` panel selected.

Code points:

- `apps/extension/src/entries/contentScript.ts`
- `apps/extension/src/entries/background.ts`
- `apps/extension/src/transport-parser.ts`

## Symptom: Event Reaches Panel But Not Rendered

Checks:

1. `normalizeContentEvent` may return `null`:
   - `apps/extension/src/runtime/normalizeContentEvent.ts`
2. Runtime filters may hide data:
   - clear text/domain filters in panel
   - `apps/extension/src/runtime/FilterRegistry.ts`
3. Lane assignment may collapse into unexpected keys:
   - `apps/extension/src/runtime/LaneLayout.ts`

## Symptom: Domain Filter Looks Wrong

Checks:

1. `source.domain` emission from producer:
   - `packages/core/src/monitor-rx.ts`
   - `apps/playground/src/App.tsx`
2. Domain extraction and prettification:
   - `apps/extension/src/runtime/FilterTags.ts`

## Symptom: Build/Test Works Locally But Fails In CI

Checks:

1. Confirm workflow uses the same commands:
   - `.github/workflows/ci.yml`
2. Re-run local gate:

```bash
pnpm --filter @rxjs-devtools/extension test
pnpm typecheck
pnpm build
```

3. Ensure lockfile is committed after dependency changes.

## Deep Verification Commands

```bash
pnpm --filter @rxjs-devtools/extension test
pnpm --filter @rxjs-devtools/extension typecheck
pnpm --filter @rxjs-devtools/extension build
pnpm typecheck
pnpm build
```
