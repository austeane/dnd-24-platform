# Plan 002: SRD → TypeScript Library

> **Status**: Superseded by [Plan 003: Canonical Content Architecture](./003-canonical-content-architecture.md)
>
> Plan 003 replaces the direct SRD parsing approach with a canonical content format (markdown + YAML frontmatter + compile pipeline). The SRD content will be converted into per-entity files by agents rather than parsed at runtime. See Plan 003 for the full design.

## Context

The `@dnd/library` package has complete type definitions (~350 LOC) and stub parsers, but no actual parsing implementation. The SRD 5.2.1 markdown (13 chapters, ~45K lines) sits in `content/srd-markdown/chapters/` ready to be transformed into typed data.

**Goal**: Build a complete parsing + data pipeline so the library exports ready-to-use typed arrays (`allSpells`, `allClasses`, etc.) that power the app's compendium, character builder, and leveling system. Design for LLM-assisted development: TDD contracts, one-parser-per-agent scoping, and a verification layer.

**Non-goals**: Live combat/VTT calculations. AA parsing (separate plan, but interfaces designed to accommodate it). Database schema.

**Reference**: Detailed per-chapter format analysis in `content/srd-markdown/chapter-summaries/`.

---

## SRD Chapter Analysis Summary

Per-chapter summaries live in `content/srd-markdown/chapter-summaries/`. Key findings:

| Ch | Content | Entries | Complexity | Priority | Parser |
|----|---------|---------|------------|----------|--------|
| 01 | Legal/TOC | ~250 | Low | **Skip** | — |
| 02 | Playing the Game | ~50 | Medium | Important | `rules.ts` (partial) |
| 03 | Character Creation | ~235 | Medium | **Important** | `creation.ts` |
| 04 | Classes | ~1,200 | **High** | **Critical** | `classes.ts` |
| 05 | Origins | ~13 | Medium | **Critical** | `origins.ts` |
| 06 | Feats | ~18 | Medium | **Critical** | `feats.ts` |
| 07 | Equipment | ~257 | **High** | **Critical** | `equipment.ts` |
| 08 | Spells | ~320 | **High** | **Critical** | `spells.ts` |
| 09 | Rules Glossary | ~131 | Medium | **Critical** | `rules.ts` |
| 10 | Gameplay Toolbox | ~50 | Medium | Nice-to-have | `toolbox.ts` |
| 11 | Magic Items | ~257 | **High** | **Critical** | `magic-items.ts` |
| 12 | Monsters | ~234 | **High** | **Critical** | `monsters.ts` |
| 13 | Animals | ~96 | Medium | Important | `monsters.ts` (shared) |

### Universal Noise Patterns (every parser must handle)

These appear in ALL chapters and must be stripped in a preprocessing pass:

1. **Page break markers**: `## Page NN` H2 headings + `<!-- source_txt: ... -->` HTML comments
2. **Page footer lines**: `**NN** System Reference Document 5.2.1` as bold paragraphs
3. **Ghost table headers**: Duplicate bold text lines above every pipe table (OCR artifact) — e.g., `**Level** **Bonus** **Class Features**` followed by the real `| Level | Bonus | ... |` table
4. **`<br>` HTML tags**: Inside table cells for multi-line values
5. **Unicode artifacts**: En-dash (U+2013) in ranges, minus sign (U+2212) in ability modifiers, tab characters in ability score cells

### Per-Parser Critical Gotchas (from chapter summaries)

**Spells (ch08)**: Two header formats (leveled: `_Level N School (Classes)_`, cantrip: `_School Cantrip (Classes)_`). ~10-15 spells have class lists wrapping across two italic lines. Ritual tag is inside casting time field ("Action or Ritual"). 4 spells contain embedded stat blocks with `### **Name**` headings. Upgrade sections: `_**Using a Higher-Level Spell Slot.**_` vs `_**Cantrip Upgrade.**_`.

**Classes (ch04)**: Feature headings are inline bold `**Level N: Feature Name**`, NOT markdown headings. 12 different progression table column shapes (Barbarian has 4 extras, Bard has 12, Warlock uses unique Slot Level column). Subclass heading format varies across 3 different patterns. Same-named features at different levels exist (Barbarian "Improved Brutal Strike" at 13 and 17). Ghost header rows above every progression table.

**Equipment (ch07)**: Italic category-header rows embedded INSIDE data tables (`_Simple Melee Weapons_`). Properties column needs parenthesis-aware comma splitting (e.g., `Thrown (Range 20/60), Versatile (1d8)`). Blowgun has non-dice damage `1 Piercing`. Lance has conditional Two-Handed. Adventuring Gear table split across multiple page boundaries. ~19 distinct data types.

**Monsters (ch12+13)**: Ability score table is 2-row × 11-column with 3 abilities per row, Unicode minus signs, tab characters, and stray `MOD SAVE MOD SAVE MOD SAVE` artifact lines in ~224/234 entries. Section delimiters (Traits, Actions, Bonus Actions, Reactions, Legendary Actions) are bare unformatted plaintext, not headings. ~27 monsters have lair-scaled values in CR, Legendary Resistance, and Legendary Actions. Ch13 has 2 stray ch12 entries at top of file.

