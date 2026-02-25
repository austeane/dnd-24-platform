# Chapter 05: Character Origins — Parser Planning Summary

## Overview

This chapter covers the two primary origin systems for D&D 2024 characters: **Backgrounds** and **Species**. Both sections follow a consistent field-list format per entry, making them well-suited to structured parsing. The chapter is pages 83–86 of the SRD and represents foundational character-builder data — every character must have one background and one species.

---

## Content Structure

The chapter uses a consistent heading hierarchy for both sections:

- `## **Section Title**` — top-level section (Character Backgrounds, Character Species)
- `#### **Parts of a [Section]**` — schema description block (prose only, not data)
- `#### **[Section] Descriptions**` — signals the start of parseable entries
- `**EntryName**` — bold paragraph-level heading introduces each entry (not an ATX heading)
- `**FieldName:** value` — inline bold label followed by colon-separated value, all on one line
- `_**TraitName.**_` — italic-bold for named special traits within species entries
- Markdown pipe tables appear for Draconic Ancestors and Elven/Fiendish Lineages
- Page-break comments (`## Page NN`) and HTML comments (`<!-- source_txt: ... -->`) are present throughout and must be stripped

Both sections share the same field-label-as-bold-paragraph pattern. Species entries have more free-form prose after the stat block fields.

---

## Data Types Extractable

### `Background`

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Entry name, bold paragraph heading |
| `abilityScores` | `string[]` | Three ability score names |
| `feat` | `string` | Feat name, with reference stripped |
| `skillProficiencies` | `string[]` | Two skill names |
| `toolProficiency` | `string` | One tool, may be a choice |
| `equipment` | `{ optionA: string, optionB: string }` | Always "Choose A or B"; B is always "50 GP" |

### `Species`

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Entry name, bold paragraph heading |
| `creatureType` | `string` | Always "Humanoid" in SRD |
| `size` | `string \| string[]` | May include height range; Human/Tiefling allow Small or Medium |
| `speed` | `number` | In feet |
| `traits` | `SpeciesTrait[]` | Named trait blocks |

### `SpeciesTrait`

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | From `_**TraitName.**_` pattern |
| `description` | `string` | Prose following the trait name |
| `subtrait` | `SubTrait[] \| null` | For choice-based traits (Giant Ancestry, Gnomish Lineage, Draconic Ancestry, Elven/Fiendish Lineage) |

### `LineageTable` / `AncestryTable`

| Field | Type | Notes |
|---|---|---|
| `tableName` | `string` | Table header text |
| `columns` | `string[]` | Column names |
| `rows` | `Record<string, string>[]` | Keyed by first column (Dragon, Lineage, Legacy) |

---

## Parsing Complexity

**Medium-High**

The field-label pattern for both Backgrounds and Species stat blocks is extremely regular and easy to parse. Complexity comes from:

1. **Species traits are free-form prose** — trait bodies are paragraphs of varying length with no consistent terminator other than the next `_**TraitName.**_` pattern.
2. **Nested choice lists** — Goliath's Giant Ancestry and Gnome's Gnomish Lineage embed bold sub-option headings (`**Cloud's Jaunt (Cloud Giant).**`) inside a trait's prose body, requiring recursive parsing.
3. **Tables are embedded mid-entry** — Dragonborn's Draconic Ancestors table and Elf/Tiefling lineage tables appear inline within the species entry, not as standalone sections.
4. **Page-break artifacts** — The `## Page NN` headings and HTML comment blocks are noise injected mid-entry (e.g., Dragonborn splits across pages 83–84). Parsers must ignore these without treating them as entry boundaries.
5. **The "Fiendish Legacies" table header** appears on page 86 between Orc and Tiefling entries with no associated entry — it is a floating label for a table that follows Tiefling's prose.
6. **Equipment field uses italic for choice signal** — `_Choose A or B:_` is italic inline within the bold-field line.

---

## Key Patterns

