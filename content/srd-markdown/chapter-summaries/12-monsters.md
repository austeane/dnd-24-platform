# Chapter 12: Monsters — Parser Planning Summary

## Overview

This is the largest chapter in the SRD at ~12,252 lines covering pages 254–343. It contains two distinct zones:

1. **Introductory rules section** (lines 1–436, pages 254–258): Prose explaining stat block structure, creature types, Hit Dice by size table, XP by CR table, Proficiency Bonus by CR table, and the rules for limited usage (X/Day, Recharge X–Y, etc.). This section should be skipped by the monster parser but could be parsed for reference tables.

2. **Monster entries A–Z** (lines 437–12252, pages 258–343): The bulk of the chapter — 234 individual stat block entries organized under ~175 group headings, spanning CR 0 (Lemure) to CR 30 (Tarrasque).

This chapter is the single most important chapter to parse for a D&D character builder, compendium, or encounter planner.

---

## Content Structure

### Heading Hierarchy

The document uses a three-level heading structure for monsters:

```
## **Group Name**          ← H2, bold — groups related variants (e.g., "Black Dragons")
### **Monster Name**       ← H3, bold — the actual stat block name (e.g., "Adult Black Dragon")
```

Some simple monsters with a single variant share the same name at both levels:

```
## **Aboleth**
### **Aboleth**
```

Multi-variant groups have one H2 group header and multiple H3 stat blocks under it:

```
## **Black Dragons**
### **Black Dragon Wyrmling**
### **Young Black Dragon**
### **Adult Black Dragon**
### **Ancient Black Dragon**
```

### Page Break Markers

HTML comment blocks appear throughout, including inside stat blocks, splitting content across page boundaries:

```
## Page 264

<!-- source_txt: srd_extract/run2/pages/p264.txt -->
<!-- source_image: srd_extract/run2/images/p264.png -->
```

These markers appear between any two lines in the document and must be treated as transparent noise by the parser. They are never part of stat block data.

### Section-Level Labels (Unformatted Plain Text)

Stat block sections are delimited by **bare unformatted lines** — no heading markers, no bold, no italic:

```
Traits

Actions

Bonus Actions

Reactions

Legendary Actions
```

These section labels are the primary structural delimiters inside a stat block. Not all monsters have all sections. The minimal stat block has only `Actions`.

### Ability Score Table

The most structurally unusual element in the chapter. Six abilities are laid out as a **two-row markdown table** with three abilities per row. Each cell contains the ability name+score, modifier, and saving throw modifier. The table spans 11 columns with separator pipes:

```markdown
| Str 21 | +5 | +5 |  | Dex 9 | −1 | +3 |  | Con 15 | +2 | +6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Int** 18 | +4 | +8 |  | **Wis**	15 | +2 | +6 |  | **Cha**	18 | +4 | +4 |
```

- Row 1: Str, Dex, Con (unbolded names)
- Row 2: Int, Wis, Cha (bolded names: `**Int**`, `**Wis**`, `**Cha**`)
- Each ability cell: `AbilityName Score` (tab or space separated within the cell)
- Following cells per ability: modifier (`+N` or `−N`), saving throw modifier (`+N` or `−N`)
- Separator columns between ability triples are empty (`|  |`)
- Some rows use the literal value `Col4` or `Col8` in separator cells instead of blank space:

```markdown
| Str 21 | +5 | +5 | Col4 | Dex 9 | −1 | +3 | Col8 | Con 15 | +2 | +6 |
```

`Col4` and `Col8` appear in a substantial portion of entries (~224 occurrences) and must be treated as empty separator content.

- Modifiers use a **Unicode minus sign** (`−`, U+2212) rather than an ASCII hyphen for negative values. This affects both ability modifiers and saving throws.
- Spacing inside the ability name cell varies: sometimes a tab character, sometimes multiple spaces, occasionally a single space.

### Occasional "MOD SAVE" Header Line

Five monsters (Basilisk, an ooze, two others, and Zombie) have a loose plaintext line immediately before the table:

