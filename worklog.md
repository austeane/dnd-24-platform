# Worklog

## Entry Format

- Use `## YYYY-MM-DD` for the day block.
- Use `### HH:MM:SS <Label>` for every sub-entry inside that day block.
- Capture each sub-entry timestamp at write time. Do not invent or backfill approximate times.

## Current Next-Step Queue

### Best immediate moves

- Run the four ready-now fleet batches from `docs/reports/fleet-readiness.md`:
  - `progression-service-boundary-split`
  - `content-roster-srd-expansion`
  - `content-aa-overlay-expansion`
  - `verification-harness-and-live-snapshots`
  Refs: [Plan 005](docs/plans/active/005-execution-roadmap.md), [Plan 006](docs/plans/active/006-agent-content-factory.md), [Plan 010](docs/plans/active/010-fleet-execution-model.md)
- Use `docs/reports/fleet-work-items.csv` as the batch handoff source for one-agent-per-row execution. Refs: [Plan 010](docs/plans/active/010-fleet-execution-model.md)
- Treat `docs/reports/srd-mechanics-coverage-atomic.md` as the execution truth and only move rows to `full` with linked tests, fixtures, or live-roster evidence. Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 010](docs/plans/active/010-fleet-execution-model.md)
- After the non-UI backend loop is stable, add only an intentionally plain proof UI:
  - DM communication board
  - player character page
  - no styling work beyond basic legibility
  Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 005](docs/plans/active/005-execution-roadmap.md), [Plan 008](docs/plans/active/008-dm-communication-surface.md)

### Persistence and campaign operations

- Add explicit session attendance, recap, DM notes, and after-session XP award entry points on top of the current campaign/session/character services. Refs: [Plan 005](docs/plans/active/005-execution-roadmap.md)
- Add idempotent seed/update tooling for future party changes so the verified roster can evolve without manual SQL. Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 009](docs/plans/active/009-deployment-and-db-ops.md)
- Add campaign-scoped helper queries for “active session”, “latest session”, and “characters eligible for communication target / XP award / spend plan review”. Refs: [Plan 005](docs/plans/active/005-execution-roadmap.md)

### Communication surface

- Build the smallest UI slice for DM communication: list, draft, publish, pin, archive. Refs: [Plan 005](docs/plans/active/005-execution-roadmap.md), [Plan 008](docs/plans/active/008-dm-communication-surface.md)
- Add session-linked reveals and a “show to party now” flow so the DM can communicate at the table without leaving the app. Refs: [Plan 005](docs/plans/active/005-execution-roadmap.md), [Plan 008](docs/plans/active/008-dm-communication-surface.md)
- Add richer reference rendering so linked spells/rules/features open directly from communication cards. Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 008](docs/plans/active/008-dm-communication-surface.md)

### Canonical content pipeline

- Extend the compiler to cover more entity types than spells/rules/conditions/AA abilities and keep generated output consumable by both app and library runtime. Refs: [Plan 003](docs/plans/active/003-canonical-content-architecture.md), [Plan 005](docs/plans/active/005-execution-roadmap.md)
- Convert the content actually required by the seeded roster before broad compendium work:
  - Fighter, Druid, Warlock, Bard, Sorcerer
  - their visible features/feats/species traits
  - the spells currently on the seeded sheets
  Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 006](docs/plans/active/006-agent-content-factory.md), [Plan 007](docs/plans/active/007-ruleset-pack-model.md)
- Add pack-aware validation for more cross-entity references as content breadth grows. Refs: [Plan 006](docs/plans/active/006-agent-content-factory.md), [Plan 007](docs/plans/active/007-ruleset-pack-model.md)

### Character runtime and tabletop loop

- Replace baseline overrides with deeper source-driven computation for:
  - skill bonuses
  - passive perception
  - action lists
  - resource refresh rules
  - spell access
  Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 005](docs/plans/active/005-execution-roadmap.md)
- Add spend-plan preview and commit rules that call `evaluatePrerequisites(...)` before mutating character state. Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 005](docs/plans/active/005-execution-roadmap.md)
- Build the first player-facing character page now that the computation loop exists. Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 005](docs/plans/active/005-execution-roadmap.md)

### Deployment and operations

- Decide whether production migrations remain manual or become part of deploy automation now that real seed data exists in Railway. Refs: [Plan 009](docs/plans/active/009-deployment-and-db-ops.md)
- Add a staging environment before the next round of schema churn if production-first migration starts slowing iteration. Refs: [Plan 009](docs/plans/active/009-deployment-and-db-ops.md)
- Add a non-secret operator runbook for:
  - migrate
  - seed
  - verify roster/runtime state
  - rollback expectations
  Refs: [Plan 009](docs/plans/active/009-deployment-and-db-ops.md)