**Background entry opening:**
```
**Acolyte**
**Ability Scores:** Intelligence, Wisdom, Charisma
**Feat:** Magic Initiate (Cleric) (see "Feats")
```

**Species entry opening:**
```
**Dwarf**
**Creature Type:** Humanoid
**Size:** Medium (about 4–5 feet tall)
**Speed:** 30 feet
```

**Named trait pattern:**
```
_**Dwarven Resilience.**_ You have Resistance to
Poison damage. You also have Advantage on saving throws...
```

**Nested sub-option within a trait:**
```
**Cloud's Jaunt (Cloud Giant).** As a Bonus Action, you
magically teleport up to 30 feet to an unoccupied
space you can see.
```

**Inline table with doubled header rows (PDF artifact):**
```
**Dragon** **Damage Type** **Dragon** **Damage Type**

| Dragon | Damage Type | Dragon | Damage Type |
| --- | --- | --- | --- |
| Black | Acid | Gold | Fire |
```

**Equipment field with italic choice signal:**
```
**Equipment:** _Choose A or B:_ (A) Calligrapher's Supplies,
Book (prayers), Holy Symbol, Parchment (10 sheets),
Robe, 8 GP; or (B) 50 GP
```

---

## Edge Cases & Gotchas

1. **Doubled table headers.** Every table has a plain-text bold "header" line above the pipe table (a PDF extraction artifact). This must be detected and discarded; the pipe table immediately below is the canonical form.

2. **Page-break headings mid-entry.** `## Page 84`, `## Page 85`, `## Page 86` appear inside species entries. These are pagination markers, not semantic headings. A parser scanning for `##` as section delimiters will incorrectly split entries here.

3. **Floating "Fiendish Legacies" heading on page 86.** The text `**Fiendish Legacies**` appears between the Human/Orc entries and the Tiefling entry. It is a table caption for the Tiefling's Fiendish Legacy trait table, but it is not inside the Tiefling entry block. A parser may misidentify it as an entry name.

4. **Draconic Ancestors table is inside Dragonborn, not standalone.** The table must be associated with the Dragonborn entry and the specific `_**Draconic Ancestry.**_` trait.

5. **Human and Tiefling have dual Size values.** The Size field reads `Medium (about 4–7 feet tall) or Small (about 2–4 feet tall), chosen when you select this species` — the value is not a single string.

6. **Soldier's Tool Proficiency is a category choice, not a fixed item.** `_Choose one kind of_ _Gaming Set_ (see "Equipment")` — italics span two separate inline runs due to PDF extraction; the field value is a conditional.

7. **Elf's Elven Lineage table cells contain `<br>` HTML tags** for multi-line cell content. These need to be normalized or handled explicitly.

8. **Rock Gnome description splits across pages** with prose continuing mid-sentence after `## Page 86`.

9. **`#### Parts of a...` blocks** describe the schema but contain no actual data — they should be parsed for schema documentation only, not as entries.

10. **Page number footers embedded in content.** Lines like `**83** System Reference Document 5.2.1` appear between entries and must be stripped.

---

## Estimated Entry Count

| Section | Entries |
|---|---|
| Backgrounds | 4 (Acolyte, Criminal, Sage, Soldier) |
| Species | 9 (Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, Tiefling) |
| Embedded tables | 3 (Draconic Ancestors, Elven Lineages, Fiendish Legacies) |
| **Total parseable entries** | **16** |

Note: The SRD includes only 4 of the 16 backgrounds from the full PHB. Species count matches the full PHB SRD-eligible list.

---

## Parser Priority

**Critical**

Every character requires a background and a species. These are among the very first choices made during character creation and feed directly into ability score generation, feat assignment, skill proficiencies, and special trait availability. A character builder cannot function without this data. Both sections are compact (4 pages total), have well-defined schemas, and have high value-to-effort ratios. Parse backgrounds first (simpler, no trait prose), then species.
