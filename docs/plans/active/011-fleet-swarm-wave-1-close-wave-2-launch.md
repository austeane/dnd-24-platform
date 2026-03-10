# Plan 011: Fleet Swarm — Wave 1 Close & Wave 2 Launch

## Current State

- Atomic: 39 full / 39 partial / 33 none (111 total)
- Wave 1: 4 batches "ready now", all substantially started, none formally closed
- Wave 2: 3 batches blocked on Wave 1, write-path collisions unresolved
- 21 of the 39 partial mechanics are implemented but auto-downgraded by evidence audit

## Goal

1. Close Wave 1 by recovering evidence and finishing remaining test/canon gaps
2. Resolve Wave 2 write-path collisions
3. Launch Wave 2 as a parallel swarm
4. Pull `condition-state-and-dm-overrides` (Wave 3) forward since its only dependency is `progression-service-boundary-split`

Expected outcome: ~60 full, ~12 partial, ~26 none → ready for Wave 3/4.

## Swarm Structure

### Round 1: Wave 1 Close (4 parallel agents)

All 4 agents can run simultaneously — no write-path collisions exist between Wave 1 batches.

---

#### Agent A: Evidence & Fixture Recovery

**Batch:** Cross-cutting (supports `verification-harness-and-live-snapshots` closure)

**Goal:** Add fixture snapshot assertions and live-roster refs for mechanics that are implemented but fail evidence audit. Pure test/assertion work, no new features.

**Target mechanics (partial → full):**

| Mechanic | Missing Gate(s) |
|----------|----------------|
| `core-expertise-grants` | live-roster |
| `action-melee-attack-profiles` | fixtures |
| `action-ranged-attack-profiles` | fixtures |
| `action-damage-package-projection` | fixtures |
| `action-weapon-mastery-runtime` | fixtures |
| `spell-prepared-capacity-grants` | fixtures |
| `spell-known-capacity-grants` | fixtures |

**Owned paths:**
- `library/tests/verification/fixture-roster-snapshot.test.ts`
- `data/fleet/snapshots/fixture-roster-baseline.json`
- `data/fleet/snapshots/fixture-roster-latest.json`
- `scripts/snapshot-fixture-roster.ts`
- `data/mechanics-coverage/srd-5e-2024-atomic.ts` (evidence refs only)

**Verification:**
- `pnpm test` passes
- `pnpm snapshot:fixture-roster --update` succeeds
- `pnpm report:fleet-readiness --strict` passes
- Target mechanics now show `full` in regenerated report

---

#### Agent B: Content & Canon Tests

**Batches:** `content-roster-srd-expansion` + `content-aa-overlay-expansion`

**Goal:** Write tests for spell catalog lookup, pack visibility, roster canon coverage, and Primal Order Warden. Close both content batches.

**Target mechanics (partial → full):**

| Mechanic | Missing Gate(s) |
|----------|----------------|
| `spell-lookup-by-id` | tests |
| `spell-lookup-by-name-alias` | tests |
| `spell-enabled-pack-visibility` | tests |
| `spell-roster-canon-coverage` | tests, live-roster |
| `spell-origin-choice-capture` | persistence, tests, live-roster |
| `feature-primal-order-warden` | tests, live-roster |
| `rules-concentration-canon-linkage` | tests |
| `core-resistance-grants` | tests |
| `core-immunity-grants` | tests |

Note: `spell-origin-choice-capture` has persistence gates that may keep it at partial even with tests. That's fine — it closes fully in Wave 2.

**Owned paths:**
- `content/canon/packs/srd-5e-2024/spells/`
- `content/canon/packs/srd-5e-2024/class-features/`
- `content/canon/packs/srd-5e-2024/species/`
- `content/canon/packs/advanced-adventurers/`
- `library/tests/canon/` (new test files)
- `library/src/catalog.ts` (if lookup needs fixes)
- `data/mechanics-coverage/srd-5e-2024-atomic.ts` (evidence refs only)

**Verification:**
- `pnpm compile` passes
- `pnpm test` passes
- `pnpm check` passes
- Tests cover at least: ID lookup, name alias lookup, pack-filtered lookup, roster spell coverage, Primal Order proficiency grants, resistance/immunity source effects

---

#### Agent C: Progression Service Tests & Extraction

**Batch:** `progression-service-boundary-split`

**Goal:** Complete the service boundary extraction and write tests for spend-plan preview, class-level commit, canonical-source commit, and spell-access commit. This is the critical-path blocker — 4 Wave 2 batches depend on it.

**Target mechanics (partial → full):**

| Mechanic | Missing Gate(s) |
|----------|----------------|
| `progression-spend-plan-preview` | tests, fixtures |
| `progression-class-level-commit` | mutation, tests, fixtures |
| `progression-canonical-source-commit` | mutation, tests, fixtures |
| `progression-spell-access-commit` | mutation, tests, fixtures |
| `progression-prerequisite-source-match` | tests, fixtures |

