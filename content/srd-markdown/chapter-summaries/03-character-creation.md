# Chapter 03: Character Creation — Parser Planning Summary

## Overview

This chapter covers the full character creation workflow: class selection, origin (background + species + languages), ability score generation, alignment, and level-up mechanics. It also covers multiclassing rules, starting at higher levels, and a 100-entry trinkets table. It is a procedural chapter rather than a data-definition chapter — it references data defined elsewhere (classes, backgrounds, species, feats) while containing several standalone reference tables that are self-contained and directly parseable.

## Content Structure

- **Top-level headings (`#`)**: Used inconsistently — appears both as the document title and as an artifact of PDF-to-markdown extraction (e.g., `# **Character** **Creation**` duplicates the H1 title with bold tokens).
- **H2 (`##`)**: Major sections: `## Page N` (pagination markers from extraction), `## Level Advancement`, `## Multiclassing`, `## Trinkets`, `## Starting at Higher Levels`.
- **H3 (`###`)**: Not present.
- **H4 (`####`)**: Used for subsections: `#### Step 1: Choose Class`, `#### Step 2: Character Origin`, `#### Step 3: Ability Scores`, `#### Step 4: Alignment`, `#### Step 5: Character Creation Details`, `#### Gaining a Level`, `#### Tiers of Play`, `#### Prerequisites`, `#### Experience Points`, `#### Hit Points and Hit Point Dice`, `#### Proficiency Bonus`, `#### Proficiencies`, `#### Class Features`, `#### Creating Your Character`, `#### Starting Equipment`.
- **Bold (`**text**`)**: Used for table titles (standalone line before the pipe table), sub-step labels within numbered lists, and inline formula labels. Also used in the heading tokens due to PDF extraction artifacts.
- **Italic-bold (`_**text**_`)**: Used for named sub-items within narrative paragraphs, functioning like definition terms (e.g., `_**Standard Array.**_`, `_**Spells Prepared.**_`).
- **Italic (`_text_`)**: Used similarly to italic-bold for sub-item labels in some sections.
- **Blockquotes (`>`)**: One instance — a sidebar/callout box ("Unaligned Creatures").
- **Bulleted lists (`-`)**: Used for enumeration (e.g., language choice questions, multiclass spellcasting slot calculation inputs).
- **Numbered lists (inline bold)**: Step sequences are formatted as bold inline text within a paragraph block, not as markdown ordered lists (e.g., `**1: Choose a Class.**`).
- **Pipe tables**: The primary structured data format. Multiple tables present.
- **HTML in tables**: `<br>` tags appear inside table cells to represent line breaks within a cell (e.g., multi-ability primary abilities like `Strength<br>or Dexterity`).
- **Page marker comments**: HTML comments `<!-- source_txt: ... -->` and `<!-- source_image: ... -->` mark page boundaries.
- **Inline formulas**: Mathematical relationships written as bold standalone lines (e.g., `**Passive Perception** = 10 + Wisdom (Perception) check modifier`).

## Data Types Extractable

**ClassOverview**
- Fields: `name: string`, `likes: string`, `primaryAbility: string[]`, `complexity: "Low" | "Average" | "High"`
- Source: "Class Overview" table (split across two page breaks, requires merging)

**AbilityScoreBackground**
- Fields: `ability: string`, `background: string`
- Source: "Ability Scores and Backgrounds" table (split across page break p019/p020, requires merging)

**StandardLanguage**
- Fields: `d12Result: string` (range like `"3-4"` or `"—"`), `language: string`
- Source: "Standard Languages" table

**RareLanguage**
- Fields: `name: string`, `note?: string` (footnote for Primordial dialects)
- Source: "Rare Languages" table (two-column layout)

**AbilityScorePointCost**
- Fields: `score: number`, `cost: number`
- Source: "Ability Score Point Costs" table (two score/cost column pairs per row)