**Magic Items (ch11)**: A-Z catalog starts at line ~564 after rules preamble. ~20 items have multi-line category metadata wrapping across italic lines. Multi-rarity items encode variants inline: `_Weapon (Any), Uncommon (+1), Rare (+2), Very Rare (+3)_`. 7 "Rarity Varies" items use two different sub-patterns (table vs inline bullets). 52 embedded tables with ghost headers. 163 named sub-properties using `_**PropertyName.**_`.

**Rules Glossary (ch09)**: All entries are bold paragraphs, not headings. Conditions tagged with `[Condition]`. Two sub-entry styles coexist: `_**Label.**_` (bold-italic) and `**Label.**` (bold-only). Multi-column list artifacts (bare words, no bullet markers). Abbreviations table split across two pages with unrelated content between halves. Damage Types table cleaved by page break with duplicated header.

**Origins (ch05)**: Backgrounds are highly regular (5 bold-label fields each). Species have free-form trait prose with `_**TraitName.**_` pattern, nested sub-option lists (Giant Ancestry, Gnomish Lineage), and embedded tables (Draconic Ancestors, Elven Lineages). Human and Tiefling have compound Size ("Small or Medium").

**Character Creation (ch03)**: Contains foundational math tables: Level Advancement (XP thresholds), Ability Score Modifiers (-5 to +10), Point Buy costs, Multiclass Spell Slots. Dual-column tables where each row = two logical records. Em-dash `—` means 0 in spell slot table.

---

## Phase 1: Shared Utilities + Infrastructure

### 1A. Extend `library/src/parsers/shared.ts`

Add utilities needed by multiple parsers. The universal noise patterns documented above mean a **preprocessing pass** is critical — every parser needs clean AST input.

```
preprocessMarkdown(markdown: string): string
  — Strip all noise BEFORE parsing to AST: remove "## Page NN" lines,
    HTML comments, page footer lines, ghost table header lines.
    This is a string-level pass that simplifies everything downstream.

filterPageNoise(nodes: Content[]): Content[]
  — AST-level backup: remove any remaining page marker headings,
    HTML comment nodes, and page-number paragraphs from node arrays.

parseMarkdownTable(node: Table): Record<string, string>[]
  — Convert a remark Table node into array of row objects keyed by header.
    Handle <br> tags in cells, strip italic category rows.

extractBoldField(nodes: Content[], fieldName: string): string | undefined
  — From a sequence of nodes, find "**Field Name:** value" patterns.
    Handle the common SRD metadata pattern (spells, origins).

splitByBoldParagraph(nodes: Content[]): Array<{name: string, children: Content[]}>
  — Split node list into sections where each starts with a bold-only
    paragraph. Used for spells, feats, magic items, rules, conditions.

nodesToMarkdown(nodes: Content[]): string
  — Serialize AST nodes back to markdown (for description fields).
    New dep: mdast-util-to-markdown.

splitBySection(nodes: Content[], markers: string[]): Record<string, Content[]>
  — Split nodes by bare plaintext section markers like "Traits", "Actions",
    "Bonus Actions", "Reactions", "Legendary Actions". Returns a map.

joinWrappedItalicLines(nodes: Content[]): Content[]
  — Concatenate consecutive italic-only paragraphs into single nodes.
    Fixes the ~10-15 spells and ~20 magic items with wrapped metadata.

normalizeUnicode(text: string): string
  — Replace U+2212 (minus) with ASCII hyphen, U+2013 (en-dash) with
    hyphen, normalize tabs to spaces. Used across all parsers.
```

### 1B. New dependency

Add `mdast-util-to-markdown` to `library/package.json` for `nodesToMarkdown`.

### 1C. Data export layer: `library/src/data/`

Create a data module that runs parsers against in-repo markdown and exports typed arrays:

```
library/src/data/
  index.ts          — barrel: re-exports all parsed data
  spells.ts         — import ch08 markdown, export allSpells: Spell[]
  classes.ts        — import ch04, export allClasses: Class[]
  equipment.ts      — import ch07, export allWeapons, allArmor, allGear
  feats.ts          — import ch06, export allFeats: Feat[]
  magic-items.ts    — import ch11, export allMagicItems: MagicItem[]
  monsters.ts       — import ch12+ch13, export allMonsters: Monster[]
  origins.ts        — import ch05, export allSpecies, allBackgrounds
  rules.ts          — import ch09, export allRules, allConditions
  creation.ts       — import ch03, export levelAdvancement, abilityScoreModifiers, etc.
```

Each file reads markdown via `fs.readFileSync` at module level (Node-only; the app imports the parsed data, not the parser). The `library/src/index.ts` barrel re-exports `data/index.ts`.

