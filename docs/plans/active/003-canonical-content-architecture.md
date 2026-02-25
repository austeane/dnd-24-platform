# Plan 003: Canonical Content Architecture

> **Status**: Active — design review phase
> **Supersedes**: [Plan 002: SRD → TypeScript Library](./002-srd-library.md)
> **Goal**: Define the content model, file format, compile pipeline, and type system for converting SRD + AA source material into a typed, agent-maintainable content layer that powers the app.

---

## Table of Contents

1. [Context & Motivation](#1-context--motivation)
2. [Decision A: Content Granularity](#2-decision-a-content-granularity)
3. [Decision B: Where Effects Live](#3-decision-b-where-effects-live)
4. [Decision C: AA Content Integration](#4-decision-c-aa-content-integration)
5. [Decision D: Runtime Types vs. Canonical Types](#5-decision-d-runtime-types-vs-canonical-types)
6. [ID System Design](#6-id-system-design)
7. [Compile Pipeline Architecture](#7-compile-pipeline-architecture)
8. [Effect Model Refinements](#8-effect-model-refinements)
9. [Full Directory Structure](#9-full-directory-structure)
10. [Zod Schema Inventory](#10-zod-schema-inventory)
11. [Canonical YAML Examples](#11-canonical-yaml-examples)
12. [Progression Modes & Content Model Interaction](#12-progression-modes--content-model-interaction)
13. [Implementation Sequencing](#13-implementation-sequencing)
14. [Open Questions](#14-open-questions)

---

## 1. Context & Motivation

### Why not parse the SRD directly?

Plan 002 proposed building 9+ parsers to extract typed data directly from raw SRD markdown (~45K lines across 13 chapters). That approach has serious problems:

1. **Fragility**: The SRD markdown has OCR artifacts, inconsistent formatting across chapters, ghost table headers, Unicode issues, page-break noise, and dozens of per-chapter gotchas. Each parser needs ~200-500 lines of brittle heuristic code.

2. **Opacity**: When a parser produces wrong output, debugging means tracing through AST manipulation code. There's no human-readable intermediate representation to inspect.

3. **Non-extensible**: Adding AA content, homebrew, or errata means writing more parsers. The SRD parser code has no value beyond the initial conversion.

4. **Agent-unfriendly**: The parsing work can't be parallelized well — each parser needs deep context about chapter-specific formatting quirks. Agents can't work on individual spells or features independently.

### The canonical content approach

Instead of parsing the SRD at runtime, we:

1. **Convert once** — Transform SRD content into clean, per-entity markdown files with YAML frontmatter. This is a one-time task, parallelizable across a fleet of agents (one agent per spell, per class feature, etc.).

2. **Validate at compile time** — Zod schemas validate every frontmatter field. If an agent produces malformed content, the compiler catches it immediately.

3. **Compile to TypeScript** — A build step reads all canonical files, validates them, and emits typed arrays (`allSpells: Spell[]`, `allClasses: Class[]`, etc.) as generated TypeScript modules.

4. **Version in git** — The canonical files ARE the source of truth. Diffs are human-readable. Corrections are PRs.

### What this buys us

- **Inspectable content**: Every spell, feature, and monster is a standalone file you can read and validate.
- **Agent-parallel conversion**: 300+ agents can each convert one spell simultaneously.
- **Trivial corrections**: Fix a typo in `acid-arrow.md`, not in parser heuristic code.
- **AA integration by convention**: AA abilities use the same file format. The compiler doesn't care about the source.
- **Homebrew by the same path**: Users could eventually add `content/homebrew/spells/custom-fireball.md`.

---

## 2. Decision A: Content Granularity

**Question**: How do we break down content into files? One file per entity? One file per class? Monolithic per chapter?

### Option A1: One File Per Leaf Entity

Every independently referenceable game entity gets its own file.

```
content/canon/
  spells/acid-arrow.md
  spells/fireball.md
  classes/barbarian/
    _class.md                    # Class-level metadata
    features/rage.md
    features/extra-attack.md
    features/brutal-strike.md
    subclasses/berserker/
      _subclass.md
      features/frenzy.md
      features/mindless-rage.md
  feats/alert.md
  feats/great-weapon-master.md
  species/dragonborn/
    _species.md
    traits/breath-weapon.md
    traits/draconic-flight.md
  monsters/aboleth.md
  equipment/weapons/longsword.md
  equipment/armor/plate.md
  magic-items/bag-of-holding.md
```

**Pros**:
- Maximum agent parallelism (each file is an independent task)
- Clean diffs (one entity per commit)
- Natural unit for validation ("this file is valid or not")
- Granular enough for cross-referencing (e.g., AA Rage → `classes/barbarian/features/rage.md`)

**Cons**:
- Many files (~800-1000+): 339 spells + ~200 class features + ~60 subclass features + 18 feats + 257 magic items + 330 monsters + ...
- Class context is distributed across 20+ files per class
- Directory nesting for classes/subclasses is 4 levels deep
- Some entities are tiny (a class feature might be 3 lines of frontmatter + 2 lines of description)

### Option A2: One File Per Top-Level Entity

Each class is a single file. Each spell is a single file. Species are single files with traits inline.

```
content/canon/
  spells/acid-arrow.md
  spells/fireball.md
  classes/barbarian.md           # All features, subclasses inline
  classes/wizard.md
  feats/alert.md
  species/dragonborn.md          # All traits inline
  monsters/aboleth.md
  equipment/weapons.md           # All weapons in one file
  equipment/armor.md             # All armor in one file
  magic-items/bag-of-holding.md
```

**Pros**:
- Fewer files (~700)
- Class is self-contained (read one file, understand the whole class)
- Simpler directory structure

**Cons**:
- Class files are massive (barbarian.md would be ~300-500 lines of YAML)
- Can't parallelize class feature conversion — one agent per class
- Individual features can't be cross-referenced by file path
- Equipment monolith files are hard to review

### Option A3: Hybrid — Per-Entity for Large Collections, Grouped for Small Ones

Spells, monsters, and magic items (which are numerous and independent) get individual files. Classes use a directory-per-class with features as individual files. Equipment, which has a fixed small set, uses grouped files.

```
content/canon/
  spells/                        # 339 individual files
    acid-arrow.md
    fireball.md
  classes/                       # 12 directories
    barbarian/
      _class.md                  # Class-level: hit die, proficiencies, progression table
      features/                  # ~15-20 features per class
        rage.md
        extra-attack.md
      subclasses/
        berserker.md             # Subclass + its features in one file
        wild-heart.md
  feats/                         # 18 individual files
    alert.md
    great-weapon-master.md
  species/                       # 9 individual files (traits inline)
    dragonborn.md
    dwarf.md
  monsters/                      # 330 individual files
    aboleth.md
    goblin.md
  equipment/                     # Grouped files
    weapons.yaml                 # All weapons as YAML array (no markdown body needed)
    armor.yaml                   # All armor as YAML array
    gear.yaml                    # All adventuring gear
  magic-items/                   # 257 individual files
    bag-of-holding.md
    flame-tongue.md
  backgrounds/                   # 4 individual files
    acolyte.md
    criminal.md
  rules/                         # Grouped or individual
    conditions.yaml              # 15 conditions as array
    actions.yaml                 # 12 action rules
  creation/                      # Reference tables
    level-advancement.yaml
    ability-score-modifiers.yaml
```

**Pros**:
- Right granularity for each content type
- Classes are navigable (directory = class, files = features)
- Equipment/rules/creation tables use YAML directly (no markdown body needed for pure data)
- Agent parallelism where it matters most (spells, monsters, magic items, class features)

**Cons**:
- Mixed conventions (some .md, some .yaml, some directories, some flat files)
- Subclass features bundled into the subclass file rather than individual files (tradeoff: fewer files vs. less granularity)
- Still ~900+ files total

### Recommendation: Option A3 (Hybrid)

**Justification**: The content types genuinely differ in structure. Spells are independent entities with rich descriptions — they deserve individual files. Equipment is tabular data with no prose — YAML arrays are the natural format. Classes are hierarchical (class → features → subclasses → subclass features) — directories mirror that hierarchy. Forcing everything into one format creates unnecessary friction.

The mixed conventions concern is addressed by clear naming rules:
- `_class.md` / `_species.md` = directory index file
- `*.md` = entity with YAML frontmatter + markdown body
- `*.yaml` = pure structured data, no prose

---

## 3. Decision B: Where Effects Live

**Question**: The Effect model (`Source → Effect[] → CharacterState`) is the core abstraction. Where do effects get authored and stored?

### The separation of concerns

There are two kinds of data in the system:

1. **Content data** — What is Fireball? What is Rage? Fields, descriptions, rules text. This is directly derivable from the SRD. An agent reading the SRD can produce it.

2. **Mechanical data** — What `Effect[]` does Rage produce? This requires *interpreting* the description text and mapping it to the Effect discriminated union. It's a modeling decision, not a transcription.

Mixing these in one file means agents doing the initial SRD conversion must also model effects — dramatically increasing the error rate and review burden.

### Option B1: Effects in Content Frontmatter

Every entity file includes an `effects` field in its frontmatter.

```yaml
# classes/barbarian/features/rage.md
---
name: Rage
level: 1
effects:
  - type: resistance
    damageType: bludgeoning
    condition: "while raging"
  - type: resistance
    damageType: piercing
    condition: "while raging"
  - type: resistance
    damageType: slashing
    condition: "while raging"
  - type: modifier
    target: melee-damage
    value: 2  # scales with level — how to represent?
    condition: "while raging, using Strength"
  - type: grant-action
    action:
      name: Rage
      timing: bonus-action
      description: "Enter a rage..."
  - type: grant-resource
    resource:
      name: Rage
      maxUses: 2  # scales with level — how to represent?
      resetOn: long
---
Rage description text...
```

**Pros**:
- Single source of truth per entity
- No file-merging complexity in compiler
- Effects are co-located with the description they model

**Cons**:
- Agents must author effects during initial conversion (harder, more error-prone)
- Effects for scaling features (Rage damage, uses, Extra Attack count) need level-conditional logic that YAML doesn't naturally express
- Reviewing effects requires reading through potentially long frontmatter
- Changes to the Effect schema require updating hundreds of content files

### Option B2: Separate Effect Files

Effects live in a parallel directory structure, keyed by entity ID.

```
content/canon/classes/barbarian/features/rage.md          # Content only
content/effects/class-features/barbarian--rage.yaml        # Effects only
```

```yaml
# content/effects/class-features/barbarian--rage.yaml
entityId: class-feature:barbarian:rage
effects:
  level-1:
    - type: resistance
      damageType: bludgeoning
      condition: "while raging"
    # ...
  level-9:
    - type: modifier
      target: melee-damage
      value: 3  # upgraded from 2
      condition: "while raging, using Strength"
```

**Pros**:
- Content conversion and effect authoring are fully decoupled
- Content agents don't need to understand the Effect type system
- Effect files can be authored by specialized agents or humans in a separate pass
- Level-scaling is naturally keyed
- Effect schema changes only touch effect files

**Cons**:
- Two files per entity → harder to keep in sync
- Compiler must resolve references between content and effect files
- Need an ID system to link them (see Decision D / Section 6)
- More directories to navigate

### Option B3: Heuristic Extraction + Manual Overrides

No effects in content files. The compiler has heuristic extractors that derive effects from frontmatter fields (proficiencies → Effect[], resistance keywords in description → Effect[]). Manual override files exist for entities where heuristics fail.

```yaml
# content/effects/overrides/barbarian--rage.yaml
# Only needed because Rage is too complex for heuristic extraction
entityId: class-feature:barbarian:rage
effects:
  - type: resistance
    damageType: bludgeoning
    condition: "while raging"
  # ...
```

**Pros**:
- Minimal manual effect authoring — only for complex cases
- Heuristics handle the ~40-60% of effects that are mechanically deterministic
- Overrides are the exception, not the rule

**Cons**:
- Heuristic code is its own maintenance burden (and can produce wrong results silently)
- Hard to know which entities have heuristic effects vs. overrides
- The "40-60%" number is optimistic — many features have nuanced mechanics
- Testing requires validating heuristic output against known correct effects

### Recommendation: Option B1 (Effects in Frontmatter) with a Phased Approach

**Justification**: The appeal of B2/B3 is decoupling content conversion from effect authoring. But in practice:

1. **We need effects eventually.** Deferring them means doing the work twice — once to read the description, once to model the effects.
2. **Agents are good at structured extraction.** Given the Effect schema as context, an agent converting "Rage" from the SRD can produce both the description AND the effects in one pass. The error rate is manageable with Zod validation.
3. **Co-location aids review.** When reviewing `rage.md`, you see both what Rage does (description) and how we model it (effects). No cross-referencing.
4. **Scaling effects are solvable.** We introduce a `scaling` variant or `level-override` pattern in the frontmatter (see Section 8: Effect Model Refinements).

**Phased approach**:
- **Phase 1 (conversion)**: Content files are created with `effects: []` (empty). Validates content correctness first.
- **Phase 2 (effect population)**: A second wave of agents populates effects on entities that need them (class features, feats, magic items, species traits). Entities that don't need effects (spells, monsters, backgrounds, rules) skip this phase.
- **Phase 3 (validation)**: Spot-check tests verify known effects exist (e.g., "Rage MUST have resistance effects").

This gives us the decoupling benefit of B2 during the conversion process, while ending up with the co-located single-source-of-truth of B1.

---

## 4. Decision C: AA Content Integration

**Question**: The Advanced Adventurers system lets players purchase abilities (including abilities that mirror class features like Rage, Bardic Inspiration, Extra Attack) with XP. How do AA abilities fit into the canonical content model?

### The integration problem

AA abilities have a fundamental relationship with SRD content:

- **Mirrors**: `AA: Rage` and `Class Feature: Barbarian Rage` grant the same mechanical effects. The AA version is purchased with XP (16 exp) instead of gained at Barbarian level 1.
- **Originals**: Some AA abilities have no SRD equivalent (Ogre's Grip, Meat Shield, Runes of Anger). These are AA-only.
- **Modifications**: Some AA abilities modify SRD mechanics (e.g., AA spellcasting works differently — no preparation, any known spell can be cast).
- **Trees**: AA abilities form prerequisite trees (Rage → Persistent Rage, Mindless Rage, Frenzy...). Some tree branches correspond to subclass features, others are unique.

In Hybrid mode, a character might have Barbarian class levels (granting Rage via class feature) AND purchase additional AA abilities from the Rage tree. The Effect pipeline must handle both sources without double-counting.

### Option C1: Separate AA Definitions (Fully Independent)

AA abilities are their own entity type in their own directory, with their own frontmatter schema. Cross-references to SRD abilities are by name string.

```
content/canon/
  aa-abilities/
    rage.md
    extra-attack.md
    bardic-inspiration.md
    ogres-grip.md
    persistent-rage.md
```

```yaml
# content/canon/aa-abilities/rage.md
---
name: Rage
expCost: 16
category: defensive
prerequisites: []
repeatable: false
treeName: Rage Tree
srdEquivalent: "Barbarian: Rage"  # informal cross-ref
effects:
  - type: resistance
    damageType: bludgeoning
    condition: "while raging"
  # ... same effects as class feature version
---
```

**Pros**:
- Simplest model — AA abilities are just another content type
- No shared-schema complexity
- Clear separation: SRD content in `classes/`, AA content in `aa-abilities/`

**Cons**:
- Effect duplication: the same effects are authored twice (class feature Rage + AA Rage)
- No compile-time guarantee that mirror abilities produce the same effects
- When the Effect schema changes, mirror abilities must be updated in two places
- `srdEquivalent` is a string — no referential integrity

### Option C2: Shared Ability Pool (Unified Definitions)

Create a single "ability" entity type. Both class features and AA purchases reference abilities from the same pool. The ability defines what it does; the class/AA source defines how you get it.

```
content/canon/
  abilities/
    rage.md                       # The ability itself
    extra-attack.md
    bardic-inspiration.md
    ogres-grip.md                 # AA-only ability
  classes/barbarian/
    _class.md                     # references abilities/rage at level 1
  aa-abilities/
    _catalog.yaml                 # references abilities/rage at 16 exp
```

```yaml
# content/canon/abilities/rage.md
---
name: Rage
effects:
  - type: resistance
    damageType: bludgeoning
    condition: "while raging"
  # ...
---
Full description of Rage...
```

```yaml
# content/canon/classes/barbarian/_class.md (excerpt)
features:
  - level: 1
    ability: abilities/rage        # reference to shared ability
    classSpecific: true            # description may differ for class context
  - level: 5
    ability: abilities/extra-attack
```

```yaml
# content/canon/aa-abilities/_catalog.yaml (excerpt)
- ability: abilities/rage
  expCost: 16
  prerequisites: []
  treeName: Rage Tree
```

**Pros**:
- Single source of truth for each ability's effects
- No effect duplication
- Compile-time referential integrity (compiler checks that referenced abilities exist)
- When Rage's effects change, both class and AA sources pick it up automatically

**Cons**:
- High complexity: three entity types (ability, class-feature-binding, aa-purchase-binding) instead of two
- Many class features DON'T have AA equivalents — they'd still be "abilities" but only referenced by one source
- Some class features are genuinely different from their AA versions (e.g., class Rage might scale differently at higher Barbarian levels vs. AA tiered purchases)
- Introduces an abstraction (the shared "ability") that may not carry its weight for the ~70% of features that aren't mirrored

### Option C3: Asymmetric References (AA References Class Content)

Class features are the primary definitions. AA abilities that mirror class features reference them and declare "same effects, different acquisition path." AA-only abilities are self-contained.

```yaml
# content/canon/aa-abilities/rage.md
---
name: Rage
expCost: 16
category: defensive
prerequisites: []
treeName: Rage Tree
mirrorOf: class-feature:barbarian:rage    # typed reference
effectOverrides: []                        # empty = same effects as mirror
tiers:
  - level: 1
    expCost: 16
    description: "Base Rage"
  - level: 2
    expCost: 8
    description: "Improved Rage: damage bonus increases to +3"
    effectOverrides:
      - type: modifier
        target: melee-damage
        value: 3
        condition: "while raging, using Strength"
---
AA-specific description and flavor...
```

```yaml
# content/canon/aa-abilities/ogres-grip.md
---
name: Ogre's Grip
expCost: 8
category: offensive-combat
prerequisites:
  - type: ability-score
    value: "STR 16"
treeName: null
mirrorOf: null                             # AA-only, no class equivalent
effects:
  - type: unmodeled
    description: "Wield two-handed melee weapons in one hand"
---
```

**Pros**:
- Minimal duplication: mirror abilities inherit effects from the class feature
- AA-only abilities are self-contained (no phantom "shared ability" wrapper)
- `mirrorOf` provides compile-time referential integrity
- `effectOverrides` handles the cases where AA versions differ (e.g., different scaling)
- Matches the conceptual reality: AA abilities ARE "you can buy this class feature"

**Cons**:
- Asymmetric: class features don't know about their AA mirrors (one-way reference)
- The `mirrorOf` + `effectOverrides` merge logic adds compiler complexity
- Tiers (AA scaling) and class level scaling are different mechanisms for the same concept
- If a class feature is refactored/renamed, AA mirrors break (but the compiler catches this)

### Recommendation: Option C3 (Asymmetric References)

**Justification**: The conceptual model of AA is "you can buy class features à la carte." The `mirrorOf` pattern captures this directly. It avoids the over-abstraction of C2 (shared ability pool) while maintaining referential integrity that C1 lacks.

Key design decisions within C3:
- `mirrorOf` uses the entity ID system (see Section 6): `class-feature:barbarian:rage`
- When `mirrorOf` is set and `effectOverrides` is empty, the compiler copies effects from the referenced class feature
- When `effectOverrides` is non-empty, those effects REPLACE (not merge with) the mirrored effects
- AA-only abilities (`mirrorOf: null`) are fully self-contained with their own effects
- The compiler validates that all `mirrorOf` references resolve to existing class features
- The `tiers` array handles AA-specific scaling (separate from class level scaling)

### AA ability trees

AA ability trees (Rage Tree, Ki Tree, Sneak Attack Tree, etc.) are modeled as a `treeName` string field on each ability. The compiler groups abilities by tree for the UI. Prerequisites create the directed graph:

```yaml
# content/canon/aa-abilities/persistent-rage.md
---
name: Persistent Rage
expCost: 5
category: defensive
prerequisites:
  - type: ability
    value: "Rage"
treeName: Rage Tree
mirrorOf: class-feature:barbarian:persistent-rage
---
```

The compiler builds the tree structure at compile time by following `prerequisites` → `treeName` chains.

---

## 5. Decision D: Runtime Types vs. Canonical Types

**Question**: Should the Zod schemas for canonical content frontmatter be the SAME as the runtime TypeScript types the app uses, or should they be separate with a compile-time transformation?

### Option D1: Same Schema for Both

The canonical frontmatter Zod schema IS the runtime type. `Spell` in the app is exactly what's in the YAML.

```typescript
// library/src/schemas/spell.ts
export const SpellSchema = z.object({
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: SpellSchoolSchema,
  classes: z.array(z.string()).min(1),
  castingTime: z.string(),
  ritual: z.boolean(),
  range: z.string(),
  components: SpellComponentsSchema,
  duration: z.string(),
  concentration: z.boolean(),
  description: z.string(),
  higherLevels: z.string().optional(),
});

export type Spell = z.infer<typeof SpellSchema>;
```

**Pros**:
- Simplest model — one schema, one type
- No transformation step in compiler
- What you see in the file is what you get at runtime

**Cons**:
- Runtime types can't have computed fields (e.g., `id` derived from filename)
- Can't add runtime-only convenience fields (e.g., `slug`, `searchText`, `sourceFile`)
- Canonical files must include every field the runtime needs (no defaults, no computed values)
- Schema changes affect both file format and runtime API simultaneously

### Option D2: Separate Canonical + Runtime Schemas

The canonical schema defines what goes in files. The runtime schema adds computed/derived fields. The compiler transforms canonical → runtime.

```typescript
// library/src/schemas/canonical/spell.ts — what goes in the .md file
export const CanonicalSpellSchema = z.object({
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: SpellSchoolSchema,
  classes: z.array(z.string()).min(1),
  castingTime: z.string(),
  ritual: z.boolean().default(false),
  range: z.string(),
  components: SpellComponentsSchema,
  duration: z.string(),
  concentration: z.boolean().default(false),
  higherLevels: z.string().optional(),
});

// library/src/types/spell.ts — what the app uses
export interface Spell {
  id: string;                    // Computed: "spell:acid-arrow"
  name: string;
  level: number;
  school: SpellSchool;
  classes: string[];
  castingTime: string;
  ritual: boolean;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  description: string;           // From markdown body, not frontmatter
  higherLevels: string | undefined;
  slug: string;                  // Computed: "acid-arrow"
  source: "srd" | "aa" | "homebrew";  // Computed: from directory
}
```

**Pros**:
- Canonical files can use defaults (e.g., `ritual` defaults to `false` — most spells aren't rituals)
- Runtime types can have computed fields without burdening content authors
- Schema evolution: can change runtime types without changing file format (and vice versa)
- `description` is the markdown body (not a frontmatter field) — cleaner files
- Source tracking (`source: "srd"`) is derived from file location, not manually authored

**Cons**:
- Two schemas per entity type → more code
- Must maintain the transformation functions
- Possible drift between canonical and runtime schemas

### Option D3: Canonical Schema + Type Extension

One base schema shared between canonical and runtime, with runtime extending it.

```typescript
// Shared base
const SpellBaseSchema = z.object({
  name: z.string(),
  level: z.number().int().min(0).max(9),
  // ...
});

// Canonical: base + defaults + optional fields
const CanonicalSpellSchema = SpellBaseSchema.extend({
  ritual: z.boolean().default(false),
  concentration: z.boolean().default(false),
});

// Runtime: base + computed fields (not a Zod schema, just a TS type)
interface Spell extends z.infer<typeof SpellBaseSchema> {
  id: string;
  slug: string;
  description: string;
  source: ContentSource;
}
```

**Pros**:
- Shared fields are defined once
- Less code than fully separate schemas
- Clear inheritance relationship

**Cons**:
- Zod's `.extend()` / `.merge()` can get awkward with complex schemas
- The runtime type isn't Zod-validated (only the canonical half is)
- `extends` chains are harder to read than standalone definitions

### Recommendation: Option D2 (Separate Canonical + Runtime)

**Justification**: The canonical schema and runtime type serve different audiences:

- **Canonical schema**: Serves content authors (humans + agents). Should be minimal, use defaults, omit computed fields. Validated by Zod.
- **Runtime type**: Serves the app. Should have every field the app needs, including computed ones. Defined as TypeScript interfaces (with Zod validation at the canonical boundary, not at runtime).

The transformation is simple and mechanical — the compiler reads frontmatter (validated by canonical schema), adds computed fields (id, slug, source), extracts the markdown body (→ description), and emits the runtime object. This is ~10-20 lines of code per entity type.

The `description` field is particularly important: in canonical files, the description IS the markdown body (below the `---` frontmatter delimiter). This is the natural authoring format. The compiler extracts it and puts it on the runtime object.

---

## 6. ID System Design

Every entity needs a stable, unique identifier for:
- Cross-referencing (AA `mirrorOf`, prerequisites, spell references)
- Effect source tracking ("this resistance comes from Rage")
- URL routing in the app (`/compendium/spells/acid-arrow`)
- Deduplication in hybrid mode ("class Rage and AA Rage are the same ability")

### ID Format

```
{entity-type}:{scope}:{slug}
```

**Examples**:
```
spell:acid-arrow
spell:fireball
class:barbarian
class-feature:barbarian:rage
class-feature:barbarian:extra-attack
subclass:barbarian:berserker
subclass-feature:barbarian:berserker:frenzy
feat:alert
feat:great-weapon-master
species:dragonborn
species-trait:dragonborn:breath-weapon
monster:aboleth
magic-item:bag-of-holding
aa-ability:rage
aa-ability:ogres-grip
background:acolyte
condition:blinded
rule:opportunity-attack
weapon:longsword
armor:plate
gear:rope-silk
```

### ID Rules

1. **Derived from file path**: The ID is computed by the compiler from the file's location in the directory tree. Content authors never write IDs manually.
   - `content/canon/spells/acid-arrow.md` → `spell:acid-arrow`
   - `content/canon/classes/barbarian/features/rage.md` → `class-feature:barbarian:rage`
   - `content/canon/aa-abilities/rage.md` → `aa-ability:rage`

2. **Slug format**: Lowercase, hyphen-separated. Derived from filename without extension.
   - `Acid Arrow` → `acid-arrow`
   - `Ogre's Grip` → `ogres-grip`
   - `Great Weapon Master` → `great-weapon-master`

3. **Scoped by parent**: Class features include the class name. Subclass features include both class and subclass. This prevents collisions (multiple classes have "Extra Attack").

4. **Entity type prefix**: Makes IDs unambiguous across types. `spell:fireball` and `magic-item:fireball` (if one existed) would be distinct.

5. **References use full IDs**: The `mirrorOf` field on AA abilities uses the full ID: `class-feature:barbarian:rage`. The compiler validates all references resolve.

### ID → URL Mapping

The app maps IDs to URLs:
```
spell:acid-arrow           → /compendium/spells/acid-arrow
class:barbarian            → /compendium/classes/barbarian
class-feature:barbarian:rage → /compendium/classes/barbarian#rage
monster:aboleth             → /compendium/monsters/aboleth
aa-ability:rage            → /compendium/aa/rage
```

---

## 7. Compile Pipeline Architecture

### Overview

```
content/canon/**/*.{md,yaml}
        │
        ▼
   ┌─────────────┐
   │  1. Discover │  Glob for all content files
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  2. Parse    │  Read frontmatter (YAML) + body (markdown)
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  3. Validate │  Zod schemas per entity type
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  4. Transform│  Canonical → Runtime (add IDs, slugs, resolve refs)
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  5. Resolve  │  Cross-reference validation, AA mirror resolution
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  6. Emit     │  Write TypeScript modules to library/src/generated/
   └─────────────┘
```

### Step Details

**1. Discover**: Use `fast-glob` or Node's `fs.glob` to find all files matching `content/canon/**/*.{md,yaml}`. Determine entity type from directory path.

**2. Parse**: For `.md` files, extract YAML frontmatter (between `---` delimiters) and markdown body. For `.yaml` files, parse the full file as YAML. Use `gray-matter` for frontmatter extraction.

**3. Validate**: Each entity type has a corresponding Zod schema. Parse the frontmatter/YAML through the schema. Collect all validation errors before failing (don't stop at first error). Report errors with file paths for easy fixing.

**4. Transform**: Apply the canonical → runtime transformation:
- Compute `id` from file path
- Compute `slug` from filename
- Compute `source` from directory (`srd`, `aa`, `homebrew`)
- Extract `description` from markdown body
- Apply schema defaults
- For AA mirror abilities: resolve `mirrorOf` reference, copy effects if needed

**5. Resolve**: Cross-reference validation pass:
- All `mirrorOf` references point to existing entities
- All `prerequisites` reference existing abilities
- No duplicate IDs
- All `classes` arrays on spells reference valid class names
- All equipment references in starting equipment resolve

**6. Emit**: Generate TypeScript files in `library/src/generated/`:
```
library/src/generated/
  spells.ts           → export const allSpells: Spell[] = [...]
  classes.ts          → export const allClasses: Class[] = [...]
  feats.ts            → export const allFeats: Feat[] = [...]
  monsters.ts         → export const allMonsters: Monster[] = [...]
  magic-items.ts      → export const allMagicItems: MagicItem[] = [...]
  species.ts          → export const allSpecies: Species[] = [...]
  backgrounds.ts      → export const allBackgrounds: Background[] = [...]
  equipment.ts        → export const allWeapons: Weapon[], allArmor: Armor[], allGear: Gear[]
  aa-abilities.ts     → export const allAAAbilities: AAAbility[] = [...]
  conditions.ts       → export const allConditions: Condition[] = [...]
  rules.ts            → export const allRules: Rule[] = [...]
  creation.ts         → export const levelAdvancement, abilityScoreModifiers, ...
  index.ts            → barrel re-export
```

### Compiler Implementation

The compiler is a Node script: `scripts/compile-content.ts`

```typescript
// scripts/compile-content.ts (conceptual structure)
import { glob } from 'fast-glob';
import matter from 'gray-matter';
import { SpellCanonicalSchema, ClassCanonicalSchema, ... } from '../library/src/schemas/canonical';

async function compile() {
  // 1. Discover
  const files = await glob('content/canon/**/*.{md,yaml}');

  // 2-4. Parse, validate, transform (per entity type)
  const spells = await processEntityType('spells', files, SpellCanonicalSchema, transformSpell);
  const classes = await processEntityType('classes', files, ClassCanonicalSchema, transformClass);
  // ...

  // 5. Resolve cross-references
  resolveReferences({ spells, classes, feats, aaAbilities, ... });

  // 6. Emit
  emitTypeScript('library/src/generated/spells.ts', 'allSpells', 'Spell', spells);
  // ...
}
```

### When to compile

- **Development**: Run `pnpm compile` manually, or via watch mode
- **CI**: Run as part of the build step, before type-checking
- **Pre-commit**: Optional — ensures generated code stays in sync
- The generated files ARE committed to git (so the library works without running the compiler)

### Dependencies

New dependencies for the compiler:
- `gray-matter` — YAML frontmatter parsing
- `fast-glob` — File discovery
- `zod` — Already available for validation (move from devDependency to dependency)

---

## 8. Effect Model Refinements

The current Effect discriminated union (in `library/src/types/effect.ts`) needs several additions to properly model the full range of SRD and AA content.

### Current Effect Variants

```typescript
type Effect =
  | { type: "modifier" }           // Numeric bonus to a stat
  | { type: "proficiency" }        // Grants a proficiency
  | { type: "expertise" }          // Doubles proficiency bonus
  | { type: "resistance" }         // Resistance to damage type
  | { type: "immunity" }           // Immunity to damage type
  | { type: "grant-action" }       // Grants an action/ability
  | { type: "grant-resource" }     // Grants a limited-use resource
  | { type: "grant-spell-access" } // Access to a spell
  | { type: "set-ac-formula" }     // Alternative AC calculation
  | { type: "extra-attack" }       // Extra Attack
  | { type: "speed-bonus" }        // Speed increase
  | { type: "unmodeled" }          // Catch-all
```

### Proposed New Variants

**`condition-immunity`** — Immunity to a condition (distinct from damage immunity).
```typescript
{ type: "condition-immunity"; condition: string }
// e.g., "immune to the Frightened condition"
```

**`advantage`** — Advantage on a category of checks/saves.
```typescript
{ type: "advantage"; on: string; condition: string | undefined }
// e.g., advantage on saves vs. poison, advantage on Perception checks
```

**`damage-bonus`** — Extra damage on attacks (distinct from `modifier` which targets a stat).
```typescript
{ type: "damage-bonus"; dice: string; damageType: string; condition: string | undefined }
// e.g., Sneak Attack: "1d6", "necrotic", "once per turn when you have advantage"
```

**`hp-bonus`** — Flat HP increase per level (distinct from hit die).
```typescript
{ type: "hp-bonus"; perLevel: number }
// e.g., Tough feat: +2 HP per level, Draconic Resilience: +1 HP per sorcerer level
```

**`saving-throw-bonus`** — Bonus to saving throws (distinct from proficiency).
```typescript
{ type: "saving-throw-bonus"; ability: string | "all"; value: number; condition: string | undefined }
// e.g., Paladin Aura of Protection: +CHA to all saves within 10 feet
```

**`skill-bonus`** — Bonus to specific skill checks.
```typescript
{ type: "skill-bonus"; skill: string; value: number }
// e.g., some features give flat bonuses to specific skills
```

**`grant-feature`** — Grants access to another feature/ability by reference.
```typescript
{ type: "grant-feature"; featureId: string }
// e.g., a subclass feature that grants a specific fighting style
```

**`choice`** — Represents a choice the player must make.
```typescript
{ type: "choice"; options: ChoiceOption[]; count: number }
// e.g., "choose 2 skills from: Athletics, Acrobatics, ..."
```

Where:
```typescript
interface ChoiceOption {
  label: string;
  effects: Effect[];
}
```

### Scaling Effects

Some effects scale with level (Rage damage, Sneak Attack dice, resource uses). Two approaches:

**Approach 1**: Model scaling as an array of level-keyed values:
```yaml
effects:
  - type: modifier
    target: melee-damage
    condition: "while raging, using Strength"
    scaling:
      1: 2
      9: 3
      16: 4
```

**Approach 2**: Declare the feature at each level where it changes, with the new effect values:
```yaml
# classes/barbarian/features/rage.md
---
name: Rage
levelOverrides:
  1:
    effects:
      - type: modifier
        target: melee-damage
        value: 2
        condition: "while raging"
  9:
    effects:
      - type: modifier
        target: melee-damage
        value: 3
        condition: "while raging"
```

**Recommendation**: Approach 1 (scaling field on the effect itself). It's more compact and keeps the effect definition cohesive. The engine resolves `scaling` by finding the highest level key ≤ character level.

### Updated Effect Type

```typescript
export type Effect =
  // Existing
  | { type: "modifier"; target: ModifierTarget; value: number; condition: string | undefined; scaling: Record<number, number> | undefined }
  | { type: "proficiency"; category: ProficiencyCategory; value: string }
  | { type: "expertise"; skill: string }
  | { type: "resistance"; damageType: string; condition: string | undefined }
  | { type: "immunity"; damageType: string }
  | { type: "grant-action"; action: GrantedAction }
  | { type: "grant-resource"; resource: GrantedResource }
  | { type: "grant-spell-access"; spellName: string; alwaysPrepared: boolean; source: string }
  | { type: "set-ac-formula"; formula: ACFormula }
  | { type: "extra-attack"; count: number }
  | { type: "speed-bonus"; value: number; movementType: string }
  | { type: "unmodeled"; description: string }
  // New
  | { type: "condition-immunity"; condition: string }
  | { type: "advantage"; on: string; condition: string | undefined }
  | { type: "damage-bonus"; dice: string; damageType: string; condition: string | undefined; scaling: Record<number, string> | undefined }
  | { type: "hp-bonus"; perLevel: number }
  | { type: "saving-throw-bonus"; ability: string | "all"; value: number; condition: string | undefined }
  | { type: "skill-bonus"; skill: string; value: number }
  | { type: "grant-feature"; featureId: string }
  | { type: "choice"; options: ChoiceOption[]; count: number };
```

---

## 9. Full Directory Structure

```
dnd-24-platform/
├── content/
│   └── canon/                              # Canonical content (source of truth)
│       ├── spells/                         # ~339 files
│       │   ├── acid-arrow.md
│       │   ├── fireball.md
│       │   ├── cure-wounds.md
│       │   └── ...
│       ├── classes/                        # 12 directories
│       │   ├── barbarian/
│       │   │   ├── _class.md              # Hit die, proficiencies, progression table
│       │   │   ├── features/              # ~15-20 features
│       │   │   │   ├── rage.md
│       │   │   │   ├── danger-sense.md
│       │   │   │   ├── extra-attack.md
│       │   │   │   ├── brutal-strike.md
│       │   │   │   └── ...
│       │   │   └── subclasses/
│       │   │       ├── berserker.md       # Subclass meta + all subclass features
│       │   │       ├── wild-heart.md
│       │   │       └── world-tree.md
│       │   ├── wizard/
│       │   │   ├── _class.md
│       │   │   ├── features/
│       │   │   │   ├── arcane-recovery.md
│       │   │   │   ├── spell-mastery.md
│       │   │   │   └── ...
│       │   │   └── subclasses/
│       │   │       ├── abjurer.md
│       │   │       ├── evoker.md
│       │   │       └── illusionist.md
│       │   └── ...                        # 10 more classes
│       ├── feats/                         # ~18 files
│       │   ├── alert.md
│       │   ├── great-weapon-master.md
│       │   ├── savage-attacker.md
│       │   └── ...
│       ├── species/                       # 9 files (traits inline in frontmatter)
│       │   ├── dragonborn.md
│       │   ├── dwarf.md
│       │   ├── elf.md
│       │   ├── gnome.md
│       │   ├── goliath.md
│       │   ├── halfling.md
│       │   ├── human.md
│       │   ├── orc.md
│       │   └── tiefling.md
│       ├── monsters/                      # ~330 files
│       │   ├── aboleth.md
│       │   ├── goblin.md
│       │   ├── ancient-red-dragon.md
│       │   └── ...
│       ├── magic-items/                   # ~257 files
│       │   ├── bag-of-holding.md
│       │   ├── flame-tongue.md
│       │   ├── +1-weapon.md
│       │   └── ...
│       ├── equipment/                     # Pure data files
│       │   ├── weapons.yaml              # All weapons as array
│       │   ├── armor.yaml                # All armor as array
│       │   └── gear.yaml                 # Adventuring gear
│       ├── backgrounds/                   # ~4 files
│       │   ├── acolyte.md
│       │   ├── criminal.md
│       │   ├── sage.md
│       │   └── soldier.md
│       ├── aa-abilities/                  # AA content
│       │   ├── rage.md
│       │   ├── extra-attack.md
│       │   ├── bardic-inspiration.md
│       │   ├── ogres-grip.md
│       │   ├── ki.md
│       │   ├── sneak-attack.md
│       │   └── ...                       # ~60-80 abilities
│       ├── rules/                        # Reference data
│       │   ├── conditions.yaml           # 15 conditions
│       │   └── actions.yaml              # Action rules
│       └── creation/                     # Foundational tables
│           ├── level-advancement.yaml
│           ├── ability-score-modifiers.yaml
│           ├── point-buy-costs.yaml
│           └── multiclass-spell-slots.yaml
├── library/
│   └── src/
│       ├── schemas/                       # Zod schemas
│       │   ├── canonical/                 # Frontmatter validation
│       │   │   ├── spell.ts
│       │   │   ├── class.ts
│       │   │   ├── class-feature.ts
│       │   │   ├── subclass.ts
│       │   │   ├── feat.ts
│       │   │   ├── species.ts
│       │   │   ├── monster.ts
│       │   │   ├── magic-item.ts
│       │   │   ├── equipment.ts
│       │   │   ├── background.ts
│       │   │   ├── aa-ability.ts
│       │   │   ├── condition.ts
│       │   │   ├── rule.ts
│       │   │   ├── creation.ts
│       │   │   └── index.ts
│       │   └── shared.ts                 # Shared enum schemas (SpellSchool, DamageType, etc.)
│       ├── generated/                     # Compiler output (committed to git)
│       │   ├── spells.ts
│       │   ├── classes.ts
│       │   ├── feats.ts
│       │   ├── species.ts
│       │   ├── monsters.ts
│       │   ├── magic-items.ts
│       │   ├── equipment.ts
│       │   ├── backgrounds.ts
│       │   ├── aa-abilities.ts
│       │   ├── conditions.ts
│       │   ├── rules.ts
│       │   ├── creation.ts
│       │   └── index.ts
│       ├── types/                         # Runtime types (existing, updated)
│       │   ├── spell.ts
│       │   ├── effect.ts
│       │   ├── class.ts
│       │   ├── monster.ts
│       │   ├── equipment.ts
│       │   ├── magic-item.ts
│       │   ├── feat.ts
│       │   ├── condition.ts
│       │   ├── aa-ability.ts
│       │   ├── campaign.ts
│       │   ├── character.ts
│       │   ├── species.ts                 # NEW
│       │   ├── background.ts              # NEW
│       │   ├── creation.ts                # NEW
│       │   └── index.ts
│       ├── compiler/                      # Content compiler
│       │   ├── compile.ts                 # Main entry point
│       │   ├── discover.ts                # File discovery
│       │   ├── parse.ts                   # Frontmatter + body extraction
│       │   ├── transform.ts               # Canonical → Runtime transforms
│       │   ├── resolve.ts                 # Cross-reference validation
│       │   ├── emit.ts                    # TypeScript code generation
│       │   └── index.ts
│       ├── parsers/                       # DEPRECATED — kept for reference
│       │   ├── shared.ts
│       │   ├── spells.ts
│       │   └── index.ts
│       └── index.ts                       # Barrel: re-exports types + generated data
├── scripts/
│   └── compile-content.ts                 # CLI entry: runs compiler
└── docs/
    └── plans/
        └── active/
            └── 003-canonical-content-architecture.md  # This document
```

---

## 10. Zod Schema Inventory

### Shared Enums

```typescript
// library/src/schemas/shared.ts

const SpellSchoolSchema = z.enum([
  "Abjuration", "Conjuration", "Divination", "Enchantment",
  "Evocation", "Illusion", "Necromancy", "Transmutation",
]);

const DamageTypeSchema = z.enum([
  "acid", "bludgeoning", "cold", "fire", "force",
  "lightning", "necrotic", "piercing", "poison",
  "psychic", "radiant", "slashing", "thunder",
]);

const AbilitySchema = z.enum([
  "Strength", "Dexterity", "Constitution",
  "Intelligence", "Wisdom", "Charisma",
]);

const SkillSchema = z.enum([
  "Acrobatics", "Animal Handling", "Arcana", "Athletics",
  "Deception", "History", "Insight", "Intimidation",
  "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand",
  "Stealth", "Survival",
]);

const ItemRaritySchema = z.enum([
  "common", "uncommon", "rare", "very-rare", "legendary", "artifact",
]);

const ArmorCategorySchema = z.enum(["light", "medium", "heavy", "shield"]);
const WeaponCategorySchema = z.enum(["simple", "martial"]);
const WeaponRangeSchema = z.enum(["melee", "ranged"]);
const FeatCategorySchema = z.enum(["general", "origin", "fighting-style", "epic-boon"]);
const RestTypeSchema = z.enum(["short", "long"]);
const ActionTimingSchema = z.enum(["action", "bonus-action", "reaction", "free", "special"]);
const ContentSourceSchema = z.enum(["srd", "aa", "homebrew"]);
```

### Effect Schema (for frontmatter)

```typescript
// library/src/schemas/canonical/effect.ts

const ScalingSchema = z.record(z.coerce.number(), z.union([z.number(), z.string()]));

const EffectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("modifier"),
    target: ModifierTargetSchema,
    value: z.number(),
    condition: z.string().optional(),
    scaling: ScalingSchema.optional(),
  }),
  z.object({
    type: z.literal("proficiency"),
    category: ProficiencyCategorySchema,
    value: z.string(),
  }),
  z.object({
    type: z.literal("expertise"),
    skill: z.string(),
  }),
  z.object({
    type: z.literal("resistance"),
    damageType: z.string(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("immunity"),
    damageType: z.string(),
  }),
  z.object({
    type: z.literal("condition-immunity"),
    condition: z.string(),
  }),
  z.object({
    type: z.literal("advantage"),
    on: z.string(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("grant-action"),
    action: z.object({
      name: z.string(),
      timing: ActionTimingSchema,
      description: z.string(),
    }),
  }),
  z.object({
    type: z.literal("grant-resource"),
    resource: z.object({
      name: z.string(),
      maxUses: z.number().int().positive(),
      resetOn: RestTypeSchema,
      scaling: ScalingSchema.optional(),
    }),
  }),
  z.object({
    type: z.literal("grant-spell-access"),
    spellName: z.string(),
    alwaysPrepared: z.boolean().default(false),
    source: z.string(),
  }),
  z.object({
    type: z.literal("set-ac-formula"),
    formula: z.object({
      base: z.number(),
      abilityModifiers: z.array(z.string()),
      maxAC: z.number().optional(),
    }),
  }),
  z.object({
    type: z.literal("extra-attack"),
    count: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("speed-bonus"),
    value: z.number(),
    movementType: z.string().default("walk"),
  }),
  z.object({
    type: z.literal("damage-bonus"),
    dice: z.string(),
    damageType: z.string(),
    condition: z.string().optional(),
    scaling: z.record(z.coerce.number(), z.string()).optional(),
  }),
  z.object({
    type: z.literal("hp-bonus"),
    perLevel: z.number(),
  }),
  z.object({
    type: z.literal("saving-throw-bonus"),
    ability: z.string(),
    value: z.number(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("skill-bonus"),
    skill: z.string(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("grant-feature"),
    featureId: z.string(),
  }),
  z.object({
    type: z.literal("choice"),
    options: z.array(z.object({
      label: z.string(),
      effects: z.lazy(() => z.array(EffectSchema)),
    })),
    count: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("unmodeled"),
    description: z.string(),
  }),
]);
```

### Per-Entity Canonical Schemas

```typescript
// library/src/schemas/canonical/spell.ts
const CanonicalSpellSchema = z.object({
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: SpellSchoolSchema,
  classes: z.array(z.string()).min(1),
  castingTime: z.string(),
  ritual: z.boolean().default(false),
  range: z.string(),
  components: z.object({
    verbal: z.boolean().default(false),
    somatic: z.boolean().default(false),
    material: z.string().optional(),
  }),
  duration: z.string(),
  concentration: z.boolean().default(false),
  higherLevels: z.string().optional(),
});

// library/src/schemas/canonical/class.ts
const CanonicalClassSchema = z.object({
  name: z.string(),
  hitDie: z.number().int(),
  primaryAbility: z.string(),
  savingThrows: z.array(z.string()).length(2),
  skillChoices: z.object({
    options: z.array(z.string()),
    count: z.number().int().positive(),
  }),
  armorProficiencies: z.array(z.string()),
  weaponProficiencies: z.array(z.string()),
  startingEquipment: z.string(),
  spellcastingAbility: z.string().optional(),
  progression: z.array(z.object({
    level: z.number().int().min(1).max(20),
    proficiencyBonus: z.number().int().min(2).max(6),
    features: z.array(z.string()),
    extras: z.record(z.string(), z.string()).default({}),
  })).length(20),
});

// library/src/schemas/canonical/class-feature.ts
const CanonicalClassFeatureSchema = z.object({
  name: z.string(),
  level: z.number().int().min(1).max(20),
  effects: z.array(EffectSchema).default([]),
});
// Body (markdown below ---) = description

// library/src/schemas/canonical/subclass.ts
const CanonicalSubclassSchema = z.object({
  name: z.string(),
  className: z.string(),
  features: z.array(z.object({
    name: z.string(),
    level: z.number().int().min(1).max(20),
    effects: z.array(EffectSchema).default([]),
    description: z.string(),
  })),
});
// Body (markdown below ---) = subclass description

// library/src/schemas/canonical/feat.ts
const CanonicalFeatSchema = z.object({
  name: z.string(),
  category: FeatCategorySchema,
  prerequisite: z.string().optional(),
  repeatable: z.boolean().default(false),
  effects: z.array(EffectSchema).default([]),
});

// library/src/schemas/canonical/species.ts
const CanonicalSpeciesSchema = z.object({
  name: z.string(),
  creatureType: z.string().default("Humanoid"),
  size: z.union([z.string(), z.array(z.string())]),
  speed: z.number().int(),
  traits: z.array(z.object({
    name: z.string(),
    description: z.string(),
    effects: z.array(EffectSchema).default([]),
  })),
});

// library/src/schemas/canonical/background.ts
const CanonicalBackgroundSchema = z.object({
  name: z.string(),
  abilityScores: z.array(z.string()),
  feat: z.string(),
  skills: z.array(z.string()),
  toolProficiency: z.string(),
  equipment: z.string(),
});

// library/src/schemas/canonical/monster.ts
const CanonicalMonsterSchema = z.object({
  name: z.string(),
  size: z.string(),
  type: z.string(),
  alignment: z.string(),
  ac: z.number().int(),
  acDescription: z.string().optional(),
  hp: z.string(),
  hpAverage: z.number().int().optional(),
  speed: z.string(),
  abilityScores: z.object({
    strength: z.number().int(),
    dexterity: z.number().int(),
    constitution: z.number().int(),
    intelligence: z.number().int(),
    wisdom: z.number().int(),
    charisma: z.number().int(),
  }),
  savingThrows: z.record(z.string(), z.number()).default({}),
  skills: z.record(z.string(), z.number()).default({}),
  damageResistances: z.array(z.string()).default([]),
  damageImmunities: z.array(z.string()).default([]),
  conditionImmunities: z.array(z.string()).default([]),
  senses: z.string(),
  languages: z.string(),
  cr: z.string(),
  xp: z.number().int().optional(),
  proficiencyBonus: z.number().int().optional(),
  initiative: z.object({
    modifier: z.number().int(),
    score: z.number().int(),
  }).optional(),
  traits: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
  actions: z.array(z.object({ name: z.string(), description: z.string() })).min(1),
  bonusActions: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
  reactions: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
  legendaryActions: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
});

// library/src/schemas/canonical/magic-item.ts
const CanonicalMagicItemSchema = z.object({
  name: z.string(),
  rarity: ItemRaritySchema,
  category: z.string(),
  requiresAttunement: z.boolean().default(false),
  attunementRequirement: z.string().optional(),
  effects: z.array(EffectSchema).default([]),
});

// library/src/schemas/canonical/aa-ability.ts
const CanonicalAAAbilitySchema = z.object({
  name: z.string(),
  expCost: z.number().int().positive(),
  category: AAAbilityCategorySchema,
  prerequisites: z.array(z.object({
    type: AAPrerequisiteTypeSchema,
    value: z.string(),
  })).default([]),
  repeatable: z.boolean().default(false),
  treeName: z.string().optional(),
  mirrorOf: z.string().optional(),    // Entity ID reference
  tiers: z.array(z.object({
    expCost: z.number().int(),
    description: z.string(),
    effects: z.array(EffectSchema).default([]),
  })).optional(),
  effectOverrides: z.array(EffectSchema).optional(),
  effects: z.array(EffectSchema).default([]),
});

// library/src/schemas/canonical/equipment.ts
// Used in weapons.yaml / armor.yaml / gear.yaml (array schemas)
const WeaponEntrySchema = z.object({
  name: z.string(),
  category: WeaponCategorySchema,
  range: WeaponRangeSchema,
  damage: z.string(),
  damageType: z.string(),
  weight: z.string(),
  cost: z.string(),
  properties: z.array(z.string()).default([]),
  mastery: z.string().optional(),
});

const ArmorEntrySchema = z.object({
  name: z.string(),
  category: ArmorCategorySchema,
  ac: z.number().int(),
  dexBonus: z.boolean(),
  maxDexBonus: z.number().int().optional(),
  strengthRequirement: z.number().int().optional(),
  stealthDisadvantage: z.boolean().default(false),
  weight: z.string(),
  cost: z.string(),
});

const GearEntrySchema = z.object({
  name: z.string(),
  cost: z.string(),
  weight: z.string(),
  description: z.string().default(""),
});

// library/src/schemas/canonical/condition.ts
const ConditionEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  effects: z.array(z.string()),  // Mechanical bullet points
});

// library/src/schemas/canonical/creation.ts
const LevelAdvancementSchema = z.object({
  level: z.number().int().min(1).max(20),
  xp: z.number().int(),
  proficiencyBonus: z.number().int(),
});

const AbilityScoreModifierSchema = z.object({
  score: z.number().int().min(1).max(30),
  modifier: z.number().int(),
});
```

---

## 11. Canonical YAML Examples

### Spell Example: Fireball

```markdown
<!-- content/canon/spells/fireball.md -->
---
name: Fireball
level: 3
school: Evocation
classes: [Sorcerer, Wizard]
castingTime: Action
ritual: false
range: 150 feet
components:
  verbal: true
  somatic: true
  material: "a tiny ball of bat guano and sulfur"
duration: Instantaneous
concentration: false
higherLevels: "The damage increases by 1d6 for each spell slot level above 3."
---
A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw, taking 8d6 Fire damage on a failed save or half as much damage on a successful one.

Flammable objects in the area that aren't being worn or carried start burning.
```

### Spell Example: Cantrip (Fire Bolt)

```markdown
<!-- content/canon/spells/fire-bolt.md -->
---
name: Fire Bolt
level: 0
school: Evocation
classes: [Artificer, Sorcerer, Wizard]
castingTime: Action
range: 120 feet
components:
  verbal: true
  somatic: true
duration: Instantaneous
---
You hurl a mote of fire at a creature or an object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Fire damage. A flammable object hit by this spell starts burning if it isn't being worn or carried.

_**Cantrip Upgrade.**_ The damage increases by 1d10 when you reach levels 5 (2d10), 11 (3d10), and 17 (4d10).
```

### Spell Example: Ritual (Detect Magic)

```markdown
<!-- content/canon/spells/detect-magic.md -->
---
name: Detect Magic
level: 1
school: Divination
classes: [Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Wizard]
castingTime: Action or Ritual
ritual: true
range: Self (30-foot radius)
components:
  verbal: true
  somatic: true
duration: Concentration, up to 10 minutes
concentration: true
---
For the duration, you sense the presence of magic within 30 feet of yourself. If you sense magic in this way, you can take a Magic action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any.

The spell can penetrate most barriers but is blocked by 1 foot of stone, 1 inch of common metal, a thin sheet of lead, or 3 feet of wood or dirt.
```

### Class Index: Barbarian

```yaml
# content/canon/classes/barbarian/_class.md
---
name: Barbarian
hitDie: 12
primaryAbility: Strength
savingThrows: [Strength, Constitution]
skillChoices:
  options: [Animal Handling, Athletics, Intimidation, Nature, Perception, Survival]
  count: 2
armorProficiencies: [Light Armor, Medium Armor, Shields]
weaponProficiencies: [Simple Weapons, Martial Weapons]
startingEquipment: "Choose A or B: (A) Greataxe, 4 Javelins, Explorer's Pack, 15 GP; (B) 75 GP"
progression:
  - level: 1
    proficiencyBonus: 2
    features: [Rage, Unarmored Defense, Weapon Mastery]
    extras: { Rages: "2", Rage Damage: "+2" }
  - level: 2
    proficiencyBonus: 2
    features: [Danger Sense, Reckless Attack]
    extras: { Rages: "2", Rage Damage: "+2" }
  - level: 3
    proficiencyBonus: 2
    features: [Barbarian Subclass, Primal Knowledge]
    extras: { Rages: "3", Rage Damage: "+2" }
  - level: 4
    proficiencyBonus: 2
    features: [Ability Score Improvement]
    extras: { Rages: "3", Rage Damage: "+2" }
  - level: 5
    proficiencyBonus: 3
    features: [Extra Attack, Fast Movement]
    extras: { Rages: "3", Rage Damage: "+2" }
  # ... levels 6-20
  - level: 20
    proficiencyBonus: 6
    features: [Primal Champion]
    extras: { Rages: "Unlimited", Rage Damage: "+4" }
---
```

### Class Feature: Rage

```markdown
<!-- content/canon/classes/barbarian/features/rage.md -->
---
name: Rage
level: 1
effects:
  - type: grant-action
    action:
      name: Rage
      timing: bonus-action
      description: "Enter a rage that lasts for 1 minute"
  - type: resistance
    damageType: bludgeoning
    condition: "while raging"
  - type: resistance
    damageType: piercing
    condition: "while raging"
  - type: resistance
    damageType: slashing
    condition: "while raging"
  - type: modifier
    target: melee-damage
    value: 2
    condition: "while raging, using Strength"
    scaling:
      9: 3
      16: 4
  - type: advantage
    on: "Strength checks and Strength saving throws"
    condition: "while raging"
  - type: grant-resource
    resource:
      name: Rage
      maxUses: 2
      resetOn: long
      scaling:
        3: 3
        6: 4
        12: 5
        17: 6
        20: -1  # -1 = unlimited
---
You can enter a Rage as a Bonus Action if you aren't wearing Heavy Armor.

While raging, you gain the following benefits:

**Damage Resistance.** You have Resistance to Bludgeoning, Piercing, and Slashing damage.

**Rage Damage.** When you make an attack using Strength and deal damage, you gain a bonus to the damage equal to your Rage Damage shown in the Barbarian Features table.

**Strength Advantage.** You have Advantage on Strength checks and Strength saving throws.

The Rage lasts until the end of your next turn, and it ends early if you don Heavy Armor or have the Incapacitated condition. If your Rage is still active on your next turn, you can extend the Rage for another round by doing one of the following: make an attack roll, force a saving throw, or take a Bonus Action to extend your Rage.

You can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.
```

### Class Feature: Unarmored Defense

```markdown
<!-- content/canon/classes/barbarian/features/unarmored-defense.md -->
---
name: Unarmored Defense
level: 1
effects:
  - type: set-ac-formula
    formula:
      base: 10
      abilityModifiers: [dexterity, constitution]
---
While you aren't wearing any armor, your base Armor Class equals 10 plus your Dexterity and Constitution modifiers. You can use a Shield and still gain this benefit.
```

### Subclass: Berserker

```markdown
<!-- content/canon/classes/barbarian/subclasses/berserker.md -->
---
name: Path of the Berserker
className: Barbarian
features:
  - name: Frenzy
    level: 3
    description: "If you use Reckless Attack while your Rage is active, you deal extra damage..."
    effects:
      - type: damage-bonus
        dice: "1d6"
        damageType: same
        condition: "when using Reckless Attack while raging"
  - name: Mindless Rage
    level: 6
    description: "You have Immunity to the Charmed and Frightened conditions while your Rage is active..."
    effects:
      - type: condition-immunity
        condition: Charmed
      - type: condition-immunity
        condition: Frightened
  - name: Retaliation
    level: 10
    description: "When you take damage from a creature that is within 5 feet of you, you can take a Reaction to make one melee attack against that creature..."
    effects:
      - type: grant-action
        action:
          name: Retaliation
          timing: reaction
          description: "Make one melee attack against a creature within 5 feet that damaged you"
  - name: Intimidating Presence
    level: 14
    description: "As a Bonus Action, you can menace your foes..."
    effects:
      - type: grant-action
        action:
          name: Intimidating Presence
          timing: bonus-action
          description: "Force creatures within 30 feet to make a Wisdom save or be Frightened"
---
For some Barbarians, Rage is a means to an end — and that end is violence.
```

### Feat: Alert

```markdown
<!-- content/canon/feats/alert.md -->
---
name: Alert
category: origin
repeatable: false
effects:
  - type: modifier
    target: initiative
    value: -1  # placeholder — proficiency bonus; needs special handling
    condition: "add proficiency bonus to initiative"
  - type: unmodeled
    description: "Can't be surprised unless incapacitated"
  - type: unmodeled
    description: "Swap initiative with a willing ally at start of combat"
---
You are always on the lookout for danger. You gain the following benefits.

_**Initiative Proficiency.**_ When you roll Initiative, you can add your Proficiency Bonus to the roll.

_**Initiative Swap.**_ Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition.
```

### Species: Dragonborn

```markdown
<!-- content/canon/species/dragonborn.md -->
---
name: Dragonborn
creatureType: Humanoid
size: Medium
speed: 30
traits:
  - name: Draconic Ancestry
    description: "You are descended from a kind of dragon. Choose the type from the Draconic Ancestors table."
    effects:
      - type: resistance
        damageType: "varies (chosen ancestry)"
  - name: Breath Weapon
    description: "As a Magic action, you exhale destructive energy in an area. The shape, damage type, and saving throw depend on your Draconic Ancestry."
    effects:
      - type: grant-action
        action:
          name: Breath Weapon
          timing: action
          description: "Exhale destructive energy (shape and type determined by Draconic Ancestry)"
      - type: grant-resource
        resource:
          name: Breath Weapon
          maxUses: 1
          resetOn: long
  - name: Damage Resistance
    description: "You have Resistance to the damage type determined by your Draconic Ancestry."
    effects: []
  - name: Darkvision
    description: "You have Darkvision with a range of 60 feet."
    effects:
      - type: unmodeled
        description: "Darkvision 60 feet"
  - name: Draconic Flight
    description: "When you reach character level 5, you sprout spectral wings..."
    effects:
      - type: speed-bonus
        value: 0
        movementType: fly
---
The ancestors of Dragonborn hatched from the eggs of chromatic and metallic dragons.
```

### Monster: Goblin

```yaml
# content/canon/monsters/goblin.md
---
name: Goblin
size: Small
type: Humanoid (Goblinoid)
alignment: Typically Neutral Evil
ac: 15
acDescription: leather armor, shield
hp: "7 (2d6)"
hpAverage: 7
speed: "30 ft."
abilityScores:
  strength: 8
  dexterity: 14
  constitution: 10
  intelligence: 10
  wisdom: 8
  charisma: 8
skills: { Stealth: 6 }
senses: "Darkvision 60 ft., Passive Perception 9"
languages: "Common, Goblin"
cr: "1/4"
xp: 50
proficiencyBonus: 2
traits: []
actions:
  - name: Scimitar
    description: "_Melee Attack Roll:_ +4, reach 5 ft. _Hit:_ 5 (1d6 + 2) Slashing damage."
  - name: Shortbow
    description: "_Ranged Attack Roll:_ +4, range 80/320 ft. _Hit:_ 5 (1d6 + 2) Piercing damage."
bonusActions:
  - name: Nimble Escape
    description: "The goblin takes the Disengage or Hide action."
reactions: []
legendaryActions: []
---
```

### Magic Item: Flame Tongue

```markdown
<!-- content/canon/magic-items/flame-tongue.md -->
---
name: Flame Tongue
rarity: rare
category: "Weapon (Any Sword)"
requiresAttunement: true
effects:
  - type: damage-bonus
    dice: "2d6"
    damageType: fire
    condition: "while the blade is ignited"
  - type: unmodeled
    description: "Sheds bright light in 40-foot radius and dim light for additional 40 feet while ignited"
---
You can take a Bonus Action to cause fire to wreathe the blade of this magic sword. While the blade is ablaze, it deals an extra 2d6 Fire damage to any target it hits. The flames last until you take a Bonus Action to extinguish them or until you drop or sheathe the sword.
```

### Equipment: Weapons (YAML Array)

```yaml
# content/canon/equipment/weapons.yaml
- name: Club
  category: simple
  range: melee
  damage: "1d4"
  damageType: Bludgeoning
  weight: "2 lb."
  cost: "1 SP"
  properties: [Light]
  mastery: Slow

- name: Greataxe
  category: martial
  range: melee
  damage: "1d12"
  damageType: Slashing
  weight: "7 lb."
  cost: "30 GP"
  properties: [Heavy, Two-Handed]
  mastery: Cleave

- name: Longsword
  category: martial
  range: melee
  damage: "1d8"
  damageType: Slashing
  weight: "3 lb."
  cost: "15 GP"
  properties: ["Versatile (1d10)"]
  mastery: Sap

- name: Blowgun
  category: martial
  range: ranged
  damage: "1"
  damageType: Piercing
  weight: "1 lb."
  cost: "10 GP"
  properties: ["Ammunition (Range 25/100)", Loading]
  mastery: Vex

- name: Hand Crossbow
  category: martial
  range: ranged
  damage: "1d6"
  damageType: Piercing
  weight: "3 lb."
  cost: "75 GP"
  properties: ["Ammunition (Range 30/120)", Light, Loading]
  mastery: Vex
```

### AA Ability: Rage (Mirror)

```markdown
<!-- content/canon/aa-abilities/rage.md -->
---
name: Rage
expCost: 16
category: defensive
prerequisites: []
treeName: Rage Tree
mirrorOf: "class-feature:barbarian:rage"
tiers:
  - expCost: 16
    description: "Base Rage — grants resistance and +2 melee damage"
    effects: []
  - expCost: 8
    description: "Improved Rage — damage bonus increases to +3"
    effectOverrides:
      - type: modifier
        target: melee-damage
        value: 3
        condition: "while raging, using Strength"
  - expCost: 10
    description: "Greater Rage — damage bonus increases to +4"
    effectOverrides:
      - type: modifier
        target: melee-damage
        value: 4
        condition: "while raging, using Strength"
effects: []
---
You can enter a Rage as a Bonus Action. While raging, you gain Resistance to Bludgeoning, Piercing, and Slashing damage and a bonus to melee damage rolls using Strength.

This functions identically to the Barbarian class feature. Additional tiers improve the damage bonus.
```

### AA Ability: Ogre's Grip (AA-Only)

```markdown
<!-- content/canon/aa-abilities/ogres-grip.md -->
---
name: Ogre's Grip
expCost: 8
category: offensive-combat
prerequisites:
  - type: ability-score
    value: "STR 16"
treeName: null
mirrorOf: null
effects:
  - type: unmodeled
    description: "Wield two-handed melee weapons in one hand"
---
Your massive grip allows you to wield any two-handed melee weapon in one hand. This does not apply to ranged weapons or weapons with the Special property.
```

### AA Ability: Bardic Inspiration (Mirror + Different Scaling)

```markdown
<!-- content/canon/aa-abilities/bardic-inspiration.md -->
---
name: Bardic Inspiration
expCost: 8
category: general-utility
prerequisites: []
treeName: Bardic Inspiration Tree
mirrorOf: "class-feature:bard:bardic-inspiration"
tiers:
  - expCost: 8
    description: "Grant 1d6 Bardic Inspiration dice"
    effectOverrides:
      - type: grant-resource
        resource:
          name: Bardic Inspiration
          maxUses: 3
          resetOn: long
      - type: grant-action
        action:
          name: Bardic Inspiration
          timing: bonus-action
          description: "Grant one creature a 1d6 Bardic Inspiration die"
  - expCost: 6
    description: "Upgrade to 1d8"
    effectOverrides:
      - type: grant-action
        action:
          name: Bardic Inspiration
          timing: bonus-action
          description: "Grant one creature a 1d8 Bardic Inspiration die"
  - expCost: 8
    description: "Upgrade to 1d10"
    effectOverrides:
      - type: grant-action
        action:
          name: Bardic Inspiration
          timing: bonus-action
          description: "Grant one creature a 1d10 Bardic Inspiration die"
effects: []
---
You can inspire others through stirring words or music. As a Bonus Action, you choose one creature other than yourself within 60 feet who can hear you. That creature gains a Bardic Inspiration die.

In the AA system, Bardic Inspiration is purchased with XP and upgraded through tiers, rather than scaling with Bard class level.
```

### Background: Acolyte

```markdown
<!-- content/canon/backgrounds/acolyte.md -->
---
name: Acolyte
abilityScores: [Intelligence, Wisdom, Charisma]
feat: Magic Initiate (Cleric)
skills: [Insight, Religion]
toolProficiency: "Calligrapher's Supplies"
equipment: "Calligrapher's Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP"
---
You devoted yourself to service in a temple, either nestled in a town or secluded in a sacred grove. There you performed hallowed rites in honor of a god or pantheon.
```

### Conditions (YAML Array)

```yaml
# content/canon/rules/conditions.yaml
- name: Blinded
  description: "A blinded creature can't see and automatically fails any ability check that requires sight."
  effects:
    - "Can't see"
    - "Automatically fails ability checks requiring sight"
    - "Attack rolls against the creature have Advantage"
    - "The creature's attack rolls have Disadvantage"

- name: Charmed
  description: "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects."
  effects:
    - "Can't attack the charmer"
    - "Can't target the charmer with harmful abilities or effects"
    - "The charmer has Advantage on ability checks to interact socially with the creature"

- name: Frightened
  description: "A frightened creature has Disadvantage on ability checks and attack rolls while the source of its fear is within line of sight."
  effects:
    - "Disadvantage on ability checks while source of fear is visible"
    - "Disadvantage on attack rolls while source of fear is visible"
    - "Can't willingly move closer to the source of its fear"
```

### Level Advancement

```yaml
# content/canon/creation/level-advancement.yaml
- { level: 1,  xp: 0,      proficiencyBonus: 2 }
- { level: 2,  xp: 300,    proficiencyBonus: 2 }
- { level: 3,  xp: 900,    proficiencyBonus: 2 }
- { level: 4,  xp: 2700,   proficiencyBonus: 2 }
- { level: 5,  xp: 6500,   proficiencyBonus: 3 }
- { level: 6,  xp: 14000,  proficiencyBonus: 3 }
- { level: 7,  xp: 23000,  proficiencyBonus: 3 }
- { level: 8,  xp: 34000,  proficiencyBonus: 3 }
- { level: 9,  xp: 48000,  proficiencyBonus: 4 }
- { level: 10, xp: 64000,  proficiencyBonus: 4 }
- { level: 11, xp: 85000,  proficiencyBonus: 4 }
- { level: 12, xp: 100000, proficiencyBonus: 4 }
- { level: 13, xp: 120000, proficiencyBonus: 5 }
- { level: 14, xp: 140000, proficiencyBonus: 5 }
- { level: 15, xp: 165000, proficiencyBonus: 5 }
- { level: 16, xp: 195000, proficiencyBonus: 5 }
- { level: 17, xp: 225000, proficiencyBonus: 6 }
- { level: 18, xp: 265000, proficiencyBonus: 6 }
- { level: 19, xp: 305000, proficiencyBonus: 6 }
- { level: 20, xp: 355000, proficiencyBonus: 6 }
```

---

## 12. Progression Modes & Content Model Interaction

The three progression modes (`standard`, `aa-only`, `hybrid`) interact with the content model at several points.

### Which content is available per mode?

| Content Type | Standard | AA Only | Hybrid |
|---|---|---|---|
| Classes (SRD) | Yes | No | Yes |
| Class Features | Yes | No | Yes |
| Subclasses | Yes | No | Yes |
| AA Abilities | No | Yes | Yes |
| Spells | Yes | Yes | Yes |
| Feats | Yes | Yes* | Yes |
| Species | Yes | Yes | Yes |
| Backgrounds | Yes | Yes | Yes |
| Equipment | Yes | Yes | Yes |
| Magic Items | Yes | Yes | Yes |
| Monsters | Yes | Yes | Yes |

*AA Only uses feats as starting options but doesn't have the class-level ASI mechanism.

### How the compiler handles progression modes

The compiler itself is mode-agnostic. It compiles ALL content (SRD + AA) into the generated TypeScript. The progression mode filtering happens at the **app layer**:

```typescript
// App-layer filtering (NOT in the compiler)
function getAvailableSources(mode: ProgressionMode): ContentFilter {
  switch (mode) {
    case "standard":
      return { classes: true, aaAbilities: false };
    case "aa-only":
      return { classes: false, aaAbilities: true };
    case "hybrid":
      return { classes: true, aaAbilities: true };
  }
}
```

### Hybrid mode: the deduplication challenge

In Hybrid mode, a character might have:
- Barbarian level 1 (granting Rage via class feature)
- AA purchase: Persistent Rage (which has `mirrorOf: class-feature:barbarian:persistent-rage`)

The Effect engine must:
1. Recognize that `class-feature:barbarian:rage` and `aa-ability:rage` produce the same effects
2. Not double-count them if a character somehow has both sources
3. Allow AA upgrades (tiers) to override class feature scaling

The ID system enables this: both sources reference the same underlying ability via `mirrorOf`. The engine can check for duplicates by comparing `mirrorOf` references.

### Saving throws in AA Only mode

In Standard/Hybrid, saving throw proficiencies come from class features. In AA Only:
- Your two highest ability scores become save proficiencies
- This is a **computed rule**, not a content-authored effect
- The engine handles this based on `ProgressionMode`, not content files

### Spellcasting differences

| Aspect | Standard | AA Only | Hybrid |
|---|---|---|---|
| Casting stat | Class-determined | Player choice (INT/WIS/CHA) | Class + player choice |
| Spell preparation | Class rules (Cleric prepares, Sorcerer knows) | No preparation | Mixed by source |
| Spell slots | Class progression table | Purchased individually | Separate pools (TBD) |
| Learning spells | Class spell list | Any spell, 1 exp each | Both |

The AA spellcasting model is fundamentally different from class spellcasting. The content model handles this by:
- SRD spells have `classes: [...]` to indicate which class spell lists include them
- In AA mode, `classes` is ignored — all spells are available for purchase
- AA spell slots are tracked separately from class spell slots (or merged — this is an open question)

### Level calculation

| Mode | Level Calculation |
|---|---|
| Standard | XP thresholds from Level Advancement table, or DM milestone |
| AA Only | Total XP earned ÷ 20 = level (level determines proficiency bonus) |
| Hybrid | Class levels + (remaining XP ÷ 20 for AA "level" component) — TBD |

---

## 13. Implementation Sequencing

### Phase 0: Infrastructure (prerequisite for everything)

1. Add `zod`, `gray-matter`, `fast-glob` to library dependencies
2. Create `library/src/schemas/shared.ts` with enum schemas
3. Create `library/src/schemas/canonical/` with all canonical schemas
4. Create `library/src/compiler/` with the compile pipeline
5. Create `scripts/compile-content.ts` CLI
6. Create `content/canon/` directory structure (empty)
7. Add `pnpm compile` script to root package.json
8. Verify: empty compile runs successfully, generates empty arrays

### Phase 1: Proof of Concept (one entity type end-to-end)

1. Create 5 spell files manually in `content/canon/spells/`
2. Run compiler, verify generated `library/src/generated/spells.ts` is correct
3. Verify the app can import and use the generated data
4. Write validation tests for the 5 spells
5. This proves the pipeline works before scaling to hundreds of files

### Phase 2: Content Conversion — Pure Data Types

Convert entity types that are purely tabular (no effects needed):

1. **Equipment** (`weapons.yaml`, `armor.yaml`, `gear.yaml`) — directly transcribe from SRD tables
2. **Creation tables** (`level-advancement.yaml`, etc.) — small, simple
3. **Conditions** (`conditions.yaml`) — 15 entries
4. **Backgrounds** (4 files) — simple structured data
5. **Rules** — action rules, glossary terms

These can be done by a single agent or human quickly. ~100 entities total.

### Phase 3: Content Conversion — Entity Files (Agent Fleet)

Convert entity types that need individual markdown files:

1. **Spells** (~339 files) — Highly parallelizable. Each agent reads one spell from the SRD chapter, produces one `.md` file. Give agents the canonical schema + 3 examples.
2. **Monsters** (~330 files) — Same approach. Each agent reads one stat block.
3. **Magic Items** (~257 files) — Same approach. Some items have variants that need special handling.
4. **Feats** (~18 files) — Small enough for one agent.
5. **Species** (9 files) — Small enough for one agent. Traits inline.

Run validation after each batch: `pnpm compile` must succeed.

### Phase 4: Content Conversion — Classes

Classes are the most complex. Sequence:

1. **Class index files** (`_class.md` × 12) — One agent per class. Transcribe core traits and progression table.
2. **Class features** (~200 files) — Per-class batches. Each agent converts all features for one class.
3. **Subclasses** (~36 files) — Per-class. Subclass features inline.
4. Validation: 12 classes × 20 levels × all features named in progression table → features directory should have matching files.

### Phase 5: AA Content Conversion

1. **AA abilities** (~60-80 files) — Read from `meta-resources/advanced-adventurers/`, create canonical files.
2. Set `mirrorOf` references on mirror abilities.
3. Validation: all `mirrorOf` references resolve to existing class features.

### Phase 6: Effect Population

Second pass over all content files that need effects:

1. **Class features** — Agents read the description, produce `effects: [...]` in the frontmatter.
2. **Feats** — Same.
3. **Magic items** — Same.
4. **Species traits** — Same.
5. **AA abilities** — Mirror abilities inherit effects; AA-only abilities get their own.

### Phase 7: Validation & Integration

1. Count validation (all expected entities exist)
2. Spot-check validation (known values verified)
3. Completeness validation (no empty required fields)
4. Effect validation (known effects exist on known features)
5. Cross-reference validation (all references resolve)
6. Full type-check: `pnpm check`
7. Full test suite: `pnpm -F @dnd/library test`

---

## 14. Open Questions

These are decisions that benefit from external review. Each is tagged with the decision it relates to.

### Q1: Should equipment use YAML arrays or individual files? (Decision A)

The hybrid approach (A3) puts all weapons in `weapons.yaml`. But this means you can't add a homebrew weapon as a standalone file — you'd have to edit the YAML array. Should equipment follow the same individual-file pattern as spells?

**Tradeoffs**: Individual files for 37 weapons = 37 tiny files (3-5 lines of YAML each, no markdown body). YAML array = compact but monolithic. A middle ground: individual YAML files (not .md, since no description body) in a directory.

### Q2: How should multi-rarity magic items be handled? (Decision A)

Items like "Weapon +1/+2/+3" have multiple rarity variants. Options:
- **One file with variants**: `weapon-plus.md` with a `variants` array in frontmatter
- **Separate files**: `weapon-+1.md`, `weapon-+2.md`, `weapon-+3.md` (each is a complete item)
- **Template + expansion**: One template file that the compiler expands into N items

### Q3: How do AA tiers interact with the `mirrorOf` effect inheritance? (Decisions B, C)

When an AA ability mirrors a class feature and has tiers, what does each tier mean for effects?
- Tier 1: inherit all effects from the mirrored class feature?
- Tier 2+: replace ALL effects with `effectOverrides`, or merge with inherited effects?
- What if the class feature has `scaling` (e.g., Rage damage: +2/+3/+4) — how do AA tiers map to the scaling levels?

### Q4: Should the `choice` effect support references, or only inline effects? (Decision B)

Example: "Choose 2 skills from Athletics, Acrobatics, ..." — the options are proficiency effects. But "Choose a Fighting Style" has options that are complex multi-effect bundles. Should choices reference other entities by ID?

```yaml
# Option A: Inline effects
effects:
  - type: choice
    count: 2
    options:
      - label: Athletics
        effects: [{ type: proficiency, category: skill, value: Athletics }]
      - label: Acrobatics
        effects: [{ type: proficiency, category: skill, value: Acrobatics }]

# Option B: References
effects:
  - type: choice
    count: 1
    optionRefs:
      - feat:fighting-style-archery
      - feat:fighting-style-defense
      - feat:fighting-style-dueling
```

### Q5: How should Warlock spellcasting be modeled? (Decision D)

Warlock's Pact Magic works differently from other spellcasters (all slots at max level, fewer slots, recover on short rest). Should this be:
- A special `spellcastingType: "pact-magic"` field on the class
- Modeled entirely through effects (`grant-resource` with short rest)
- A separate interface (`PactMagicProgression` vs `SpellcastingProgression`)

### Q6: Should the compiler generate one file per entity type or one barrel? (Pipeline)

Current plan: one file per type (`generated/spells.ts`, `generated/classes.ts`, etc.). Alternative: one big `generated/all-content.ts`. The per-file approach is better for tree-shaking but creates more files. Since the generated files are committed to git, large diffs on regeneration could be noisy.

### Q7: How should subclass spell lists be represented? (Decision A)

Some subclasses grant extra spells (e.g., Land Druid gets terrain-specific spell lists). These spells are already in `content/canon/spells/`. Should the subclass file:
- Reference spells by ID: `grantedSpells: ["spell:entangle", "spell:spike-growth"]`
- Reference by name: `grantedSpells: ["Entangle", "Spike Growth"]`
- Use effect: `effects: [{ type: "grant-spell-access", spellName: "Entangle", ... }]`

### Q8: Should the Effect union be open or closed? (Decision B)

The current Effect type is a closed discriminated union — every variant is hardcoded. Should we support:
- `{ type: "custom", key: string, value: unknown }` for homebrew/unforeseen effects
- Or keep it closed and use `{ type: "unmodeled", description: string }` as the escape hatch

### Q9: How to handle content that doesn't need effects at all? (Decision B)

Spells, monsters, backgrounds, conditions, and rules don't have effects in the current model. Should:
- Their schemas simply not include an `effects` field
- They include `effects: z.array(EffectSchema).default([])` for uniformity
- Use a `HasEffects` mixin interface that only some schemas extend

### Q10: Generated file format — arrays or maps? (Pipeline)

Should generated files export arrays (`allSpells: Spell[]`) or indexed maps (`spellsById: Record<string, Spell>`)? Maps enable O(1) lookup by ID. Arrays are simpler. The compiler could emit both:

```typescript
export const allSpells: Spell[] = [...];
export const spellsById: Record<string, Spell> = Object.fromEntries(allSpells.map(s => [s.id, s]));
export const spellsBySlug: Record<string, Spell> = Object.fromEntries(allSpells.map(s => [s.slug, s]));
```

---

## Appendix A: Entity Type Summary

| Entity Type | Count | File Format | Has Effects | Notes |
|---|---|---|---|---|
| Spell | ~339 | Individual .md | No | Largest collection |
| Class | 12 | Directory (_class.md) | No (on class itself) | Features in subdirectory |
| Class Feature | ~200 | Individual .md | Yes | Core effect producer |
| Subclass | ~36 | Individual .md | No (on subclass itself) | Features inline |
| Subclass Feature | ~100 | Inline in subclass .md | Yes | Part of subclass file |
| Feat | ~18 | Individual .md | Yes | 4 categories |
| Species | 9 | Individual .md | No (on species itself) | Traits in frontmatter |
| Species Trait | ~50 | Inline in species .md | Yes | Part of species file |
| Monster | ~330 | Individual .md | No | Second largest collection |
| Magic Item | ~257 | Individual .md | Yes | Third largest collection |
| Weapon | ~37 | YAML array | No | Pure data |
| Armor | ~14 | YAML array | No | Pure data |
| Gear | ~50+ | YAML array | No | Pure data |
| Background | ~4 | Individual .md | No | Simple structured data |
| AA Ability | ~60-80 | Individual .md | Yes | Mirrors + originals |
| Condition | 15 | YAML array | No | Bullet-point effects |
| Rule | ~116 | YAML array | No | Glossary entries |
| Level Advancement | 20 | YAML array | No | Reference table |
| Ability Score Modifiers | 30 | YAML array | No | Reference table |

**Total files**: ~1,050-1,100 content files + ~15 YAML data files

## Appendix B: Decision Summary

| Decision | Recommendation | Key Justification |
|---|---|---|
| A: Content Granularity | Hybrid (A3) | Right granularity per type; .md for prose entities, .yaml for pure data |
| B: Where Effects Live | In frontmatter (B1), phased | Co-location aids review; phased approach decouples content vs. effect authoring |
| C: AA Integration | Asymmetric references (C3) | `mirrorOf` captures the "buy class features" concept directly |
| D: Runtime vs. Canonical Types | Separate schemas (D2) | Canonical files use defaults, runtime adds computed fields |

## Appendix C: Dependency Changes

### New Dependencies (library)
- `zod` — Schema validation (move to production dependency)
- `gray-matter` — YAML frontmatter parsing
- `fast-glob` — File discovery for compiler

### Kept Dependencies
- `unified`, `remark-parse`, `mdast-util-to-string` — Still useful for markdown body processing in compiler

### Removed Dependencies (eventually)
- Raw SRD parsers in `library/src/parsers/` become unnecessary once all content is in canonical format. Keep for reference during conversion, then deprecate.
