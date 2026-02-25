# Chapter 11: Magic Items — Parser Planning Summary

## Overview

This chapter covers all magic items in the SRD 5.2.1, spanning pages 204–253 of the PDF. It has two structurally distinct sections: a **preamble** (pages 204–209) covering rules for categories, rarity, activation, crafting, sentient items, and cursed items, followed by the **A–Z item catalog** (pages 209–253) containing individual item entries. The A–Z section is the primary target for parsing. The preamble is rules content that informs how to interpret item entries but should generally be parsed separately or skipped in item-focused passes.

This chapter is the single largest data source in the SRD for a character builder or compendium. Every magic item a character might use lives here.

---

## Content Structure

### Preamble (lines 1–563)

The preamble uses standard `##` and `####` headings for rules sections, along with inline bold/italic for sub-rules. It contains several reference tables (Potion Miscibility, Magic Item Rarities and Values, Magic Item Tools, Crafting Time and Cost, Sentient Item Alignment/Communication/Senses/Special Purpose tables) that are not item entries but are game-rule lookups. These tables use the standard GFM pipe-table format.

Page markers appear throughout:

```markdown
## Page 207

<!-- source_txt: srd_extract/run2/pages/p207.txt -->
<!-- source_image: srd_extract/run2/images/p207.png -->
```

These are structural noise from the PDF extraction process and must be skipped by a parser.

### A–Z Catalog (line 564 onward)

Introduced by `## **Magic Items A–Z**` at line 564. Each item entry follows a two-element header pattern and a prose body, with optional embedded tables and named sub-properties.

**Standard item header (single-line category):**

```markdown
**Bag of Holding**
_Wondrous Item, Uncommon_
```

**Multi-line category (wraps across two italic lines when long):**

```markdown
**Armor, +1, +2, or +3**
_Armor (Any Light, Medium, or Heavy), Rare (+1), Very_
_Rare (+2), or Legendary (+3)_
```

```markdown
**Armor of Invulnerability**
_Armor (Plate Armor), Legendary (Requires_
_Attunement)_
```

**Named sub-properties** use bold-italic inline formatting:

```markdown
_**Metal Shell.**_ You can take a Magic action to give yourself Immunity...
```

**Bulleted properties** (some items use a bold name + body pattern inside a list):

```markdown
**Dwarvish.** You know Dwarvish.
**Friend of Dwarvenkind.** You have Advantage on Charisma (Persuasion) checks...
**Toughness.** Your Constitution increases by 2, to a maximum of 20.
```

Note: these are NOT in a markdown list (`-`), they are bare bold terms at the start of a paragraph, each followed by its description inline.

**Embedded tables** use GFM pipe syntax with a preceding bold header line and a pre-table "label row" that duplicates the column names in bold (artifact of PDF extraction):

```markdown
**1d100** **Creature Type** **1d100** **Creature Type**

| 1d100 | Creature Type | 1d100 | Creature Type |
| --- | --- | --- | --- |
| 01–10 | Aberrations | 51–60 | Fey |
```

The "label row" (plain bold text before the pipe table) appears consistently and should be discarded; the actual data is in the pipe table.

---

## Data Types Extractable

### `MagicItem` (primary type)

Each A–Z entry yields one record:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | From the `**Name**` bold header line |
| `category` | `enum` | One of: Armor, Weapon, Wondrous Item, Potion, Ring, Rod, Scroll, Staff, Wand |
| `categoryDetail` | `string \| null` | Parenthetical after category, e.g. `"Any Light, Medium, or Heavy"`, `"Dagger"`, `"Shield"` |
| `rarity` | `string \| string[]` | Single rarity string, or array for multi-rarity items |
| `rarityVaries` | `boolean` | True when metadata says `Rarity Varies` |
| `requiresAttunement` | `boolean` | Whether `Requires Attunement` appears in category line |
| `attunementPrerequisite` | `string \| null` | E.g. `"a Wizard"`, `"a Druid"`, `"a Bard, Cleric, or Druid"`, `"a Paladin"` |
| `description` | `string` | Full prose body (markdown preserved) |
| `namedProperties` | `NamedProperty[]` | Parsed `_**PropertyName.**_` sub-sections |
| `charges` | `number \| null` | Starting charge count if present |
| `chargeRecharge` | `string \| null` | Recharge schedule, e.g. `"daily at dawn"` |
| `embeddedTables` | `EmbeddedTable[]` | Inline random tables within the item description |
| `isCursed` | `boolean` | Whether item body contains a `_**Curse.**_` property |
| `isConsumable` | `boolean` | Potions, scrolls, one-use items |
| `sourcePageRange` | `string` | From the chapter-level `_Pages 204-253_` marker |

