# dnd-24-platform

A campaign companion for D&D 5e (2024) that aims to replace paper character sheets and rulebook lookups at the table. Built for a real campaign, with real characters, grounded in the 2024 SRD with a pack system for layering on homebrew, third-party supplements, and alternate rule systems.

**Status: Active development.** The rules engine and character computation are functional. The web UI is being built out. This is a real tool for a real group, not a theoretical exercise.

## What this does

At its core, this platform knows the rules so your players don't have to memorize them.

You tell it what your character has (class, level, feats, species, equipment, AA purchases) and it computes everything derived: AC breakdown, attack bonuses, spell save DC, skill modifiers, available actions, resource pools. When you level up or buy an AA ability, it knows what you qualify for and what changes. When you take a short rest, it knows which resources recharge.

The goal is that a player can sit at the table with just this app open and play their character without ever reaching for a rulebook, a PDF, or a pencil.

## Three ways to play

The platform supports three progression modes, configured per campaign:

| | Standard 5e | AA Only | Hybrid |
|---|---|---|---|
| **Classes** | Yes | No | Yes |
| **XP as currency** | No | Yes | Yes |
| **Leveling** | XP thresholds or milestones | 20 XP = 1 level | 20 XP = 1 class level |
| **Spell access** | Class spell lists | Buy and learn any spell | Both |
| **AA ability purchases** | No | Yes | Yes |

**Standard 5e 2024** follows the PHB rules as written. Pick a class, follow its progression table, get spells from your class list.

**AA Only** throws out classes entirely. XP is currency. You spend it to buy abilities, HP, proficiencies, and spells from a universal catalog. Your level is just `XP earned / 20`, which sets your proficiency bonus.

**Hybrid** is what our campaign actually uses. You can take class levels (20 XP each) *and* buy AA abilities with leftover XP. A Fighter 3 / 40 XP spent on AA purchases is a valid character. The engine merges effects from both systems cleanly.

## Canonical source and content packs

The **SRD 5.2.1** (Systems Reference Document) is the canonical foundation -- the official, freely available 2024 rules published by Wizards of the Coast. The full SRD markdown is checked into the repo and parsed into typed data at build time.

On top of that, the platform has a **pack system** for adding homebrew rules, third-party supplements, or alternate progression systems as first-class content. Packs can define new abilities, spells, rules, and progression mechanics. They can override or extend SRD concepts with `derivedFrom` links. They're enabled or disabled per campaign, so each table gets exactly the rules it wants.

The first pack built on this system is [Advanced Adventurers](content/canon/packs/advanced-adventurers/), a classless XP-as-currency supplement that our campaign uses. But the architecture is designed so that any homebrew system -- a custom crafting ruleset, a different magic system, campaign-specific feats -- can be added the same way.

No rules are hardcoded as magic strings or ad-hoc conditionals. The SRD markdown is parsed through a `remark` AST pipeline into typed TypeScript objects (spells, classes, feats, equipment, conditions). Pack content follows the same pattern. All of it flows through a single compilation step that validates cross-references, enforces provenance metadata, and produces the canonical dataset the engine runs on.

## How the engine works

The architecture is built around one central idea: **the unified effect model**.

```
Source (class feature, AA purchase, item, feat, species trait, DM override...)
  -> Effect[] (stat modifier, proficiency grant, resistance, action grant, resource pool...)
    -> CharacterState (computed AC, HP, skills, spell slots, attack profiles, actions...)
```

Every character modifier -- whether it comes from a class feature, an AA ability, a magic item, a feat, or a species trait -- is a `Source` that produces `Effect[]`. The engine collects all effects, handles deduplication and stacking rules, and computes the final `CharacterState`.

This is what makes Hybrid mode possible without special cases everywhere. A Rogue's Sneak Attack and an AA-purchased "Precise Strike" both produce effects through the same interface. The engine doesn't care where they came from.

The character computer handles: ability score computation, AC breakdown (with formula selection for Unarmored Defense variants), attack profiles with weapon mastery, spell slot tables across all caster types, proficiency aggregation, condition effects, wild shape transformations, familiar lifecycle, and resource pool management with rest-based recovery.

