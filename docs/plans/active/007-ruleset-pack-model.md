# Plan 007: Ruleset Pack Model

## Goal

Treat the 5e SRD as the base ruleset and treat AA as the first extension pack.

The system should support future packs the same way: enable them per campaign and let their content become native to lookup, character building, and character computation.

## Model

- One base pack: `srd-5e-2024`
- Optional extension packs, starting with `advanced-adventurers`
- Campaign config enables one or more packs
- Runtime code works on the merged enabled set, not on hardcoded AA branches

## What A Pack Can Contribute

- Content entities: spells, feats, features, items, rules, progression data
- Effects and prerequisites
- References to base-pack entities
- Campaign options that are only valid when that pack is enabled

## Rules

1. The base pack must compile and stand on its own.
2. Extension packs do not edit base files in place. They add their own files and reference base IDs where needed.
3. Every generated entity and every applied source carries pack provenance.
4. Disabled packs disappear cleanly from compendium results, character options, and runtime computation.
5. Enabled packs are first-class. The UI should not treat AA as a sidecar document.

## AA-Specific Meaning

For your campaign, AA is not just extra reference content. It changes character progression and adds purchasable abilities that should appear in the same product surfaces as SRD classes, spells, feats, and rules.

That means:

- AA abilities belong in the same search and compendium layer as base content.
- AA purchases belong in the same character source ledger as class levels, feats, and items.
- AA prerequisite checks and effects belong in the same runtime pipeline as base rules.
- Campaign config should enable AA explicitly, and your personal campaign should default to AA enabled.

## Content Layout Constraint

The canonical content layout should make pack boundaries obvious.

Example shape:

- `content/canon/packs/srd-5e-2024/...`
- `content/canon/packs/advanced-adventurers/...`

Do not mix base and extension files in one flat directory.

## Runtime Constraint

The runtime should expose pack-aware queries and assembly:

- load enabled packs for a campaign
- merge generated entities by stable IDs
- resolve cross-pack references
- reject sources from disabled packs

## Exit Criteria

This model is in place when:

- Base SRD content can compile alone.
- AA content can compile as a separate pack.
- A campaign can enable AA and receive AA content and mechanics without code paths that are unique to AA.
- Adding a second extension pack would follow the same path.
