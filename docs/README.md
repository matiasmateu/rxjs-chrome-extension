# Documentation Index

## TL;DR

- If you only remember one page, use [quickstart.md](./quickstart.md).
- If behavior breaks, use [runbooks/debugging.md](./runbooks/debugging.md).
- If you are changing architecture, read [architecture/system-overview.md](./architecture/system-overview.md) first.

## Start Here

- [Quickstart](./quickstart.md): first-time setup, run extension, run playground, verify events.
- [Commands Reference](./reference/commands.md): copy/paste command list by task.
- [Dev Loop Runbook](./runbooks/dev-loop.md): repeatable workflow for daily changes.

## Architecture

- [System Overview](./architecture/system-overview.md): package boundaries and module ownership.
- [Event Pipeline](./architecture/event-pipeline.md): exact event path from page RxJS to panel marbles.

## Troubleshooting

- [Debugging Runbook](./runbooks/debugging.md): symptom -> checks -> fixes.

## Reference

- [Commands](./reference/commands.md)
- [Glossary](./reference/glossary.md)

## Decision Log

- [ADR-0001: Migration Decisions](./adr/ADR-0001-migration-decisions.md)
- [RDR-0001: Developer-Friendly Refactor Plan](./rdr/RDR-0001-developer-friendly-refactor.md)

## Maintenance Rules

- Update docs in the same PR when behavior, commands, or architecture changes.
- Keep each page front-loaded with:
  - `TL;DR`
  - `When to use`
  - copy/paste commands
- Prefer short runbooks and concrete examples over long narrative text.
