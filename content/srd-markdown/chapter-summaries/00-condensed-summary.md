# SRD 5.2.1 Condensed Parser Reference

All chapters share the same extraction pipeline artifacts. Strip these universally before parsing content.

## Universal Noise Patterns

**Page break markers** (every chapter):
```
## Page NNN

<!-- source_txt: srd_extract/run2/pages/pNNN.txt -->
<!-- source_image: srd_extract/run2/images/pNNN.png -->
```
`## Page N` is H2 — same level as semantic sections. Match `/^## Page \d+$/` to distinguish.

**Page footers**: `**NNN** System Reference Document 5.2.1` — standalone lines, strip via `/^\*\*\d+\*\* System Reference Document/`.

**Duplicate H1**: Every chapter has a plain `# Title` (file-level) AND a bold `# **Title**` (OCR artifact inside the first page block). Treat second as decorative.

**Ghost header rows**: Bold plain-text line(s) above every GFM pipe table duplicate column names. Always discard:
```
**Column1** **Column2** **Column3**

| Column1 | Column2 | Column3 |
| --- | --- | --- |
```

**`<br>` in table cells**: Multi-line cell content uses raw `<br>` tags. Strip/normalize before processing cell values.

**H3 skipped**: Most chapters jump H2 to H4, skipping H3 entirely (except ch12/13 which use H3 for stat block names).

**Tables split across page breaks**: A single logical table gets interrupted by `## Page N` + HTML comments, producing two table fragments with repeated headers. Merge by matching identical column headers in the same section context.

**Bold-italic sub-entries**: `_**Name.**_` pattern used across all chapters for named sub-items within entries.

**En-dash (U+2013)** in ranges, **Unicode minus (U+2212)** in negative modifiers. Never assume ASCII hyphen.

---

## Ch01: Legal Information (~131 lines, ~350 entries, MEDIUM)
**Content**: CC-BY-4.0 license (page 1), ToC + stat block index (pages 2-4).
**ToC pattern**: `^(.+?)[\s.]+(\d+)$` after stripping markdown. Bold = chapter-level, plain = sub-entry.
**Mid-line OCR artifact**: ` **.** ` (bold-wrapped period) appears ~30 times in dot-leader lines.
**Two-line entries**: Subclass names split across lines — first line ends with colon, no page number; continuation has the page number.
**Stat block index**: Starts at `# **Index of Stat Blocks**` mid-page-2 with no structural separator from ToC.
**Parser priority**: Skip (no mechanical value).

---

## Ch02: Playing the Game (~1,518 lines, ~150 entries, MEDIUM-HIGH)
**Split by**: `## Section` H2 headings (8 major sections). Subsections use `####` (H4), no H3.
**Key tables**: Ability Descriptions, Ability Modifiers (16 rows), Skills (18 rows), Proficiency Bonus (8 rows), DCs (6 rows), Actions (11), Cover (3), Creature Sizes (6), Travel Pace (3).
**Bold table title pattern**: `**Table Name**` on own line, then optional fake header row, then real pipe table.
**Italic-bold definitions**: `_**Term.**_ Description...` for inline sub-rules (Bright Light, Round Down, etc.).
**Numbered steps as bold inline**: `**1: The GM Describes a Scene.** Text...` (not ordered list items).
**Bare-word lists**: Special senses and hazards listed as plain words on consecutive lines with no list markers.
**Score ranges**: Use Unicode en-dash `2-3` (U+2013), not ASCII hyphen.
**Gotchas**:
- Actions table split by `## Page 10` break mid-table
- Formula as bold inline: `**Base AC** = 10 + Dex modifier`
- Heading skip H2->H4 means hierarchy can't be inferred from level alone

---

## Ch03: Character Creation (~750 lines, ~235 entries, MEDIUM)
**Key tables**: Class Overview (12 rows), Character Advancement (20 rows), Standard Array by Class (12), Ability Score Point Costs (dual-column: `Score | Cost | Score | Cost`), Multiclass Spell Slots (20 rows), Trinkets (100 rows, split across 3 pages).
**Alignment entries**: Embedded in prose via `_**Name (AB).**_` italic-bold pattern, not in a table.
**Dual-column tables**: Point Costs and Ability Score Modifiers have paired columns — each row yields 2 records.
**Gotchas**:
- Trinket d100 uses `00` for 100 (fails naive `parseInt`)
- `<br>` in primary ability cells: `Strength<br>or Dexterity` ("or" vs "and" have different mechanical meanings)
- XP numbers use comma formatting: `2,700`, `100,000`
- `--` (em-dash) as zero in Multiclass Spellcaster table
- Rare Languages table: two-column layout `Language | Language`
- Footnote `*Primordial includes...` is a plain paragraph below its table, not structurally linked

