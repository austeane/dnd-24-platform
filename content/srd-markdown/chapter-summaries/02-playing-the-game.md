# Chapter 02: Playing the Game — Parser Planning Summary

## Overview

This chapter covers the foundational rules of D&D play: the six ability scores and modifiers, D20 Tests (ability checks, saving throws, attack rolls), proficiency, actions, social interaction, exploration, combat mechanics, and damage/healing. It is the single most important chapter for a rules engine because it defines the core numeric systems (ability scores → modifiers, proficiency bonus by level/CR, DC tables, cover bonuses, travel pace, creature sizes) that nearly every other rule references.

## Content Structure

- **Top-level heading (`#`)**: Used for the chapter title ("Playing the Game"), appears twice — once as the file's logical title and once immediately after the page-5 HTML comment block. Effectively a duplicate artifact of the extraction process.
- **`## Page N` headings**: Each physical page is separated by a `## Page N` heading followed by two HTML comments (`<!-- source_txt: ... -->`, `<!-- source_image: ... -->`). These are structural noise from the PDF extraction, not game content.
- **`## Section` headings (H2)**: Major game rules sections — "The Six Abilities", "D20 Tests", "Proficiency", "Actions", "Social Interaction", "Exploration", "Combat", "Damage and Healing".
- **`#### Subsection` headings (H4)**: Subsections within major sections — "Ability Checks", "Saving Throws", "Attack Rolls", "Advantage/Disadvantage", "Skill Proficiencies", etc. H3 (`###`) is not used at all; heading levels jump from H2 to H4.
- **Bold table titles (plain text, not headings)**: Tables are preceded by a bolded plain-text label on its own line (e.g., `**Ability Descriptions**`), followed by an optional bolded column-header row (also plain text, not a real table header), and then the actual GFM table. This is a consistent but non-standard pattern.
- **Bold paragraph labels**: Many subsections start with a bold run-in label: `**Ability Modifier**`, `**Proficiency Bonus**`, `**Difficulty Class**`, etc. These are not headings — they are bold text at the start of a paragraph.
- **Numbered-step bold text**: Procedural steps are formatted as bold inline text at the start of a paragraph, e.g., `**1: The Game Master Describes a Scene.**` — not as ordered list items.
- **Italic-bold run-in definitions**: Sub-rules within sections use `_**Term.**_` at the start of a sentence, e.g., `_**Bright Light.**_`, `_**Round Down**_`.
- **Bullet lists**: Used sparingly — for special senses (Blindsight, Darkvision, etc.) and hazards (Burning, Falling, etc.). Items are bare words with no additional structure.
- **GFM tables**: 2–3 column tables for all lookup data. Some cells contain `<br>` tags for multi-line content within a single cell.
- **Inline bold**: Game terms are bolded inline throughout prose (e.g., "Armor Class", "Critical Hit", "Proficiency Bonus").
- **Inline italic**: Used for spell names and item names (e.g., `_Fireball_`, `_Cure Wounds_`).
- **Page-number watermarks**: Bare numbers like `**6** System Reference Document 5.2.1` appear mid-text as extraction artifacts.

## Data Types Extractable

**AbilityScore**
- `name`: string (Strength | Dexterity | Constitution | Intelligence | Wisdom | Charisma)
- `measures`: string (human-readable description)
- `defaultCheckUse`: string (example use description)

**AbilityModifierTable** (lookup table)
- `score`: number | range string (e.g., "2–3")
- `modifier`: number (−5 to +10)

**AbilityScoreMeaning** (lookup table)
- `scoreRange`: string (e.g., "2–9", "10–11")
- `meaning`: string

**Skill**
- `name`: string (18 entries)
- `ability`: string (governing ability)
- `exampleUses`: string

**ProficiencyBonusTable** (lookup table)
- `levelOrCRRange`: string (e.g., "Up to 4", "5–8")
- `bonus`: number (+2 to +9)

**Action** (core action types)
- `name`: string (Attack, Dash, Disengage, Dodge, Help, Hide, Influence, Magic, Ready, Search, Study, Utilize)
- `summary`: string

**DifficultyClass** (named DCs)
- `difficulty`: string (Very easy | Easy | Medium | Hard | Very hard | Nearly impossible)
- `dc`: number (5 | 10 | 15 | 20 | 25 | 30)

**CoverType**
- `degree`: string (Half | Three-Quarters | Total)
- `benefit`: string
- `offeredBy`: string

**CreatureSize**
- `size`: string (Tiny | Small | Medium | Large | Huge | Gargantuan)
- `spaceFeet`: string (e.g., "5 by 5 feet")
- `spaceSquares`: string (e.g., "1 square")

**TravelPace**
- `pace`: string (Fast | Normal | Slow)
- `perMinute`: string
- `perHour`: string
- `perDay`: string
- `effect`: string (Advantage/Disadvantage implications)

**AttackRollAbility**
- `ability`: string
- `attackType`: string

**LightLevel**
- `name`: string (Bright Light | Dim Light | Darkness)
- `obscuredCategory`: string (None | Lightly Obscured | Heavily Obscured)

**SpecialSense** (enumeration only — no stats in this chapter)
- `name`: string (Blindsight | Darkvision | Tremorsense | Truesight)

**Hazard** (enumeration only — no stats in this chapter)
- `name`: string (Burning | Falling | Suffocation | Dehydration | Malnutrition)