### `NamedProperty` (sub-type)

```typescript
{
  name: string;         // e.g. "Metal Shell", "Call Dragons", "Lightning Strike"
  description: string;  // prose following the bold-italic header
}
```

### `EmbeddedTable` (sub-type)

```typescript
{
  title: string | null;   // e.g. "Apparatus of the Crab Levers", "Gray Bag of Tricks"
  dieExpression: string;  // e.g. "1d100", "1d8", "1d10"
  columns: string[];      // column headers
  rows: { [col: string]: string }[];
}
```

### `ItemVariant` (sub-type, for grouped items)

Some "items" are actually item families. These should be modeled as a parent entry with variant sub-entries:

- `Belt of Giant Strength` — 5 variants (hill/frost/stone/fire/cloud/storm) each with different Strength score and rarity
- `Potion of Healing` — 4 variants (regular/greater/superior/supreme)
- `Figurine of Wondrous Power` — 9 sub-figurines
- `Feather Token` — 6 sub-tokens
- `Ioun Stone` — 12 sub-types
- `Bag of Tricks` — 3 color variants
- `Crystal Ball` — 4 variants (base + 3 named)

---

## Parsing Complexity

**Rating: High**

Reasons:

1. **Two-section document with different grammars.** The preamble uses standard rules-text headings; the A–Z section uses a flat, non-hierarchical bold/italic header pattern. The parser must identify where A–Z begins and switch modes.

2. **Multi-line category lines.** About 20 items have category metadata that wraps across two consecutive italic lines. The continuation line has no special marker — a parser must check whether an italic line following another italic line continues the same logical unit.

3. **Multi-rarity items.** Items like `Ammunition, +1, +2, or +3` embed the rarity for each variant within the single category line: `_Weapon (Any Ammunition), Uncommon (+1), Rare (+2), or Very Rare (+3)_`. This requires parsing the rarity field as a structured list.

4. **"Rarity Varies" items.** Seven items (e.g. `Belt of Giant Strength`, `Feather Token`, `Figurine of Wondrous Power`, `Ioun Stone`) use `Rarity Varies` in their metadata and define per-variant rarities in embedded tables or inline `_(Type — Rarity)._` bullets inside the description body. These require secondary parsing of the body.

5. **Grouped items with stat-block inclusions.** The `Figurine of Wondrous Power` entry embeds a full creature stat block (Giant Fly) inside it. The stat block has its own complex formatting with an ability score table that uses a non-standard layout from the PDF extraction:

