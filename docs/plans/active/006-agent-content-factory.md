# Plan 006: Agent Content Factory

## Goal

Use a fleet of agents to convert SRD and AA source material into canonical files without losing control of correctness.

## Source Of Truth

- Raw SRD chapter markdown and AA extracts are input material only.
- `content/canon/` becomes the maintained source of truth.
- Canonical content is organized by ruleset pack: base SRD content plus extension packs such as AA.
- Generated TypeScript data is compiled from `content/canon/`.
- App and library runtime code read generated data, not raw source markdown.

## Factory Loop

1. Lock the schema for one entity type.
2. Create 3 to 5 gold example files.
3. Build a batch manifest with one row per entity.
4. Give one agent one entity at a time.
5. Run compile and validation after every batch.
6. Spot-check a sample against the source text before merging.

## What Agents Need

Each agent task should include:

- The exact canonical schema
- Naming and ID rules
- One gold example close to the target entity
- The exact source excerpt to convert
- A short checklist for common failure modes

Do not ask agents to infer the whole system from a large architecture document.

## Validation Gates

Every batch must pass all of these:

- Frontmatter/schema validation
- Unique IDs and slugs
- No base/extension identity collisions
- Cross-reference resolution
- Required fields present and non-empty
- Generated output compiles
- Expected count for the batch matches the manifest

## Human Review Rule

Review by sampling, not by rereading everything.

For each batch:

- Check one straightforward entry
- Check one edge-case entry
- Check one entry that references another entity

If any of those fail, reject the batch and tighten the prompt or schema before continuing.

## Conversion Order

Convert in the order that helps the table first:

1. Base creation tables, conditions, rules, equipment, backgrounds
2. Base spells
3. Base species and feats
4. Base classes, subclasses, and class features
5. AA abilities and AA-only supporting content
6. Campaign-specific magic items
7. Broader magic item coverage
8. Monsters

Monsters are intentionally late. They matter for DM tooling, but they do not block the player goal.

## Effect Pass

Do not mix transcription and effect modeling on the first pass.

Pass 1:

- Convert content into canonical files with clean metadata and body text.

Pass 2:

- Add `effects` to the entity types that need them.
- Validate those effects against character-engine tests.

This keeps the early agent work narrow and easier to verify.

## Exit Criteria

This factory is working when:

- New entities can be added by agents without changing runtime code.
- A failed batch is caught by validation before it reaches the app.
- The generated dataset is complete enough to build the character engine against it.
- A new ruleset extension can be added as a pack instead of as a repo-wide rewrite.
