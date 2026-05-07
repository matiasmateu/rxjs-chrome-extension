# Dev Loop Runbook

## TL;DR

Most common loop:

```bash
pnpm --filter @rxjs-devtools/extension test
pnpm typecheck
pnpm build
```

## When to use

- Daily development.
- Before creating a PR.
- After pulling changes.

## Loop A: UI or Runtime Code Change

1. Start playground:

```bash
pnpm dev:playground
```

2. Build extension after changes:

```bash
pnpm build:extension
```

3. Reload extension in `chrome://extensions`.
4. Validate panel behavior on playground tab.
5. Run quality gate:

```bash
pnpm --filter @rxjs-devtools/extension test
pnpm typecheck
pnpm build
```

## Loop B: Protocol / Event Contract Change

1. Edit protocol in `packages/core/src/protocol.ts`.
2. Update parser/normalizer:
   - `apps/extension/src/transport-parser.ts`
   - `apps/extension/src/runtime/normalizeContentEvent.ts`
3. Update producer use if needed:
   - `packages/core/src/monitor-rx.ts`
   - `apps/playground/src/App.tsx`
4. Run full checks:

```bash
pnpm --filter @rxjs-devtools/extension test
pnpm typecheck
pnpm build
```

## Definition Of Done Checklist

- Tests pass.
- Typecheck passes.
- Build passes.
- Playground -> panel behavior validated manually.
- Docs updated in `docs/` if commands, architecture, or behavior changed.

## Before PR

Use this exact command block:

```bash
pnpm --filter @rxjs-devtools/extension test
pnpm typecheck
pnpm build
```

Optional:

- `pnpm clean && pnpm build` for a clean-state build verification.
