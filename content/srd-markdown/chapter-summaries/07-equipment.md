# Chapter 07: Equipment — Parser Planning Summary

## Overview

This chapter (SRD pages 89–103) is the primary economic and gear reference for the game. It covers
coins, weapons, armor, tools, adventuring gear, mounts and vehicles, lifestyle costs, food/drink/lodging,
hirelings, spellcasting services, magic item rules (attunement, identification), and crafting rules. For a
character builder it provides the complete catalog of purchasable, equippable, and craftable items. Nearly
every section is structured as a named table plus prose definitions — making it among the most
data-dense chapters in the SRD.

---

## Content Structure

### Heading levels

The chapter uses an irregular three-tier hierarchy because the source was OCR'd page-by-page from PDF:

- `# Equipment` — true chapter title (appears both as the first `#` and as bold text after a page-marker `##`)
- `## **Section**` — major section breaks: Weapons, Armor, Tools, Adventuring Gear, Mounts and Vehicles, Lifestyle Expenses, Food Drink and Lodging, Hirelings, Spellcasting, Magic Items, Crafting Nonmagical Items, Brewing Potions of Healing, Scribing Spell Scrolls
- `#### **Subsection**` — jumps from `##` to `####` with no `###` level used; subsections are things like Weapon Proficiency, Properties, Mastery Properties, Artisan's Tools, Other Tools, etc.
- `## Page N` — pagination markers inserted by the extraction pipeline; these are not semantic headings and must be filtered out

### Prose formatting

- Bold property names open a paragraph with no blank line after: `**Ammunition**\nYou can use...`
- Inline bold for field labels inside tool entries: `**Ability:** Intelligence **Weight:** 8 lb.`
- Italic text used for: category rows within tables (`_Simple Melee Weapons_`), magic item names (`_Potion of Healing_`), and sub-entries within gear descriptions (`_**Dousing a Creature or an Object.**_` — bold-italic combined)
- Plain bold for table title labels that appear above the markdown table as a duplicate header row (artifact of PDF OCR)

### Table conventions

Every data table appears with:
1. A bold title on its own line (e.g., `**Coin Values**`)
2. A bold column-header line duplicating the `| --- |` header row (e.g., `**Coin** **Value in GP**`)
3. The actual GFM pipe table

Items 1 and 2 are PDF-extraction artifacts and are redundant with the table itself; the parser should skip them and use only the pipe table.

### HTML comments

Each page boundary is annotated with `<!-- source_txt: ... -->` and `<!-- source_image: ... -->` comments. These carry provenance metadata and should be stripped before parsing item data but could be retained for debugging/sourcing.

### Page-number footers

Lines of the form `**89** System Reference Document 5.2.1` appear at regular intervals and must be discarded.

---

## Data Types Extractable

### 1. `Coin`
Fields:
- `name: string` — e.g., "Copper Piece"
- `abbreviation: string` — e.g., "CP"
- `valueInGP: number | string` — stored as a fraction string ("1/100") or number (1, 10)

### 2. `Weapon`
Fields:
- `name: string`
- `category: "Simple" | "Martial"`
- `classification: "Melee" | "Ranged"`
- `damageDice: string` — e.g., "1d6", "2d6", "1" (blowgun edge case)
- `damageType: string` — e.g., "Piercing", "Slashing", "Bludgeoning"
- `properties: string[]` — parsed from comma-delimited cell; each property may carry embedded arguments
- `rangeNormal?: number` — extracted from "Thrown (Range 20/60)" or "Ammunition (Range 80/320; Arrow)"
- `rangeLong?: number`
- `ammunitionType?: string` — extracted from Ammunition property parenthetical, e.g., "Arrow", "Bolt", "Bullet", "Needle"
- `versatileDamage?: string` — extracted from "Versatile (1d8)"
- `mastery: string` — e.g., "Slow", "Nick", "Cleave"
- `weight: string` — e.g., "2 lb.", "1/4 lb.", "—"
- `cost: string` — e.g., "2 GP", "500 GP"

### 3. `WeaponProperty`
Fields:
- `name: string`
- `description: string`

