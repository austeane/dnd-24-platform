# Plan 011: Fleet Swarm — Backend Close Through Tavern Launch

## Current State

- Atomic: 68 full / 20 partial / 23 none (111 total) — post-Wave 2
- Wave 1: 4 batches closed (Rounds 1-2 complete)
- Wave 2: 3 batches closed (Round 3 complete) — choice-state, resource/rest, conditions
- Wave 3-4: backend mechanics remaining (AC/equipment, spell state, class features, feat/species)
- Tavern frontend: zero routes, zero components, zero test infra (see [constraint register](014-tavern-frontend-constraint-register.md))

## Goal

1. ~~Close Wave 1 by recovering evidence and finishing remaining test/canon gaps~~ ✓
2. ~~Resolve Wave 2 write-path collisions~~ ✓
3. ~~Launch Wave 2 as a parallel swarm~~ ✓ (in-flight)
4. Close Wave 3 backend mechanics needed for truthful Tavern display (AC, equipment effects, spell state)
5. Scaffold frontend foundation (design system, test infra, read models, conventions)
6. Build the Tavern UI surfaces per [Plan 013](013-tavern-front-end-architecture.md)
7. Resolve every item in the [constraint register](014-tavern-frontend-constraint-register.md)

Expected outcome: ~80 full mechanics, Tavern rendering all 5 roster characters across 5 tabs with real data.

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

---

### Round 4: Wave 3 Backend — AC, Equipment & Spell State (2 parallel agents)

These close the highest-value remaining backend mechanics that directly affect Tavern display quality. Both agents can run in parallel — no write-path collisions.

---

#### Agent J: AC & Equipment Effects

**Batch:** `runtime-ac-and-attack-foundation`

**Goal:** Derive AC from equipped armor/shield, apply equipment effects to attack profiles, and close the equipment-to-runtime projection loop. This makes the Tavern combat panel truthful for AC and the inventory tab truthful for weapon stats.

**Target mechanics (up to 9, none/partial → full):**

| Mechanic | Current | Tavern Impact |
|----------|---------|---------------|
| `core-equipped-armor-and-shield-ac` | none | Combat panel AC is wrong without this |
| `action-armor-effect-application` | none | Inventory shows armor but no AC contribution |
| `action-weapon-effect-application` | none | Inventory shows weapons but no attack stats |
| `core-ac-base-fallback` | partial | AC falls back to 10+DEX without equipment |
| `core-ac-formula-selection` | partial | Unarmored Defense, etc. |
| `action-melee-attack-profiles` | full | Maintain |
| `action-ranged-attack-profiles` | full | Maintain |
| `action-damage-package-projection` | full | Maintain |
| `action-weapon-mastery-runtime` | full | Maintain |

**Owned paths:** (per batch definition in `srd-fleet-batches.ts`)
- `library/src/engine/defenses.ts`
- `library/src/engine/attack-profiles.ts`
- `library/src/types/character.ts`
- `library/tests/engine/attacks.test.ts`
- `content/canon/packs/srd-5e-2024/equipment/`

**Verification:**
- AC is fully explained from equipped items and formulas for roster characters
- Weapon attacks show derived attack bonus, damage, and relevant tags
- `pnpm check && pnpm test && pnpm build` pass

---

#### Agent K: Spell Slot, Capacity & Cast State

**Batch:** `runtime-slot-capacity-and-cast-state`

**Goal:** Model spell capacities, slot spend, and concentration so the Tavern spellbook tab can show real slot availability and casting constraints.

**Target mechanics (up to 9, none/partial → full):**

| Mechanic | Current | Tavern Impact |
|----------|---------|---------------|
| `spell-capacity-enforcement` | none | Spellbook can't show prepared/known limits |
| `spell-slot-spend-mutation` | none | Can't track which slots are used |
| `spell-free-cast-state` | none | Racial/feat free casts not tracked |
| `spell-concentration-state-tracking` | none | Can't show what spell is being concentrated on |
| `spell-concentration-save-flow` | none | No concentration break mechanics |
| `spell-resolution-engine` | none | No cast execution |
| `spell-access-grants` | partial | |
| `spell-origin-choice-capture` | partial | |
| `spell-slot-pools-from-class-features` | partial | |

**Owned paths:** (per batch definition)
- `library/src/engine/spellcasting.ts`
- `library/src/types/character.ts`
- `app/src/server/progression/`
- `library/tests/engine/spellcasting.test.ts`
- `content/canon/packs/srd-5e-2024/class-features/`
- `content/canon/packs/srd-5e-2024/spells/`

**Verification:**
- Known/prepared capacities are derived for roster classes
- Slot spend consumes the right slot type
- At least one character proves pact slots, one proves standard slots
- `pnpm check && pnpm test && pnpm build` pass

