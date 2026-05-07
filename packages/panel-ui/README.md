# @rxjs-devtools/panel-ui

Shared presentational UI components for RxJS DevTools panels.

## Scope

This package is intentionally **UI-only**.

- Allowed:
  - Pure React components
  - UI types (props/view-model types)
  - Styling tokens and rendering helpers
  - View-model helpers (for example `extractMessageInfo`, display formatters)
- Not allowed:
  - Chrome extension APIs (`chrome.*`)
  - Transport/runtime wiring
  - Business/event normalization logic
  - Imports from `apps/*`

## Dependency Rules

- Components should receive data and callbacks through props.
- Side effects should be limited to local UI concerns.
- Runtime/state orchestration stays in app packages (`apps/extension`, `apps/playground`).

## Consumption

- `apps/extension` imports and composes these components in `panel-app.tsx`.
- Keep extension-specific wiring (clipboard, downloads, runtime interaction) in app-level code unless broadly reusable.
