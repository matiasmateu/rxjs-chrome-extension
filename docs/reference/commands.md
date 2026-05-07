# Commands Reference

## TL;DR

Daily gate:

```bash
pnpm verify
```

## When to use

- You forgot which command does what.
- You need copy/paste command blocks.

## Workspace Commands (repo root)

| Command                | Use For                                | Expected Result                                 |
| ---------------------- | -------------------------------------- | ----------------------------------------------- |
| `pnpm install`         | bootstrap deps                         | all workspace deps installed                    |
| `pnpm dev`             | run all dev tasks in parallel          | long-running package dev tasks                  |
| `pnpm test`            | run workspace test tasks               | package tests pass                              |
| `pnpm format`          | apply repository formatting            | Prettier rewrites files to canonical style      |
| `pnpm format:check`    | validate repository formatting         | fails when files are not Prettier-formatted     |
| `pnpm verify`          | canonical pre-PR quality gate          | format check + lint + tests + typecheck + build |
| `pnpm typecheck`       | full monorepo typecheck                | all package/app typecheck pass                  |
| `pnpm build`           | full monorepo build                    | all builds pass, dist outputs generated         |
| `pnpm clean`           | remove build artifacts via turbo tasks | package outputs cleaned                         |
| `pnpm build:extension` | build extension only                   | `apps/extension/dist/*` refreshed               |
| `pnpm dev:extension`   | extension watcher                      | rebuild on file changes                         |
| `pnpm dev:playground`  | run playground vite dev server         | local URL printed                               |

## Extension Commands

From repo root:

| Command                                            | Use For                                 |
| -------------------------------------------------- | --------------------------------------- |
| `pnpm --filter @rxjs-devtools/extension test`      | run extension unit + smoke tests        |
| `pnpm --filter @rxjs-devtools/extension typecheck` | extension TS checks                     |
| `pnpm --filter @rxjs-devtools/extension build`     | extension bundle build (purges `dist/`) |

## Playground Commands

| Command                                         | Use For                     |
| ----------------------------------------------- | --------------------------- |
| `pnpm --filter @rxjs-devtools/playground dev`   | local playground dev server |
| `pnpm --filter @rxjs-devtools/playground build` | playground production build |

## Quality Gates

### Minimum Gate Before PR

```bash
pnpm verify
```

### Clean-State Gate

```bash
pnpm clean
pnpm install
pnpm build
```