**Import strategy**: Use Node `fs` to read from `content/srd-markdown/chapters/` relative to the library root. This keeps the library self-contained within the monorepo.

### 1D. Type adjustments

Based on chapter summary analysis, these types need changes:

**Modifications to existing types**:
- **`Monster`**: Add `initiative: { modifier: number; score: number }`, `proficiencyBonus: number`, `bonusActions: MonsterAction[]` (currently missing from type).
- **`Weapon`**: Add `mastery: string` field — SRD weapons table has a Mastery column (Slow, Nick, Vex, etc.).

**New types needed**:
- **`Species`**: `{ name, creatureType, size: string | string[], speed, traits: SpeciesTrait[] }` — size can be compound ("Small or Medium").
- **`SpeciesTrait`**: `{ name, description, effects: Effect[] }` — for individual species traits like Breath Weapon, Darkvision.
- **`Background`**: `{ name, abilityScores: string[], feat: string, skills: string[], toolProficiency: string, equipment: string }`.
- **`LevelAdvancement`**: `{ level, xp, proficiencyBonus }` — from ch03 table.
- **`AbilityScoreModifier`**: `{ score, modifier }` — from ch03 table.

### 1E. Fixture + test infrastructure

Create `tests/fixtures/` with representative markdown snippets. Each fixture should contain 2-3 entries covering the edge cases identified in chapter summaries.

```
tests/fixtures/
  spell-sample.md         — exists; expand to 5+ spells (cantrip, leveled, ritual, multi-line classes, table in description)
  class-barbarian.md      — Barbarian: traits table, progression, 4+ features incl. Rage detail, subclass
  class-wizard.md         — Wizard: spellcasting class to test spell slot columns + cantrips
  weapons-sample.md       — 5+ weapons (simple melee, martial ranged, blowgun non-dice, lance conditional, versatile)
  armor-sample.md         — one per category (light/medium/heavy/shield) with AC parsing edge cases
  feat-sample.md          — 3+ feats (origin simple, general with prereq, fighting style, one with Repeatable)
  magic-item-sample.md    — 4+ items (simple, attunement, multi-rarity +1/+2/+3, Rarity Varies with table)
  monster-sample.md       — 3 monsters (simple beast, medium CR, legendary actions + lair)
  species-sample.md       — 2 species (Dragonborn with tables, Dwarf simpler)
  background-sample.md    — 2 backgrounds (Acolyte, Criminal)
  rules-sample.md         — 5+ entries (2 conditions with [Condition] tag, 2 rules, 1 action with [Action] tag)
  creation-tables.md      — Level Advancement + Ability Score Modifiers + Point Buy tables from ch03
```

---

## Phase 2: Parser Implementations (TDD)

Each parser follows the same pattern:
1. Write fixture markdown (small, representative snippet from SRD)
2. Write expected output as typed objects in the test file
3. Implement parser to make tests pass
4. Run against full chapter as integration test (count + spot-check)

### Parser execution order (dependencies →)

```
shared utilities → spells → feats → equipment → origins → creation-tables → classes → magic-items → rules → monsters
```

Rationale: Spells have the most consistent per-entry format. Classes are deferred because they're most complex and benefit from patterns established in feats/origins. Monsters last because they have the most irregular formatting.

