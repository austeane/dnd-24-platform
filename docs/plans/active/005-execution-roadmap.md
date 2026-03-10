# Plan 005: Execution Roadmap

## Current State

This is the mechanically true starting point:

- `pnpm check` passes.
- `pnpm -F @dnd/library test` passes, but only one placeholder spell test is active.
- `pnpm -F @dnd/app build` passes.
- `app/` is a landing page.
- `library/` has type definitions and parser scaffolding, but no real data pipeline and no character engine.
- SRD source markdown is present under `content/srd-markdown/`.
- AA source material is present under `meta-resources/advanced-adventurers/`.

## Milestones

### M1. Canonical Content Pipeline

Build the compiler and file conventions that turn canonical markdown/YAML into generated TypeScript data for a base ruleset plus opt-in extensions.

Exit criteria:

- `content/canon/` exists with stable schemas and examples.
- Base SRD content and extension content have separate pack identities.
- `pnpm compile` validates and generates typed outputs.
- Runtime code no longer depends on raw SRD chapter markdown.
- A campaign can enable AA as a first-class extension without special-case runtime wiring.

### M2. Player-Critical Content Conversion

Convert the content needed to run and level player characters.

Order:

1. Base SRD player-critical content: creation tables, conditions, core rules, equipment, backgrounds
2. Base SRD spells, species, feats
3. Base SRD classes, subclasses, class features
4. AA extension content
5. Magic items that the campaign actually uses

Exit criteria:

- The generated dataset covers the content a hybrid player needs at the table.
- Counts and cross-reference checks pass.
- A player character can be expressed from canonical content alone.
- Enabled extension content merges cleanly with base content in lookup and character assembly.

### M3. Character Runtime

Implement the source ledger, effect resolution, prerequisite checks, and explainable character computation.

Exit criteria:

- The library can compute a hybrid character from stored sources.
- Derived values have explanations.
- XP banking, class-level spending, and AA purchases are enforced by code.
- The runtime merges enabled ruleset packs by configuration rather than by AA-specific branching.

### M4. Tabletop Player Surface

Build the player-facing character experience for session use.

Exit criteria:

- One page shows the numbers, actions, resources, spells, and conditions that matter during play.
- Linked rules open in-app.
- Rest and condition changes refresh the page without manual bookkeeping.

### M5. Guided Level-Up And Spend Flow

Build the leveling and XP-spend flow that replaces paper and external references.

Exit criteria:

- Players can preview, validate, and commit level-up or AA spend choices in-app.
- The UI explains what unlocked, what changed, and what is still blocked.

### M6. DM Communication Surface

Build the DM-to-player communication tools that replace side chats, external docs, and ad hoc reminders during play.

Exit criteria:

- DM can create player-facing updates, handouts, and rules reminders in-app.
- DM can mark content as DM-only, party-visible, character-visible, or revealed later.
- DM can pin a small set of current session items so players see what matters now.
- Player surfaces show current pinned and revealed communication without mixing it into hidden DM notes.

### M7. Campaign And DM Operations

Add the minimum persistence and control surface needed for real sessions.

Exit criteria:

- Campaign settings define progression mode and content sources.
- Campaign settings define which ruleset packs are enabled.
- DM can award XP, fix mistakes, trigger rests, and manage visibility.
- Characters persist across sessions.

### M8. Hardening And Secondary Content

Finish the parts that make the tool dependable over repeated use.

Exit criteria:

- Real-session test passes with the current campaign.
- Missing content and edge cases are closed.
- Secondary systems can be added without destabilizing the core loop.

Secondary systems:

- Monster content
- Deeper magic item coverage
- Broad wiki/lore tooling beyond the communication layer
- Presentation polish

## Order Rules

- Do not build deep UI before M1 and M3 exist.
- Do not convert secondary content while player-critical content is still incomplete.
- Do not let a broad wiki/CMS project delay the smaller DM communication surface.
- Do not add broad product modules if they do not move the "no sheet, no outside references" goal.

## Immediate Loop

The next tightening loop is short:

1. Finalize the ruleset-pack model, canonical schemas, and compile path.
2. Prove the pipeline on a small base spell batch and a small AA batch.
3. Convert player-critical content in batches with validators.
4. Build the first end-to-end hybrid character computation with AA enabled by campaign config.

Everything else depends on that.