```
MOD SAVE MOD SAVE MOD SAVE
```

This is a stray OCR/formatting artifact that appears as a bare line before the ability table. It should be discarded.

### Combat Stats Block (AC / Initiative / HP / Speed)

Three lines appear immediately after the size/type/alignment italic line, before the ability table:

```
**AC** 17 **Initiative** +7 (17)
**HP** 150 (20d10 + 40)
**Speed** 10 ft., Swim 40 ft.
```

- `**AC**` followed by integer
- `**Initiative**` followed by modifier (`+N` or `−N`) then initiative score in parentheses
- `**HP**` followed by average integer then hit dice expression in parentheses: `NdX + Y` or `NdX` or `NdX + Y`
- `**Speed**` followed by comma-separated speed list; speeds include: `N ft.`, `Fly N ft.`, `Fly N ft. (hover)`, `Swim N ft.`, `Burrow N ft.`, `Climb N ft.`
- These three lines always appear together in this order, with no intervening content

### Size / Type / Alignment

Immediately after the H3 heading, a blank line, then an italic line:

```
_Large Aberration, Lawful Evil_
```

Format: `_Size Type [Tag], Alignment_`

Variations:
- Tags in parentheses: `_Huge Fiend (Demon), Chaotic Evil_`
- Class tags: `_Medium Undead (Wizard), Neutral Evil_`
- Multiple tags: `_Medium Dragon (Chromatic), Chaotic Evil_`
- Size ranges: `_Medium or Small Humanoid, Neutral_`
- "Unaligned": `_Large Monstrosity (Titan), Unaligned_`
- A blank line between the H3 heading and the italic line is consistent

### Optional Stat Block Fields

These appear between the ability table and the `Traits` section label (or directly to `Actions` if no traits). Each is a bold-key line:

```
**Skills** History +12, Perception +10
**Resistances** Bludgeoning, Lightning, Piercing, Slashing
**Vulnerabilities** Fire
**Immunities** Poison, Thunder; Exhaustion, Grappled, Paralyzed, ...
**Gear** Light Crossbow, Shortsword, Studded Leather Armor
**Senses** Darkvision 120 ft.; Passive Perception 20
**Languages** Deep Speech; telepathy 120 ft.
**CR** 10 (XP 5,900, or 7,200 in lair; PB +4)
```

- `**Skills**`: comma-separated `Skill +N` pairs
- `**Resistances**`: comma-separated damage types
- `**Vulnerabilities**`: comma-separated damage types
- `**Immunities**`: damage types and condition immunities, separated by a semicolon within the same field. Damage types come before the semicolon; conditions after. The field can span multiple lines.
- `**Gear**`: comma-separated item names
- `**Senses**`: semicolon-separated; Passive Perception always last
- `**Languages**`: semicolons separate language from telepathy range; can include `telepathy N ft.`
- `**CR**`: `N (XP N,NNN; PB +N)` — fractional CRs: `1/8`, `1/4`, `1/2`. Lair variants: `(XP N,NNN, or N,NNN in lair; PB +N)`

Only `**Senses**` and `**CR**` are present in every stat block. The others are optional.

### Trait / Action / Ability Format

Each individual trait, action, bonus action, reaction, or legendary action follows the same inline pattern:

```
_**Name.**_ Description text that continues on the same and following lines.
```

- Name is bold+italic: `_**Name.**_`
- Period is inside the bold before the closing italic marker
- Description begins immediately after on the same line
- Multi-paragraph descriptions are possible; blank lines separate paragraphs within an entry

Variants with usage annotations:

```
_**Multiattack.**_
_**Whirlwind (Recharge 4–6).**_
_**Dominate Mind (2/Day).**_
_**Unicorn's Blessing (3/Day).**_
_**Legendary Resistance (3/Day, or 4/Day in Lair).**_
_**Protective Magic (3/Day).**_
_**Misty Step (3/Day).**_
```

