# Chapter 04: Classes — Parser Planning Summary

## Overview

This is the largest chapter in the SRD at 5,818 lines, covering all 12 base classes: Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, and Wizard. Each class section follows a consistent high-level structure but contains substantial per-class variation in progression columns, spellcasting mechanics, and subclass-specific tables. The chapter also includes complete spell lists (organized by class) and Warlock-specific Eldritch Invocation options — making it the single most data-rich chapter in the SRD. Parsing this chapter is the foundation of any character builder.

---

## Content Structure

### Top-level organization

The chapter is a single flat markdown file paginated with `## Page N` headings and HTML comments (`<!-- source_txt: ... -->` / `<!-- source_image: ... -->`). These page-break markers divide the logical content at arbitrary points and must be ignored during parsing — they are not structural.

The 12 classes appear sequentially as `## **ClassName**` headings (H2, bold). Within each class the logical sections are:

1. **Core Traits table** (`**Core ClassName Traits**` bold label above a 2-column key/value markdown table)
2. **Becoming a ClassName** section (`#### **Becoming a ClassName …**`, H4, bold)
3. **Features progression table** (introduced by a loose bold label `**ClassName Features**`, immediately followed by a ghost plain-text header row, then the real pipe-table)
4. **Class Features prose** (`#### **ClassName Class Features**`, H4, bold — introduces the level-keyed feature descriptions)
5. **Spell list** (spellcasting classes only; `#### **ClassName Spell List**` H4 heading followed by cantrip and level-1–9 tables)
6. **Eldritch Invocation Options** (Warlock only; a large block of individually named invocations)
7. **Subclass** (`#### **ClassName Subclass: SubclassName**`, H4, bold)

### Heading levels

| Heading level | Used for |
|---|---|
| `# **Classes**` (H1 bold) | Chapter title |
| `## **ClassName**` (H2 bold) | Each class |
| `## Page N` (H2 plain) | Page-break artifact (ignore) |
| `#### **Becoming a ClassName …**` (H4 bold) | Multiclass/level-1 entry rules |
| `#### **ClassName Class Features**` (H4 bold) | Opens the feature prose block |
| `#### **ClassName Subclass: SubclassName**` (H4 bold) | Subclass section |
| `#### **ClassName Spell List**` (H4 bold) | Spell list section |
| `#### **Eldritch Invocation Options**` (H4 bold) | Warlock invocations block |

H3 (`###`) does not appear in this chapter.

### Feature descriptions

Each class feature is introduced by a bold paragraph heading of the form:

```
**Level N: Feature Name**
```

This is a `**bold**` span within an otherwise normal paragraph — it is NOT a markdown heading. The feature description text follows immediately in the same or subsequent paragraphs. Sub-bullets within a feature use `_**Sub-heading.**_` (italic + bold inline) followed by the sub-description text on the same line.

Example (Barbarian Rage sub-rules):
```
_**Damage Resistance.**_ You have Resistance to Bludgeoning, Piercing, and Slashing damage.
_**Rage Damage.**_ When you make an attack using Strength…
```

### Tables

All tables use standard GFM pipe syntax. Cells frequently contain:
- `<br>` for line breaks within a cell (common in Core Traits and spell slot headers)
- Italicized spell names using `_SpellName_`
- `—` as a dash/null value in progression tables
- Multi-word comma-separated lists of features in the "Class Features" column (sometimes with `<br>` for wrapping)

---

## Data Types Extractable

### 1. `ClassDefinition`
One per class (12 total).
- `name: string` — e.g. "Barbarian"
- `primaryAbility: string[]` — e.g. ["Strength"] or ["Strength", "Charisma"]
- `hitPointDie: string` — e.g. "d12"
- `savingThrowProficiencies: string[]` — e.g. ["Strength", "Constitution"]
- `skillProficiencies: { choose: number, options: string[] }`
- `weaponProficiencies: string[]`
- `armorTraining: string[]`
- `toolProficiencies?: { choose: number, options: string[] }`
- `startingEquipment: EquipmentChoice[]` — A/B (or A/B/C for Fighter) options
- `subclassLevel: number` — level at which you choose a subclass (always 3)
- `multiclassGrants: string[]` — traits gained when multiclassing into this class
- `spellcastingAbility?: string` — e.g. "Charisma" (null for non-casters)
- `spellcastingFocus?: string` — e.g. "Musical Instrument"
- `isFullCaster: boolean`
- `isHalfCaster: boolean`
- `pactMagic: boolean` — Warlock only