**CoreRule / RulesText** (prose rules not reducible to structured data)
- `id`: string (slug)
- `title`: string
- `body`: string (markdown)
- Examples: Advantage/Disadvantage stacking rules, Death Saving Throws, Resistance/Vulnerability order of operations, Temporary Hit Points behavior

## Parsing Complexity

**Medium-High**

The tables themselves are straightforward GFM. The difficulty comes from:

1. The page-break headings (`## Page N`) and extraction artifacts (page-number watermarks, duplicate H1) that must be stripped before parsing.
2. The non-standard table titling pattern: a bold plain-text label + an optional fake column-header row appear before the real `| --- |` table. A naive parser will either skip the title or attempt to parse the fake header row as data.
3. The heading level skip (H2 → H4, no H3) means section hierarchy cannot be inferred from level alone.
4. Bold run-in labels within paragraphs (`**Proficiency Bonus**`) look syntactically identical to bold terms in prose — context is needed to distinguish sub-rule headings from emphasis.
5. Some table cells contain `<br>` for multi-line values that need to be either preserved or normalized.
6. The chapter is long (1518 lines, 14 physical pages) and mixes many data-type categories in a single file.

## Key Patterns

**Page-break separator with HTML comments (noise to strip):**
```
## Page 6

<!-- source_txt: srd_extract/run2/pages/p006.txt -->
<!-- source_image: srd_extract/run2/images/p006.png -->
```

**Bold table title + fake header row + real GFM table:**
```
**Ability Descriptions**

**Ability** **Score Measures …**

| Strength | Physical might |
| --- | --- |
```

**Italic-bold run-in sub-rule definition:**
```
_**Bright Light.**_ Bright Light lets most creatures see
normally.
```

**Numbered-step as bold inline text (not an ordered list):**
```
**1: The Game Master Describes a Scene.** The GM
tells the players where their adventurers are...
```

**Page-number watermark artifact (mid-content):**
```
**6** System Reference Document 5.2.1
```

**Bullet list of bare enumeration terms:**
```
Blindsight
Darkvision
Tremorsense
Truesight
```
(These appear under a `####` heading with no `-` or `*` prefix — they are bare lines, not standard markdown list items.)

**Table cell with `<br>` for multi-line content:**
```
| 1 | This is the lowest a score can normally go.<br>If an effect reduces a score to 0, that effect<br>explains what happens. |
```

## Edge Cases & Gotchas

1. **Duplicate H1**: The file has `# Playing the Game` at line 1 (file title) and again at line 10 (inside the first page block). A parser treating the first H1 as the document title will encounter a second H1 and must decide how to handle it.

2. **`## Page N` as H2**: Page-break headings are H2, the same level used for major game sections. A parser cannot distinguish them by heading level alone — it must match the pattern `/^## Page \d+$/` to identify and strip them.

3. **Fake table header rows**: The lines like `**Ability** **Score Measures …**` appear between the bold table title and the real table. They look like paragraph text but logically describe column names that are duplicated (sometimes inconsistently) in the actual table's first row. In some tables the fake header matches the real header exactly; in others (like "Ability Descriptions") the real table has no header row at all — the fake header is the only column-label.

4. **Missing H3 level**: All subsections under H2 sections use H4 (`####`), skipping H3 entirely. Any tree-building parser expecting sequential heading levels will produce incorrect nesting.

5. **Bare-word list items**: The special senses and hazard lists (lines 766–769, 844–848) have no list marker — they are just bare words on consecutive lines. Standard markdown parsers will render these as separate paragraphs, not a list. A custom parser must detect them as implicit enumerations by context (following a specific `####` heading pattern).

6. **Table split across page break**: The Actions table is split by a `## Page 10` break (lines 562–585). The first half of the table ends at page 9, and the second half resumes after the page separator. A naive parser will see two separate tables; they must be merged.

7. **Inline italics for spell/item names**: Spell names like `_Fireball_` and `_Cure Wounds_` use single underscore italics. These look identical to `_**Term.**_` italic-bold run-ins at the character level; parsers must distinguish by whether the content also has `**` inside.

8. **Formula as inline bold**: `**Base AC** = 10 + the creature's Dexterity modifier` — a mathematical formula presented as a bold text block inside a paragraph, not a code block or table.

9. **Score ranges as strings**: Table rows use en-dash ranges like `2–3`, `5–8` (Unicode en-dash U+2013, not ASCII hyphen). Numeric range parsing must handle this character.

## Estimated Entry Count

| Data Type | Count |
|---|---|
| Ability scores (with descriptions) | 6 |
| Ability modifier table rows | 16 |
| Ability score meaning rows | 7 |
| Skills (with ability + example) | 18 |
| Proficiency bonus table rows | 8 |
| Typical DC table rows | 6 |
| Core actions | 11 |
| Attack roll ability rows | 3 |
| Cover types | 3 |
| Creature sizes | 6 |
| Travel pace rows | 3 |
| Special senses (enumerated) | 4 |
| Hazards (enumerated) | 5 |
| Named prose rules (CoreRule) | ~25–30 |

**Total structured entries: ~120–125**
**Total prose rule blocks: ~25–30**

## Parser Priority

**Critical**

This chapter defines the numeric backbone of the entire rules engine: ability scores, modifiers, proficiency bonus scaling, skill list, DC table, action economy, cover, movement, damage, and death mechanics. Any character builder or rules engine feature — from stat blocks to combat simulation to skill checks — depends on data from this chapter. It should be parsed first or in tandem with the character creation chapter.