Named properties: Ammunition, Finesse, Heavy, Light, Loading, Range, Reach, Thrown, Two-Handed, Versatile

### 4. `MasteryProperty`
Fields:
- `name: string`
- `description: string`

Named mastery properties: Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex (Vex is referenced in the table but its definition text is cut off / missing from the SRD text as extracted — see Edge Cases)

### 5. `Armor`
Fields:
- `name: string`
- `category: "Light" | "Medium" | "Heavy" | "Shield"`
- `armorClass: string` — e.g., "11 + Dex modifier", "14 + Dex modifier (max 2)", "16", "+2"
- `strengthRequirement?: number` — e.g., 13, 15
- `stealthDisadvantage: boolean`
- `donTime?: string` — encoded in category row, e.g., "1 Minute to Don and 5 Minutes to Doff"
- `doffTime?: string`
- `weight: string`
- `cost: string`

### 6. `Tool`
Fields:
- `name: string`
- `category: "Artisan's Tools" | "Other Tools"`
- `cost: string` — some have "Varies"
- `ability: string` — e.g., "Intelligence", "Dexterity"
- `weight: string`
- `utilize: string[]` — list of utilize actions with DC values
- `craft?: string[]` — list of craftable item names
- `variants?: ToolVariant[]`

### 7. `ToolVariant`
Fields:
- `name: string` — e.g., "dragonchess", "flute"
- `cost: string`
- `weight?: string`

### 8. `AdventuringGear`
Fields:
- `name: string`
- `weight: string` — "—" for weightless items
- `cost: string` — "Varies" for items with sub-tables
- `description?: string` — prose after the item name heading

### 9. `Ammunition`
Fields:
- `type: string` — e.g., "Arrows", "Bolts", "Bullets, Firearm"
- `amount: number`
- `storage: string` — e.g., "Quiver", "Case", "Pouch"
- `weight: string`
- `cost: string`

### 10. `SpellcastingFocus` (sub-type of AdventuringGear)
Three separate sub-tables: Arcane Focuses, Druidic Focuses, Holy Symbols
Fields:
- `focusType: "Arcane" | "Druidic" | "Holy Symbol"`
- `form: string` — e.g., "Crystal", "Sprig of mistletoe", "Amulet (worn or held)"
- `weight: string`
- `cost: string`
- `note?: string` — e.g., "also a Quarterstaff"

### 11. `AdventureKit` (packs)
Fields:
- `name: string` — e.g., "Burglar's Pack"
- `cost: string`
- `weight: string`
- `contents: string[]` — parsed from comma-separated prose list

### 12. `Mount`
Fields:
- `name: string`
- `carryingCapacity: string` — e.g., "450 lb."
- `cost: string`

### 13. `TackOrVehicle`
Fields:
- `name: string`
- `category?: string` — "Saddle" for saddle sub-entries
- `weight: string`
- `cost: string`

### 14. `LargeVehicle` (ships/airships)
Fields:
- `name: string`
- `speed: string` — e.g., "8 mph"
- `crew: number`
- `passengers: number | null`
- `cargoTons: number | string | null` — "1/2" is fractional
- `ac: number`
- `hp: number`
- `damageThreshold: number | null`
- `cost: string`

### 15. `LifestyleExpense`
Fields:
- `tier: string` — e.g., "Wretched", "Squalid", "Poor", "Modest", "Comfortable", "Wealthy", "Aristocratic"
- `costPerDay: string` — e.g., "Free", "1 SP", "1 GP"
- `description: string`

### 16. `FoodDrinkLodging`
Fields:
- `item: string`
- `cost: string`
- `category?: "food" | "drink" | "inn" | "meal"`

### 17. `Hireling`
Fields:
- `service: string`
- `cost: string`

### 18. `SpellcastingService`
Fields:
- `spellLevel: string` — e.g., "Cantrip", "1", "4–5", "6–8", "9"
- `availability: string` — e.g., "Village, town, or city", "City only"
- `cost: string`

