# RDR-0002: Repository-Wide Developer-Friendly Refactor

- Status: In Progress
- Date: 2026-05-07
- Owners: RxJS DevTools maintainers
- Related: `RDR-0001`, `ADR-0001`

## Context

`RDR-0001` completed toolchain and type-contract foundations, but key developer-ergonomics work remains in runtime boundaries, rendering performance, interaction correctness, and transport hardening.

Current repo health is good (`pnpm verify` passes), so this record focuses on safe, incremental structural improvements without feature churn.

## Decision

Execute refactor in phased slices, each independently shippable and validation-backed.

### Phase 0: Baseline + Guardrails

1. Capture baseline commands and expected outputs:
   - `pnpm verify`
   - `pnpm --filter @rxjs-devtools/extension test`
2. Capture runtime invariants:
   - no event loss under normal playground scenarios
   - pin/hover behavior unchanged
   - domain/text filter behavior unchanged
3. Add/confirm pre-merge checklist for manual panel verification.

Exit criteria:

- Baseline is documented and reproducible.

### Phase 1: Runtime Facade Boundary (RDR-0001 Step 4 completion)

1. Introduce a narrow runtime public API for panel integration.
2. Remove React usage of runtime internals (`hoverId`, `publishTooltip`, and similar).
3. Remove the `react-hooks/exhaustive-deps` suppression in `panel-app` by stabilizing creation/sync patterns.
4. Keep runtime orchestration in `apps/extension`; keep `packages/panel-ui` UI-only.

Exit criteria:

- `panel-app.tsx` only uses approved runtime facade methods.
- No eslint suppression for React hook deps in `panel-app.tsx`.

### Phase 2: Render Path Performance (RDR-0001 Step 5 completion)

1. Replace frame-time repeated linear scans with indexed lookups/snapshots.
2. Remove `marbles.find(...)` patterns from hot render loops.
3. Add focused tests for index maintenance and rendering correctness inputs.

Exit criteria:

- Hot-path render logic has no repeated per-frame global linear scans for lane matching/tooltip lookup.
- Existing behavior remains unchanged in tests/manual validation.

### Phase 3: Zoom/Viewport Semantics (RDR-0001 Step 6 completion)

1. Implement anchor-preserving zoom math.
2. Remove dead/unused math paths and reset behaviors that violate expected zoom semantics.
3. Add interaction tests for:
   - zoom in/out at anchor
   - world offset continuity
   - wheel behavior

Exit criteria:

- Zoom preserves anchor semantics and passes interaction tests.

### Phase 4: Transport + Hook Hardening (RDR-0001 Step 7 completion)

1. Add bounded queue policy for content-script forwarding.
2. Gate hook debug logging (default off).
3. Deduplicate serializer logic (or enforce parity tests if physical dedupe is constrained by entrypoint/runtime boundaries).
4. Keep failure mode non-breaking for user streams.

Exit criteria:

- Queue is bounded with deterministic overflow policy.
- Debug logging is opt-in.
- Serialization behavior is consistent across producer/hook paths.

### Phase 5: Test Coverage Expansion (RDR-0001 Step 8 completion, part 1)

1. Add `packages/core` tests for:
   - `safeSerialize`
   - `monitorRx` lifecycle emission semantics
2. Add `packages/panel-ui` tests for:
   - message extraction/formatting helpers
   - tree/formatter utility edge cases

Exit criteria:

- New package-level tests exist and run in workspace quality flow.

### Phase 6: Documentation + Decision Log Hygiene (RDR-0001 Step 8 completion, part 2)

1. Ensure docs point to existing RDR/ADR filenames.
2. Update runbooks/architecture references for any boundary or behavior changes.
3. Keep command references aligned with canonical `pnpm` workflow.

Exit criteria:

- Docs contain no stale decision-log links for active RDRs.

### Phase 7: Final Validation

1. Run:
   - `pnpm verify`
2. Manual validation with playground + DevTools panel:
   - subscribe/next/error/complete/unsubscribe visibility
   - pin/unpin/close tooltip actions
   - filter text + domain behavior
   - zoom/pan expected interaction

Exit criteria:

- Automated and manual checks pass.

## PR Slicing Strategy

