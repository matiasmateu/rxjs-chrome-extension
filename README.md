# rxjs-devtools-workspace

Monorepo for the RxJS DevTools extension and supporting packages.

## Workspace Layout

- `apps/extension`: Chrome MV3 extension app (current codebase)
- `apps/playground`: ad hoc app to generate deterministic RxJS scenarios
- `packages/core`: shared event schema and protocol utilities
- `packages/panel-ui`: reusable panel UI primitives

## Commands

- `pnpm build`
- `pnpm dev`
- `pnpm typecheck`
- `pnpm clean`
- `pnpm dev:extension`
- `pnpm dev:playground`

## Notes

- The extension behavior is intentionally preserved during this migration stage.
- Full strict typing and deeper runtime decomposition are planned in later phases.
