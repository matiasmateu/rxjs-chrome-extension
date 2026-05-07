# ADR-0001: Monorepo Migration And Runtime Refactor Decisions

- Status: Accepted
- Date: 2026-05-07
- Owners: RxJS DevTools maintainers

## Context

The codebase needed to migrate toward a developer-friendly structure with:

- isolated components and modules
- clearer ownership boundaries
- safer typed runtime flow
- repeatable validation and CI automation
- practical playground-based manual verification

## Decisions

1. Use a monorepo layout with app/package boundaries.
   - Apps: `apps/extension`, `apps/playground`
   - Packages: `packages/core`, `packages/panel-ui`

2. Keep extension runtime orchestration in app layer.
   - `MarblePanelRuntime` coordinates state/render/transport.
   - Runtime split into focused modules (renderer, interaction, store, layout, transport, tooltip).

3. Move shared presentational UI to `packages/panel-ui`.
   - `panel-ui` is UI-only.
   - No `chrome.*`, no runtime transport, no app imports.

4. Keep protocol and producer instrumentation in `packages/core`.
   - `monitorRX` emits protocol messages.
   - Protocol contract in `protocol.ts`.

5. Centralize transport parsing/decoding.
   - Canonical parser: `apps/extension/src/transport-parser.ts`.
   - Shared guards: `apps/extension/src/transport-guards.ts`.

6. Strengthen type safety.
   - Runtime `any` removed from extension source.
   - Extension TS config uses `strict: true`.

7. Add focused tests and smoke coverage.
   - Unit tests: normalization, lane activity, filter tag extraction, transport guards/parser.
   - Smoke test: end-to-end transport pipeline to runtime store.

8. Add CI quality gate.
   - Workflow runs extension tests + workspace typecheck + workspace build.

## Consequences

Positive:

- Faster onboarding and recall via clear boundaries and docs.
- Safer refactors due to typed contracts and tests.
- Repeatable local/CI verification path.
- Better confidence in extension/playground event flow.

Tradeoffs:

- More files/modules to navigate.
- Need to keep docs and ADRs updated as architecture evolves.
- CI adds guardrails but increases baseline maintenance cost.

## Follow-Up Rules

- Any protocol or transport shape change must update:
  - parser/guards
  - normalization tests
  - docs in `docs/architecture/event-pipeline.md`
- Any runtime behavior change must include at least one test update.
