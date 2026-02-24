# Architecture

## Overview

The platform is split into two workspace packages:

- **`@dnd/library`** — Pure TypeScript. Parsers, types, and rules engine. Zero React/DB dependencies.
- **`@dnd/app`** — TanStack Start web application. Routing, persistence, UI. Depends on `@dnd/library`.

Game logic lives exclusively in the library. The app is a thin layer.

## Library Design

### Parsers

Parsers convert SRD markdown chapters (and AA markdown files) into typed TypeScript objects.

**Pipeline**: `markdown string → remark AST → walk/extract → typed data`

Each parser is a pure function: same input, same output. No side effects.

- `parsers/spells.ts` — Chapter 08 → `Spell[]`
- `parsers/classes.ts` — Chapter 04 → `Class[]`
- `parsers/monsters.ts` — Chapter 12 → `Monster[]`
- `parsers/equipment.ts` — Chapter 07 → `Equipment[]`
- `parsers/magic-items.ts` — Chapter 11 → `MagicItem[]`
- `parsers/feats.ts` — Chapter 06 → `Feat[]`
- `parsers/conditions.ts` — Chapter 09 → `Condition[]`
- `parsers/aa-abilities.ts` — AA markdowns → `AAAbility[]`

### SRD Markdown Format

Spells (chapter 08) follow a consistent pattern:
```
**Spell Name**
_Level N School (Class1, Class2)_      ← leveled spells
_School Cantrip (Class1, Class2)_      ← cantrips

**Casting Time:** ...
**Range:** ...
**Components:** V, S, M (material)
**Duration:** ...

Description text...
_**Using a Higher-Level Spell Slot.**_ ... (optional)
```

Other chapters have their own patterns. See `content/srd-markdown/chapters/` for source files.

### Effect Model

The unified effect model is the core architectural abstraction. It makes hybrid mode work.

Every character modifier is a **Source** that produces **Effects**:

```
Source (class feature, AA purchase, item, feat, etc.)
  → Effect[] (modifier, proficiency, resistance, grant-action, etc.)
    → CharacterState (computed AC, HP, skills, etc.)
```

All sources — class features, AA purchases, magic items, species traits, feats, DM overrides — produce Effects through the same `SourceWithEffects` interface. The engine resolves, deduplicates, and computes final character state.

Key types: `Source`, `Effect`, `SourceWithEffects` in `library/src/types/effect.ts`.

### Engine (planned)

- **CharacterComputer** — Takes `SourceWithEffects[]`, produces `CharacterState`
- **PrerequisiteEvaluator** — Checks if a character meets `AAPrerequisite[]`
- **EffectResolver** — Handles deduplication and stacking rules
- **Explanation** — Generates `ModifierExplanation` breakdowns ("Why is my AC 18?")

## Data Flow

### Static Reference Data (SRD, AA)

SRD and AA content is static. It's parsed at import time from markdown files on disk. No database involved.

```
content/srd-markdown/chapters/*.md → parsers → typed arrays → library exports
meta-resources/advanced-adventurers/ → aa-parser → AAAbility[] → library exports
```

### Mutable State (Postgres)

Campaigns, characters, XP transactions, wiki pages, homebrew content — all mutable state lives in Postgres via Drizzle ORM.

```
User action → App route → Drizzle → Postgres
                       → Library (compute) → Response
```

## Tech Stack Rationale

| Choice | Why |
|--------|-----|
| unified/remark | SRD markdown has page breaks, HTML in tables, nested formatting. Regex would break. |
| Postgres + Drizzle | CRUD app with campaigns, characters, transactions needs a real DB. |
| Postgres FTS | Start with built-in full-text search. Upgrade to Meilisearch only if needed. |
| TanStack Start | SSR + server functions, type-safe routing, same stack as kink project. |
| Tailwind v4 | Utility CSS, agent-friendly, no config file needed. |