Usage annotations are embedded in the name before the period. The recharge range uses an en-dash (`–`, U+2013), not a hyphen.

### Attack Roll Format

Attacks consistently follow:

```
_**AttackName.**_ _Melee Attack Roll:_ +N, reach N ft. _Hit:_ N (XdY + Z) DamageType damage.
_**AttackName.**_ _Ranged Attack Roll:_ +N, range N/N ft. _Hit:_ N (XdY + Z) DamageType damage.
_**AttackName.**_ _Melee or Ranged Attack Roll:_ +N, reach N ft. or range N/N ft. _Hit:_ ...
```

- `_Melee Attack Roll:_` or `_Ranged Attack Roll:_` or `_Melee or Ranged Attack Roll:_` — italic labels
- Followed by `+N` bonus, then reach/range
- `_Hit:_` introduces hit effects
- `_Miss:_` may follow for miss effects
- `_Hit or Miss:_` for effects regardless of outcome

Damage notation: `N (XdY + Z)` where N is the average, followed by dice expression. Minimal form: `N (XdY)` or just `N` for flat damage (e.g., `1 Slashing damage`).

### Saving Throw Attack Format

```
_**Name.**_ _AbilityType Saving Throw:_ DC N, target description. _Failure:_ effect. _Success:_ effect.
```