### 19. `SpellScrollCost`
Fields:
- `spellLevel: string`
- `craftTime: string` — e.g., "1 day", "120 days"
- `craftCost: string`

---

## Parsing Complexity

**Rating: High**

Reasons:
1. **Category rows embedded in tables.** The Weapons, Armor, and Tack tables use italic merged rows (e.g., `| _Simple Melee Weapons_ | | | | | |`) as category headers. These rows have all blank cells except the first and must be detected, used to tag subsequent rows, and then discarded from output data.
2. **Multi-value property cells.** The Weapons Properties column contains comma-delimited values that themselves embed parenthetical arguments: `Ammunition (Range 80/320; Arrow), Loading, Two-Handed`. Each must be split carefully without breaking on commas inside parentheses.
3. **Versatile damage disambiguation.** "Versatile (1d10)" in Properties and "Versatile (1d8)" in a different row require extracting the parenthetical as a secondary damage value.
4. **Armor Class strings.** AC values range from plain integers ("16") to modifier expressions ("11 + Dex modifier") to capped expressions ("12 + Dex modifier (max 2)") to bonuses ("+2" for Shield). These need a structured representation.
5. **Tool entries are prose-based, not tabular.** Each tool appears as a bold heading (`**Alchemist's Supplies (50 GP)**`) followed by labeled key-value lines. There is no tool table; cost and weight are embedded in the heading and first body line respectively.
6. **Table fragmentation across pages.** The Adventuring Gear table is split across three page boundaries into separate markdown tables with repeated header rows. The parser must merge them.
7. **Inlined sub-tables within prose sections.** Arcane Focuses, Druidic Focuses, Holy Symbols, and Ammunition are small stand-alone tables embedded mid-section within the larger Adventuring Gear section.
8. **Food, Drink, and Lodging uses a two-column-pair layout.** The table has four columns (`Item | Cost | Item | Cost`), presenting two logical columns side by side — each row contains two separate item/cost pairs that must be split into individual records.
9. **Spell Scroll appears in two contexts** — as a purchasable item in the Adventuring Gear table (with a buy price) and as a craftable item with a separate cost/time table (Spell Scroll Costs). These must be linked but kept as separate data types.
10. **Lifestyle tiers appear only as `####` prose sections**, not in a table, requiring heading-plus-cost extraction from `#### **Wretched (Free)**` style headings.
11. **`<br>` inside table cells.** Some long property strings use `<br>` for line continuation within the cell (Heavy Crossbow, Musket). Standard markdown parsers will emit `<br>` as an element; the parser needs to strip it and re-join the text.

---

## Key Patterns

### Category header rows inside tables (Weapons, Armor, Tack)

```markdown
| _Simple Melee Weapons_ |  |  |  |  |  |
| Club | 1d4 Bludgeoning | Light | Slow | 2 lb. | 1 SP |
```

The italicised first cell with all remaining cells empty signals a category boundary. Subsequent rows inherit this category until the next such row.

### Armor table category rows with don/doff time

```markdown
| _Medium Armor (5 Minutes to Don and 1 Minute to Doff)_ |  |  |  |  |  |
| Hide Armor | 12 + Dex modifier (max 2) | — | — | 12 lb. | 10 GP |
```

Don and doff durations must be parsed from the italicised category label string.

### Tool entry block (no table — pure prose pattern)

```markdown
**Alchemist's Supplies (50 GP)**
**Ability:** Intelligence **Weight:** 8 lb.
**Utilize:** Identify a substance (DC 15), or start a fire (DC 15)
**Craft:** Acid, Alchemist's Fire, Component Pouch, Oil, Paper, Perfume
```

Name and cost live in the `**Name (cost)**` heading. Ability and Weight share a single line. Utilize and Craft are multi-value fields.

### Tool with Variants field

```markdown
**Gaming Set (Varies)**
**Ability:** Wisdom **Weight:** —
**Utilize:** Discern whether someone is cheating (DC 10), or win the game (DC 20)
**Variants:** Dice (1 SP), dragonchess (1 GP), playing cards (5 SP), three-dragon ante (1 GP)
```