**Owned paths:**
- `app/src/server/progression/service.ts`
- `app/src/server/progression/` (new focused modules)
- `app/src/server/progression/*.test.ts`
- `data/mechanics-coverage/srd-5e-2024-atomic.ts` (evidence refs only)

**Verification:**
- `pnpm check` passes
- `pnpm test` passes
- `pnpm build` passes
- Each progression operation lives in a focused module with tests
- Mutation tests prove commit idempotency and validation

**Hints:**
- Prefer extraction + naming cleanup over behavioral changes
- Write proper mutation tests that exercise the DB path (integration test config exists at `app/vitest.integration.config.ts`)
- The service already has `projection.ts` extracted — continue that pattern

---

#### Agent D: Action Inventory & HP Tests

**Batch:** Cross-cutting (fills remaining test gaps outside other agents' scopes)

**Goal:** Write tests for action/bonus/reaction inventory derivation, HP base derivation, and species custom normalization. These are implemented in the engine but have no test references.

**Target mechanics (partial → full where possible):**

| Mechanic | Missing Gate(s) |
|----------|----------------|
| `action-action-inventory` | tests, live-roster |
| `action-bonus-action-inventory` | tests, live-roster |
| `action-reaction-inventory` | tests, live-roster |
| `core-hp-base-fallback` | explainability, tests, live-roster |
| `species-reviewed-custom-normalization` | canon, live-roster |

**Owned paths:**
- `library/tests/engine/action-inventory.test.ts` (new)
- `library/tests/engine/hp.test.ts` (new)
- `library/src/engine/character-computer.ts` (read-mostly, minor explainability additions if needed)
- `data/mechanics-coverage/srd-5e-2024-atomic.ts` (evidence refs only)

**Verification:**
- `pnpm test` passes
- `pnpm check` passes
- Tests verify action/bonus/reaction lists for at least 2 roster characters
- HP derivation test verifies the base snapshot path

---

### Round 2: Wave 2 Prep (1 agent, runs after Round 1)

#### Agent E: Schema & Service Split

**Goal:** Resolve the Wave 2 write-path collisions between `choice-state-and-equipment-persistence` and `resource-spend-and-rest-engine`. Both need `app/src/server/db/schema/progression.ts` and `app/src/server/progression/`.

**Actions:**
1. Split `progression.ts` schema into domain files:
   - `schema/character-sources.ts` — existing source/XP tables
   - `schema/resource-pools.ts` — resource pool state tables
   - `schema/choice-state.ts` — new skill/feat/spell/equipment choice tables
   - `schema/conditions.ts` — condition state tables
   - `schema/progression.ts` — re-export barrel
2. Create service file stubs for Wave 2 owned domains:
   - `progression/resource-service.ts`
   - `progression/choice-service.ts`
   - `progression/rest-service.ts`
3. Update `data/fleet/srd-fleet-batches.ts` owned paths to reference the split files
4. Regenerate fleet reports to confirm no collisions remain

**Owned paths:**
- `app/src/server/db/schema/`
- `app/src/server/progression/` (new service stubs only)
- `data/fleet/srd-fleet-batches.ts`
- `docs/reports/`

**Verification:**
- `pnpm check` passes
- `pnpm test` passes
- `pnpm build` passes
- `pnpm test:integration` passes
- `pnpm report:fleet-readiness` shows no Wave 2 write-scope collisions
- Drizzle migrations still apply cleanly

---

### Round 3: Wave 2 + Condition Swarm (3 parallel agents)

After Wave 1 closes and collisions are resolved, launch the main feature swarm.

---

#### Agent F: Choice State & Equipment Persistence

**Batch:** `choice-state-and-equipment-persistence`

**Goal:** Persist skill picks, feat picks, spell picks, owned equipment, and equipped state so runtime can stop relying on sheet baselines.

**Target mechanics (8, mostly none → full):**

| Mechanic | Current |
|----------|---------|
| `core-skill-choice-capture` | none |
| `feat-magic-initiate-choice-capture` | none |
| `feat-skilled-choice-capture` | none |
| `action-equipment-persistence` | none |
| `action-equipped-state-persistence` | none |
| `action-weapon-mastery-choice-capture` | partial |
| `feature-metamagic-option-capture` | partial |
| `feature-pact-blade-bond-state` | partial |

**Owned paths:** (updated after split)
- `app/src/server/db/schema/choice-state.ts`
- `app/src/server/progression/choice-service.ts`
- `app/drizzle/` (new migration)
- `data/real-campaign-intake/verified-characters.json`
- `app/src/server/db/seed-real-campaign.ts`

**Verification:**
- New schema and migrations apply cleanly
- Seeded characters rehydrate idempotently with structured choices
- `pnpm test:integration` passes with choice-state round-trip tests
- At least one roster character proves each choice-state bucket

---

#### Agent G: Resource Spend & Rest Engine

**Batch:** `resource-spend-and-rest-engine`

**Goal:** Make resources stateful and recoverable so session use stops depending on paper tracking.

**Target mechanics (7, mostly none → full):**

| Mechanic | Current |
|----------|---------|
| `action-resource-spend-mutation` | none |
| `action-resource-restore-mutation` | none |
| `action-short-rest-reset-engine` | none |
| `action-long-rest-reset-engine` | none |
| `rules-rest-flow-event-recording` | none |
| `action-fixed-resource-pools` | full (maintain) |
| `action-scaling-resource-pools` | full (maintain) |

**Owned paths:** (updated after split)
- `app/src/server/db/schema/resource-pools.ts`
- `app/src/server/progression/resource-service.ts`
- `app/src/server/progression/rest-service.ts`
- `library/src/engine/traits-and-resources.ts`
- `library/tests/engine/resources.test.ts`

**Verification:**
- Resources have current/max state persisted
- Short and long rest flows reset the right pools and record an event
- At least one live character proves short-rest recovery, one proves long-rest recovery
- `pnpm test:integration` passes with spend/restore/rest round-trip tests

---

#### Agent H: Condition State & DM Overrides (pulled forward from Wave 3)

**Batch:** `condition-state-and-dm-overrides`

**Goal:** Close the condition loop. The library engine already implements condition state, apply/remove, charmed/incapacitated effects, and DM overrides — all 5 mechanics are "full" in source but auto-downgrade because they lack persistence/mutation/fixture evidence. This batch adds the DB persistence layer and integration tests.

**Target mechanics (5, partial → full):**

| Mechanic | Missing Gate(s) |
|----------|----------------|
| `rules-condition-state-engine` | persistence, mutation, fixtures, live-roster |
| `rules-condition-apply-remove` | persistence, mutation, fixtures, live-roster |
| `rules-charmed-effects` | fixtures, live-roster |
| `rules-incapacitated-effects` | fixtures, live-roster |
| `rules-dm-condition-override` | persistence, mutation, fixtures, live-roster |

**Owned paths:** (updated after split)
- `app/src/server/db/schema/conditions.ts`
- `app/src/server/progression/condition-service.ts`
- `library/src/engine/conditions.ts`
- `library/tests/engine/conditions.test.ts` (expand with fixtures)
- `content/canon/packs/srd-5e-2024/conditions/`

**Verification:**
- Conditions are persisted as explicit state, not note text
- Charmed and Incapacitated have observable mechanical effects in runtime output
- DM override flows are audited with integration tests
- `pnpm test:integration` passes with condition round-trip tests

---

### Round 3 Follow-up: Skill & Passive Loop (1 agent, after Agent F)

#### Agent I: Runtime Skill & Passive Loop

**Batch:** `runtime-skill-and-passive-loop`

Depends on `choice-state-and-equipment-persistence` completing first.

**Target mechanics (4):**
- `core-skill-proficiency-grants` (full, maintain)
- `core-skill-bonus-derivation` (full, maintain)
- `core-expertise-grants` (should be full after Round 1)
- `core-passive-perception-derivation` (full, maintain)

**Goal:** Use persisted choices to derive full skill state from sources rather than photographed baselines.

---

## Timeline Summary

```
Round 1 (parallel):  A + B + C + D  →  Wave 1 closed, ~18 mechanics recovered
Round 2 (serial):    E              →  Wave 2 collisions resolved
Round 3 (parallel):  F + G + H      →  Wave 2 + conditions, ~20 mechanics closed
Round 3.1 (serial):  I              →  Skill loop closed
```

## Expected Final Counts

After all rounds: ~65-70 full / ~8-12 partial / ~26-28 none

Remaining `none` mechanics would be concentrated in:
- Spell cast resolution (slot spend, free-cast, concentration)
- Equipment effects on AC/attacks (armor, shield, weapon application)
- Specific feat execution (Savage Attacker, Musician, Magic Initiate free-cast)
- HP level-by-level derivation
- Alternate movement modes
- Study action availability

These are all Wave 3-4 work and none block the intentionally plain proof UI.

## Acceptance Criteria

1. `pnpm check && pnpm test && pnpm lint && pnpm build` all pass
2. `pnpm test:integration` passes with the new DB-backed tests
3. `pnpm report:fleet-readiness --strict` passes
4. Wave 1 batches are formally closed (moved to completed or marked done)
5. Wave 2 write-path collisions are resolved in fleet batch definitions
6. Atomic report shows ≥60 full mechanics
7. Worklog updated with final counts and next-wave assignments
