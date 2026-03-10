# Testing & Evaluating the Tavern Frontend

Guide for verifying everything built in Rounds 4–6 of the fleet swarm.

## Quick Verification (Automated)

```bash
pnpm check          # TypeScript strict mode — 0 errors
pnpm test           # 632 tests (558 library + 74 app)
pnpm lint           # 0 errors
pnpm build          # Client + Nitro SSR build
```

All four must pass before any commit.

## What Was Built

### Round 4: Backend Mechanics

**AC & Equipment Effects** (`library/src/engine/defenses.ts`)
- Unarmored AC = 10 + DEX modifier (not baseArmorClass snapshot)
- Formula candidates (armor, Unarmored Defense) compared against unarmored baseline
- DEX cap enforcement for medium/heavy armor
- Shield bonus and other AC modifiers applied correctly
- Full AC breakdown with per-contributor explanations

**Test file**: `library/tests/engine/defenses.test.ts` (23 tests)

```bash
pnpm -F @dnd/library test -- tests/engine/defenses.test.ts
```

Key cases to verify:
- Unarmored AC includes DEX modifier
- Light armor uses full DEX
- Medium armor caps DEX at +2
- Heavy armor ignores DEX
- Best formula wins (highest AC)
- AC breakdown is fully explainable

### Round 5: Frontend Foundation

**Design system** (`app/src/styles/tavern.css`)
- Theme tokens: `--color-parchment`, `--color-ink`, `--color-wood`, `--color-ember`, etc.
- Typography: Fraunces (headings), Source Sans 3 (body), IBM Plex Mono (code)
- Atmosphere CSS: `@keyframes candleFlicker`, warm tones

**UI primitives** (`app/src/components/tavern/ui/`)
- Button, Card, StatBadge, ProgressBar, SlotDots
- Loading, Skeleton, ErrorCard, EmptyState, NotFound
- ProseContent (markdown rendering)

**Layout** (`app/src/components/tavern/layout/`)
- TavernNav — top navigation with optional campaign context
- TavernLayout — centered content container

### Round 6: Tavern Surfaces

**Read models** (`app/src/server/tavern/`)

| File | Purpose |
|---|---|
| `home.ts` | Campaign list + character roster |
| `character-shell.ts` | Full character state (abilities, AC, HP, skills, etc.) |
| `spellbook.ts` | Spell groups by level + slot tracking |
| `inventory.ts` | Equipment, attack profiles, resources |
| `journal.ts` | Communication cards from DM |
| `compendium.ts` | Searchable compendium with pack/type filters |

**Routes** (`app/src/routes/`)

| Route | Tab |
|---|---|
| `/` | Home — campaign cards + roster links |
| `/characters/$characterId` | Shell layout — loads character state |
| `/characters/$characterId/` | Overview — abilities, combat stats, skills, features |
| `/characters/$characterId/spellbook` | Spell list grouped by level |
| `/characters/$characterId/inventory` | Equipment, attacks, resources |
| `/characters/$characterId/journal` | DM-published cards |
| `/characters/$characterId/compendium` | Searchable rules compendium |

## Manual Testing with Dev Server

```bash
pnpm -F @dnd/app dev
```

The app requires a running Postgres database with seeded data. Without it, server functions will error. To verify:

1. **Home page** (`/`): Should show campaign cards with roster entries
2. **Character page** (`/characters/<id>`): Should show character overview
3. **Tab navigation**: Click through spellbook, inventory, journal, compendium tabs
4. **Compendium search**: Type in search box, filter by type/pack, click entries for detail

If you don't have a database:
- The build (`pnpm build`) verifies the full compilation pipeline
- Component tests verify rendering in isolation
- The server read models are thin wrappers over existing services, so their correctness depends on the underlying services (already tested)

## Server/Client Boundary

The `-server.ts` files use `createServerFn` with variable-based dynamic imports:

```typescript
const shellMod = "../../../server/tavern/character-shell" + ".ts";
// ...
const { getCharacterShellData } = await import(/* @vite-ignore */ shellMod);
```

This pattern prevents Rollup from statically resolving server-only modules (postgres, node:crypto, etc.) during the client build. The string concatenation makes the import path opaque to Rollup's static analysis.

**If the build fails with postgres/perf_hooks errors**, a new server function was likely added with a static string import path. Fix by using the variable-based pattern above.

## Architecture Checks

- [ ] All `import type` in `-server.ts` files (no value imports from `server/tavern/`)
- [ ] All dynamic imports use variable paths (string concatenation)
- [ ] Route components only import from `-server.ts` and `-adapters.ts`, never directly from `server/`
- [ ] `-adapters.ts` files only have `import type` from server modules
- [ ] UI components in `components/tavern/` have zero server imports

## Test Coverage Summary

| Area | Tests | File |
|---|---|---|
| Defense/AC engine | 23 | `library/tests/engine/defenses.test.ts` |
| Attack engine | 17 | `library/tests/engine/attacks.test.ts` |
| Character computer | 10 | `library/tests/engine/character-computer.test.ts` |
| EmptyState component | 4 | `app/src/components/tavern/ui/EmptyState.test.tsx` |
| Full library suite | 558 | `pnpm -F @dnd/library test` |
| Full app suite | 74 | `pnpm -F @dnd/app test` |