1. PR-1: Runtime facade and panel boundary cleanup.
2. PR-2: Render/index refactor.
3. PR-3: Zoom semantics + tests.
4. PR-4: Transport/hook hardening.
5. PR-5: Package tests (`core`, `panel-ui`).
6. PR-6: Docs + final cleanup.

Each PR must remain behavior-preserving unless explicitly documented.

## Risks And Mitigations

- Risk: behavior regressions in panel interactions.
  - Mitigation: interaction-focused tests + manual loop in each PR.
- Risk: hidden coupling between runtime and UI state.
  - Mitigation: facade-first refactor before deeper performance edits.
- Risk: transport reliability regressions.
  - Mitigation: bounded queue policy with deterministic retry/drop behavior and smoke validation.

## Execution Log

### Phase 1 Completed (2026-05-07)

Implemented:

- added explicit panel runtime facade API:
  - `apps/extension/src/runtime/PanelRuntimeFacade.ts`
- rewired `panel-app` to depend on facade methods only (no direct runtime internals).
- removed `react-hooks/exhaustive-deps` suppression in `panel-app`.
- moved pin/tooltip panel actions behind runtime public panel actions:
  - `togglePinFromPanel`
  - `closeTooltipFromPanel`
- tightened internal runtime surface by making internal methods private where appropriate.

Validation:

- `pnpm --filter @rxjs-devtools/extension lint`
- `pnpm --filter @rxjs-devtools/extension test`
- `pnpm --filter @rxjs-devtools/extension typecheck`
- `pnpm verify`

### Phase 2 Completed (2026-05-07)

Implemented:

- removed repeated frame-time linear scans (`marbles.find(...)`) in render grid paths by using lane sample indexes.
- added marble indexes in runtime store:
  - id -> marble map
  - laneKey -> first marble sample map
- switched tooltip target lookup from array scan to id-index lookup.
- tightened filter matcher boolean contract to avoid weak union inference.

Validation:

- `pnpm --filter @rxjs-devtools/extension lint`
- `pnpm --filter @rxjs-devtools/extension test`
- `pnpm --filter @rxjs-devtools/extension typecheck`
- `pnpm verify`

### Phase 3 Completed (2026-05-07)

Implemented:

- fixed anchor-preserving zoom semantics in `InteractionController.zoomAtX`.
- removed dead zoom math path and world-offset reset behavior.
- added focused tests:
  - `InteractionController` zoom anchor continuity and wheel behavior.
  - `MarbleStore` index maintenance behavior.

Validation:

- `pnpm --filter @rxjs-devtools/extension lint`
- `pnpm --filter @rxjs-devtools/extension test`
- `pnpm --filter @rxjs-devtools/extension typecheck`
- `pnpm verify`

### Phase 4 Completed (2026-05-07)

Implemented:

- content-script forward queue is now bounded (`MAX_QUEUE_SIZE`) with deterministic oldest-drop policy.
- injected hook debug logging is now gated and opt-in:
  - global flag: `window.__RXJS_DEVTOOLS_DEBUG__ = true`
  - persisted flag: `localStorage['rxjs-devtools:debug'] = 'true'` (or `'1'`)
- deduplicated hook serialization by reusing `safeSerialize` from `@rxjs-devtools/core/monitor-rx` with hook-specific bounds.

Validation:

- `pnpm --filter @rxjs-devtools/extension lint`
- `pnpm --filter @rxjs-devtools/extension test`
- `pnpm --filter @rxjs-devtools/extension typecheck`
- `pnpm verify`

### Phase 5 Completed (2026-05-07)

Implemented:

- added package-level tests:
  - `packages/core/src/__tests__/monitor-rx.test.ts`
  - `packages/panel-ui/src/__tests__/messageInfo.test.ts`
- added runtime-focused extension tests introduced during phases 2-3:
  - `InteractionController.test.ts`
  - `MarbleStore.test.ts`
- added workspace `test` command and Turbo `test` task.
- updated root `verify` to include workspace tests (`pnpm test`).

Validation:

- `pnpm test`
- `pnpm verify`

### Phase 6 Completed (2026-05-07)

Implemented:

- fixed docs decision-log link drift and added `RDR-0002` to docs index.
- updated command reference to include workspace `pnpm test`.
- kept canonical quality-gate docs aligned with current `verify` behavior.

Validation:

- `pnpm format:check`
- `pnpm verify`