### 2. `ClassLevelEntry`
One per class per level (20 levels × 12 classes = 240 entries, plus columns vary).
- `className: string`
- `level: number` (1–20)
- `proficiencyBonus: number`
- `features: string[]` — feature names at this level (from "Class Features" column)
- `extraColumns: Record<string, string | number>` — class-specific columns (see below)

### 3. `ClassFeature`
One per named feature.
- `className: string`
- `subclassName?: string` — present if it's a subclass feature
- `level: number`
- `name: string`
- `description: string` — full prose, may contain sub-features
- `subFeatures?: ClassSubFeature[]` — named `_**italic bold**_` sub-sections

### 4. `SubclassDefinition`
One per subclass (12 total in this SRD chapter, one per class).
- `parentClass: string`
- `name: string`
- `flavorText: string` — the italicized tagline (e.g. _Channel Rage into Violent Fury_)
- `description: string` — introductory prose
- `features: ClassFeature[]` — subclass-level features

### 5. `SpellList`
One per spellcasting class (Bard, Cleric, Druid, Ranger, Sorcerer, Warlock, Wizard).
- `className: string`
- `spellsByLevel: { level: number, spells: SpellListEntry[] }[]`

### 6. `SpellListEntry`
- `name: string`
- `school: string`
- `concentration: boolean` — `C` in Special column
- `ritual: boolean` — `R` in Special column
- `requiresMaterial: boolean` — `M` in Special column

### 7. `EldritchInvocation` (Warlock-specific)
- `name: string`
- `prerequisite?: string` — e.g. "Level 5+ Warlock, Pact of the Blade Invocation"
- `description: string`
- `repeatable: boolean` — presence of `_**Repeatable.**_` sub-feature

### 8. `SubclassSpellTable` (Cleric, Druid, Paladin, Warlock subclasses)
- `subclassName: string`
- `entries: { classLevel: number, spells: string[] }[]`

### 9. `BeastShapesTable` (Druid-specific)
- `druidLevel: number`
- `knownForms: number`
- `maxCR: string`
- `flySpeed: boolean`

---

## Parsing Complexity

**Rating: High**

Reasons:
1. **No single structural delimiter for features.** The `**Level N: Name**` pattern is a bold inline span, not a heading. A parser cannot use heading-based section splitting; it must scan paragraphs for this bold pattern.
2. **Page-break markers interrupt logical content.** The `## Page N` H2 headings and `<!-- source_... -->` comments appear mid-feature, mid-table, and mid-sentence. A feature description started on page 28 may continue on page 29. The features progression table header row appears *before* the table on page 28 but the `|---|` table body appears after the page marker.
3. **Ghost header rows.** Every features progression table is preceded by a raw plain-text pseudo-header (e.g. `**Proficiency** **Rage** **Weapon**`) that duplicates the table's column names but is not itself a table row. This must be stripped.
4. **Highly variable class-specific columns.** Each class has different extra columns in the progression table. No uniform schema.
5. **Spell lists split across pages.** Each spell level section may start a new pipe table mid-page and continue in the next page's table block with identical `| Spell | School | Special |` headers. These must be merged.
6. **Warlock invocations** are a large alphabetical block with their own mini-format (name as bold paragraph heading, optional italic prerequisite line, description body, optional `_**Repeatable.**_`).
7. **Druid Circle of the Land** has four sub-tables for spell selection (Arid/Polar/Temperate/Tropical Land), each with the same column structure but different data.
8. **Core Traits table cell splitting.** Several classes have a Skill Proficiencies row where the label and content are split across columns due to overflow wrapping (e.g., Fighter, Monk, Rogue render the label in one column and a blank in the right, with the actual content spilling into the left column of the next row).

---

## Key Patterns

### Core Traits table (2-column key/value)
First column is a bold key, second is the value. `<br>` is used for multi-line values. Some cells use italic for instructions.

```markdown
| Primary Ability | Strength |
| --- | --- |
| **Hit Point Die** | D12 per Barbarian level |
| **Saving Throw**<br>**Proficiencies** | Strength and Constitution |
| **Skill Proficiencies** | _Choose 2:_ Animal Handling, Athletics, ... |
```

### Features progression table (class-specific extra columns)
The table has a plain-text "ghost" header before the real pipe table. The pipe table's column 3 ("Class Features") contains comma-separated feature names, sometimes with `<br>` for line breaks. Extra columns vary by class.

Non-spellcasting class (Barbarian):
```markdown
| Level | Bonus | Class Features | Rages | Damage | Mastery |
| --- | --- | --- | --- | --- | --- |
| 1 | +2 | Rage, Unarmored Defense, Weapon Mastery | 2 | +2 | 2 |
```

