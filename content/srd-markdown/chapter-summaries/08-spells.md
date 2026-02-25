# Chapter 08: Spells — Parser Planning Summary

## Overview

This is the largest chapter in the SRD by a wide margin (9,274 lines). It opens with roughly three pages of rules prose covering Gaining Spells, Casting Spells, Spell Level, Spell Slots, Schools of Magic, Casting Time mechanics, Range, Components, Duration, and Effects. The bulk of the chapter (from line 361 onward) is the **Spell Descriptions** section: an alphabetically sorted list of 339 distinct spell entries (312 leveled spells + 27 cantrips). No class spell list tables appear before the descriptions; the introductory prose merely notes that class membership appears in parentheses inside each spell's school line. Four embedded monster stat blocks appear mid-chapter as sub-entries inside certain spells (Animate Objects → Animated Object, Find Steed → Otherworldly Steed, Giant Insect → Giant Insect, Summon Dragon → Draconic Spirit). The chapter ends without any trailing appendix or index.

---

## Content Structure

### Pre-description rules section (lines 1–360)

- `##` headings for major rule sections: **Gaining Spells**, **Casting Spells**, **Spell Descriptions**
- `####` headings for subsections: Preparing Spells, Always-Prepared Spells, Spell Level, School of Magic, Casting Time, Range, Components, Duration, Effects
- Two inline tables in the rules preamble: *Spell Preparation by Class* and *Schools of Magic*, both rendered as pipe-delimited markdown tables
- Rule explanation text is plain paragraphs with occasional `**bold**` terms and `_italic_` spell-name cross-references

### Spell entry structure (lines 361–9274)

Each spell entry follows this template:

```
**Spell Name**
_Level N School (Class, Class, ...)_
                        — OR —
_School Cantrip (Class, Class, ...)_

**Casting Time:** <value>
**Range:** <value>
**Components:** <value>
**Duration:** <value>


<description body>
_**Using a Higher-Level Spell Slot.**_ <text>
            — OR —
_**Cantrip Upgrade.**_ <text>
```

- Spell name: `**bold**` on its own line
- Level/school line: single `_italic_` line immediately below the name (occasionally wraps to two italic lines when the class list is long)
- Metadata block: four `**bold label:** value` lines with a blank line before the description
- Description body: plain paragraphs; may include bold-prefixed sub-options (`**Option Name.**`), italic-bold sub-options (`_**Sub-option.**_`), unordered lists (`-` prefix), or embedded pipe tables
- Upgrade section: italic-bold inline section at the end, if present
- Page-break markers: `## Page NNN` lines plus HTML comments appear throughout and must be ignored by the parser

---

## Data Types Extractable

### `Spell`

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Bold heading line |
| `level` | `0–9` | 0 for cantrips |
| `school` | `string` | e.g. `"Evocation"` |
| `classes` | `string[]` | Class names in parentheses |
| `isCantrip` | `boolean` | Determined by header format |
| `isRitual` | `boolean` | Presence of `Ritual` in Casting Time |
| `castingTime` | `string` | Raw string (complex values possible) |
| `range` | `string` | e.g. `"90 feet"`, `"Self"`, `"Touch"` |
| `components` | `{ v: bool, s: bool, m: string | null }` | Material component text if present |
| `materialConsumed` | `boolean` | Presence of "which the spell consumes" in material text |
| `materialCost` | `string | null` | e.g. `"1,000+ GP"` if a cost is specified |
| `duration` | `string` | Raw string |
| `concentration` | `boolean` | Presence of "Concentration" in duration |
| `descriptionMd` | `string` | Full body markdown |
| `higherLevelText` | `string | null` | Text of "Using a Higher-Level Spell Slot" section |
| `cantripUpgradeText` | `string | null` | Text of "Cantrip Upgrade" section |
| `hasTables` | `boolean` | Whether description contains embedded tables |
| `hasEmbeddedStatBlock` | `boolean` | Whether a `### **StatBlockName**` follows the spell |

### `SpellPreambleTable` (minor, from rules section)

Two small tables before the descriptions: *Spell Preparation by Class* and *Schools of Magic*. These are static reference data, not runtime spell objects.

### `EmbeddedStatBlock` (four instances)

Four spells embed a full creature stat block using `### **Name**` heading followed by a structured block. These cannot be parsed as ordinary Spell fields and require separate handling.

---

## Parsing Complexity

**High**

