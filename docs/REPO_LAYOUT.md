# Repo Layout

## Workspace Structure

pnpm monorepo with two packages:

- **`library/`** (`@dnd/library`) — TypeScript library: SRD/AA parsers, types, rules engine
- **`app/`** (`@dnd/app`) — TanStack Start web application

## Key Directories

```
dnd-24-platform/
├── CLAUDE.md              # Start here: navigational hub
├── META-PLAN.md           # Philosophy and conventions
├── library/               # @dnd/library
│   ├── src/types/         # All TypeScript types
│   ├── src/parsers/       # SRD/AA markdown parsers
│   ├── src/engine/        # Rules engine (planned)
│   └── tests/             # Vitest tests
├── app/                   # @dnd/app
│   └── src/routes/        # TanStack file-based routes
├── content/srd-markdown/  # SRD 5.2.1 chapters (synced)
├── scripts/               # Utility scripts
└── docs/                  # Architecture, plans
    ├── architecture.md
    ├── campaign-modes.md
    └── plans/
        ├── active/
        └── completed/
```

## Why Separate from dnd-24-resources?

- `dnd-24-resources/` has its own git repo for content lifecycle
- `dnd-24-platform/` (this repo) has its own git repo for code lifecycle
- Content syncs via `scripts/sync-srd-content.sh`