### 2A. `parseSpells(markdown: string): Spell[]`
**File**: `library/src/parsers/spells.ts`
**Source**: chapter 08 (~9,274 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/08-spells.md`
**Strategy**:
- Preprocess markdown (strip noise), parse to AST
- Split by `splitByBoldParagraph` on spell name headers
- Join wrapped italic lines, then parse italic subheading for level/school/classes
  - Leveled: `_Level N School (Class1, Class2)_`
  - Cantrip: `_School Cantrip (Class1, Class2)_`
- Extract `**Casting Time:**`, `**Range:**`, `**Components:**`, `**Duration:**` via `extractBoldField`
- Parse components string: V/S/M detection + material text in parentheses
- Detect `concentration` from "Concentration" in duration, `ritual` from "or Ritual" in casting time
- Remaining nodes = description; split off `_**Using a Higher-Level Spell Slot.**_` / `_**Cantrip Upgrade.**_`
- Skip the 4 embedded stat blocks within spell bodies (Animate Objects, etc.) — don't let them create false spell entries

**Expected counts**: ~320 spells
**Key edge cases**: Multi-line class lists (~15 spells), spells with tables, ritual tag in casting time, reaction casting time spanning multiple lines

### 2B. `parseFeats(markdown: string): Feat[]`
**File**: `library/src/parsers/feats.ts`
**Source**: chapter 06 (~238 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/06-feats.md`
**Strategy**:
- Preprocess, parse, split by bold paragraph
- Skip "Parts of a Feat" intro section (uses same `_**Label.**_` pattern as feat benefits)
- Parse italic line for category + prerequisite:
  - `_Origin Feat_` → category: "origin", no prereq
  - `_General Feat (Prerequisite: Level 4+)_` → category: "general", prereq: "Level 4+"
  - `_Fighting Style Feat (Prerequisite: Fighting Style Feature)_`
  - `_Epic Boon Feat (Prerequisite: Level 19+)_`
- Handle wrapped prerequisite lines (join consecutive italic paragraphs)
- Detect `_**Repeatable.**_` in body
- Remaining = description

**Expected counts**: ~18 feats across 4 categories

### 2C. `parseWeapons` + `parseArmor` + `parseGear`
**File**: `library/src/parsers/equipment.ts`
**Source**: chapter 07 (~1,666 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/07-equipment.md`
**Strategy**:
- **Weapons**: Find weapons table in AST. Use `parseMarkdownTable`. Handle:
  - Italic category rows (`_Simple Melee Weapons_`) → set current category context, don't emit as weapon
  - Damage parsing: split "1d8 Slashing" → damage: "1d8", damageType: "Slashing". Handle "1 Piercing" (blowgun)
  - Properties: parenthesis-aware comma split. "Thrown (Range 20/60), Versatile (1d8)" → 2 properties
  - Mastery: single word from Mastery column
- **Armor**: Find armor table. Parse AC formula:
  - Light: "11 + Dex modifier" → ac: 11, dexBonus: true, maxDexBonus: undefined
  - Medium: "14 + Dex modifier (max 2)" → ac: 14, dexBonus: true, maxDexBonus: 2
  - Heavy: "18" → ac: 18, dexBonus: false
  - Shield: "+2" → special handling
  - Category from italic section rows. Strength req from "Str 13" → 13. Stealth: "Disadvantage" → true
- **Gear**: Parse Tools table + Adventuring Gear table(s) into `Gear[]` (name, cost, weight, description)

**Expected counts**: ~37 weapons, ~14 armor + shield, ~50+ gear items

### 2D. `parseSpecies` + `parseBackgrounds`
**File**: `library/src/parsers/origins.ts`
**Source**: chapter 05 (~474 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/05-character-origins.md`
**Strategy**:
- **Backgrounds**: Split "Background Descriptions" section by bold paragraph. Extract:
  - `**Ability Scores:**` → string[]
  - `**Feat:**` → string
  - `**Skill Proficiencies:**` → string[]
  - `**Tool Proficiency:**` → string
  - `**Equipment:**` → string (raw, include A/B choice)
- **Species**: Split "Species Descriptions" section by bold paragraph. Extract:
  - `**Creature Type:**`, `**Size:**`, `**Speed:**` bold fields
  - Size: handle compound "Small or Medium" → string[]
  - Traits: parse `_**Trait Name.**_` pattern within each species body
  - Some traits have embedded tables (Draconic Ancestors) — include as description markdown

**Expected counts**: ~4 backgrounds, ~9 species

### 2E. `parseCreationTables`
**File**: `library/src/parsers/creation.ts`
**Source**: chapter 03 (~998 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/03-character-creation.md`
**Strategy**:
- Extract key reference tables (not all prose content):
  - **Level Advancement table**: level → XP threshold → proficiency bonus
  - **Ability Score Modifiers table**: score → modifier (1-30)
  - **Ability Score Point Cost table**: score → point cost
  - **Multiclass Spell Slots table**: total caster levels → slots per level (em-dash = 0)
- Handle dual-column table format (2 logical records per row)
- These are foundational to the character computation engine

**Expected outputs**: 4 typed lookup tables

### 2F. `parseClasses(markdown: string): Class[]`
**File**: `library/src/parsers/classes.ts`
**Source**: chapter 04 (~5,818 lines, 12 classes)
**Summary ref**: `content/srd-markdown/chapter-summaries/04-classes.md`
**Strategy** (most complex parser):
- Preprocess markdown, parse to AST
- Split chapter by `## **ClassName**` H2 headings (12 sections)
- Per class:
  - **Core Traits**: Find "Core X Traits" table. Parse for: Primary Ability, Hit Point Die (extract number), Saving Throw Proficiencies, Skill Proficiencies (options + count from "Choose 2:" pattern), Weapon/Armor Proficiencies, Starting Equipment. Handle `<br>` in cells.
  - **Progression table**: Find the features table. Variable columns per class — always has Level, Proficiency Bonus, Class Features. Extra columns go into `extras: Record<string, string>`. Warlock is unique (Slot Level column instead of per-level slots).
  - **Feature descriptions**: Scan for `**Level N: Feature Name**` bold paragraphs. Group consecutive text into feature description. Handle same-named features at different levels.
  - **Subclasses**: Detect subclass boundaries (3 different heading patterns across classes). Parse subclass features with their own level-keyed descriptions.
  - **Spellcasting**: Detect spellcasting feature, extract ability from text. Identify spell list sections (varies by class).

**Expected counts**: 12 classes × (20-level progression + 15-20 features + 1-3 subclasses)
**Key edge cases**: Ghost header rows above every table, Rogue's Starting Equipment outside traits table, 12 different progression column shapes, `## Page N` splitting features mid-paragraph

### 2G. `parseMagicItems(markdown: string): MagicItem[]`
**File**: `library/src/parsers/magic-items.ts`
**Source**: chapter 11 (~5,854 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/11-magic-items.md`
**Strategy**:
- Find A-Z catalog boundary (starts at `## **Magic Items A–Z**`, ~line 564)
- Split by bold paragraph for item names
- Join wrapped italic metadata lines, then parse:
  - Standard: `_Wondrous Item, Uncommon (Requires Attunement)_`
  - Typed: `_Armor (Chain Mail), Rare_`
  - Multi-rarity: `_Weapon (Any), Uncommon (+1), Rare (+2), or Very Rare (+3)_`
  - Rarity Varies: `_Wondrous Item, Rarity Varies (Requires Attunement)_`
- Extract: category, rarity, requiresAttunement, attunementRequirement
- For multi-rarity items: either expand to N entries or store variant info
- Remaining nodes = description (preserve embedded tables as markdown)

**Expected counts**: ~257 items (290+ if expanding variants)
**Key edge cases**: Multi-line metadata (~20 items), 7 Rarity Varies items with two sub-patterns, 52 embedded tables

### 2H. `parseRules` + `parseConditions`
**File**: `library/src/parsers/rules.ts`
**Source**: chapter 09 (~1,858 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/09-rules-glossary.md`
**Strategy**:
- Preprocess, parse, split by bold paragraph
- Detect tagged entries: `**Term [Tag]**` → tag in brackets identifies type
  - `[Condition]` → Condition (15 entries)
  - `[Action]` → Action rules (12 entries)
  - `[Area of Effect]` → AoE rules (6 entries)
  - `[Hazard]` → Hazard rules (5 entries)
  - `[Attitude]` → Attitude rules (3 entries)
  - No tag → general Rule
- For Conditions: extract bulleted effects into `effects: string[]`
- For all: description as markdown text
- Handle both `_**Label.**_` and `**Label.**` sub-entry styles
- Skip abbreviations table (split across pages, low value)

**Expected counts**: ~131 entries (15 conditions + 116 rules)

### 2I. `parseMonsters(markdown: string): Monster[]`
**File**: `library/src/parsers/monsters.ts`
**Source**: chapter 12 (~12,251 lines) + chapter 13 (~3,110 lines)
**Summary ref**: `content/srd-markdown/chapter-summaries/12-monsters.md` + `13-animals.md`
**Strategy** (most irregular format):
- Preprocess: strip page noise + `MOD SAVE MOD SAVE MOD SAVE` artifact lines
- Split by `### **Creature Name**` H3 headings
- Skip ch13 preamble stray entries (2 ch12 monsters before the `# **Animals**` H1)
- Per entry parse:
  - **Type line**: italic `_Size Type (Tags), Alignment_`
  - **Combat stats**: regex on `**AC** N`, `**Initiative** +N (N)`, `**HP** N (dice)`, `**Speed** ...`
  - **Ability scores**: The 2-row × 11-column table. Parse using column positions (cols 1-3 = Str score/mod/save, 5-7 = Dex, 9-11 = Con; row 2 = Int/Wis/Cha). Normalize Unicode minus signs. Handle tab characters. Ignore stray Col4/Col8 separator columns.
  - **Detail lines**: Parse `**Skills**`, `**Senses**`, `**Languages**`, `**CR**` bold fields. CR format: `10 (XP 5,900; PB +4)` or with lair: `10 (XP 5,900, or 7,200 in lair; PB +4)`
  - **Sections**: Split by bare text markers "Traits", "Actions", "Bonus Actions", "Reactions", "Legendary Actions". Parse `_**Name.**_` entries within each.
  - **Spellcasting**: Detect `At Will:` / `N/Day Each:` patterns, parse italic spell names
  - **Lair actions**: Detect lair section marker, parse lair action entries

**Expected counts**: ~234 (ch12) + ~96 (ch13) = ~330 total
**Key edge cases**: Ability table formatting (the hardest single element), lair-scaled values on ~27 monsters, fractional CRs (1/8, 1/4, 1/2), swarm compound types, spellcasting blocks wrapping across pages

---

## Phase 3: Effect Extraction (LLM-Assisted)

After all parsers produce clean typed data with `effects: []`, a second pass populates `Effect[]` on relevant types.

### 3A. Design the extraction contract

Create `library/src/effects/` module:

```
library/src/effects/
  extract.ts        — Effect extraction functions per type
  verify.ts         — Verification/validation of extracted effects
  index.ts          — barrel
```

**`extractEffectsFromFeature(feature: ClassFeature): Effect[]`** — Given a parsed feature with name, level, and description, return the effects it grants. Same pattern for feats, magic items, species traits.

### 3B. Effect extraction approach

For each entity type, effects fall into categories by extractability:

**Mechanically deterministic** (extractable from structured fields):
- Class proficiencies → `{ type: "proficiency", category, value }` from traits table
- Saving throw proficiencies → from traits table
- AC formulas (Unarmored Defense) → `{ type: "set-ac-formula", formula }`
- Extra Attack → `{ type: "extra-attack", count }`
- Speed bonuses → `{ type: "speed-bonus", value, movementType }`

**Extractable from description patterns** (regex/heuristic):
- "Resistance to X damage" → `{ type: "resistance", damageType }`
- "Immunity to X" → `{ type: "immunity", damageType }`
- "proficiency with X" → `{ type: "proficiency", ... }`
- "+N bonus to X" → `{ type: "modifier", target, value }`

**Requires interpretation** (LLM-assisted):
- Complex features (Rage: multiple effects, conditional)
- Features with choices ("choose two skills from...")
- Resource grants (uses per rest)
- Granted actions (Breath Weapon, Cunning Action)

### 3C. Implementation strategy

1. **Heuristic extractor**: Write rule-based extraction for the deterministic + pattern categories above. This handles ~40-60% of effects.
2. **LLM extraction task**: For each entity type, give an agent:
   - The type definitions (Effect discriminated union)
   - The parsed entities (name + description)
   - The heuristic results as a starting point
   - Instructions to fill in remaining effects or correct heuristic ones
3. **Verification test**: For each entity, a test that checks:
   - No empty effects on features that clearly grant something
   - Effect types match what the description says (spot-check)
   - Known effects are present (e.g., Barbarian Rage MUST have resistance + modifier + grant-action)

### 3D. What gets effects

| Type | Gets Effect[] | Notes |
|------|---------------|-------|
| ClassFeature | Yes | Core value — powers leveling |
| SubclassFeature | Yes | Same |
| Feat | Yes | Powers feat selection |
| MagicItem | Yes | Powers equipment screen |
| SpeciesTrait | Yes | Powers character creation |
| Background | Indirectly | Proficiency grants via feat/skill fields |
| Spell | No | Spells ARE effects; they don't produce Effect[] |
| Monster | No | Monsters use their own stat block |
| Condition | No | Conditions are referenced, not applied as Effect[] |

---

## Phase 4: Verification Layer

### 4A. Count validation (`tests/validation/counts.test.ts`)

After parsing full chapters, assert known counts:
- Spells: >= 300
- Classes: exactly 12
- Feats: >= 15
- Weapons: >= 35
- Armor: >= 14
- Magic Items: >= 200
- Monsters + Animals: >= 300
- Species: exactly 9
- Backgrounds: >= 4
- Conditions: >= 14
- Rules: >= 80

### 4B. Spot-check validation (`tests/validation/spot-checks.test.ts`)

Hand-verify specific entries against known values:
- Fireball: level 3, Evocation, 8d6 fire, 150 feet, V/S/M, concentration false
- Cure Wounds: level 1, Abjuration, classes includes "Cleric" and "Druid"
- Barbarian: d12 hit die, STR primary, STR+CON saves, 20 levels, Rage at level 1
- Wizard: d6 hit die, INT spellcasting, Arcane Recovery at level 1
- Longsword: martial melee, 1d8 slashing, Versatile (1d10), Sap mastery
- Plate Armor: heavy, AC 18, STR 15 req, stealth disadvantage, no dex bonus
- Aboleth: CR 10, Large Aberration, AC 17, HP 150, 3 legendary resistances
- Alert feat: origin category, no prerequisite, not repeatable
- Dragonborn species: Humanoid, Medium, 30 ft, has Breath Weapon trait
- Bag of Holding: Wondrous Item, Uncommon, no attunement

### 4C. Completeness checks (`tests/validation/completeness.test.ts`)

- Every spell has: name, level (0-9), school, ≥1 class, castingTime, range, components, duration, description (non-empty)
- Every class has: 20 levels in progression, hitDie > 0, ≥1 subclass, features at levels 1-20, savingThrows.length === 2
- Every weapon has: name, category, range, damage, damageType, cost, mastery
- Every armor has: name, category, ac > 0, cost
- Every monster has: name, type, armorClass > 0, hitPoints (non-empty), challengeRating, ≥1 action
- Every magic item has: name, rarity, category, description (non-empty)
- Every species has: name, creatureType, size, speed, ≥1 trait
- Every feat has: name, category, description (non-empty)

### 4D. Effect verification (`tests/validation/effects.test.ts`)

- Barbarian Rage: has resistance effect (bludgeoning/piercing/slashing), modifier effect, grant-action effect
- Alert feat: has modifier effect on initiative
- Fighter Extra Attack (level 5): has extra-attack effect with count >= 1
- Barbarian Unarmored Defense: has set-ac-formula effect with DEX + CON
- Dragonborn Breath Weapon: has grant-action effect
- Dwarf Dwarven Resilience: has resistance effect (poison)
- Sample 5+ class features per class: no empty effects on features with clear mechanical grants

---

## Agent Execution Plan

### Guiding principle

Each agent task has: **focused scope, clear inputs, testable outputs, fixture-first TDD**. No agent handles more than one parser. Context stays lean.

Each agent receives:
1. The plan section for their specific parser
2. The chapter summary for their source chapter
3. The relevant type definitions
4. The shared utilities (from Phase 1)
5. The fixture file for their parser
6. Access to the full chapter markdown

### Wave 0: Infrastructure (1 agent, sequential)
**Agent**: "infra-setup"
**Scope**:
- Extend `shared.ts` with all new utilities listed in 1A
- Add `mdast-util-to-markdown` dependency
- Create `Species`, `SpeciesTrait`, `Background`, `LevelAdvancement`, `AbilityScoreModifier` types
- Add `mastery: string` to `Weapon`
- Add `initiative`, `bonusActions`, `proficiencyBonus` to `Monster`
- Create `library/src/data/` directory with stub files
- Create ALL fixture files in `tests/fixtures/` (copy representative snippets from SRD chapters)
- Create test file stubs with expected outputs for each fixture
**Verify**: `pnpm check` passes, all fixtures exist, all test stubs exist

### Wave 1: Simple Parsers (3 agents, parallel)
Parsers with the most consistent per-entry markdown formats.

**Agent 1**: "parse-spells"
- Reads: `content/srd-markdown/chapter-summaries/08-spells.md` for format reference
- Input fixture: `tests/fixtures/spell-sample.md`
- Implement: `parseSpells` in `parsers/spells.ts`
- Wire: `data/spells.ts` exports `allSpells`
- Verify: fixture tests pass, integration count >= 300, Fireball spot-check

**Agent 2**: "parse-feats"
- Reads: `content/srd-markdown/chapter-summaries/06-feats.md`
- Input fixture: `tests/fixtures/feat-sample.md`
- Implement: `parseFeats` in `parsers/feats.ts`
- Wire: `data/feats.ts` exports `allFeats`
- Verify: fixture tests pass, integration count >= 15, Alert spot-check

**Agent 3**: "parse-equipment"
- Reads: `content/srd-markdown/chapter-summaries/07-equipment.md`
- Input fixtures: `tests/fixtures/weapons-sample.md` + `armor-sample.md`
- Implement: `parseWeapons`, `parseArmor`, `parseGear` in `parsers/equipment.ts`
- Wire: `data/equipment.ts` exports `allWeapons`, `allArmor`, `allGear`
- Verify: fixture tests pass, weapons >= 35, armor >= 14, Longsword + Plate spot-checks

### Wave 2: Medium Parsers (3 agents, parallel)

**Agent 4**: "parse-origins"
- Reads: `content/srd-markdown/chapter-summaries/05-character-origins.md`
- Input fixtures: `tests/fixtures/species-sample.md` + `background-sample.md`
- Implement: `parseSpecies`, `parseBackgrounds` in `parsers/origins.ts`
- Wire: `data/origins.ts` exports `allSpecies`, `allBackgrounds`
- Verify: species = 9, backgrounds >= 4, Dragonborn spot-check

**Agent 5**: "parse-magic-items"
- Reads: `content/srd-markdown/chapter-summaries/11-magic-items.md`
- Input fixture: `tests/fixtures/magic-item-sample.md`
- Implement: `parseMagicItems` in `parsers/magic-items.ts`
- Wire: `data/magic-items.ts` exports `allMagicItems`
- Verify: fixture tests pass, items >= 200, Bag of Holding spot-check

**Agent 6**: "parse-rules"
- Reads: `content/srd-markdown/chapter-summaries/09-rules-glossary.md`
- Input fixture: `tests/fixtures/rules-sample.md`
- Implement: `parseRules`, `parseConditions` in `parsers/rules.ts`
- Wire: `data/rules.ts` exports `allRules`, `allConditions`
- Verify: conditions >= 14, rules >= 80

### Wave 3: Complex Parsers (3 agents, parallel)

**Agent 7**: "parse-classes"
- Reads: `content/srd-markdown/chapter-summaries/04-classes.md`
- Input fixtures: `tests/fixtures/class-barbarian.md` + `class-wizard.md`
- Implement: `parseClasses` in `parsers/classes.ts`
- Wire: `data/classes.ts` exports `allClasses`
- Verify: exactly 12 classes, 20-level progressions, Barbarian + Wizard spot-checks

**Agent 8**: "parse-monsters"
- Reads: `content/srd-markdown/chapter-summaries/12-monsters.md` + `13-animals.md`
- Input fixture: `tests/fixtures/monster-sample.md`
- Implement: `parseMonsters` in `parsers/monsters.ts`
- Wire: `data/monsters.ts` exports `allMonsters`
- Verify: total >= 300, Aboleth spot-check, fractional CRs parse correctly

**Agent 9**: "parse-creation-tables"
- Reads: `content/srd-markdown/chapter-summaries/03-character-creation.md`
- Input fixture: `tests/fixtures/creation-tables.md`
- Implement: `parseCreationTables` in `parsers/creation.ts`
- Wire: `data/creation.ts` exports lookup tables
- Verify: 20 level entries, ability modifiers for scores 1-30, multiclass slot table

### Wave 4: Effect Extraction (3 agents, parallel)

**Agent 10**: "effects-heuristic"
- Implement rule-based `extractEffects` functions in `library/src/effects/extract.ts`
- Cover: proficiency grants, resistance/immunity, numeric modifiers, AC formulas, extra attack, speed bonuses
- Unit tests with known feature descriptions → expected effects

**Agent 11**: "effects-classes-feats"
- Input: All parsed class features + feats from Wave 1-3
- Apply heuristic extractor, then LLM-fill remaining effects
- Output: effect arrays for all class features + feats as verified data
- Verification tests for 10+ known features

**Agent 12**: "effects-items-species"
- Input: All parsed magic items + species traits
- Same approach as Agent 11
- Verification tests for 10+ known items/traits

### Wave 5: Integration + Validation (1 agent)

**Agent 13**: "validation-integration"
- Wire all `data/*.ts` modules into `data/index.ts` barrel
- Update `library/src/index.ts` to re-export data
- Write count, spot-check, completeness, and effect verification tests
- Run full test suite: `pnpm -F @dnd/library test`
- Run type check: `pnpm check`
- Verify: all tests green, all counts match, all spot-checks pass

---

## File Inventory

### New files
```
library/src/parsers/spells.ts          — rewrite (exists as stub)
library/src/parsers/equipment.ts       — new
library/src/parsers/classes.ts         — new
library/src/parsers/feats.ts           — new
library/src/parsers/magic-items.ts     — new
library/src/parsers/monsters.ts        — new
library/src/parsers/origins.ts         — new
library/src/parsers/rules.ts           — new
library/src/parsers/creation.ts        — new
library/src/data/index.ts              — new
library/src/data/spells.ts             — new
library/src/data/classes.ts            — new
library/src/data/equipment.ts          — new
library/src/data/feats.ts              — new
library/src/data/magic-items.ts        — new
library/src/data/monsters.ts           — new
library/src/data/origins.ts            — new
library/src/data/rules.ts              — new
library/src/data/creation.ts           — new
library/src/effects/extract.ts         — new
library/src/effects/verify.ts          — new
library/src/effects/index.ts           — new
library/src/types/species.ts           — new
library/src/types/background.ts        — new
library/src/types/creation.ts          — new (LevelAdvancement, AbilityScoreModifier)
tests/fixtures/spell-sample.md         — expand existing
tests/fixtures/class-barbarian.md      — new
tests/fixtures/class-wizard.md         — new
tests/fixtures/weapons-sample.md       — new
tests/fixtures/armor-sample.md         — new
tests/fixtures/feat-sample.md          — new
tests/fixtures/magic-item-sample.md    — new
tests/fixtures/monster-sample.md       — new
tests/fixtures/species-sample.md       — new
tests/fixtures/background-sample.md    — new
tests/fixtures/rules-sample.md         — new
tests/fixtures/creation-tables.md      — new
tests/parsers/spells.test.ts           — expand existing
tests/parsers/feats.test.ts            — new
tests/parsers/equipment.test.ts        — new
tests/parsers/classes.test.ts          — new
tests/parsers/magic-items.test.ts      — new
tests/parsers/monsters.test.ts         — new
tests/parsers/origins.test.ts          — new
tests/parsers/rules.test.ts            — new
tests/parsers/creation.test.ts         — new
tests/validation/counts.test.ts        — new
tests/validation/spot-checks.test.ts   — new
tests/validation/completeness.test.ts  — new
tests/validation/effects.test.ts       — new
```

### Modified files
```
library/src/parsers/shared.ts          — add 9 utility functions
library/src/parsers/index.ts           — re-export all parsers
library/src/types/index.ts             — re-export Species, Background, SpeciesTrait, creation types
library/src/types/monster.ts           — add initiative, bonusActions, proficiencyBonus
library/src/types/equipment.ts         — add mastery to Weapon
library/src/index.ts                   — re-export data module
library/package.json                   — add mdast-util-to-markdown
```

---

## Verification

After all waves complete:

```bash
# Type check
pnpm check

# Run all tests (unit + integration + validation)
pnpm -F @dnd/library test

# Spot check: print parsed counts
node -e "
  const d = require('./library/src/data');
  console.log('Spells:', d.allSpells.length);
  console.log('Classes:', d.allClasses.length);
  console.log('Feats:', d.allFeats.length);
  console.log('Weapons:', d.allWeapons.length);
  console.log('Armor:', d.allArmor.length);
  console.log('Monsters:', d.allMonsters.length);
  console.log('Magic Items:', d.allMagicItems.length);
  console.log('Species:', d.allSpecies.length);
  console.log('Backgrounds:', d.allBackgrounds.length);
  console.log('Conditions:', d.allConditions.length);
  console.log('Rules:', d.allRules.length);
"
```

Expected: all tests green, counts match SRD, spot-checks pass, effects populated on class features/feats/items/species traits.