Half-caster spellcasting class (Paladin — 5 spell levels only, no cantrips):
```markdown
| Level | Bonus | Class Features | Divinity | Spells | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | +2 | Lay On Hands, Spellcasting,<br>Weapon Mastery | — | 2 | 2 | — | — | — | — |
```

Full-caster spellcasting class (Bard — 9 spell levels + Bardic Die + Cantrips + Prepared):
```markdown
| Level | Bonus | Class Features | Die | Cantrips | Spells | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | +2 | Bardic Inspiration,<br>Spellcasting | D6 | 2 | 4 | 2 | — | — | — | ... |
```

Warlock (unique Pact Magic columns — Spell Slots count + Slot Level, not per-level slots):
```markdown
| Level | Bonus | Class Features | Invocations | Cantrips | Spells | Slots | Level |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | +2 | Eldritch Invocations, Pact Magic | 1 | 2 | 2 | 1 | 1 |
```

### Level feature heading pattern (bold inline, not a heading)
```markdown
**Level 1: Rage**
You can imbue yourself with a primal power called Rage...
```

### Feature sub-bullets (italic-bold inline label)
```markdown
_**Damage Resistance.**_ You have Resistance to Bludgeoning, Piercing, and Slashing damage.
_**Rage Damage.**_ When you make an attack using Strength—with either a weapon...
```

### Subclass heading pattern
```markdown
#### **Barbarian Subclass:** **Path of the Berserker**

_Channel Rage into Violent Fury_
```
Note the subclass name may be split across two bold spans separated by a space.

### Subclass spell table (Cleric, Paladin, Warlock, Druid Circle of the Land)
```markdown
**Life Domain Spells**

| Cleric Level | Prepared Spells |
| --- | --- |
| 3 | _Aid_, _Bless_, _Cure Wounds_, _Lesser Restoration_ |
| 5 | _Mass Healing Word_, _Revivify_ |
```

### Spell list tables (per-level within a class)
```markdown
**Cantrips (Level 0 Bard Spells)**

| Spell | School | Special |
| --- | --- | --- |
| Dancing Lights | Illusion | C |
| Light | Evocation | — |
```

### Eldritch Invocation entry
```markdown
**Agonizing Blast**
_Prerequisite: Level 2+ Warlock, a Warlock Cantrip That Deals Damage_

Choose one of your known Warlock cantrips that deals damage...
_**Repeatable.**_ You can gain this invocation more than once...
```

---

## Edge Cases & Gotchas

1. **Page-break markers mid-table.** The Bard features table on page 31 has its opening prose and ghost header, then the page break `## Page 32` comment, then the actual `| Level | ... |` pipe table continues. Similarly the Cleric features table body appears after a page marker. Parsers that split on `## Page N` will break tables.

2. **Ghost header rows before every progression table.** Each class has 1–2 lines of raw bold text listing column names before the actual pipe table. Example:
   ```
   **Proficiency** **Rage** **Weapon**
   **Level** **Bonus** **Class Features** **Rages** **Damage** **Mastery**
   ```
   These must be discarded; they are not table rows. The real table always appears after them.

3. **Sorcerer table cell wrapping.** The Sorcerer Features table uses `<br>` within the "Class Features" cells to wrap long feature names:
   ```
   | 1 | +2 | Spellcasting,<br>Innate Sorcery | — | 4 | 2 | ... |
   ```
   This is common in long-named-feature rows; parsers must strip `<br>` tags from cell content.

4. **Fighter Core Traits table cell overflow.** The Skill Proficiencies and Starting Equipment rows in Fighter and Rogue have content overflow: the label cell contains part of the value, and the second column cell is empty, with the rest of the value in the next row's left column. This is an OCR/PDF-extraction artifact:
   ```
   | **Skill Proficiencies**<br>_Choose 2:_ Acrobatics, Animal<br>Handling, Athletics, History,... |  |
   ```
   The right column is blank — all content is stuffed into the left cell.

5. **Monk and Rogue Core Traits similar overflow.** Same pattern as Fighter — multi-line content in the left key cell with a blank right cell.

6. **Rogue Starting Equipment outside the table.** The Rogue's Starting Equipment row appears as a bold paragraph below the Core Traits table rather than inside it:
   ```
   **Starting Equipment** _Choose A or B:_ (A) Leather Armor, 2 Daggers...
   ```
   It is not a table row at all — it is a standalone bold paragraph following the table.

7. **Cleric subclass has only 3 feature levels (3, 6, 17), not 4.** Life Domain Cleric subclass has features at levels 3, 6, and 17 — skipping the level 10 and 14 slots that most subclasses use. The parser must not assume all subclasses grant features at the same levels.