## Content packs

Content is organized into **packs** -- modular bundles that can be enabled or disabled per campaign:

```
content/canon/packs/
  srd-5e-2024/           # Base 2024 rules (classes, spells, feats, equipment, etc.)
  advanced-adventurers/  # First extension: classless XP-as-currency abilities and spells
```

Each pack goes through the same compilation and validation pipeline as the SRD itself. The compiler enforces provenance metadata, validates cross-pack references, and catches broken links at build time -- not at the table. Adding a new pack means adding entity files to a new directory under `content/canon/packs/` and enabling it on your campaign.

## Architecture

```
dnd-24-platform/
  library/     @dnd/library -- Pure TypeScript. Parsers, types, rules engine.
                               Zero React or database dependencies.
  app/         @dnd/app     -- TanStack Start web app. Routing, persistence, UI.
                               Thin layer over the library.
  content/     SRD markdown chapters + canonical entity definitions
  data/        Mechanics coverage tracking, campaign intake
  docs/        Architecture docs and execution plans
  scripts/     Content compilation, reporting, data import
```

**The library owns all game logic.** It's pure TypeScript with no framework dependencies. You could use it to build a CLI character manager, a Discord bot, or a different web app -- the rules engine doesn't know or care about React or Postgres.

**The app is a thin layer.** It handles routing (TanStack Start with file-based routes), persistence (Postgres via Drizzle ORM), authentication, and the UI. When it needs to compute a character's stats, it calls the library.

### Data flow

Static reference data (SRD rules, spell lists, class features) is parsed from markdown at build time and compiled into TypeScript. No database involved.

Mutable state (campaigns, characters, XP transactions, equipment, DM communications) lives in Postgres. The schema tracks character sources as a ledger -- every ability has a provenance record of where it came from (class level, feat selection, AA purchase, DM override).

### Tech stack

| | |
|---|---|
| **Language** | TypeScript (strict mode, no `any`) |
| **Monorepo** | pnpm workspaces |
| **Web framework** | TanStack Start (SSR + server functions) |
| **Database** | Postgres + Drizzle ORM |
| **Styling** | Tailwind v4 with a custom tavern theme |
| **Markdown parsing** | unified / remark |
| **Testing** | Vitest |
| **Linting** | oxlint + husky pre-commit hooks |
| **Hosting** | Railway |

## What's working today

- **Rules engine**: Character state computation from sources and effects, including AC breakdown, attack profiles, spell slot calculation, proficiency aggregation, condition application, wild shape, and familiars
- **Content pipeline**: SRD markdown parsing, canonical entity compilation with validation, pack-aware entity lookup
- **Progression service**: XP transaction ledger, spend plans, prerequisite evaluation, choice state persistence, resource pool management with rest recovery
- **Database**: Full schema with migrations, seeded with real campaign characters
- **Web app**: Home page with campaign roster, character sheet with tabbed navigation (stats, spellbook, inventory, journal, compendium), tavern-themed design system
- **Mechanics coverage**: 68 of 111 tracked atomic mechanics at full implementation, 20 partial

## What's coming

- Completing the remaining mechanics (equipment effects on AC/damage, spell slot mutations, class feature spending like Bardic Inspiration and Sorcery Points, HP tracking)
- DM communication surface (reveals, handouts, session pins -- backend exists, needs UI)
- Level-up and AA purchase flows with prerequisite checking
- Full spellbook management (preparation, slot spending, ritual casting)
- Polish on the character sheet UI to reach the level where nobody misses their paper sheet

## Running locally

```bash
pnpm install
pnpm compile                    # Compile canonical content from SRD/AA sources
pnpm -F @dnd/library test       # Run library tests (engine, parsers, canon)
pnpm -F @dnd/app dev            # Start dev server on port 3001
```

Requires Node 20+, pnpm, and Postgres for the app (library tests run without a database).

## License

The SRD 5.2.1 content is used under the Creative Commons Attribution 4.0 International License as published by Wizards of the Coast. Third-party content packs (like Advanced Adventurers) are maintained separately. The platform code itself is not currently published under an open-source license.