---

### Round 5: Frontend Foundation (1 agent, serial)

**Goal:** Lay all infrastructure that Plans 012 and 013 assume exists. This is the bridge between backend-complete and UI-buildable. Resolves the hard constraints in the [constraint register](014-tavern-frontend-constraint-register.md).

#### Agent L: Frontend Infrastructure Scaffold

**What gets built:**

1. **Dependencies** — install `react-markdown`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
2. **Tailwind v4 `@theme` tokens** — all Tavern colors, shadows, fonts, border-radius in `app/src/styles/app.css` (Plan 012 Phase 1a)
3. **Global atmosphere CSS** — body gradients, noise texture overlay, vignette in `app/src/styles/app.css` (Plan 012 Phase 1b)
4. **Component CSS** — `.tavern-card`, `.tavern-nav`, `.content-grid`, `.animate-fade-up` in `app/src/styles/tavern.css` (Plan 012 Phase 1c)
5. **Font loading** — Google Fonts preconnect + stylesheet links in `app/src/routes/__root.tsx` (Plan 012 Phase 1d)
6. **Page-state primitives** — `Loading`, `Skeleton`, `ErrorCard`, `EmptyState`, `NotFound` under `app/src/components/tavern/ui/`
7. **Frontend test setup** — update `app/vitest.unit.config.ts` to include `*.test.tsx`, add jsdom environment, create setup file with Testing Library matchers
8. **`createServerFn` convention** — establish the pattern with one reference implementation (e.g., roster list) showing server fn → route-local adapter → component
9. **Read model stubs** — create `app/src/server/tavern/` directory with typed stubs for `home.ts`, `character-shell.ts`, `spellbook.ts`, `inventory.ts`, `journal.ts`, `compendium.ts`
10. **Markdown component** — `app/src/components/tavern/ui/ProseContent.tsx` wrapping `react-markdown` with Tavern prose styling

**Owned paths:**
- `app/src/styles/app.css`
- `app/src/styles/tavern.css` (new)
- `app/src/routes/__root.tsx`
- `app/src/components/tavern/` (new tree)
- `app/src/server/tavern/` (new tree)
- `app/vitest.unit.config.ts`
- `app/src/test-setup.ts` (new)
- `app/package.json` (new deps only)

**Verification:**
- `pnpm check && pnpm test && pnpm lint && pnpm build` pass
- `pnpm -F @dnd/app dev` starts, homepage loads with Tavern body background + fonts
- At least one `.test.tsx` file exists and passes with jsdom
- Page-state primitives render in isolation
- `ProseContent` renders markdown safely
- One `createServerFn` endpoint works end-to-end

**Constraint register items closed:**
- Front-end baseline → design tokens, layout primitives, component system
- TanStack Start UI data conventions → createServerFn reference implementation
- Page-state primitives → loading, skeleton, empty, error, not-found components
- App markdown rendering → ProseContent component with react-markdown
- Front-end unit test infrastructure → jsdom, Testing Library, .test.tsx support

---

### Round 6: Tavern Surface Build (3 parallel agents)

After foundation exists, build the actual UI surfaces per [Plan 013](013-tavern-front-end-architecture.md). Each agent owns a set of routes and their server read models. All agents can run in parallel — each owns distinct route files and read model modules.

---

#### Agent M: Home/Roster + Character Shell

**Goal:** Build the campaign home page, roster cards, and the character shell (nested route layout with tab navigation). This is the skeleton that all other tabs plug into.

**Surfaces:**
- `/` — campaign list with roster cards per campaign
- `/characters/$characterId` — character shell route with shared loader
- `/characters/$characterId/` (index) — character tab: hero card, XP, abilities, combat panel, skills, features

**Owned paths:**
- `app/src/routes/index.tsx` (rewrite)
- `app/src/routes/index/-server.ts` (new)
- `app/src/routes/index/-adapters.ts` (new)
- `app/src/routes/characters/$characterId/route.tsx` (new)
- `app/src/routes/characters/$characterId/index.tsx` (new)
- `app/src/routes/characters/$characterId/-server.ts` (new)
- `app/src/routes/characters/$characterId/-adapters.ts` (new)
- `app/src/components/tavern/layout/` (TavernNav, TavernLayout)
- `app/src/components/tavern/character/` (CharacterCard, AbilityScoreRow, CombatPanel, SkillsPanel, FeaturesPanel, XPProgressBar)
- `app/src/server/tavern/home.ts`
- `app/src/server/tavern/character-shell.ts`

**Key decisions:**
- `CombatPanelProps` accepts `currentHp?: number` and `maxHp: number` — renders truth-preserving max-only state until currentHP is modeled
- Hero action buttons (Level Up, Long Rest) are visually present but `aria-disabled` with explanatory copy
- Data flows: server read model → `createServerFn` → route loader → adapter → component props