---

## Ch04: Classes (~5,818 lines, ~1,200 entries, HIGH)
**Split by**: `## **ClassName**` H2 headings (12 sections). No H3 used.
**Core Traits table**: 2-col key-value. `<br>` in key cells: `**Saving Throw**<br>**Proficiencies**`. Some classes (Fighter/Monk/Rogue) have content overflow — all content stuffed into left cell, right cell blank.
**Progression table**: Variable extra columns per class. Ghost header rows (1-2 bold text lines) precede every table.
  - Non-caster (Barbarian): `Level | Bonus | Class Features | Rages | Damage | Mastery`
  - Full caster (Bard): adds `Die | Cantrips | Spells | 1-9` slot columns
  - Half caster (Paladin): adds `Divinity | Spells | 1-5` slot columns
  - Warlock (unique): `Invocations | Cantrips | Spells | Slots | Level` (Pact Magic, not per-level slots)
**Feature heading**: `**Level N: Feature Name**` — bold inline, NOT a markdown heading.
**Sub-features**: `_**Sub-heading.**_` italic-bold inline label.
**Subclass heading**: `#### **ClassName Subclass: SubclassName**` — name may split across two bold spans: `#### **Monk Subclass: Warrior of the** **Open Hand**`.
**Spell list tables**: `| Spell | School | Special |` per level. `C`=Concentration, `R`=Ritual, `M`=Material.
**Eldritch Invocations** (Warlock only): Bold name, optional italic prerequisite line, body, optional `_**Repeatable.**_`.
**Gotchas**:
- "Subclass feature" is a placeholder in progression tables, not a real feature name
- Duplicate feature names: Barbarian has "Improved Brutal Strike" at both levels 13 and 17
- Rogue Starting Equipment is a bold paragraph BELOW the Core Traits table, not inside it
- Druid has secondary "Beast Shapes" table embedded mid-prose in Wild Shape feature
- Druid Circle of the Land has 4 sub-tables (Arid/Polar/Temperate/Tropical)
- Cleric subclass features at levels 3/6/17 (not standard 3/6/10/14 pattern)
- `--` = no spell slots in progression tables

---

## Ch05: Character Origins (~170 lines, ~16 entries, MEDIUM-HIGH)
**Split by**: `## **Section**` H2 for Backgrounds / Species.
**Background pattern** (4 entries: Acolyte, Criminal, Sage, Soldier):
```
**Acolyte**
**Ability Scores:** Intelligence, Wisdom, Charisma
**Feat:** Magic Initiate (Cleric) (see "Feats")
**Skill Proficiencies:** Insight, Religion
**Tool Proficiency:** Calligrapher's Supplies
**Equipment:** _Choose A or B:_ (A) items, N GP; or (B) 50 GP
```
**Species pattern** (9 entries):
```
**Dwarf**
**Creature Type:** Humanoid
**Size:** Medium (about 4-5 feet tall)
**Speed:** 30 feet
```
Traits follow as `_**TraitName.**_` paragraphs. Nested sub-options use `**Name (SubType).**` bold-only pattern.
**Embedded tables**: Draconic Ancestors (inside Dragonborn), Elven Lineages, Fiendish Legacies — all with doubled header rows.
**Gotchas**:
- Human/Tiefling have dual Size: `Medium ... or Small ..., chosen when you select this species`
- Floating `**Fiendish Legacies**` heading between Orc and Tiefling entries (table caption, not an entry)
- Soldier tool proficiency spans two separate italic runs due to OCR: `_Choose one kind of_ _Gaming Set_`

---