### Lower-priority later work

- Broaden DM tooling into wiki/lore only after the tighter communication layer is working in sessions. Refs: [Plan 004](docs/plans/active/004-tabletop-completion-definition.md), [Plan 005](docs/plans/active/005-execution-roadmap.md)
- Expand monster and magic-item coverage after the player-critical loop is usable. Refs: [Plan 005](docs/plans/active/005-execution-roadmap.md)
- Keep treating [Plan 003](docs/plans/active/003-canonical-content-architecture.md) as reference architecture, not as the day-to-day task list.
- Keep [Plan 001](docs/plans/superceded/001-scaffold.md) and [Plan 002](docs/plans/superceded/002-srd-library.md) as historical context only.

## 2026-03-09

### 16:49:48 Session Goal

- Tighten the plan set around the real product goal: run and level hybrid 5e + AA characters at the table without paper sheets or outside references.
- Set up Drizzle cleanly enough that persistence is no longer hypothetical.
- Add the first real campaign-domain tables so communication and future game state can hang off actual foreign keys.

### 16:49:49 Notes for Future Agents

- Active plan set now lives in `docs/plans/active/003-009`.
- `001` and `002` were moved to `docs/plans/superceded/`.
- The true product target is defined in [Plan 004](docs/plans/active/004-tabletop-completion-definition.md).
- The active execution order is in [Plan 005](docs/plans/active/005-execution-roadmap.md).
- The pack model is explicit: base `srd-5e-2024`, extension `advanced-adventurers`, campaign-level enablement. See [Plan 007](docs/plans/active/007-ruleset-pack-model.md).
- The DM communication surface has a concrete data model in [Plan 008](docs/plans/active/008-dm-communication-surface.md).
- Railway is the live hosting target, and the local-vs-runtime DB URL split is documented in [docs/deployment.md](docs/deployment.md) and [Plan 009](docs/plans/active/009-deployment-and-db-ops.md).
- `DATABASE_URL` is for app runtime inside Railway.
- `DATABASE_PUBLIC_URL` is for local Drizzle work from this workstation.
- The live Railway Postgres already has the initial communication schema and the follow-up campaign/session/character schema applied.

### 16:49:50 Tech Debt / Workarounds / Architecture Decisions

- Drizzle is pinned to the beta line in use locally: `drizzle-orm@1.0.0-beta.2-f9236e3` and `drizzle-kit@1.0.0-beta.2-f9236e3`.
- Relations are using the beta Relations v2 API via `defineRelations(...)`.
- The current DB model is intentionally minimal:
  - `campaigns`
  - `sessions`
  - `characters`
  - `communication_items`
  - `communication_targets`
  - `communication_refs`
  - `communication_events`
- IDs are still application-assigned text IDs. That is acceptable for now, but the repo should pick a generation convention before the first real mutation layer lands.
- The canonical content pipeline still does not exist. Planning is ahead of implementation here.
- The app is still mostly a shell. Persistence now exists, but no meaningful campaign/service/UI layer is built on top of it yet.

### 16:49:51 Validation

- `pnpm check`
- `pnpm lint`
- `pnpm -F @dnd/library test`
- `pnpm -F @dnd/app build`
- `pnpm db:check`
- Generated Drizzle migrations are committed in `app/drizzle/`.
- Live Railway Postgres was verified to contain:
  - `campaigns`
  - `sessions`
  - `characters`
  - `communication_items`
  - `communication_targets`
  - `communication_refs`
  - `communication_events`

### 16:49:52 Current Recommendation

- If the goal is to keep tightening the shortest path to real-session usefulness, the best next move is:
  1. campaign/session/character service layer
  2. XP transaction ledger
  3. DM communication commands and reads
  4. canonical pack-aware content compiler

That order keeps persistence, session flow, and DM-to-player communication moving while still respecting the longer-term content/runtime architecture.

### 17:38:06 Runtime, Content, And Seed Baseline

- Implemented the first canonical pack compiler baseline in `content/canon/` and `scripts/compile-canon.ts`.
- The proof batch now includes:
  - 5 SRD 2024 spells
  - 5 AA overlay spells
  - core rules and conditions
  - AA ability references
- Canon validation now enforces:
  - provenance metadata
  - judgement-call metadata for AA modernizations
  - cross-pack `derivedFrom`
  - overlay-target resolution
  - linked AA ability resolution
- Added the first library runtime engine:
  - `computeCharacterState(...)`
  - `evaluatePrerequisites(...)`
  - explainable AC / HP / initiative / passive perception / spell save DC / spell attack bonus