**Verification:**
- Home page lists campaigns with clickable roster cards
- Character shell renders with real data for all roster characters
- Responsive at 480px, 768px, 1024px breakpoints
- `pnpm check && pnpm build` pass

---

#### Agent N: Spellbook + Inventory Tabs

**Goal:** Build the two most mechanically rich character tabs. These require dedicated read models that join runtime state against canonical data and DB records.

**Surfaces:**
- `/characters/$characterId/spellbook` — spells grouped by level, slot pools, casting ability info
- `/characters/$characterId/inventory` — equipped items, carried/stowed items, attack profiles, tracked resources

**Owned paths:**
- `app/src/routes/characters/$characterId/spellbook.tsx` (new)
- `app/src/routes/characters/$characterId/inventory.tsx` (new)
- `app/src/components/tavern/character/SpellsPanel.tsx`
- `app/src/components/tavern/character/InventoryPanel.tsx`
- `app/src/components/tavern/ui/SlotDots.tsx`
- `app/src/server/tavern/spellbook.ts` (read model: joins grantedSpells → canonical spell metadata)
- `app/src/server/tavern/inventory.ts` (read model: joins equipment records + runtime attack profiles + resources)

**Key decisions:**
- Spellbook groups spells by canonical spell level, not by access source
- Spellbook read model enriches `grantedSpells` with `level`, `school`, `castingTime`, `concentration` from canonical spell entities
- Inventory read model joins `character_equipment` (owned items) + `runtime.attackProfiles` (derived stats) + `runtime.resources` (tracked resources)
- Both tabs share the parent character shell loader for base character data

**Constraint register items closed:**
- Spellbook enrichment → dedicated read model joining canonical spell data
- Inventory composition → dedicated read model joining equipment + runtime + resources

**Verification:**
- Spellbook renders spell groups with slot availability for caster characters
- Spellbook renders empty state for non-caster characters
- Inventory shows equipped vs. carried items for all roster characters
- `pnpm check && pnpm build` pass

---

#### Agent O: Journal + Compendium Tabs

**Goal:** Build the two content-focused tabs. These are simpler mechanically but require markdown rendering and search/filter UX.

**Surfaces:**
- `/characters/$characterId/journal` — player communication cards with markdown bodies
- `/characters/$characterId/compendium` — browse/search/filter enabled-pack canonical entities

**Owned paths:**
- `app/src/routes/characters/$characterId/journal.tsx` (new)
- `app/src/routes/characters/$characterId/compendium.tsx` (new)
- `app/src/components/tavern/character/JournalPanel.tsx`
- `app/src/components/tavern/character/CompendiumPanel.tsx`
- `app/src/server/tavern/journal.ts` (read model: `listPlayerCommunicationCards`)
- `app/src/server/tavern/compendium.ts` (read model: browse/search/filter canonical entities)

**Key decisions:**
- Journal uses `ProseContent` component for markdown rendering
- Journal has first-class empty state design (not a fallback placeholder)
- Compendium uses URL search params (`q`, `type`, `pack`, `entry`) for filter state
- Compendium detail view renders `bodyMd` through `ProseContent`
- Compendium browses existing `CanonicalEntity` records directly — no new normalization layer

**Constraint register items closed:**
- Journal demo content → designed empty state
- Compendium app surface → browse/search/filter/detail query layer with URL-state

**Verification:**
- Journal renders communication cards or empty state
- Compendium lists entities filterable by type and pack
- Compendium detail renders markdown body
- `pnpm check && pnpm build` pass

---

### Round 7: Polish & Accessibility (1 agent, serial, after Round 6)

#### Agent P: Polish Pass

**Goal:** Close the remaining quality gaps from the constraint register.

**Actions:**
1. **Animations** — `fadeUp` with staggered `--delay` per component (Plan 012 Phase 4)
2. **Responsive tuning** — verify all breakpoints, fix layout issues across tablets/phones
3. **Accessibility pass** — skip links, focus-visible styles, `role="progressbar"` on HP/XP bars, `aria-label` on ability cards, semantic nav, live-region patterns
4. **Loading states** — `CharacterSheetSkeleton` with `animate-pulse` in Tavern palette
5. **Error states** — themed error cards for missing/failed character loads
6. **Disabled-state messaging** — not-yet-built actions (Level Up, Long Rest, spell cast) have clear explanatory copy
7. **Render tests** — add adapter tests + component render tests for key surfaces using Testing Library

**Constraint register items closed:**
- Browser acceptance tooling → basic Lighthouse checks added
- App-level accessibility primitives → skip links, focus management, live regions
- Seeded front-end fixtures → render tests with fixture data
- Query/cache convention → documented decision (use TanStack Start loader caching for v1; add react-query only when needed)