Variations:
- `_Failure or Success:_` for effects that apply regardless
- `_First Failure:_` / `_Second Failure:_` for multi-stage effects (e.g., Basilisk's Petrifying Gaze)
- Save description and failure/success effects run as inline prose

### Reaction Format

```
_**Name.**_ _Trigger:_ description. _Response:_ description.
```

The `_Trigger:_` and `_Response:_` labels are italic, inline within the entry.

### Legendary Actions Section Header

The section begins with the bare label `Legendary Actions` followed immediately by a block of italic description text (no blank line between label and description):

```
Legendary Actions
_Legendary Action Uses: 3 (4 in Lair). Immediately after_
_another creature's turn, the aboleth can expend a use to_
_take one of the following actions. The aboleth regains all_
_expended uses at the start of each of its turns._
```

The description is multi-line italic, with each line starting and ending with `_`. The number of uses may include a lair variant: `3 (4 in Lair)`.

### Spellcasting Action Format

Appears as a named action under `Actions` or `Bonus Actions`:

```
_**Spellcasting.**_ The monster casts one of the following spells,
requiring no Material components and using Intelligence as the
spellcasting ability (spell save DC 14):

**At Will:** _Spell Name_, _Spell Name_ (variant note), _Spell Name_
**2/Day Each:** _Spell Name_, _Spell Name_
**1/Day Each:** _Spell Name_, _Spell Name_ (level N version)
```

- Ability used: `Charisma`, `Intelligence`, or `Wisdom`
- `spell save DC N` always present when spells require saves
- `+N to hit with spell attacks` appears when spells use attack rolls
- Spell names are italic: `_Detect Magic_`
- Spell variant notes appear in parentheses after the italic name: `_Fireball_ (level 5 version)`
- Frequency categories: `At Will:`, `2/Day Each:`, `1/Day Each:`, `3/Day Each:` (bold)
- Spell list entries can span multiple lines (page breaks may interrupt mid-list)
- Some entries have restriction notes embedded inline: `_Invisibility_ (self only)`
- Some entries have complex inline parenthetical notes spanning multiple lines (Couatl's Shapechange note wraps across a page break)

### Coven Magic (Non-Standard Spellcasting)

The Green Hag has a trait called `Coven Magic` which describes conditional spellcasting inline in the trait text rather than using the structured `At Will:` / `1/Day Each:` format. This is the only such monster in the SRD chapter and is essentially freeform prose.

### Vampire Weakness (Sub-List in Trait)

The Vampire Spawn and Vampire have a trait with an embedded bold-labeled sub-list:

```
_**Vampire Weakness.**_ The vampire has these weaknesses:

**Forbiddance.** description
**Running Water.** description
**Stake to the Heart.** description
**Sunlight.** description
```

Sub-items use `**Name.**` (bold only, not italic+bold) followed by plain text. This is structurally different from regular action entries.

### Sphinx Roar (Sequenced Sub-Actions)

The Sphinx of Valor's `Roar (3/Day)` action contains a numbered sub-list of sequential effects:

```
**First Roar.** _Wisdom Saving Throw:_ DC 20...
**Second Roar.** _Wisdom Saving Throw:_ DC 20...
**Third Roar.** _Constitution Saving Throw:_ DC 20...
```

Again, sub-items use `**Name.**` (bold only) inline format.

---

## Data Types Extractable

### `Monster` (top-level)
- `name: string` — from `### **Name**`
- `group: string | null` — from `## **Group Name**` when different from individual name
- `size: string` — one of: Tiny, Small, Medium, Large, Huge, Gargantuan; also `"Medium or Small"` etc.
- `type: string` — creature type (Aberration, Beast, Celestial, Construct, Dragon, Elemental, Fey, Fiend, Giant, Humanoid, Monstrosity, Ooze, Plant, Undead)
- `tags: string[]` — values in parentheses after type, e.g. `["Demon"]`, `["Wizard"]`, `["Chromatic"]`, `["Titan"]`
- `alignment: string`
- `sourcePages: string` — page range from chapter source

### `CombatStats`
- `ac: number`
- `initiativeModifier: number`
- `initiativeScore: number`
- `hp: number` — average
- `hpDice: string` — e.g. `"20d10 + 40"`
- `speeds: SpeedEntry[]`

### `SpeedEntry`
- `type: string` — `"walk" | "fly" | "swim" | "burrow" | "climb"`
- `distance: number` — in feet
- `hover: boolean` — true when `(hover)` annotation present

### `AbilityScores`
- `str: AbilityEntry`, `dex: AbilityEntry`, `con: AbilityEntry`
- `int: AbilityEntry`, `wis: AbilityEntry`, `cha: AbilityEntry`

### `AbilityEntry`
- `score: number`
- `modifier: number`
- `savingThrow: number`

### `ChallengeRating`
- `cr: string` — `"0"`, `"1/8"`, `"1/4"`, `"1/2"`, `"1"` through `"30"`
- `xp: number`
- `xpInLair: number | null`
- `proficiencyBonus: number`

### `SkillProficiency`
- `skill: string`
- `modifier: number`

### `SenseEntry`
- `type: string` — e.g. `"Darkvision"`, `"Blindsight"`, `"Tremorsense"`, `"Truesight"`
- `range: number` — in feet
- `notes: string | null` — e.g. `"unimpeded by magical Darkness"`

### `MonsterTrait` / `MonsterAction` / `MonsterBonusAction` / `MonsterReaction`
- `name: string`
- `usageLimit: UsageLimit | null`
- `description: string` — raw prose

### `UsageLimit`
- `type: "perDay" | "recharge" | "rechargeRest" | "inLair"`
- `count: number | null`
- `rechargeMin: number | null`
- `rechargeMax: number | null`

### `LegendaryActions`
- `usesPerTurn: number`
- `usesPerTurnInLair: number | null`
- `actions: MonsterAction[]`

### `SpellcastingBlock`
- `ability: "Charisma" | "Intelligence" | "Wisdom"`
- `spellSaveDC: number | null`
- `spellAttackBonus: number | null`
- `requiresNoMaterialComponents: boolean`
- `requiresNoComponents: boolean`
- `atWill: SpellEntry[]`
- `perDayGroups: PerDayGroup[]`

### `SpellEntry`
- `name: string`
- `levelVariant: number | null` — from `(level N version)` annotation
- `notes: string | null` — other parenthetical restrictions

### `AttackEntry` (structured, extracted from description)
- `attackType: "melee" | "ranged" | "meleeOrRanged"`
- `attackBonus: number`
- `reach: number | null`
- `rangeNormal: number | null`
- `rangeLong: number | null`
- `averageDamage: number`
- `damageExpression: string`
- `damageType: string`

---

## Parsing Complexity

**Rating: High**

Reasons:

1. **The ability score table** is a non-standard markdown table with 11 columns, two data rows, mixed bold/unbolded ability names, tab characters inside cells, Unicode minus signs, and an occasional `Col4`/`Col8` artifact in separator columns. It cannot be parsed with a generic markdown table parser.

2. **Section delimiters are bare plaintext**, not headings. The parser must track state by recognizing lines like `"Traits"`, `"Actions"`, `"Bonus Actions"`, `"Reactions"`, `"Legendary Actions"` as section transitions. These bare labels appear nowhere else in the document in this form.

3. **Page break comments appear inside stat blocks** at arbitrary positions, splitting AC/HP/Speed lines, ability tables, spell lists, and action descriptions across page boundaries. They must be filtered out transparently.

4. **Spell lists can span lines and page breaks.** The `At Will:` list for a monster can extend over two or three lines, and a page break comment can appear in the middle.

5. **The Legendary Actions section** starts with a multi-line italic boilerplate block that must be recognized and stripped, not treated as an action entry.

6. **Actions with sub-lists** (Vampire Weakness, Sphinx Roar) require recognizing bold-only labels (`**Label.**`) as sub-item markers rather than section headers or action names.

7. **Usage annotations embedded in names** — `(Recharge 5–6)`, `(2/Day)`, `(3/Day, or 4/Day in Lair)` — must be extracted from the action name before storing the clean name.

8. **CR fractions** (`1/8`, `1/4`, `1/2`) must be parsed as rational numbers, not strings, for sorting and filtering.

9. **Immunities field mixes damage types and conditions** in a single field, separated by a semicolon. The parser must split on `;` to get two sublists.

10. **Unicode characters**: minus sign (`−` U+2212), en-dash (`–` U+2013 in recharge ranges), various non-breaking spaces/tabs inside cells. Naive ASCII string operations will fail.

---

## Key Patterns

### Stat Block Header (H3 + italic type line)

```markdown
### **Adult Black Dragon**

_Large Dragon (Chromatic), Chaotic Evil_
```

### Combat Stats Line

```markdown
**AC** 22 **Initiative** +16 (26)
**HP** 367 (21d20 + 147)
**Speed** 40 ft., Fly 80 ft., Swim 40 ft.
```

### Ability Score Table (typical)

```markdown
| Str 27 | +8 | +8 | Col4 | Dex 14 | +2 | +9 | Col8 | Con 25 | +7 | +7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Int** 16 | +3 | +3 |  | **Wis**	15 | +2 | +9 |  | **Cha**	22 | +6 | +6 |
```

### CR Line (with lair variant)

```markdown
**CR** 21 (XP 33,000, or 41,000 in lair; PB +7)
```

### Trait Entry

```markdown
_**Legendary Resistance (3/Day, or 4/Day in Lair).**_ If the dragon fails a saving throw, it can choose to succeed instead.
```

### Melee Attack Action

```markdown
_**Rend.**_ _Melee Attack Roll:_ +15, reach 15 ft. _Hit:_ 17 (2d8 + 8) Slashing damage plus 9 (2d8) Acid damage.
```

### Recharge Action

```markdown
_**Acid Breath (Recharge 5–6).**_ _Dexterity Saving Throw:_ DC 22, each creature in a 90-foot-long, 10-foot-wide Line. _Failure:_ 67 (15d8) Acid damage. _Success:_ Half damage.
```

### Reaction Entry

```markdown
_**Parry.**_ _Trigger:_ The bandit is hit by a melee attack roll while holding a weapon. _Response:_ The bandit adds 2 to its AC against that attack, possibly causing it to miss.
```

### Legendary Actions Section

```markdown
Legendary Actions
_Legendary Action Uses: 3 (4 in Lair). Immediately after_
_another creature's turn, the dragon can expend a use to_
_take one of the following actions. The dragon regains all_
_expended uses at the start of each of its turns._

_**Cloud of Insects.**_ _Dexterity Saving Throw:_ DC 17, ...
```

### Spellcasting Action Block

```markdown
_**Spellcasting.**_ The lich casts one of the following spells,
using Intelligence as the spellcasting ability (spell save DC 20):

**At Will:** _Detect Magic_, _Detect Thoughts_, _Dispel Magic_,
_Fireball_ (level 5 version), _Invisibility_, _Lightning Bolt_
(level 5 version), _Mage Hand_, _Prestidigitation_
**2/Day Each:** _Animate Dead_, _Dimension Door_,
_Plane Shift_
**1/Day Each:** _Chain Lightning_, _Finger of Death_, _Power_
_Word Kill_, _Scrying_
```

### Page Break Comment (noise to discard)

```markdown
## Page 265

<!-- source_txt: srd_extract/run2/pages/p265.txt -->
<!-- source_image: srd_extract/run2/images/p265.png -->
```

---

## Edge Cases & Gotchas

1. **Unicode minus in ability scores**: The minus sign in `−1` is U+2212 (MINUS SIGN), not ASCII hyphen U+002D. String-to-integer conversion using naive parseInt or split on `-` will fail. Must handle both characters.

2. **En-dash in recharge ranges**: `Recharge 4–6` uses U+2013 (EN DASH). Splitting on `-` will not work.

3. **Tabs inside ability table cells**: The Wis and Cha cells frequently contain a tab character between the ability name and score: `**Wis**\t15`. This is inconsistent with Str/Dex/Con cells which use a space or no separator.

4. **`Col4` / `Col8` in ability table separator columns**: ~224 rows use these literal values in what should be empty separator columns. They must be recognized and ignored.

5. **`MOD SAVE MOD SAVE MOD SAVE` header line**: Appears before the ability table on exactly 5 monsters (Basilisk, two others mid-chapter, and Zombie). Discard this line.

6. **Page break inside stat block content**: Page break comments (`## Page N` + HTML comments) appear at arbitrary points including:
   - Between the HP line and the ability table
   - Inside the ability table (between the two data rows)
   - Inside a spell list
   - Inside an action description paragraph
   - Between stat block fields (e.g., between `**Immunities**` and `**Senses**`)
   This is the most critical filtering requirement.

7. **Double blank lines between the ability table and stat fields**: After the ability table, there are frequently two blank lines before the first stat field. This is normal and should not be confused with a block separator.

8. **Immunity field spans multiple lines**: The `**Immunities**` field commonly wraps to the next line, e.g.:
   ```
   **Immunities** Poison, Thunder; Exhaustion, Grappled,
   Paralyzed, Petrified, Poisoned, Prone, Restrained,
   Unconscious
   ```
   The parser must join continuation lines until the next `**Key**` field begins.

9. **Skills field appears above Resistances/Immunities, not always**: Field order within the optional block is: Skills → Resistances → Vulnerabilities → Immunities → Gear → Senses → Languages → CR. This order is consistent but any field may be absent.

10. **CR 0 exists**: The Lemure and Awakened Shrub have CR 0 with XP of `10`, and the Lemure entry shows `0 or 10` in the reference table. CR 0 must be handled as a valid value, not as a parse error.

11. **Fractional CRs**: `1/8`, `1/4`, `1/2` are stored as strings in the source. For comparison/sorting logic, convert to decimal: `0.125`, `0.25`, `0.5`.

12. **`or N in lair` XP / uses variants**: Many legendary monsters have lair-scaled values:
    - CR line: `(XP 5,900, or 7,200 in lair; PB +4)`
    - Legendary Actions boilerplate: `Legendary Action Uses: 3 (4 in Lair)`
    - Legendary Resistance trait: `(3/Day, or 4/Day in Lair)`
    These must be captured as optional lair-variant fields, not discarded.

13. **Spellcasting trait vs. spellcasting action**: In 2024 SRD monsters, `Spellcasting` is listed as an `Actions` entry (not a `Traits` entry), though some monsters have conditional or coven-based spellcasting in `Traits` (e.g., Green Hag's `Coven Magic`). The `Coven Magic` trait does not use the structured `At Will:` / `1/Day Each:` format.

14. **Spell names that wrap across lines**: In the `At Will:` list, a spell name like `_Power` can appear at the end of one line with `_Word Kill_` starting the next. A naive line-by-line parser will split spell names. Spell name continuation lines lack any `At Will:` / `N/Day Each:` prefix and must be joined to the preceding line.

15. **Spellcasting ability note wrapping across page breaks (Couatl)**: The Couatl's `Shapechange` at-will description wraps across a page break comment:
    ```
    **At Will:** ..., _Shapechange_ (Beast or Humanoid form only, no Temporary Hit Points gained from the spell,

    ## Page 278
    <!-- source_txt: ... -->
    <!-- source_image: ... -->

    and no Concentration or Temporary Hit Points required to maintain the spell)
    ```
    The continuation of a parenthetical note can be separated by a page break comment and a blank line.

16. **Action entries that reference other stat block entries by bold name**: Some descriptions reference other monster entries inline, e.g., `two new **Black Puddings**`. These bold references are not headings or action names; they are prose cross-references.

17. **Speed with hover annotation**: `Fly 90 ft. (hover)` — the `(hover)` must be captured as a boolean flag on the fly speed entry, not as a separate speed.

18. **`Melee or Ranged Attack Roll`**: Some attacks are hybrid (e.g., the Lich's `Eldritch Burst`), with both a reach and a range. Both must be captured.

19. **Senses field semicolon separates special senses from Passive Perception**: `Darkvision 120 ft. (unimpeded by magical Darkness); Passive Perception 20` — `(unimpeded by magical Darkness)` is a parenthetical note on a specific sense type.

20. **Languages with `Understands ... but can't speak` variant**: Some monsters understand languages but cannot speak them, e.g., `Understands Common plus one other language but can't speak`. This must be captured as `canSpeak: false` rather than as a regular language entry.

21. **Stat blocks that appear just before a page break have no blank line before the table**: When the ability table follows immediately after a page break comment, the standard double-blank-line gap may be reduced to one blank line. Parser must be tolerant of 0, 1, or 2 blank lines before the table.

---

## Estimated Entry Count

- **H2 group headings**: ~175 (including 2 introductory-section headings that are not monster groups)
- **H3 stat block entries (individual monsters)**: **234**
- **Monsters with Legendary Actions**: ~30
- **Monsters with spellcasting**: ~35 (dragons, lich, mages, clerics, sphinxes, hags, unicorn, couatl, etc.)
- **Monsters with Bonus Actions**: ~64
- **Monsters with Reactions**: ~22
- **Monsters with lair-scaled CR values**: ~27

---

## Parser Priority

**Critical**

This chapter is the most important chapter in the SRD for virtually every D&D digital tool use case:

- **Encounter builder**: Needs CR, XP, monster type, and stat block for every monster
- **Compendium**: Full stat block display for all 234 entries
- **Combat tracker / initiative order**: AC, HP, speed, initiative
- **Character builder (indirect)**: Spells granted by class features that summon or reference specific monsters, wildshape forms, familiars
- **Rules engine**: Actions, saving throws, damage types, conditions for adjudicating monster abilities

The chapter should be parsed with the highest fidelity. Structured parsing of individual attack entries (attack bonus, damage dice, damage type) adds significant compendium value beyond raw description text and enables search, filter, and comparison features.

Recommended parsing approach: a line-by-line state machine that tracks current monster, current section (Traits/Actions/Bonus Actions/Reactions/Legendary Actions), and current entry accumulation, with pre-processing passes to:
1. Strip page break markers
2. Join continuation lines for spell lists and wrapped fields
3. Handle the ability table as a dedicated specialized parser