```markdown
| Str 14 | +2 | +2 | Col4 | Dex 13 | +1 | +1 | Col8 | Con 13 | +1 | +1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

6. **52 embedded tables in the A–Z section.** Each item with a random-result table requires table extraction logic. Tables have inconsistent numbers of columns (2, 3, or 4) and sometimes span multiple page breaks (the Mysterious Deck table is split across two sequential page markers, with the second half of the data appearing after card descriptions).

7. **Named sub-property pattern.** 163 `_**Name.**_` formatted sub-properties must be extracted as structured data to enable rules-engine queries (e.g. "does this item have a Curse property?").

8. **Attunement prerequisites.** The prerequisite string can be: absent, `Requires Attunement`, or `Requires Attunement by [class/creature type]`. The prerequisite clause can itself be multi-line when the category line wraps.

9. **Name collisions in bold text.** Within item descriptions, bold text is used both for item names (cross-references) and for sub-property headers. The bold text at the very start of an item's prose section is the next item's name — requiring lookahead to determine item boundaries.

---

## Key Patterns

### Pattern 1: Standard item header

```markdown
**Amulet of Health**
_Wondrous Item, Rare (Requires Attunement)_
```

Detect: line matches `/^\*\*[A-Z][^|]/` AND next non-empty line matches `/^_[A-Z]/` AND next line contains a known category keyword.

### Pattern 2: Multi-line category (wrap)

```markdown
**Dwarven Thrower**
_Weapon (Warhammer), Very Rare (Requires_
_Attunement by a Dwarf or a Creature Attuned to a Belt_
_of Dwarvenkind)_
```

Detect: the category italic line does not end with `_` but the next line also starts with `_`. Concatenate all consecutive italic lines after the item name into a single logical category string, then parse the combined string.

### Pattern 3: Multi-rarity encoding in category line

```markdown
**Ammunition, +1, +2, or +3**
_Weapon (Any Ammunition), Uncommon (+1), Rare (+2),_
_or Very Rare (+3)_
```

Parse: split on commas/`or` within the rarity portion and map each `Rarity (+N)` pair to a variant record.

### Pattern 4: Named sub-property

```markdown
_**Curse.**_ This armor is cursed, a fact that is revealed
only when the _Identify_ spell is cast on the armor or
you attune to it.
```

Detect: line matches `/^_\*\*[^*]+\.\*\*_/`. Extract the name (without trailing period) and all following prose until the next `_**Name.**_` or next item header.

### Pattern 5: Inline variant sub-entries (Figurine / Feather Token style)

```markdown
_**Bronze Griffon (Rare).**_ This bronze statuette is of a griffon rampant. It can become a **Griffon** for up to 6 hours.
_**Ebony Fly (Rare).**_ This ebony statuette, carved in the likeness of a horsefly, can become a **Giant Fly**...
```

The rarity is parenthetical inside the property name itself. Extract as variant sub-entries with individual rarities.

### Pattern 6: Embedded table with pre-table label row

```markdown
**1d100** **Destination**

| 1d100 | Destination |
| --- | --- |
| 01–60 | Random location on the plane you named |
```

The bold line directly before `|` table headers is a duplicate label row from PDF extraction. Discard it; parse the GFM table that follows.

### Pattern 7: Page-break marker (noise to strip)

```markdown
## Page 210

<!-- source_txt: srd_extract/run2/pages/p210.txt -->
<!-- source_image: srd_extract/run2/images/p210.png -->

**210** System Reference Document 5.2.1
```

Strip all `## Page N` headings, HTML comments, and standalone `**NNN** System Reference Document 5.2.1` lines before parsing.

---

## Edge Cases & Gotchas

### 1. The item name line for multi-word names that wrap

`Amulet of Proof against Detection and Location` has its name split across two bold lines because of PDF column layout:

```markdown
**Amulet of Proof against Detection**
**and Location**
_Wondrous Item, Uncommon (Requires Attunement)_
```

Two consecutive `**bold**` lines without an italic category line between them must be merged into a single item name.

### 2. Page-break mid-item

Many items span page breaks. The prose body is interrupted by the page marker block. After stripping page markers, the body paragraphs must be re-joined. Example: `Bead of Force` begins on page 212 and continues on page 213 — the body text is broken at the page boundary.

### 3. The Mysterious Deck (Deck of Many Things) table split

The table is split into two segments with the card descriptions interspersed:

- First segment: rows for card indices 65–77 (page 231 lower half)
- Then all card descriptions in `_**CardName.**_` blocks
- Second segment: rows for card indices 01–64 (page 232)

A naive table extractor will find two separate tables for what is logically one lookup table.

### 4. Creature stat blocks embedded inside items

