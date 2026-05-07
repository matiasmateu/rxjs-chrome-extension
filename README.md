# rxjs-devtools-workspace

Monorepo for the RxJS DevTools extension and supporting packages.

## Documentation

- Start at [`docs/README.md`](./docs/README.md)
- Quickstart at [`docs/quickstart.md`](./docs/quickstart.md)

## Workspace Layout

- `apps/extension`: Chrome MV3 extension app (current codebase)
- `apps/playground`: ad hoc app to generate deterministic RxJS scenarios
- `packages/core`: shared event schema and protocol utilities
- `packages/panel-ui`: reusable panel UI primitives (presentational-only contract)

## Commands

- `pnpm build`
- `pnpm dev`
- `pnpm verify`
- `pnpm typecheck`
- `pnpm typecheck:extension`
- `pnpm build:extension`
- `pnpm clean`
- `pnpm dev:extension`
- `pnpm dev:playground`

## Notes

- Extension UI primitives now live in `packages/panel-ui` and are consumed by `apps/extension`.
- `packages/panel-ui` must remain UI-only (see `packages/panel-ui/README.md`).
- The extension panel uses package React (`react`, `react-dom`) with TS JSX typing (`react-jsx`).
- Runtime behavior is preserved while `MarblePanelRuntime` is being decomposed into focused modules.