- Added the first app-side projection from DB rows into runtime state via `getCharacterRuntimeState(...)`.
- Added the first DM communication service layer:
  - create/edit draft
  - schedule/publish
  - audience change
  - pin/unpin
  - archive
  - DM board list
  - player-visible card list

### 17:38:07 Real Campaign Intake

- OCR intake was written to `data/real-campaign-intake/raw-pages.json`.
- Added `data/real-campaign-intake/verified-characters.json` with the first reviewed roster for:
  - Ronan Wildspark
  - Tali
  - Oriana
  - Vivennah
  - Nara
- Added idempotent seed tooling in `app/src/server/db/seed-real-campaign.ts`.
- Generated and applied the progression migration for:
  - `xp_transactions`
  - `character_sources`
  - `character_spend_plans`
- Seeded the live Railway Postgres with:
  - campaign `real-aa-campaign`
  - 5 characters
  - source ledger rows per character
- Verified seeded DB rows directly in Postgres:
  - `nara|Nara|3|0`
  - `oriana|Oriana|6|0`
  - `ronan-wildspark|Ronan Wildspark|5|0`
  - `tali|Tali|5|0`
  - `vivennah|Vivennah|5|0`
  - format: `slug|name|source_count|xp_count`

### 17:38:08 Validation

- `pnpm compile`
- `pnpm check`
- `pnpm lint`
- `pnpm test`
- `pnpm -F @dnd/app build`
- `pnpm db:generate`
- `pnpm db:check`
- Live migration applied to Railway Postgres.
- Live seed rerun proved idempotent and returned runtime projections for all five seeded characters.

### 19:01:52 Backend Completion Loop

- Rebuilt the interrupted auth work as a generalized campaign/character access model:
  - `access_credentials`
  - `access_sessions`
  - DM-scoped password
  - optional per-character player passwords
  - DB-backed opaque session tokens
- Updated Drizzle beta client wiring to use the Relations v2 schema shape cleanly.
- Added auth helpers:
  - `setDmPassword(...)`
  - `setCharacterPassword(...)`
  - `createAccessSession(...)`
  - `validateAccessSession(...)`
  - `listAccessSessions(...)`
  - access guards for campaign / DM / character scope
- Added pure app tests for:
  - auth crypto helpers
  - spend-plan document parsing
- Added library tests for:
  - canonical ID alias resolution
  - spell-name alias lookup
  - spell-slot pool and duplicate spell-access merge behavior
- Tightened canonical/runtime behavior for the live roster:
  - canonical lookup now handles both colon and hyphen entity IDs
  - added `Toll the Dead`
  - moved level-2 caster progression features onto `grant-spell-slots`
  - deduped duplicate spell-access rows across multiple sources
- Tightened the reviewed seed data:
  - Ronan now has explicit `Goliath`
  - Oriana now has explicit `Drow`
  - Vivennah now has explicit `Wood Elf`
  - Nara now has explicit `Magic Initiate (Wizard)`
  - Tali now has explicit `Primal Order: Warden` plus a reviewed sheet-derived species source
- Applied the new auth migration to live Railway Postgres and re-seeded the real campaign.

### 19:01:53 Live Runtime Verification

- Live DB now contains:
  - `access_credentials`
  - `access_sessions`
- Live roster runtime now shows slot pools from canonical sources:
  - Tali: level-1 spell slots x3
  - Oriana: pact slots x2 on short rest
  - Vivennah: level-1 spell slots x3
  - Nara: level-1 spell slots x3 and Sorcery Points x2
- Live roster runtime now shows explicit species / feature resources:
  - Ronan: `Second Wind` and `Stone's Endurance`
  - Vivennah: `Bardic Inspiration`
  - Oriana: `Magical Cunning`
- Remaining backend gaps are now mostly deeper mechanics rather than missing infrastructure:
  - weapon mastery selections and mastery resolution
  - Savage Attacker damage reroll resolution
  - exact `Skilled` picks
  - pact weapon bonded-weapon state
  - Wild Shape form library / transform state
  - Magic Initiate exact spell picks for Nara
  - unresolved species identity for Nara and the exact named species for Tali

### 21:19:24 SRD Mechanics Tracker

- Added a first-pass SRD mechanics coverage tracker in `data/mechanics-coverage/srd-5e-2024.ts`.
- Added a generator script in `scripts/report-mechanics-coverage.ts`.
- Added the root command:
  - `pnpm report:mechanics-coverage`
- Generated the first report at `docs/reports/srd-mechanics-coverage.md`.
- Current first-pass counts at subsystem / feature granularity:
  - 53 total tracked mechanics
  - 7 full
  - 33 partial
  - 13 none