**StandardArrayByClass**
- Fields: `class: string`, `str: number`, `dex: number`, `con: number`, `int: number`, `wis: number`, `cha: number`
- Source: "Standard Array by Class" table

**AbilityScoreModifier**
- Fields: `scoreRange: [number, number]`, `modifier: number`
- Source: "Ability Scores and Modifiers" table (two score/modifier column pairs per row)

**Alignment**
- Fields: `name: string`, `abbreviation: string`, `description: string`
- Source: narrative paragraphs under "Step 4: Alignment" using `_**Name (AB).**_` pattern

**LevelAdvancement**
- Fields: `level: number`, `xpRequired: number`, `proficiencyBonus: number`
- Source: "Character Advancement" table

**Level1HitPointsByClass**
- Fields: `classGroup: string[]`, `formula: string` (e.g., `"12 + Con. modifier"`)
- Source: "Level 1 Hit Points by Class" table

**FixedHitPointsByClass**
- Fields: `classGroup: string[]`, `formula: string` (e.g., `"7 + Con. modifier"`)
- Source: "Fixed Hit Points by Class" table

**TierOfPlay**
- Fields: `tier: number`, `levelRange: [number, number]`, `description: string`
- Source: "Tiers of Play" subsection, bold-labeled paragraphs

**StartingEquipmentAtHigherLevels**
- Fields: `levelRange: [number, number]`, `equipment: string`, `magicItems: string`
- Source: "Starting Equipment at Higher Levels" table

**MulticlassSpellSlots**
- Fields: `characterLevel: number`, `slots: Record<1|2|3|4|5|6|7|8|9, number>`
- Source: "Multiclass Spellcaster: Spell Slots per Spell Level" table (dash `—` = 0)

**Trinket**
- Fields: `d100Result: string` (e.g., `"01"`, `"00"`), `description: string`
- Source: "Trinkets" table (split across three page segments)

**MulticlassPrerequisite**
- Fields: `class: string`, `requiredAbility: string`, `minimumScore: number`
- Source: narrative text only (no table); inferred from prose — harder to parse reliably

## Parsing Complexity

**Medium**

The tables are well-structured GFM pipe tables and straightforward to parse individually. However, several complications elevate complexity above Low:

1. Several tables are split across `## Page N` boundary markers and must be merged.
2. The "Class Overview" table has a standalone bold header row (`**Class** **Likes ...** ...`) above the pipe table that is not a proper header row — it is a vestigial PDF artifact and should be discarded.
3. Multi-value cells use `<br>` for line breaks (e.g., `Strength<br>or Dexterity`) requiring HTML-aware cell parsing.
4. Some tables use a dual-column layout within one table (e.g., Ability Score Point Costs has `Score | Cost | Score | Cost`), requiring each row to produce two logical records.
5. Alignment entries are embedded in narrative prose, not tables, and must be extracted by matching the `_**Name (AB).**_` italic-bold pattern.
6. Numbered creation steps are inline bold within paragraphs, not standard markdown ordered lists.

## Key Patterns

**Table with bold phantom header row (discard the pre-table bold line):**
```
**Class** **Likes ...** **Primary** **Complexity**
**Ability**

| Barbarian | Battle | Strength | Average |
| --- | --- | --- | --- |
```

**Italic-bold definition pattern for named entries:**
```
_**Standard Array.**_ Use the following six scores for
your abilities: 15, 14, 13, 12, 10, 8.
_**Random Generation.**_ Roll four d6s and record
```

**Inline formula (bold label + math expression):**
```
**Passive Perception** = 10 + Wisdom (Perception)
check modifier
```

**Table cell with `<br>` for multi-value entries:**
```
| Fighter | Weapons | Strength<br>or Dexterity | Low |
| Monk | Unarmed combat | Dexterity and Wisdom | High |
```

**Dual-column table producing two records per row:**
```
| Score | Cost | Score | Cost |
| --- | --- | --- | --- |
| 8 | 0 | 12 | 4 |
| 9 | 1 | 13 | 5 |
```

