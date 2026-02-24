# Plan: Scaffold dnd-24-platform

## Context

The `dnd-24-platform` repo (at `/Users/austin/dev/dnd/dnd-24-platform/`) is a bare scaffold with two empty directories (`library/`, `app/`), SRD content in `content/srd-markdown/`, and docs. No code, no configs, no CLAUDE.md. We need to set up the full development environment so work on the TypeScript library (SRD/AA parsers, types, rules engine) can begin immediately.

All work happens inside `dnd-24-platform/` (existing git repo). The parent `dnd/` directory stays as a non-git workspace parent.

The project philosophy mirrors the kink project's META-PLAN: agents execute, CLAUDE.md is a short table of contents, mechanical enforcement over documentation, plans live in `docs/plans/active/`.

## What We're Creating

### Directory Structure (new files marked with `+`)

```
dnd-24-platform/
+ CLAUDE.md                          # ~100 lines, navigational hub
+ META-PLAN.md                       # Philosophy and conventions
+ package.json                       # Workspace root
+ pnpm-workspace.yaml                # packages: [library, app]
+ tsconfig.base.json                 # Shared strict TS config
+ .npmrc                             # pnpm settings
+ .husky/pre-commit                  # lint-staged gate
  .gitignore                         # Updated

  library/
+   package.json                     # @dnd/library
+   tsconfig.json                    # extends ../tsconfig.base.json
+   src/
+     index.ts                       # Public barrel export
+     types/
+       index.ts                     # Re-export all types
+       spell.ts                     # Spell, SpellSchool, SpellComponents
+       class.ts                     # Class, Subclass, ClassFeature
+       monster.ts                   # Monster, StatBlock
+       equipment.ts                 # Equipment, Weapon, Armor
+       magic-item.ts                # MagicItem
+       feat.ts                      # Feat
+       condition.ts                 # Condition, Rule
+       aa-ability.ts                # AAAbility, AAPrerequisite, tiers
+       effect.ts                    # Source, Effect (unified model)
+       character.ts                 # CharacterState, computed stats
+       campaign.ts                  # CampaignConfig, ProgressionMode
+     parsers/
+       index.ts
+       shared.ts                    # Remark AST helpers
+       spells.ts                    # Stub
+     engine/
+       index.ts                     # Stubs for character-computer, etc.
+   tests/
+     parsers/
+       spells.test.ts               # First real test: parse Acid Arrow
+     fixtures/
+       spell-sample.md              # Extracted spell entries for testing

  app/
+   package.json                     # @dnd/app (minimal TanStack Start shell)
+   tsconfig.json
+   app.config.ts
+   src/
+     routes/
+       __root.tsx
+       index.tsx
+     styles/
+       app.css                      # Tailwind v4 imports

  docs/
+   architecture.md                  # Library design, effect model, parsing
+   campaign-modes.md                # AA-only / Hybrid / Standard 5e rules
    REPO_LAYOUT.md                   # Updated
    5.2-pro-response.md              # Existing
    plans/active/                    # Copy of this plan goes here
    plans/completed/
```

## Key Files

### `CLAUDE.md` (~100 lines)

Navigational hub. Contains:
- 2-3 sentence project overview
- Workspace structure (`library/` = `@dnd/library`, `app/` = `@dnd/app`)
- Commands: `pnpm install`, `pnpm -F @dnd/library test`, `pnpm -F @dnd/app dev`, `pnpm check`, `pnpm lint`
- Conventions: strict TS, no `any`, named exports only, parsers are pure functions, effect model is the core abstraction
- Pointers to `META-PLAN.md`, `docs/architecture.md`, `docs/campaign-modes.md`
- **Plan rule**: "When creating a plan in Claude plan mode, copy the `~/.claude/plans/` plan file to `docs/plans/active/NNN-slug.md` before presenting for approval. Completed plans move to `docs/plans/completed/`."
- Pre-commit contract: lint-staged → typecheck
- Session hygiene: update docs/ when completing work

### `META-PLAN.md`

Adapted from kink's. Key differences from kink:
- Library-first architecture (all game logic in `@dnd/library`, zero React/DB deps)
- Postgres + Drizzle instead of DuckDB (CRUD app with mutable state)
- SRD markdown parsing instead of dataset importing
- Three progression modes as a core architectural concern

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

### Root `package.json`

- `"type": "module"`, `"packageManager": "pnpm@10.28.2"`
- Scripts: `check` (recursive tsc), `lint` (oxlint), `test` (recursive vitest), `prepare` (husky)
- devDeps: `husky`, `lint-staged`, `oxlint`, `typescript`
- lint-staged: `*.{ts,tsx}` → oxlint