8. **Fighter Champion subclass has features at 3, 7, 10, 15, 18** — more than the typical 3/6/10/14 pattern. Champion uniquely has a level 18 subclass feature that coincides with the class-level 18 "Subclass feature" row.

9. **"Subclass feature" placeholder rows.** The features progression table uses the text "Subclass feature" as a placeholder feature name at levels where the subclass grants a feature. This is not a real feature name — it means "the feature comes from whichever subclass you chose." Parsers should recognize this as a reference, not a concrete feature.

10. **Druid "Circle of the Land Spells" uses four sub-tables.** This subclass spell-grant feature presents four separate tables (Arid/Polar/Temperate/Tropical Land) with identical column structure but different data. The table title (e.g., `**Arid Land**`) precedes each one as a bold paragraph heading.

11. **Druid has a secondary progression table ("Beast Shapes").** This small table tracks Wild Shape scaling independently of the main features table:
    ```
    | Druid | Known | Max | Fly |
    | 2 | 4 | 1/4 | No |
    ```
    It is embedded mid-prose within the Wild Shape feature description, not adjacent to the main table.

12. **Subclass name formatting inconsistency.** The `####` subclass heading sometimes splits the name across two bold spans with a colon in between:
    - `#### **Barbarian Subclass:** **Path of the Berserker**` (colon in first span, name in second)
    - `#### **Fighter Subclass: Champion**` (all in one span)
    - `#### **Monk Subclass: Warrior of the** **Open Hand**` (name splits mid-word across two spans)
    Parsers must handle all three variants.

13. **Warlock spell list uses a different table format for higher spell levels.** Some Warlock spell-level sections render the first row outside the table (bold text before the pipe row), creating an inconsistency with the other spell list tables:
    ```
    **Spell** **School** **Special**

    | Chill Touch | Necromancy | — |
    | --- | --- | --- |
    ```
    The first data row is the separator row's *predecessor*, not the header. The header (`Spell | School | Special`) exists as the bold plain text above. This is an OCR artifact that differs from other classes' spell lists which have a proper `| Spell | School | Special |` header row.

14. **"—" vs null in progression tables.** Empty/non-applicable progression column cells use `—` (em dash), not an empty string or zero. Spell slot columns for levels not yet gained always show `—`.

15. **Feature names with duplicate level entries.** The Barbarian has two distinct features both named "Improved Brutal Strike" (at levels 13 and 17). A parser that uses (class, level, name) as a composite key will collide. The level-17 entry augments the level-13 version but has a different description.

16. **Spellcasting section split by page break.** The Sorcerer's Spellcasting feature text starts before the Features table, the table appears mid-feature (after a page marker), and the rest of the Spellcasting prose continues after the table. The table is embedded mid-feature rather than preceding it.

---

## Estimated Entry Count

| Data type | Estimated count |
|---|---|
| ClassDefinition | 12 |
| ClassLevelEntry (progression rows) | 240 (12 × 20) |
| ClassFeature (main class features) | ~180–200 (avg ~15–17 named features per class) |
| ClassFeature (subclass features) | ~60–80 (avg ~4–6 per subclass × 12 subclasses) |
| EldritchInvocation (Warlock only) | ~20 |
| SpellList entries (all classes combined) | ~600–700 spell-class associations (spells appear on multiple lists) |
| SubclassSpellTable entries | ~40–50 level rows across Cleric, Druid, Paladin, Warlock subclasses |
| BeastShapesTable rows | 3 |
| **Total parseable entities** | **~1,150–1,300** |

---

## Parser Priority

**Critical**

Classes are the core of any D&D character builder. Without this chapter parsed, you cannot:
- Build or display a character sheet
- Track level-up progression or class features
- Know a character's spell slots, hit dice, saving throw proficiencies, or ability score improvement levels
- Show which spells a class can learn
- Implement subclass selection or feature unlocking

All 12 classes, all 20 levels of progression per class, all class features, all spell lists, and all subclasses must be parsed for a minimum viable product. The Warlock invocations are also critical since they function as that class's primary build customization mechanism. This chapter should be the first priority after foundational infrastructure (legal, glossary).

### Recommended parse order within chapter
1. Core Traits tables (class metadata — fast, uniform)
2. Features progression tables (level/proficiency/feature columns)
3. Class feature prose (`**Level N: Name**` blocks)
4. Subclass headings and subclass feature prose
5. Spell lists (large but structurally regular)
6. Subclass spell tables (embedded in subclass feature prose)
7. Eldritch Invocations (Warlock-specific block)
8. Beast Shapes table (Druid-specific secondary table)