## Ch06: Feats (~117 lines, ~18 entries, MEDIUM)
**Feat entry pattern**:
```
**Alert**
_Origin Feat_
```
or with prerequisite:
```
**Grappler**
_General Feat (Prerequisite: Level 4+, Strength or_
_Dexterity 13+)_
```
**4 categories**: Origin (4), General (2), Fighting Style (4), Epic Boon (8). Category headers: `#### **Category Name**`.
**Sub-benefits**: `_**Benefit Name.**_` inline. `_**Repeatable.**_` always last when present.
**Gotchas**:
- Prerequisite line wraps across 2 italic lines — must join consecutive italic lines
- Simple feats (Savage Attacker, Archery, etc.) have no named sub-benefits — pure prose
- Introductory `#### Parts of a Feat` section uses same `_**Label.**_` pattern but is NOT a feat entry
- Origin/Fighting Style feats have no parenthetical; General/Epic Boon embed prerequisites inline

---

## Ch07: Equipment (~383 lines, ~257 entries, HIGH)
**Weapons table**: Category rows as italic merged cells: `| _Simple Melee Weapons_ | | | | | |`. Properties column has embedded args: `Ammunition (Range 80/320; Bolt), Loading, Two-Handed`. Split on `, ` only at top level (not inside parens). Ammo type after `;` inside Ammunition parens.
**Armor table**: Category rows include don/doff: `_Medium Armor (5 Minutes to Don and 1 Minute to Doff)_`. AC values: plain int (`16`), modifier expr (`11 + Dex modifier`), capped (`12 + Dex modifier (max 2)`), bonus (`+2` for Shield).
**Tool entries** (prose, not table):
```
**Alchemist's Supplies (50 GP)**
**Ability:** Intelligence **Weight:** 8 lb.
**Utilize:** Identify a substance (DC 15), or start a fire (DC 15)
**Craft:** Acid, Alchemist's Fire, Component Pouch, Oil, Paper, Perfume
```
Variants: `**Variants:** Dice (1 SP), dragonchess (1 GP), playing cards (5 SP)`
**Food/Drink/Lodging**: 4-column two-pair layout `| Item | Cost | Item | Cost |` with italic category rows in each pair.
**Gotchas**:
- Blowgun damage is `1 Piercing` (flat int, not dice)
- Lance: `Two-Handed (unless mounted)` — conditional, not damage override
- Light Armor category row missing from table — don/doff must be inferred
- Shield is `+2` AC (additive bonus, not base)
- Musical Instrument variants split across page with hyphenated word: `dul-\ncimer`
- Weight formats: `2 lb.`, `1/4 lb.`, `1½ lb.` (Unicode half), `5 lb. (full)`, `--`, `Varies`
- Cost values: some use commas (`1,500 GP`), some don't
- Vex mastery property definition text is missing/cut off

---

## Ch08: Spells (~9,274 lines, ~339 entries, HIGH)
**Leveled header**: `**Acid Arrow**` then `_Level 2 Evocation (Wizard)_`
**Cantrip header**: `**Acid Splash**` then `_Evocation Cantrip (Sorcerer, Wizard)_`
**Metadata block** (4 lines):
```
**Casting Time:** Action
**Range:** 90 feet
**Components:** V, S, M (powdered rhubarb leaf)
**Duration:** Instantaneous
```
**Upgrade sections**: `_**Using a Higher-Level Spell Slot.**_` or `_**Cantrip Upgrade.**_`
**4 embedded stat blocks**: Animated Object, Otherworldly Steed, Giant Insect, Draconic Spirit — each uses `### **Name**` heading. Ability table formats vary between them.
**Gotchas**:
- Class list wraps to 2 italic lines (~10-15 spells): `_Level 4 Abjuration (Cleric, Paladin, Sorcerer, Warlock,_` / `_Wizard)_`
- Reaction Casting Time is multi-line (trigger description flows onto next lines)
- Material Components wrap across lines (up to 3 lines for Astral Projection)
- Duration `Special` exists (Creation spell)
- Concentration cantrip exists (Dancing Lights)
- Spell name with slash: `Antipathy/Sympathy`
- Irregular list indentation: both `- ` and `     - ` (five-space) in same chapter
- Page break can interrupt metadata block between Casting Time and Range

---

