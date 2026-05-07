# RDR-0001: Refactor Decision Record - Refactor Plan

- Status: In Progress
- Date: 2026-05-07
- Owners: RxJS DevTools maintainers

## Context

The repository already has strong architecture intent and passing checks, but developer ergonomics are inconsistent:

- mixed package-manager workflows (`pnpm` workspace with npm-style scripts and a committed `package-lock.json`)
- no real lint gate (placeholder scripts)
- runtime/UI boundaries are partially implicit and rely on internal access patterns
- performance and type-safety hotspots remain in rendering and shared UI types

This record captures the approved refactor sequence and tracks execution.

## Decision

Refactor in the following order:

1. Standardize tooling first:
   - unify scripts on `pnpm`
   - remove npm lockfile drift
   - add one `verify` command: format check + lint + extension test + workspace typecheck + workspace build
2. Add real lint/format gates and wire them into CI.
3. Tighten type contracts (remove public `any` from shared UI APIs).
4. Introduce a runtime facade API and stop UI access to runtime internals.
5. Refactor render path for performance (remove repeated frame-time linear scans).
6. Fix zoom/viewport interaction semantics and cover with tests.
7. Harden transport/hook behavior (bounded queue, gated debug logging, deduplicated serialization).
8. Expand tests for `packages/core` and `packages/panel-ui`, then update docs.

## Execution Log

### Step 1 Started (2026-05-07)

Implemented:

- root scripts switched from npm workspace invocations to `pnpm --filter` commands
- added root `verify` script:
  - `pnpm lint`
  - `pnpm --filter @rxjs-devtools/extension test`
  - `pnpm typecheck`
  - `pnpm build`
- CI workflow switched to run `pnpm verify` as the single quality gate
- removed `apps/extension/package-lock.json`
- added `package-lock.json` to `.gitignore`

Validation:

- `pnpm verify`

### Step 2 Completed (2026-05-07)

Implemented:

- added shared lint/format tooling at repo root:
  - `eslint.config.mjs` (ESLint flat config for JS/TS/TSX)
  - `.prettierrc.json` and `.prettierignore`
- replaced placeholder package `lint` scripts with real ESLint invocations:
  - `apps/extension`
  - `apps/playground`
  - `packages/core`
  - `packages/panel-ui`
- added root format scripts:
  - `pnpm format`
  - `pnpm format:check`
- updated root `verify` to include formatting checks first.
- updated command docs to include formatting commands and the expanded quality gate.

Validation:

- `pnpm format:check`
- `pnpm lint`
- `pnpm verify`

### Step 3 Completed (2026-05-07)

Implemented:

- removed exported `any` usage from `packages/panel-ui` API types:
  - introduced `TooltipMessage` type
  - changed `TooltipState.message` to `TooltipMessage | null`
  - changed `MessageInfo.dataPayload` to `unknown`
- updated `extractMessageInfo` to accept `unknown` input and use explicit runtime narrowing helpers.
- updated `JsonTree` props and recursive node builder from `any` to `unknown` with object/array narrowing.
- updated `panel-ui` exports to include `TooltipMessage`.

Validation:

- `pnpm verify`

## Consequences

Positive:

- one package-manager workflow reduces onboarding friction and CI drift
- single `verify` command gives a reproducible quality gate
- lockfile source of truth is now explicit (`pnpm-lock.yaml`)

Tradeoffs:

- contributors using npm need to switch to `pnpm`
- CI and docs must consistently reference the new canonical commands