**Trinket table with zero-padded d100 results and `00` for 100:**
```
| 00 | A metal urn containing the ashes of a hero |
| 01 | A mummified goblin hand |
```

## Edge Cases & Gotchas

1. **Duplicate H1 title**: The file starts with `# Character Creation` (document title) and then immediately has `# **Character** **Creation**` with bold tokens on a sub-heading. These are the same heading; the second should be discarded or treated as decorative.

2. **Page break markers as H2**: `## Page 19`, `## Page 20`, etc. are not semantic section headings — they are extraction artifacts. Any section-boundary detection must skip these.

3. **Table split across page markers**: The "Class Overview" table is interrupted by `## Page 20` (and the page marker comments) between the `| Rogue |` row and the `| Barbarian |` row that appears earlier. A parser walking H2 sections will see two separate table fragments; they must be joined. Same applies to "Ability Scores and Backgrounds" and the "Trinkets" table (split across three pages).

4. **`<br>` in primary ability cells**: `Strength<br>or Dexterity` and `Dexterity and Wisdom` both indicate a class has two primary abilities but use different connectives ("or" vs. "and") with different mechanical meanings.

5. **Phantom header rows**: Several tables have a bold text line immediately before the pipe table that mimics a header (e.g., `**Class** **Likes ...**`). This is a PDF-extraction artifact and is not a proper markdown element.

6. **Trinket d100 uses `00` not `100`**: The last entry is keyed `00` (representing a roll of 100 on a d100), which will fail a naive `parseInt` check.

7. **`—` (em-dash) as zero in Multiclass Spellcaster table**: Spell slot values of `—` mean 0 available slots, not null/missing data.

8. **XP numbers use comma formatting**: Values like `2,700` and `100,000` in the Character Advancement table contain commas and will fail `parseInt` without stripping them first.

9. **Alignment descriptions span a page break**: The Neutral (N) alignment description is split by the `## Page 22` marker and a blockquote sidebar mid-paragraph. The description text must be concatenated across the page boundary.

10. **Rare Languages table has a two-column layout**: The table has `Language | Language` as headers with entries in both columns — each row yields two language records, with possible empty right cells.

11. **Footnote after Rare Languages table**: The asterisk footnote `*Primordial includes...` appears as a plain paragraph below the table and is not structurally linked to the table row that contains `Primordial*`.

## Estimated Entry Count

| Data Type | Count |
| --- | --- |
| ClassOverview entries | 12 |
| AbilityScoreBackground pairs | 6 (only Soldier/Acolyte in SRD) |
| StandardLanguage entries | 13 (including Common at "—") |
| RareLanguage entries | 9 |
| AbilityScorePointCost entries | 8 |
| StandardArrayByClass rows | 12 |
| AbilityScoreModifier ranges | 10 |
| Alignment entries | 9 |
| LevelAdvancement rows | 20 |
| Level1HitPointsByClass rows | 4 |
| FixedHitPointsByClass rows | 4 |
| TierOfPlay entries | 4 |
| StartingEquipmentAtHigherLevels rows | 4 |
| MulticlassSpellSlots rows | 20 |
| Trinket entries | 100 |
| **Total** | **~235** |

## Parser Priority

**Important**

This chapter contains several globally-required reference tables (LevelAdvancement, AbilityScoreModifier, AbilityScorePointCost, MulticlassSpellSlots) that are foundational to character builder logic and must be available in the rules engine. The ClassOverview and StandardArray tables are useful for the character creation wizard UX. Alignments are simple enums. Trinkets are nice-to-have flavor data with no mechanical weight. The multiclassing prerequisite rules are narrative-only (no table) and can be hardcoded more easily than parsed. Overall the chapter is not the richest source of game-mechanic data (classes, spells, and feats chapters will be more complex), but the reference tables here are indispensable for core character math.