## Ch09: Rules Glossary (~255 lines, ~131 entries, MEDIUM)
**Entry pattern**: `**Entry Name**` or `**Entry Name [Tag]**` — bold inline, NOT a heading.
**Tags**: `[Action]` (12), `[Condition]` (15), `[Hazard]` (5), `[Area of Effect]` (6), `[Attitude]` (3).
**Two sub-entry label styles**: Most use `_**Label.**_` (italic-bold), but Long Rest/Short Rest/Truesight/Unarmed Strike use `**Label.**` (bold only).
**Cross-refs**: `_See also_ "Term," "Term," and "Chapter" ("Section").`
**Multi-column list artifacts**: Bare words with no list markers, separated by blank lines (from PDF multi-column layout).
**Abbreviations table**: Split across two pages with entries between fragments — must merge.
**Embedded tables**: Damage Types (13 types), Object AC/HP, Carrying Capacity, Water/Food Needs, Influence Checks, Search skills, Areas of Knowledge.
**Gotchas**:
- Damage Types table split by page break into two separate tables
- Exhaustion is a condition with cumulative stacking (unique among 15 conditions)
- Creature type list and condition list are enumerations embedded inside parent entries, not standalone entries

---

## Ch10: Gameplay Toolbox (~202 lines, ~79 entries, HIGH complexity, NICE-TO-HAVE priority)
**Content types**: Travel terrain (11 rows), poisons (13), traps (8), contagions (3), environmental hazards (8), XP budget (20 rows), fear/stress DCs.
**Poison header**: `**Assassin's Blood (150 GP)**` / `_Ingested Poison_`
**Trap header**: `**Collapsing Roof**` / `_Deadly Trap (Levels 1-4)_` then `**Trigger:**` / `**Duration:**` fields.
**Trap scaling table**: Pre-table noise line + GFM table per trap.
**Gotchas**:
- Rolling Stone has dual severity: `_Deadly Trap (Levels 11-16) or Nuisance Trap (Levels 17-20)_`
- XP Budget table has orphaned headers as 3 separate plain-text lines above the table (no header row in table itself)
- Spiked Pit scaling table uses `<br>` in a cell: `10 (3d6) Bludgeoning plus 13<br>(3d8) Piercing`
- Table footnotes use `*` / `+` inline, no standard footnote syntax

---

## Ch11: Magic Items (~362 lines, ~257 entries + ~163 named properties, HIGH)
**A-Z boundary**: `## **Magic Items A-Z**` divides preamble rules from item catalog.
**Item header**:
```
**Amulet of Health**
_Wondrous Item, Rare (Requires Attunement)_
```
**Multi-line category**: Consecutive italic lines after name must be joined.
**Multi-rarity**: `_Weapon (Any Ammunition), Uncommon (+1), Rare (+2), or Very Rare (+3)_`
**Named properties**: `_**Property Name.**_` pattern. 163 total. `_**Curse.**_` signals cursed item.
**Variant families** (~10): Belt of Giant Strength (table), Figurine of Wondrous Power (inline `_**Name (Rarity).**_`), Ioun Stone (inline), Feather Token (inline), Potion of Healing (table), Bag of Tricks, Crystal Ball.
**Embedded tables**: ~52 random-result tables in A-Z section. Dual-column format common: `| 1d100 | Type | 1d100 | Type |`.
**Rarity enum**: Common, Uncommon, Rare, Very Rare, Legendary, Artifact (6 values — Artifact from Dragon Orb).
**Gotchas**:
- Item name wraps across 2 bold lines: `**Amulet of Proof against Detection**` / `**and Location**` — merge consecutive bold lines before italic category
- Figurine of Wondrous Power embeds a full `### Giant Fly` stat block
- Mysterious Deck table split into 2 segments with card descriptions interspersed
- Bold monster names mid-prose (`**Water Elemental**`) are cross-refs, not item headers — item headers always followed by italic category line
- Pre-table label rows (`**1d100** **Destination**`) look like item names but aren't

---

## Ch12: Monsters (~12,252 lines, ~234 stat blocks, HIGH)
## Ch13: Animals (~750 lines, ~96 stat blocks, MEDIUM)

**These two chapters share identical stat block format.** Parse with same state machine; ch13 adds: strip stray ch12 entries before `# **Animals**` H1, handle compound swarm type `"Swarm of Tiny Beasts"`.