`Figurine of Wondrous Power` (Ebony Fly variant) includes a `### Giant Fly` stat block. The ability score table has non-standard column layout:

```markdown
| Str 14 | +2 | +2 | Col4 | Dex 13 | +1 | +1 | Col8 | Con 13 | +1 | +1 |
```

This is a PDF extraction artifact where three ability scores appear side-by-side in one table row. Treat this as opaque or use a dedicated stat-block parser.

### 5. Bold monster name cross-references inside item text

In item descriptions, monster names in **bold** are cross-references, not sub-entries or new items:

```markdown
you can take a Magic action to summon a **Water Elemental**.
```

This `**Water Elemental**` is not a new item header — it just follows mid-sentence prose. Item headers only appear at the start of a line (no indentation) and are immediately followed by an italic category line.

### 6. Numbered table values ("label rows") masquerading as item names

Lines like `**1d100** **Creature Type** **1d100** **Creature Type**` start with `**` and contain uppercase text, but are pre-table label rows, not item headers. A parser checking for the italic category line on the next line will correctly reject these, since the next line is the pipe-table header.

### 7. Preamble bold sub-headings are not items

The preamble contains bold headings like `**Abilities**`, `**Communication**`, `**Conflict**` under the Sentient Magic Items section. These appear at the same visual level as item names but are section headings within preamble rules text. Since they precede the `## **Magic Items A–Z**` divider, a parser operating only on the A–Z section will not encounter them.

### 8. Rarity `Artifact` is a valid rarity tier

`Dragon Orb` uses `_Wondrous Item, Artifact (Requires Attunement)_`. The rarity enum must include `Common | Uncommon | Rare | Very Rare | Legendary | Artifact` (six values, not five).

### 9. Consumable items in non-Potion categories

Potions and Scrolls are inherently consumable, but some non-potion items are also one-use (e.g. `Dust of Disappearance`, `Elemental Gem`, `Bead of Nourishment`). The `isConsumable` flag must be inferred from the description text, not just the category.

### 10. "Rarity Varies" items with per-variant sub-rarities in a table vs. inline

`Belt of Giant Strength` uses a pipe table to express variant rarities:

```markdown
| Belt | Str. | Rarity |
| --- | --- | --- |
| Belt of Giant Strength (hill) | 21 | Rare |
```

`Feather Token` uses inline rarity in the named property label:

```markdown
_**Anchor (Uncommon).**_ You can take a Magic action...
```

`Ioun Stone` also uses the inline format. These two sub-patterns must both be handled.

---

## Estimated Entry Count

| Category | Approximate Count |
|---|---|
| Distinct named item entries in A–Z section | ~257 |
| Items that represent variant families (parent + children) | ~10 |
| Total logical item variants (including sub-entries) | ~290–310 |
| Embedded random-result tables | ~52 |
| Named sub-properties (`_**Name.**_`) | ~163 |

The discrepancy between the 361 bold-prefixed lines and ~257 item entries is explained by: pre-table label rows, bold inline text within item bodies (monster names, property sub-headings), and named sub-properties that are not separate items.

---

## Parser Priority

**Critical**

Magic items are the core content of chapters like this. A character builder requires item data to implement attunement tracking, bonus calculations, and equipment management. A compendium needs the full item catalog. A rules engine needs the charges, spell-casting, and property data to simulate item use. No other chapter in the SRD contributes more distinct game objects. This chapter should be parsed before classes, spells, or monsters if the product scope includes equipment at all.

Suggested parsing order within this chapter:

1. Strip page-break noise (page markers, page-number lines, HTML comments)
2. Identify preamble vs. A–Z boundary (`## **Magic Items A–Z**`)
3. Parse A–Z section: identify item boundaries by `**BoldName**` + following `_italic category_` pattern
4. Parse each item header into structured fields (category, rarity, attunement)
5. Parse item body for named sub-properties, embedded tables, and charge information
6. Post-process variant families (Rarity Varies items) to expand into sub-entries