Variants are comma-separated `Name (cost)` pairs on the Variants line.

### Weapon property cell with embedded range and ammo type

```markdown
| Light Crossbow | 1d8 Piercing | Ammunition (Range 80/320; Bolt), Loading, Two-Handed | Slow | 5 lb. | 25 GP |
```

Split on `, ` only at the top level (not inside parentheses). Then extract `Range normal/long` and `ammo type` from the `Ammunition (...)` parenthetical using `;` as the delimiter between range and ammo type.

### `<br>` continuation in table cells

```markdown
| Heavy Crossbow | 1d10 Piercing | Ammunition (Range 100/400; Bolt), Heavy, Loading,<br>Two-Handed | Push | 18 lb. | 50 GP |
```

Must replace `<br>` with a space before splitting properties.

### Four-column two-pair table (Food, Drink, and Lodging)

```markdown
| Item | Cost | Item | Cost |
| --- | --- | --- | --- |
| Ale (mug) | 4 CP | Comfortable | 8 SP |
| _Inn Stay per Day_ |  | _Meal_ |  |
| Squalid | 7 CP | Squalid | 1 CP |
```

Columns 1–2 and columns 3–4 are independent item/cost pairs. Rows with italic first-cells (`_Inn Stay per Day_`, `_Meal_`) are category labels for the rows that follow them within their respective column pair. This table is also split across two page boundaries.

### Saddle sub-rows inside Tack table

```markdown
| _Saddle_ |  |  |
| Exotic | 40 lb. | 60 GP |
| Military | 30 lb. | 20 GP |
| Riding | 25 lb. | 10 GP |
```

The `_Saddle_` row is a group label, and sub-rows have partial names. Full names must be constructed as "Saddle, Exotic", "Saddle, Military", "Saddle, Riding".

---

## Edge Cases & Gotchas

1. **Vex mastery property is missing its definition text.** The Weapons table references "Vex" as a mastery property for several weapons, but the property's definition paragraph is not present in this chapter extract. The Topple definition is also cut off mid-sentence at the page break (ends with "you can force"). Parsers should flag these as incomplete.

2. **Blowgun damage is `1 Piercing`**, not a dice expression. The damage field format is inconsistent — all other weapons use `XdY` format, but Blowgun uses a flat integer. The parser must handle both.

3. **Lance has a conditional property**: `Two-Handed (unless mounted)`. The parenthetical is not a damage value but a conditional modifier. Must not be parsed as a Versatile-style damage override.

4. **Armor Light category rows have don/doff times in a non-standard location.** The Light Armor category header row is missing from the extracted table — the table begins directly with Padded Armor rows with no italicised Light Armor header. The `_Medium Armor (...)_` and `_Heavy Armor (...)_` rows are present, but Light Armor's don/doff time ("1 Minute to Don and 5 Seconds to Doff") must be inferred from game rules, not parsed from the table.

5. **Shield is included in the Armor table** but is neither Light, Medium, nor Heavy — its category row reads `_Shield (Utilize Action to Don or Doff)_` and its AC value is `+2` (a bonus, not a base). The parser must handle Shield as a distinct armor category with additive rather than fixed AC.

6. **Adventuring Gear table is split into two separate markdown pipe tables** on different pages (pages 95 and 95–96 continuation), each with its own header row. A naive parser treating each table independently will get two partial lists; they must be merged by recognising consecutive tables with identical headers in the Adventuring Gear section context.

7. **Musical Instrument Variants entry is split across a page break.** The Variants line for Musical Instrument begins on page 94 and the value continues on page 95 after the `<!-- source_... -->` comment and page footer. The full variant list is: `Bagpipes (30 GP, 6 lb.), drum (6 GP, 3 lb.), dulcimer (25 GP, 10 lb.), flute (2 GP, 1 lb.), horn (3 GP, 2 lb.), lute (35 GP, 2 lb.), lyre (30 GP, 2 lb.), pan flute (12 GP, 2 lb.), shawm (2 GP, 1 lb.), viol (30 GP, 1 lb.)`. The word "dulcimer" is hyphenated across the break as "dul-\ncimer". The parser must strip page-break artifacts and rejoin hyphenated words.

