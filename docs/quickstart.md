# Quickstart

## TL;DR

```bash
pnpm install
pnpm build:extension
pnpm dev:playground
```

Then load `apps/extension` as an unpacked Chrome extension and open the DevTools `RxJS` panel.

## When to use

- First setup on a new machine.
- After pulling latest changes.
- When you forgot the run sequence.

## Prerequisites

- Node.js `20.x`
- `pnpm` `10.x`
- Chrome or Chromium with DevTools

## First-Time Setup

From repo root:

```bash
pnpm install
pnpm typecheck
pnpm build
```

Expected:

- `pnpm typecheck` passes.
- `pnpm build` produces package builds and extension `apps/extension/dist/*`.

## Load Extension In Chrome

1. Build extension bundle:

```bash
pnpm build:extension
```

2. In Chrome, open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select folder: `apps/extension`.

Expected:

- Extension appears as `RxJS DevTools`.
- No immediate errors in extension card.

## Run Playground

From repo root:

```bash
pnpm dev:playground
```

Open the printed URL (usually `http://localhost:5173`).

In playground UI:

1. Pick scenario (for example `mixed`).
2. Click `Start`.

## Verify End-To-End

1. Open DevTools on the tab running playground.
2. Open `RxJS` panel.
3. Confirm marbles appear and stats count increases.

If nothing appears:

- Go to [runbooks/debugging.md](./runbooks/debugging.md).

## Daily Fast Path

If dependencies are already installed:

```bash
pnpm build:extension
pnpm dev:playground
```

## Stop / Reset

```bash
pnpm clean
pnpm build
```