### `library/package.json` (`@dnd/library`)

- Runtime deps: `unified`, `remark-parse`, `mdast-util-to-string` (markdown AST parsing)
- devDeps: `typescript`, `vitest`
- Scripts: `check` (tsc), `test` (vitest run), `test:watch` (vitest)
- Exports `./src/index.ts` directly (no build step needed for workspace consumption)

### Core Types

**`types/effect.ts`** - The most important type file. Defines:
- `Source` (where an effect comes from: class feature, AA purchase, item, etc.)
- `SourceKind` union: `"class-feature" | "aa-purchase" | "feat" | "equipment" | "magic-item" | ...`
- `Effect` discriminated union: `modifier`, `proficiency`, `resistance`, `grant-action`, `grant-resource`, `grant-spell-access`, `set-ac-formula`, `extra-attack`, `speed-bonus`
- This is what makes hybrid mode work — every source (class, AA, item) produces Effects through the same interface

**`types/spell.ts`** - Parsed from chapter 08. Fields: `name`, `level` (0 for cantrips), `school`, `classes[]`, `castingTime`, `ritual`, `range`, `components` (V/S/M), `concentration`, `duration`, `description`, `higherLevels`

**`types/aa-ability.ts`** - Parsed from AA markdowns. Fields: `name`, `expCost`, `prerequisites[]`, `description`, `repeatable`, `tiers[]` (for tiered abilities like Rage), `effects[]`, `category`, `treeName`

**`types/campaign.ts`** - `ProgressionMode`: `"aa-only" | "hybrid" | "standard"`. `LevelingMethod`: `"standard-xp" | "milestone" | "fixed-cost" | "aa-formula"`

### App Shell (minimal)

Just enough to validate the workspace: TanStack Start hello-world page with Tailwind. No Drizzle, no auth, no real routes yet. The app depends on `@dnd/library: "workspace:*"`.

## Design Decisions

1. **Why remark/unified for parsing**: SRD markdown has page-break comments, multi-line table cells with `<br>`, inline formatting in headers. Remark gives a proper AST. The alternative (regex) would need too many edge-case handlers. Cost: 3 small deps.

2. **Why SRD data stays on disk, not in DB**: SRD is static reference data. Parse at import time, export typed arrays. Postgres is for mutable state (campaigns, characters, XP transactions). AA data is the same — static reference.

3. **Why define the effect model now**: With three progression modes, a character's stats can come from class features + AA purchases + items + species + DM overrides. Defining `Source → Effect[]` types from day one constrains parsers to produce data the engine can consume. Implementation of the engine comes later.

4. **Why the app is minimal**: Library must be built first. App can't be built correctly without typed SRD data and the effect model. Drizzle schema, TipTap, auth, deployment are all separate future plans.

## Order of Operations

1. **Root config**: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.npmrc`, `.gitignore`
2. **CLAUDE.md + META-PLAN.md**: Project philosophy and navigation
3. **Library skeleton**: `package.json`, `tsconfig.json`, all type files, parser stubs, engine stubs, barrel exports
4. **First test**: `tests/parsers/spells.test.ts` with `tests/fixtures/spell-sample.md` containing Acid Arrow + Acid Splash (known format from chapter 08)
5. **App shell**: Minimal TanStack Start + Tailwind hello-world
6. **Enforcement**: `pnpm install`, `husky init`, `.husky/pre-commit`, verify `pnpm check` + `pnpm lint` + `pnpm test` all pass
7. **Docs**: `architecture.md`, `campaign-modes.md`, update `REPO_LAYOUT.md`
8. **Copy plan**: Copy this plan to `docs/plans/active/001-scaffold.md`

## What Is NOT In This Scaffold

- Drizzle schema / database (separate plan after types stabilize)
- TipTap / rich text editor (wiki/notes feature, later)
- Playwright / E2E tests (needs real app first)
- Deployment config (Railway/SST, later)
- Search infra — start with Postgres full-text search (tsvector/tsquery), add dedicated search engine only if insufficient
- Auth / password system (later)

## Verification

After scaffolding is complete:
1. `pnpm install` succeeds without errors
2. `pnpm check` passes (TypeScript type-check across both packages)
3. `pnpm lint` passes (oxlint)
4. `pnpm -F @dnd/library test` runs and the spell fixture test passes
5. `pnpm -F @dnd/app dev` starts the dev server and renders the hello-world page
6. `git commit` triggers husky pre-commit hook running lint-staged
7. `CLAUDE.md` exists and is under 100 lines
8. `docs/plans/active/001-scaffold.md` contains a copy of this plan