8. **Some Musical Instrument Variants include weight in addition to cost** (e.g., `Bagpipes (30 GP, 6 lb.)`), while Gaming Set variants include only cost. The variant parenthetical format is inconsistent between tool types.

9. **Smith's Tools Craft list spans a page boundary.** The entry begins on page 93 and the Craft list continues from the top of page 94 after the page break. Similarly for Leatherworker's Tools, whose Craft list wraps to a second line mid-value.

10. **Cost values use inconsistent formatting**: some use commas for thousands (`1,500 GP`, `40,000 GP`) while others do not. Parsed cost strings should be normalised (strip commas, parse as numbers) for comparison or sorting.

11. **Weight values have multiple formats**: `2 lb.`, `1/4 lb.`, `1/2 lb.`, `1½ lb.`, `5 lb. (full)` (for Waterskin), `—` (none/negligible), and `Varies`. The `½` character is Unicode, not `1/2`. All fractional formats must be normalised.

12. **Potion of Healing appears in the Adventuring Gear table** with italic formatting (`_Potion of Healing_`), signaling it is a magic item. Its entry in the gear table is just cost/weight; its rules text appears later in the prose section of the same chapter. These must be linked.

13. **Spell Scroll appears twice in the Adventuring Gear table** as separate rows: `_Spell Scroll_ (Cantrip)` and `_Spell Scroll_ (Level 1)`. Both are italicised magic items. The names include parenthetical level descriptors that must be parsed as part of the item identity.

14. **The Armor table title block contains a duplicate plain-text header row** (`**Armor** **Armor Class (AC)** **Strength** **Stealth** **Weight** **Cost**`) between the section prose and the pipe table — an OCR artifact identical to the table headers. It should be discarded.

15. **Crafting rules reference tool entries by cross-link** (`"Tools" section of "Equipment"`). A parser building a crafting graph must join the `Tool.craft[]` lists against the canonical item names from the Weapons and Armor tables, resolving abbreviated forms like "Any Melee weapon (except Club, Greatclub, Quarterstaff, and Whip)".

---

## Estimated Entry Count

| Category | Approx. Count |
| --- | --- |
| Coins | 5 |
| Weapons (Simple Melee) | 10 |
| Weapons (Simple Ranged) | 4 |
| Weapons (Martial Melee) | 17 |
| Weapons (Martial Ranged) | 6 |
| Weapon Properties | 9 |
| Mastery Properties | 8 (Vex incomplete) |
| Armor (Light) | 3 |
| Armor (Medium) | 5 |
| Armor (Heavy) | 4 |
| Shield | 1 |
| Artisan's Tools | 16 |
| Other Tools | 7 (with named variants) |
| Adventuring Gear items | ~70 |
| Ammunition types | 5 |
| Arcane Focus forms | 5 |
| Druidic Focus forms | 3 |
| Holy Symbol forms | 3 |
| Adventure Packs (kits) | 6 |
| Mounts | 8 |
| Tack / Drawn Vehicles | ~10 |
| Large Vehicles (ships) | 7 |
| Lifestyle Tiers | 7 |
| Food/Drink/Lodging items | ~14 |
| Hirelings | 3 |
| Spellcasting Services | 7 tiers |
| Spell Scroll Costs | 10 tiers |
| **Total distinct entries** | **~257** |

---

## Parser Priority

**Critical**

This chapter provides the foundational item catalog for a character builder. Weapons and armor are required to build attack/damage calculations and AC for every character. Tools are needed to display proficiency options, compute ability checks, and handle crafting. Adventuring gear feeds starting equipment lists and pack contents. The cost and weight data for all items drives encumbrance calculations and gold budgeting. Without a parsed equipment chapter, the character builder cannot display gear, compute stats from equipped items, or generate starting inventories.

The Mounts, Vehicles, Lifestyle, and Hirelings sections are lower priority for a core character builder (Nice-to-have / compendium reference), but Weapons, Armor, and Tools are Critical and should be parsed first.
