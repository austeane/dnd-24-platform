# dnd-24-platform

D&D 2024 campaign platform. TypeScript library for SRD/AA parsing and rules engine (`library/`), TanStack Start web app (`app/`). Supports three progression modes: Standard 5e 2024, AA Only, and Hybrid.

**Read `META-PLAN.md` first.** It defines how this project is built: library-first, humans steer, agents execute.

## Structure

- `library/` — `@dnd/library`: SRD parsers, AA parsers, types, rules engine. Pure TS, no React/DB deps.
- `app/` — `@dnd/app`: TanStack Start campaign platform. Depends on `@dnd/library`.
- `content/srd-markdown/` — SRD 5.2.1 chapters (synced from `../dnd-24-resources`)
- `docs/` — Architecture docs, plans
- `scripts/` — Utility scripts

## Commands

```
pnpm install                    # Install all workspace deps
pnpm -F @dnd/library test       # Run library tests
pnpm -F @dnd/library test:watch # Watch mode
pnpm -F @dnd/app dev            # Start app dev server
pnpm check                      # Type-check all packages
pnpm lint                       # Lint all packages (oxlint)
```

## Pre-commit Contract

Every commit must pass: `lint-staged` (oxlint on staged .ts/.tsx) → type-check.

## Conventions

- TypeScript strict mode everywhere. No `any`. No `as` casts without comment.
- Named exports only. No default exports.
- Parsers are pure functions: markdown string in, typed data out.
- The effect model is the core abstraction: every character modifier is a `Source` producing `Effect[]`.
- Three progression modes: `"aa-only" | "hybrid" | "standard"` — always test all three.
- SRD data is static (parsed at import time). Postgres is for mutable state only.

## Deployment

Deploys to `www.austinwallace.ca/dnd` via Railway + SST Router. See `docs/deployment.md` for full details.

- Railway project: `dnd-platform`, service: `app`
- Railway origin: `https://app-production-0cb2.up.railway.app`
- `VITE_BASE_PATH=/dnd/` set on Railway; defaults to `/` locally
- SST Router config lives in `~/dev/austin-site/sst.config.ts`
- SST deploy: `cd ~/dev/austin-site && AWS_PROFILE=prod npx sst deploy --stage production`

## Docs (progressive disclosure)

- `META-PLAN.md` — Project philosophy, tech choices, architecture principles
- `docs/architecture.md` — Library design, effect model, parsing strategy
- `docs/campaign-modes.md` — Progression mode rules and differences
- `docs/deployment.md` — Railway + SST Router deployment setup
- `docs/plans/active/` — In-progress execution plans
- `docs/plans/completed/` — Finished plans (for context)

## Plans

When creating a plan in Claude plan mode, copy the `~/.claude/plans/` plan file to `docs/plans/active/NNN-slug.md` before presenting for approval. Completed plans move to `docs/plans/completed/`.

## Session Hygiene

When you have fully completed a task, update `docs/` with what was built, changed, or decided. Future agents should be able to read CLAUDE.md → docs/ and understand the current state without needing conversation history.