**Group/Entry headings**: `## **Group Name**` (H2) -> `### **Monster Name**` (H3). Single-variant groups repeat name at both levels.
**Type line**: `_Size Type (Tag), Alignment_` — e.g., `_Huge Fiend (Demon), Chaotic Evil_`. Dual-size: `_Medium or Small Humanoid_`.
**Combat stats** (3 lines, always together, always this order):
```
**AC** 17 **Initiative** +7 (17)
**HP** 150 (20d10 + 40)
**Speed** 10 ft., Swim 40 ft., Fly 90 ft. (hover)
```

**Ability score table** (11-col, 2-row):
```
| Str 21 | +5 | +5 | Col4 | Dex 9 | -1 | +3 | Col8 | Con 15 | +2 | +6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Int** 18 | +4 | +8 |  | **Wis**	15 | +2 | +6 |  | **Cha**	18 | +4 | +4 |
```
Row 1: Str/Dex/Con (unbolded). Row 2: Int/Wis/Cha (**bolded**). Cells: `AbilityName Score | modifier | save`. `Col4`/`Col8` in separator columns (~224 occurrences) = empty. Tab chars in row-2 cells. Unicode minus (U+2212) for negatives.

**`MOD SAVE` artifact**: `MOD SAVE MOD SAVE MOD SAVE` — plain text before ability table on ~12 monsters total (5 in ch12, 7 in ch13). Discard.

**Optional fields** (fixed order, any may be absent): `**Skills**` -> `**Resistances**` -> `**Vulnerabilities**` -> `**Immunities**` -> `**Gear**` -> `**Senses**` -> `**Languages**` -> `**CR**`. Only Senses and CR always present.
**Immunities**: Damage types and conditions in ONE field, semicolon-separated: `**Immunities** Poison, Thunder; Exhaustion, Grappled, Paralyzed`.
**CR**: `**CR** 10 (XP 5,900, or 7,200 in lair; PB +4)`. Fractional: `1/8`, `1/4`, `1/2`.

**Section labels**: Bare unformatted text on own line: `Traits`, `Actions`, `Bonus Actions`, `Reactions`, `Legendary Actions`. NOT headings, NOT bold.
**Trait/Action pattern**: `_**Name.**_ Description...`
  - Usage: `_**Name (Recharge 5-6).**_`, `_**Name (2/Day).**_`, `_**Name (3/Day, or 4/Day in Lair).**_`
  - Attacks: `_**Bite.**_ _Melee Attack Roll:_ +N, reach N ft. _Hit:_ N (XdY + Z) Type damage.`
  - Saves: `_**Name.**_ _Ability Saving Throw:_ DC N, target. _Failure:_ effect. _Success:_ effect.`
  - Reactions: `_**Name.**_ _Trigger:_ description. _Response:_ description.`
  - Sub-items use `**Bold.**` (not italic-bold): Vampire Weakness, Sphinx Roar

**Legendary Actions**: Section label followed by multi-line italic boilerplate: `_Legendary Action Uses: 3 (4 in Lair). Immediately after..._ ` — strip boilerplate, parse action entries below.

**Spellcasting block**:
```
_**Spellcasting.**_ The lich casts ... using Intelligence ... (spell save DC 20):
**At Will:** _Spell_, _Spell_ (level 5 version)
**2/Day Each:** _Spell_, _Spell_
```
Frequency categories bold; spell names italic. Parenthetical notes after spell names. Lists can wrap across lines and page breaks.

**Gotchas**:
- Spell names wrap across lines: `_Power` at line end, `_Word Kill_` at next line start
- Couatl Shapechange note wraps across page break inside a parenthetical
- Green Hag `Coven Magic` is freeform prose spellcasting (no structured frequency categories)
- Action entries with bold cross-refs (`**Black Puddings**`) are prose, not action names
- Languages: `Understands Common but can't speak` variant (capture `canSpeak: false`)
- ch13: 5 non-Beast entries (Flying Snake=Monstrosity, Giant Eagle/Elk/Owl=Celestial, Giant Vulture=Monstrosity)
- ch13: Swarm type string: `Large Swarm of Tiny Beasts` — compound type, not standard Size+Type
- ch13: 2 stray ch12 entries (unnamed creature fragment + Ogre Zombie) before Animals H1