Reasons:
1. **Two structurally different header formats** for cantrips vs leveled spells that must be distinguished before any other field is parsed.
2. **Multi-line italic class list**: when the class parenthetical is long, it wraps to a second `_…_` line (e.g. `_Level 4 Abjuration (Cleric, Paladin, Sorcerer, Warlock,_` followed by `_Wizard)_`). A naive single-line regex will miss the continuation.
3. **Multi-line Casting Time values**: Reaction spells have a two- or three-line Casting Time entry whose trigger description flows onto the next lines before the Range field begins.
4. **Multi-line Components values**: material component descriptions frequently wrap across lines (e.g. the Astral Projection component description spans three lines).
5. **Four embedded stat blocks** inside spell entries that must be detected and treated separately from the spell description body.
6. **Page-break noise**: `## Page NNN` headers and HTML `<!-- source_... -->` comment blocks are interspersed throughout and must be stripped before any other parsing.
7. **Multiple table shapes**: embedded tables within spell descriptions vary from simple 2-column tables to 5-column tables with merged-cell values (e.g. Teleport's outcome table, Control Weather's three stage tables).
8. **Irregular list indentation**: some bullet lists use `- ` at the left margin and others use five-space indentation (`     - `), both occurring within spell description bodies.
9. **Duration variety**: values include `"Instantaneous"`, `"Concentration, up to 1 minute"`, `"Until dispelled"`, `"Until dispelled or triggered"`, `"Special"`, and time spans up to `"1 day"`.

---

## Key Patterns

### Leveled spell header

```
**Acid Arrow**
_Level 2 Evocation (Wizard)_
```

### Cantrip header (school comes first)

```
**Acid Splash**
_Evocation Cantrip (Sorcerer, Wizard)_
```

### Wrapped class list (two italic lines)

```
_Level 4 Abjuration (Cleric, Paladin, Sorcerer, Warlock,_
_Wizard)_
```

### Standard metadata block

```
**Casting Time:** Action
**Range:** 90 feet
**Components:** V, S, M (powdered rhubarb leaf)
**Duration:** Instantaneous
```

### Ritual Casting Time (two formats observed)

```
**Casting Time:** 1 minute or Ritual
```
```
**Casting Time:** Action or Ritual
```

### Reaction Casting Time (multi-line)

```
**Casting Time:** Reaction, which you take when you see a
creature within 60 feet of yourself casting a spell with
Verbal, Somatic, or Material components
```

### Material component that spans two lines

```
**Components:** V, S, M (for each of the spell's targets,
one jacinth worth 1,000+ GP and one silver bar worth
100+ GP, all of which the spell consumes)
```

### Material component with no Verbal or Somatic

```
**Components:** S, M (ink worth 10+ GP, which the spell
consumes)
```

### Using a Higher-Level Spell Slot section

```
_**Using a Higher-Level Spell Slot.**_ The damage
(both initial and later) increases by 1d4 for each
spell slot level above 2.
```

### Cantrip Upgrade section

```
_**Cantrip Upgrade.**_ The damage increases by 1d6
when you reach levels 5 (2d6), 11 (3d6), and 17
(4d6).
```

### Bold-prefix sub-options within description

```
**Audible Alarm.** The alarm produces the sound of
a handbell for 10 seconds within 60 feet of the
warded area.
**Mental Alarm.** You are alerted by a mental ping
if you are within 1 mile of the warded area.
```

### Italic-bold sub-options within description

```
_**Aquatic Adaptation.**_ You sprout gills and grow
webs between your fingers.
_**Change Appearance.**_ You alter your appearance.
```

### Embedded table within spell description

```
**Omens**

**Omen** **For Results That Will Be …**

| Weal | Good |
| --- | --- |
| Woe | Bad |
```

Note the duplicated header row pattern: a bold pseudo-header line appears above the pipe table (an artifact of the PDF extraction), and both must be handled.

### Page-break noise to strip

```
## Page 107

<!-- source_txt: srd_extract/run2/pages/p107.txt -->
<!-- source_image: srd_extract/run2/images/p107.png -->
```

### Embedded stat block heading (inside a spell)

```
### **Animated Object**

_Huge or Smaller Construct, Unaligned_

**AC** 15
**HP** 10 (Medium or smaller), 20 (Large), 40 (Huge)
```

---

## Edge Cases & Gotchas

1. **Class list wrap**: Approximately 10–15 spell entries have a two-line italic class list. The continuation line is also wrapped in `_…_`. A parser must join consecutive italic lines that form the same span.