- This tracker is now the clearest default reference for deciding what to do next on the non-UI loop:
  - finish current partials that block real table use
  - then burn down the `none` bucket

### 22:51:58 Fleet Readiness Baseline

- Split the runtime engine into smaller modules so later runtime batches have cleaner ownership boundaries:
  - `library/src/engine/math.ts`
  - `library/src/engine/levels.ts`
  - `library/src/engine/proficiencies.ts`
  - `library/src/engine/spellcasting.ts`
  - `library/src/engine/traits-and-resources.ts`
  - `library/src/engine/defenses.ts`
  - `library/src/engine/xp.ts`
- Added the fleet execution plan in [Plan 010](docs/plans/active/010-fleet-execution-model.md).
- Added the atomic mechanics source in `data/mechanics-coverage/srd-5e-2024-atomic.ts`.
- Added the fleet batch source in `data/fleet/srd-fleet-batches.ts`.
- Added the fleet report generator in `scripts/report-fleet-readiness.ts`.
- Added the root command:
  - `pnpm report:fleet-readiness`
- Generated the fleet handoff artifacts:
  - `docs/reports/srd-mechanics-coverage-atomic.md`
  - `docs/reports/fleet-readiness.md`
  - `docs/reports/fleet-work-items.csv`
- Current fleet baseline:
  - 111 atomic mechanics
  - 17 full
  - 42 partial
  - 52 none
  - 15 fleet batches
  - 4 ready now
- The ready-now write scopes currently have no exact path collisions.
- Validation passed after the prep pass:
  - `pnpm report:fleet-readiness`
  - `pnpm check`
  - `pnpm test`

### 23:42:47 Verification Harness and Evidence Infrastructure

- Built the verification harness batch (`verification-harness-and-live-snapshots`):

#### Live-roster snapshot script
- Added `scripts/snapshot-live-roster.ts` with `pnpm snapshot:live-roster` command.
- Reads `data/real-campaign-intake/verified-characters.json`, builds `CharacterComputationInput` for all 5 characters using the same canonical lookup pipeline as the seed script (no DB required), calls `computeCharacterState`, and writes deterministic JSON snapshots.
- Supports `--update` (overwrite baseline), `--check` (exit non-zero on drift), and default mode (compare + print diff).
- Baseline stored at `data/fleet/snapshots/live-roster-baseline.json`.
- Current roster baseline: Nara L2, Oriana L2, Ronan Wildspark L2, Tali L2, Vivennah L2.

#### Fixture infrastructure
- Added `data/fleet/fixture-patterns.ts` with `loadVerifiedRoster()`, `buildCharacterFixture(roster, slug)`, and `buildAllCharacterFixtures(roster)`.
- These helpers let any batch test build a deterministic `CharacterComputationInput` from the verified roster without touching the database.
- Exported `rosterSlugs` constant for the 5 seeded characters.

#### Determinism tests
- Added `library/tests/verification/report-determinism.test.ts` with 8 tests:
  - Coarse mechanics report determinism
  - Atomic mechanics summary determinism
  - Fleet readiness summary determinism
  - No duplicate IDs in coarse, atomic, or batch data
  - All batch mechanic IDs reference valid atomic IDs
  - All batch dependency IDs reference valid batch IDs

#### Evidence gate enforcement
- Added `checkEvidenceGates()` to `data/mechanics-coverage/types.ts`.
- Evidence patterns: `.test.ts`, `.spec.ts`, `tests/`, `snapshots/`, `fixtures/`, `verified-characters.json`.
- Integrated into `scripts/report-fleet-readiness.ts` main(): warns on violations, fails with `--strict`.
- Added `library/tests/verification/evidence-gates.test.ts` (4 tests) to enforce that all `full` mechanics have evidence refs.
- Fixed 5 `full` mechanics that were missing evidence refs by adding `testsEngine` ref.

#### Live-roster computation tests
- Added `library/tests/verification/live-roster-snapshot.test.ts` (8 tests):
  - Loads all 5 characters, verifies computation succeeds
  - Checks determinism across runs
  - Verifies each character's sheet-baseline values (AC, HP, speed, PP, spell DC)

#### Infrastructure changes
- Updated `library/tsconfig.json` to include `../data/**/*.ts` (rootDir changed to `..`).
- Added `snapshot:live-roster` script to root `package.json`.

#### Validation
- `pnpm check` passes
- `pnpm test` passes (134 library tests + 4 app tests)
- `pnpm lint` passes (0 warnings, 0 errors)
- `pnpm snapshot:live-roster` produces no drift from baseline
- `pnpm report:fleet-readiness` produces no evidence gate violations
