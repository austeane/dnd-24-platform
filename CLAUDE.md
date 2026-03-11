# dnd-24-platform

The ultimate goal of this repo is to make it so that when we are playing dnd irl, with 5e rules but AA additions, players don't have to use their character sheets at all, and don't have to consult outside resources when levelling up or using their characters.

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
pnpm compile                    # Compile canonical content
pnpm report:fleet-readiness     # Regenerate fleet reports + CSV
pnpm report:mechanics-coverage  # Regenerate coarse mechanics report
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
- Railway Postgres service: `Postgres`
- Railway origin: `https://app-production-0cb2.up.railway.app`
- `VITE_BASE_PATH=/dnd/` set on Railway; defaults to `/` locally
- SST Router config lives in `~/dev/austin-site/sst.config.ts`
- SST deploy: `cd ~/dev/austin-site && AWS_PROFILE=prod npx sst deploy --stage production`
- Production runbook: `pnpm db:check` -> migrate Railway Postgres with `DATABASE_PUBLIC_URL` -> deploy app -> smoke `https://www.austinwallace.ca/dnd/` in a browser, not just curl
- Base-path gotcha: any server-built or plain-anchor app URL must go through `app/src/lib/base-path.ts`; the March 11, 2026 production bug was raw `/campaigns/...` and `/characters/...` hrefs bypassing `/dnd`
- After destructive Railway reseed, bootstrap DM at `/campaigns/<slug>/access?role=dm&next=%2Fdnd%2Fcampaigns%2F<slug>%2Fdm`, then set player passwords from the DM dashboard `Access` section. Do not commit live credentials to docs.

## Fleet Execution

This repo uses a batch-based fleet execution model for parallel agent work. Read [Plan 010](docs/plans/active/010-fleet-execution-model.md) for rules.

- **Batch assignments**: `docs/reports/fleet-work-items.csv` — one row per batch, all context included
- **Mechanics tracker**: `docs/reports/srd-mechanics-coverage-atomic.md` — execution truth, 111 atomic mechanics
- **Fleet readiness**: `docs/reports/fleet-readiness.md` — wave/batch status and dependency graph
- **Batch source**: `data/fleet/srd-fleet-batches.ts` — typed batch definitions with owned paths, gates, and hints
- **Atomic mechanics source**: `data/mechanics-coverage/srd-5e-2024-atomic.ts`

Key rules:
- Each batch owns explicit write paths. Do not write outside your batch's `ownedPaths`.
- Do not mark a mechanic `full` without linked tests, fixtures, or live-roster evidence.
- Regenerate reports after status changes: `pnpm report:fleet-readiness`

## Docs (progressive disclosure)

- `META-PLAN.md` — Project philosophy, tech choices, architecture principles
- `docs/architecture.md` — Library design, effect model, parsing strategy
- `docs/campaign-modes.md` — Progression mode rules and differences
- `docs/deployment.md` — Railway + SST Router deployment setup
- `docs/plans/active/` — In-progress execution plans
- `docs/plans/completed/` — Finished plans (for context)

## Tavern Round 7

- DB/bootstrap: `pnpm db:test:up && eval "$(pnpm --silent db:test:env)"` (`--silent` matters; plain `pnpm db:test:env` can pollute the exported env).
- Fast Tavern loop: `pnpm test:fixtures:tavern`, `pnpm -F @dnd/app test:integration -- progression/resource-rest.integration.test.ts progression/hit-point-state.integration.test.ts`, `pnpm test:acceptance:tavern`, `pnpm test:accessibility:tavern`, `pnpm snapshot:tavern-session --check`.
- Progression + HP seams: `app/src/server/progression/{projection.ts,derived-state.ts,hit-point-state.ts,resource-rest.integration.test.ts}`, `app/src/server/db/schema/hit-points.ts`, `app/src/server/db/seed-real-campaign.ts`.
- Tavern UI + a11y seams: `app/src/routes/__root.tsx`, `app/src/routes/index.tsx`, `app/src/routes/characters/$characterId/{route.tsx,index.tsx,spellbook.tsx,inventory.tsx,journal.tsx,compendium.tsx}`, `app/src/test/fixtures/tavern/`, `tests/acceptance/tavern-session.spec.ts`.
- Write-mode seams: `app/src/routes/campaigns/$campaignSlug/{access.tsx,dm.tsx}`, `app/src/routes/characters/$characterId/{-server.ts,level-up.tsx,route.tsx}`, `app/src/server/{auth/web-session.ts,tavern/viewer.ts}`, `app/src/server/progression/condition-service.ts` (concentration is now tracked and cleared on incapacitated/long rest).
- Production smoke seams: `app/src/server/tavern/{home.ts,viewer.ts}`, `app/src/routes/campaigns/$campaignSlug/{-server.ts,access.tsx,dm.tsx}`, `app/src/routes/characters/$characterId/route.tsx`, `app/src/lib/base-path.ts`.
- As of March 11, 2026 the live public smoke bar is: home renders `/dnd/...` links, DM access works, Tali player login works, and a live HP write+restore succeeds on the public domain.
- Read `docs/guides/testing-tavern-frontend.md` before changing Tavern gates or smoke checks.

## Plans

When creating a plan in Claude plan mode, copy the `~/.claude/plans/` plan file to `docs/plans/active/NNN-slug.md` before presenting for approval. Completed plans move to `docs/plans/completed/`.

## Session Hygiene

When you have fully completed a task, update `docs/` with what was built, changed, or decided. Future agents should be able to read CLAUDE.md → docs/ and understand the current state without needing conversation history.


## AGENTS.md is a symlink of CLAUDE.md