2. **Duplicated table header rows**: Every embedded table is preceded by a line of `**bold**` words that replicates the column headers. This pseudo-header is not part of the markdown table syntax and must not be parsed as a data row. Example from Control Weather: `**Stage** **Condition**` appears above `| Stage | Condition |`.

3. **Teleport table cell with `<br>`**: The Teleportation Outcome table contains a cell with an embedded `<br>` tag: `| Viewed once or<br>described |`. Parsers must handle raw HTML inside table cells.

4. **Bestow Curse higher-slot text is unusually complex**: The higher-level slot text for Bestow Curse is three sentences long and references multiple slot level ranges (4, 5–6, 7–8, 9). Most other spells have one-sentence upgrade text.

5. **Create Undead higher-slot text spans a page break**: The `_**Using a Higher-Level Spell Slot.**_` paragraph for Create Undead is interrupted by a page-break marker mid-sentence and resumes on the next "page." Stripping page markers before splitting on spell boundaries is essential.

6. **Duration: Special**: The Creation spell (line 2302) has `**Duration:** Special` rather than a conventional time span. The spell body explains the duration table-driven by material.

7. **Stat block ability table format inconsistency**: The Animated Object stat block (line 653) uses a 9-column table with all six ability scores in one row (`| Str 16 | +3 | +3 | Dex 10 | ... |`), while the Otherworldly Steed and Giant Insect stat blocks (lines 3508, 4139) use a standard 4-column table with one ability per row. The Draconic Spirit stat block (line 8056) uses yet another variant 9-column layout with column headers (`| Ability | Mod | Save | Ability | Mod | Save | ... |`).

8. **Stat blocks have their own sub-section headers**: Traits, Actions, Bonus Actions are rendered as plain-text lines (not markdown headings) inside stat blocks, e.g. `Actions` on its own line followed by attack descriptions.

9. **Material-only components (no V or S)**: The Illusory Script spell (line 4940) has `**Components:** S, M (ink worth 10+ GP, which the spell consumes)` — no Verbal component. Wish has only `**Components:** V`. These are valid but uncommon patterns.

10. **Concentration cantrip**: Dancing Lights (`_Illusion Cantrip_`) has `**Duration:** Concentration, up to 1 minute`. Most cantrips are Instantaneous — this edge case must not be assumed away.

11. **Five-space indented list items**: Commune with Nature and Bestow Curse use `     - ` (five-space indent) for some list items instead of the more common `- ` (flush). Both appear in the same chapter.

12. **Guards and Wards uses italic-formatted spell names inside a list**: `- _Dancing Lights_ in four corridors, with a simple program...`. Cross-reference spell names are italicized throughout the chapter and appear inside body text, option labels, and list items.

13. **Antipathy/Sympathy spell name contains a slash**: The name `Antipathy/Sympathy` uses a forward slash. Name parsing must treat the full string as the spell name.

14. **Missing blank line between Components and Range for Bless**: On page 113 (line 1204–1212), the Casting Time and Range appear on consecutive lines, then a page break marker intervenes before Components is printed. The parser must be resilient to page-break interruption inside the metadata block.

---

## Estimated Entry Count

- **Total spell entries**: 339
  - Leveled spells (level 1–9): ~312
  - Cantrips (level 0): 27
- **Embedded stat blocks**: 4 (Animated Object, Otherworldly Steed, Giant Insect, Draconic Spirit)
- **Introductory tables**: 2 (Spell Preparation by Class, Schools of Magic)
- **Inline tables within spell descriptions**: at least 10 (Augury Omens, Control Weather ×3, Creation Materials, Teleport Outcome, Symbol effects implied, etc.)

---

## Parser Priority

**Critical**

The spells chapter is the single most important chapter to parse for a D&D character builder, compendium, or rules engine. Spellcasting classes (Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard) all depend on structured spell data to implement:

- Spell preparation and known-spell lists
- Slot expenditure and upcast scaling
- Ritual casting flags
- Component tracking (for focus/pouch substitution logic)
- Concentration conflict detection
- Cantrip level-scaling at character levels 5/11/17

Without parsed spell data, these classes cannot function in a character builder. The sheer size and formatting complexity make this the hardest chapter to parse, but it is also the most irreplaceable. Recommend building a dedicated spell-block tokenizer rather than reusing any general-purpose section parser.