**Verification:**
- Lighthouse accessibility score ≥ 90 on character sheet route
- All components have render tests
- `pnpm check && pnpm test && pnpm lint && pnpm build` pass
- All 5 roster characters render correctly on all tabs

---

## Constraint Register Cross-Reference

Every item from [014-tavern-frontend-constraint-register.md](014-tavern-frontend-constraint-register.md) mapped to its resolution:

### Hard Constraints

| Constraint | Resolution |
|------------|-----------|
| Front-end baseline missing | Round 5 (Agent L): design tokens, layout primitives, component tree |
| TanStack Start data conventions not established | Round 5 (Agent L): createServerFn reference impl + adapter pattern |
| Page-state primitives missing | Round 5 (Agent L): Loading, Skeleton, ErrorCard, EmptyState, NotFound |
| App markdown rendering missing | Round 5 (Agent L): ProseContent component with react-markdown |
| Front-end unit test infrastructure missing | Round 5 (Agent L): jsdom, Testing Library, .test.tsx config |
| Browser acceptance tooling missing | Round 7 (Agent P): Lighthouse checks; full Playwright deferred to post-Tavern |

### Domain and Data-Model Constraints

| Constraint | Resolution |
|------------|-----------|
| Current HP not modeled | Round 4 (Agent J): HP derivation path improved. Round 6 (Agent M): truth-preserving max-only display per Plan 013 |
| Spellbook requires enrichment | Round 6 (Agent N): dedicated read model joining grantedSpells → canonical spell metadata |
| Inventory requires multi-source composition | Round 6 (Agent N): dedicated read model joining equipment + runtime + resources |
| Journal demo content absent | Round 6 (Agent O): designed empty state as intentional UX |
| Compendium app surface absent | Round 6 (Agent O): browse/search/filter over canonical entities with URL-state |

### Quality Gaps

| Constraint | Resolution |
|------------|-----------|
| No UI architecture boundary | Round 5 (Agent L): `app/src/server/tavern/` read models + route-local adapters |
| No query/cache convention | Round 7 (Agent P): documented decision — TanStack Start loaders for v1, react-query when needed |
| No accessibility primitives | Round 7 (Agent P): skip links, focus management, live regions, ARIA patterns |
| No front-end fixtures | Round 7 (Agent P): render tests with Testing Library + fixture data |

---

## Timeline Summary

```
Round 1 (parallel):  A + B + C + D  →  Wave 1 closed, ~18 mechanics recovered
Round 2 (serial):    E              →  Wave 2 collisions resolved
Round 3 (parallel):  F + G + H      →  Wave 2 + conditions, ~20 mechanics closed
Round 3.1 (serial):  I              →  Skill loop closed
Round 4 (parallel):  J + K          →  Wave 3 backend: AC/equipment + spell state
Round 5 (serial):    L              →  Frontend foundation scaffolded
Round 6 (parallel):  M + N + O      →  Tavern surfaces built
Round 7 (serial):    P              →  Polish + accessibility + test coverage
```

## Expected Final Counts

After Round 3.1: ~65-70 full / ~8-12 partial / ~23 none

After Round 4: ~75-80 full / ~8-10 partial / ~15 none

After Round 7: Tavern fully rendered with real data for all roster characters. Remaining `none` mechanics concentrated in:
- Class feature execution (Bardic Inspiration, Font of Magic, Metamagic, Wild Shape)
- Feat execution (Savage Attacker, Musician)
- Species edge cases (Stone's Endurance, Wood Elf Trance)
- Study action

These are Wave 4-5 work and do not block the Tavern — they add interactivity to features that are already displayed read-only.

## Acceptance Criteria

### Rounds 1-3 (Backend Mechanics)
1. `pnpm check && pnpm test && pnpm lint && pnpm build` all pass
2. `pnpm test:integration` passes with new DB-backed tests
3. `pnpm report:fleet-readiness --strict` passes
4. Wave 1 batches formally closed
5. Wave 2 write-path collisions resolved
6. Atomic report shows ≥60 full mechanics
7. Worklog updated with final counts

### Round 4 (Wave 3 Backend)
8. AC is derived from equipped items for roster characters
9. Spell slot spend and concentration tracking work for at least one caster
10. Atomic report shows ≥75 full mechanics

### Rounds 5-7 (Tavern Frontend)
11. All constraint register items from Plan 014 are resolved or explicitly deferred with rationale
12. Home page lists campaigns with roster cards linking to character sheets
13. Character sheet renders 5 tabs (character, spellbook, inventory, journal, compendium) with real data
14. All 5 roster characters render correctly across all tabs
15. Responsive layout works at 480px, 768px, 1024px
16. Lighthouse accessibility score ≥ 90
17. Frontend test suite passes with adapter + render tests
