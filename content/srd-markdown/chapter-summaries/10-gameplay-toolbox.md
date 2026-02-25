# Chapter 10: Gameplay Toolbox — Parser Planning Summary

## Overview

This chapter is a GM-facing reference covering optional and supplemental game systems: travel pace and terrain, custom background creation, curses, magical contagions, environmental hazards, fear/mental stress rules, poisons, traps, and combat encounter building. It is a collection of heterogeneous rule subsystems rather than a single structured content type. Its relevance to parsing is moderate — it contains several well-structured data entries (poisons, traps, terrain table) alongside large swaths of narrative GM guidance that is not easily typed.

## Content Structure

- **Page markers**: Each page boundary is wrapped in `## Page NNN` headings with HTML comment annotations for source files.
- **Section headings**: Mix of `##` (major section) and `####` (subsection). `###` is unused. `#` appears once as a re-statement of the chapter title (artifact from OCR/extraction).
- **Named entries** (poisons, traps, contagions): Structured as a bold name line + italic type tag on the next line, followed by prose with bold lead-in bullet-style paragraphs.
- **Italic subheadings within entries**: Used for subsections like `_**Fighting the Contagion.**_`, `_**Detect and Disarm.**_`, `_**At Higher Levels.**_`.
- **Scaling tables**: Each trap entry concludes with a raw text header line (`**Levels** **Bludgeoning Damage** **Save DC**`) followed immediately by a markdown table. The text header is redundant with the table header but must be recognized as pre-table noise.
- **Tables**: Standard GFM pipe tables. The Travel Terrain table is the most complex (6 columns). Tables appear mid-section and also as standalone scaling tables per trap entry.
- **Table footnotes**: Appear as plain text lines starting with `*` or `†` immediately after a table, not in a standard footnote syntax.
- **Bold lead-in lists**: Many subsections use `**Term.** Prose...` at the paragraph level rather than actual list markers — a common pattern across the whole source.
- **Inline italics**: Spell names, item names, and emphasis use single `_underscores_`. Some use bold-italic `_**...**_` for named subheadings inside entries.
- **Damage expressions**: Follow the pattern `NN (XdY)` throughout (e.g., `11 (2d10)`).

## Data Types Extractable

### TerrainType
- `name: string`
- `maximumPace: "Slow" | "Normal" | "Fast" | "Special"`
- `encounterDistance: DiceExpression` (e.g., `"6d6 × 10 feet"`)
- `foragingDC: number`
- `navigationDC: number`
- `searchDC: number`
- `notes?: string` (for footnote-flagged rows like Arctic, Waterborne)

### CustomBackgroundStep
- `stepNumber: number`
- `title: string`
- `description: string`

### MagicalContagion
- `name: string`
- `incubationPeriod?: DiceExpression`
- `effects: ContagionEffect[]` (each with a name and description)
- `fightingThreshold?: { saveDC: number; saveAttribute: string; successesRequired?: number }`
- `spreadingMechanism?: string`

### EnvironmentalHazard
- `name: string`
- `saveDC: number | "scaling"`
- `saveAttribute: string`
- `effect: string` (typically Exhaustion gain)
- `automaticSuccessCondition?: string`

### Curse (narrative, loosely structured — hard to fully type)
- `name: string`
- `type: "bestow" | "creature" | "item" | "narrative" | "environmental"`
- `description: string`
- `removalMethod?: string`

### DemonicPossession (specific environmental curse, structured enough to type)
- `saveDC: 15`
- `saveAttribute: "Charisma"`
- `triggerCondition: string`
- `ongoingSaveTrigger: string`
- `removalMethods: string[]`

### Poison
- `name: string`
- `cost: number` (in GP)
- `type: "Contact" | "Ingested" | "Inhaled" | "Injury"`
- `saveDC: number`
- `saveAttribute: string`
- `damageOnFail?: DamageExpression`
- `damageOnSuccess?: DamageExpression | "half"`
- `conditions?: Condition[]`
- `specialRules?: string`

### Trap
- `name: string`
- `severity: "Nuisance" | "Deadly"`
- `levelRange: string` (e.g., `"1-4"`, `"11-16"`)
- `trigger: string`
- `duration: string`
- `description: string`
- `saveDC: number`
- `saveAttribute: string`
- `damageOnFail?: DamageExpression`
- `damageOnSuccess?: DamageExpression | "half"`
- `detectAndDisarm?: string`
- `scaling: TrapScalingEntry[]` (per level band)

### TrapScalingEntry
- `levelRange: string`
- `damage?: string`
- `saveDC?: number`
- `areaOfEffect?: string`
- `pitDepth?: string`

### EncounterXPBudget
- `partyLevel: number` (1–20)
- `low: number`
- `moderate: number`
- `high: number`

### FearDC / MentalStressDC (reference tables)
- `example: string`
- `saveDC: number`
- `psychicDamage?: DiceExpression`

## Parsing Complexity

**High**

The chapter combines at least 7 structurally different content types under one roof. The main challenges are:

1. Entry boundaries are not uniform — poisons use bold-name + italic-type, traps use bold-name + italic-severity-and-levels, contagions use bold-name + italic-type. A single pattern won't match all.
2. The scaling table for each trap is preceded by a redundant plain-text header line that must be discarded or ignored.
3. The `Rolling Stone` trap has a dual-severity declaration (`_Deadly Trap (Levels 11–16) or Nuisance Trap (Levels 17–20)_`) which breaks the standard single-severity pattern.
4. The `Midnight Tears` poison entry spans a page boundary — it begins on page 197 and its mechanical effect is on page 198. The `## Page 198` marker splits the entry mid-paragraph.
5. Table footnotes use `*` and `†` inline characters without structured footnote syntax.
6. The `XP Budget per Character` table has its column headers split across three separate lines of OCR-extracted text above the table rather than in the table itself.
7. Curse subtypes vary wildly in structure and can only be parsed as prose + name + type.

## Key Patterns

**Poison entry header:**
```
**Assassin's Blood (150 GP)**
_Ingested Poison_
```

**Trap entry header:**
```
**Collapsing Roof**
_Deadly Trap (Levels 1–4)_

**Trigger:** A creature crosses a trip wire
**Duration:** Instantaneous
```

**Italic bold subheading inside entry:**
```
_**Fighting the Contagion.**_ At the end of each Long
Rest, an infected creature makes a DC 13 Constitution saving throw.
```

**Contagion effect as bold lead-in:**
```
**Fever.** The creature gains 1 Exhaustion level, which
lasts until the contagion ends on the creature.
```

**Trap scaling (pre-table noise line + GFM table):**
```
**Levels** **Bludgeoning Damage** **Save DC**

| Levels | Bludgeoning Damage | Save DC |
| --- | --- | --- |
| 5–10 | 22 (4d10) | 15 |
```

**Travel terrain table footnotes:**
```
*Appropriate equipment (such as skis) is necessary to keep up a Fast pace in Arctic terrain.
†Characters' rate of travel while waterborne depends on the vehicle carrying them; see "Vehicles."
```

## Edge Cases & Gotchas

- **Dual page-1 `#` heading**: The chapter starts with a `# Gameplay Toolbox` at line 1 (file metadata) and again at line 10 inside the page block. The second `#` is the real chapter title; the first is a file-level label.
- **Rolling Stone dual severity**: `_Deadly Trap (Levels 11–16) or Nuisance Trap (Levels 17–20)_` — no other trap has this format. The parser needs a special case or a more flexible regex.
- **Page-split entry**: `Midnight Tears` begins its name/type block on page 197 but its saving throw mechanic text continues after the `## Page 198` page-break heading. Any parser that resets context on page markers will break this entry.
- **Damage expressions with line breaks**: The Spiked Pit scaling table uses `<br>` inside a table cell: `10 (3d6) Bludgeoning plus 13<br>(3d8) Piercing`. This is the only table cell using HTML `<br>` in the chapter.
- **XP Budget table orphaned headers**: The column headers `**Party's Level**`, `**——— Encounter Difficulty ———**`, and `**Low** **Moderate** **High**` appear as separate plain text lines above the table rather than as part of it. The actual markdown table starts with numeric rows (`| 1 | 50 | 75 | 100 |`), with no header row.
- **Background creation steps use `####` headings numbered 1–5** but are not a distinct content type from the surrounding prose — they are a procedural list formatted as subheadings.
- **Spell and item names in italic**: Inline references to spells and magic items are in `_italics_` throughout but are not tagged or distinguished from emphasis or subheading italic.
- **Page number footers**: Each page ends with a line like `**192** System Reference Document 5.2.1` — these must be filtered out.

## Estimated Entry Count

| Content Type | Count |
| --- | --- |
| Terrain types (table rows) | 11 |
| Background creation steps | 5 |
| Curse subtypes | 5 (Bestow, Creature, Item, Narrative, Environmental/Demonic Possession) |
| Magical contagions | 3 (Cackle Fever, Sewer Plague, Sight Rot) |
| Environmental hazards | 8 (Deep Water, Extreme Cold, Extreme Heat, Frigid Water, Heavy Precipitation, High Altitude, Slippery Ice, Strong Wind, Thin Ice) |
| Poisons | 13 |
| Traps | 8 |
| XP Budget table rows | 20 (levels 1–20) |
| Fear DC examples | 3 |
| Mental Stress DC examples | 3 |
| **Total distinct parseable entries** | **~79** |

## Parser Priority

**Nice-to-have** (with two exceptions that are **Important**)

- **Poisons (Important)**: 13 well-structured entries with consistent name/type/cost/DC/effect patterns. Useful for a compendium reference and for tracking poison application in a character builder.
- **XP Budget table (Important)**: The encounter building budget table is directly useful for a DM-facing encounter builder tool and is a clean 20-row lookup table once the orphaned headers are handled.
- **Traps (Nice-to-have)**: Useful for a compendium but not needed for character building or rules engine core.
- **Travel Terrain table (Nice-to-have)**: Useful reference but primarily a DM tool.
- **Environmental Hazards (Nice-to-have)**: Rule lookups; structured but low mechanical depth.
- **Curses & Contagions (Nice-to-have)**: Interesting content but highly narrative; Demonic Possession is the only one structured enough to fully type.
- **Combat Encounter guidance, Background creation steps (Skip for now)**: Pure GM narrative guidance with no typed structure that benefits a character builder or rules engine.
