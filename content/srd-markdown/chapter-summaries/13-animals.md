# Chapter 13: Animals — Parser Planning Summary

## Overview

This chapter covers pages 344–364 of the SRD 5.2.1 and contains 96 animal stat blocks, ranging from tiny creatures (Bat, Seahorse) to massive dinosaurs (Tyrannosaurus Rex, Mammoth). The chapter is pure stat block content with no introductory prose — it begins immediately with entries and contains nothing else. It is a direct companion to Chapter 12 (Monsters), sharing the exact same stat block format. Animals are mechanically identical in structure to monsters; the distinction is taxonomic (creature type tags such as "Beast," "Celestial," or "Monstrosity"), not structural.

The chapter is highly relevant to parsing because many of these creatures serve as player-available familiars, mounts, ranger companions, wildshape forms, and druid Circle of the Land/Moon forms. A character builder or rules engine needs this data for those features.

**Important:** The file opens with two stray stat block entries that belong to Chapter 12: an unnamed creature with a Slam attack (lines 10–13) and the Ogre Zombie (lines 14–41). These appear at the top of the page due to page boundary positioning in the OCR extraction. The actual Animals chapter H1 (`# **Animals**`) begins at line 47, with the first animal entry (Allosaurus) immediately following.

## Content Structure

- File-level H1: `# Animals` (plain, line 1)
- Page-range italic: `_Pages 344-364_` (line 3)
- Page delimiters: `## Page N` H2 headings, each followed by two HTML comments
- Per-animal heading: `### **Name**` (H3, bold-wrapped)
- Type/alignment line: `_Size Type (Tag), Alignment_` (italic, one line below H3)
- Combat highlights: `**AC** N **Initiative** +N (N)` on one line, then `**HP** N (dice)` and `**Speed** N ft.` on separate lines
- Ability score table: two-row markdown table with 11 columns (3 abilities per row + spacer columns)
- Optional details block: `**Skills** ...`, `**Resistances** ...`, `**Immunities** ...`, `**Senses** ...`, `**Languages** ...`, `**CR** N (XP N; PB +N)` — all bolded labels, semicolon-separated senses
- Action category labels: plain text lines (`Traits`, `Actions`, `Bonus Actions`, `Reactions`) with no markdown formatting
- Per-action lines: `_**Action Name.**_ _Attack/Save type:_ details. _Hit/Failure/Success:_ outcome.`
- Page footer: `**NNN** System Reference Document 5.2.1` (must be discarded)

## Data Types Extractable

### `AnimalStatBlock`
- `name: string` — e.g., "Allosaurus", "Swarm of Bats"
- `size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan"`
- `creatureType: string` — e.g., "Beast", "Celestial", "Monstrosity"
- `creatureTag?: string` — parenthetical subtype, e.g., "Dinosaur"
- `alignment: string` — e.g., "Unaligned", "Neutral Good", "Neutral Evil"
- `armorClass: number`
- `initiative: { modifier: number; score: number }` — e.g., `{ modifier: +1, score: 11 }`
- `hitPoints: { average: number; diceExpression: string }` — e.g., `{ average: 51, diceExpression: "6d10 + 18" }`
- `speed: SpeedEntry[]` — e.g., `[{ type: "walk", feet: 60 }, { type: "climb", feet: 30 }]`
- `abilityScores: AbilityScoreBlock` — all six scores with modifier and save bonus
- `skills?: SkillEntry[]` — e.g., `[{ skill: "Perception", bonus: +5 }]`
- `resistances?: string[]` — damage types
- `immunities?: { damage: string[]; conditions: string[] }` — split on semicolon
- `senses?: SenseEntry[]` — e.g., `[{ type: "Darkvision", range: 60 }, { type: "Passive Perception", value: 15 }]`
- `languages: string` — almost always `"None"` for animals; sometimes `"Understands X but can't speak"`
- `challengeRating: string` — e.g., `"2"`, `"1/2"`, `"0"`, `"1/8"`
- `experiencePoints: number`
- `proficiencyBonus: number`
- `traits?: ActionEntry[]`
- `actions?: ActionEntry[]`
- `bonusActions?: ActionEntry[]`
- `reactions?: ActionEntry[]`

### `ActionEntry`
- `name: string` — e.g., "Bite", "Multiattack", "Web (Recharge 5–6)"
- `recharge?: string` — e.g., `"6"`, `"5-6"`, `"1/Day"`
- `description: string` — full prose text of the action
- `attackRoll?: { bonus: number; reach?: number; range?: string }`
- `savingThrow?: { type: string; dc: number }`
- `hitDamage?: DamageEntry[]`

### `AbilityScoreBlock`
- `str: { score: number; modifier: number; save: number }`
- `dex: { score: number; modifier: number; save: number }`
- `con: { score: number; modifier: number; save: number }`
- `int: { score: number; modifier: number; save: number }`
- `wis: { score: number; modifier: number; save: number }`
- `cha: { score: number; modifier: number; save: number }`

## Parsing Complexity

**Medium** (slightly lower than Chapter 12 monsters).

The stat block format is structurally identical to Chapter 12. The reduction in complexity relative to Chapter 12 comes from: no leading prose section to skip, no legendary actions, no lair actions, no legendary resistance, and simpler ability sets overall. Animals rarely have spellcasting (only Giant Owl has it). The same OCR artifacts present in Chapter 12 appear here: spurious `MOD SAVE MOD SAVE MOD SAVE` header lines (7 occurrences), entries split across page boundaries, page footers, and inline tab characters in bold-wrapped ability score labels. The most complex structural issue is that two Chapter 12 entries appear at the very top of the file before the Animals H1.

## Key Patterns

Stat block header (H3 entry start):

```
### **Allosaurus**

_Large Beast (Dinosaur), Unaligned_
```

Combat highlights line (AC, Initiative, HP, Speed — each on its own line):

```
**AC** 13 **Initiative** +1 (11)
**HP** 51 (6d10 + 18)
**Speed** 60 ft.
```

Ability score table (two-row, 11-column, with Col4/Col8 spacers and embedded tab characters in some cells):

```
| Str 19 | +4 | +4 | Col4 | Dex 13 | +1 | +1 | Col8 | Con 17 | +3 | +3 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Int** 2 | −4 | −4 |  | **Wis**	12 | +1 | +1 |  | **Cha**	 5 | −3 | −3 |
```

Details block (optional fields only present when non-empty):

```
**Skills** Perception +5
**Senses** Darkvision 60 ft.; Passive Perception 15
**Languages** None
**CR** 2 (XP 450; PB +2)
```

Action category label (plain text, no markdown, on its own line):

```
Actions
```

Melee attack action:

```
_**Bite.**_ _Melee Attack Roll:_ +6, reach 5 ft. _Hit:_ 15 (2d10 + 4) Piercing damage.
```

Saving throw action (Bonus Action section):

```
_**Trample.**_ _Dexterity Saving Throw:_ DC 16, one creature
within 5 feet that has the Prone condition. _Failure:_ 17
(2d10 + 6) Bludgeoning damage. _Success:_ Half damage.
```

Reaction with trigger/response pattern:

```
_**Ink Cloud (1/Day).**_ _Trigger:_ The octopus takes damage
while underwater. _Response:_ The octopus releases ink...
```

Spellcasting block (only Giant Owl):

```
**At Will:** _Detect Evil and Good_, _Detect Magic_
**1/Day:** _Clairvoyance_
```

Swarm immunities (condition immunities separated from damage immunities by semicolon on the Immunities line):

```
**Immunities** Charmed, Frightened, Grappled, Paralyzed,
Petrified, Prone, Restrained, Stunned
```

Page delimiter with HTML comments (must be skipped):

```
## Page 345

<!-- source_txt: srd_extract/run2/pages/p345.txt -->
<!-- source_image: srd_extract/run2/images/p345.png -->
```

Page footer (must be discarded):

```
**344** System Reference Document 5.2.1
```

## Edge Cases & Gotchas

1. **Stray Chapter 12 entries at file start.** Lines 1–46 contain an unnamed creature fragment (Slam attack only) and the full Ogre Zombie stat block — both are from page 344 in Chapter 12. These appear before the `# **Animals**` H1 on line 47. A parser must skip everything before that H1, or treat the file as having a dirty preamble. The first valid animal entry is Allosaurus at line 48.

2. **Duplicate H1 for chapter title.** The file has `# Animals` (line 1, file-level, plain) and `# **Animals**` (line 47, bold-wrapped, inside the first page). A parser using H1s to detect chapter boundaries must handle both.

3. **`MOD SAVE MOD SAVE MOD SAVE` artifact.** Appears 7 times as a plain-text line immediately before the ability score table. This is an OCR artifact from the column headers in the original PDF layout. It must be discarded before parsing the table.

4. **Ability score table tab characters.** Some `**Int**`, `**Wis**`, and `**Cha**` cells in the second table row contain embedded tab characters between the bold marker and the score number (e.g., `**Wis\t12`). Trimming is required.

5. **Entries split across page boundaries.** The `## Page N` delimiter with its two HTML comments can appear mid-entry — between the stat block header and the ability table, or between the traits and actions sections. A parser cannot use page headers as entry boundaries.

6. **Non-Beast creature types.** Although the chapter is called "Animals," 5 entries are not typed as Beast: Flying Snake (Tiny Monstrosity), Giant Vulture (Large Monstrosity), Giant Eagle (Large Celestial), Giant Elk (Huge Celestial), Giant Owl (Large Celestial). The Ogre Zombie stray entry is Undead.

7. **Swarm entries use a different size pattern.** Swarm entries have a compound size: `_Large Swarm of Tiny Beasts, Unaligned_`. The type field contains "Swarm of Tiny Beasts" rather than just "Beast." These entries also consistently have condition Immunities (shared by all swarms) and a Swarm trait, and their attack damage has a Bloodied condition variant.

8. **Single-line vs. multi-line field values.** `Immunities` can wrap across two lines (e.g., condition lists). `Languages` can be multi-phrase (e.g., "Celestial; understands Common and Primordial (Auran) but can't speak them"). `Senses` uses semicolons to separate multiple sense types. All of these require careful splitting logic rather than naive EOL termination.

9. **Fractional CR values.** CR is stored as a string: "0", "1/8", "1/4", "1/2", or integer strings. The XP field for CR 0 is always 10 in this chapter (no "0 or 10" ambiguity seen here, unlike Chapter 12's XP table).

10. **Recharge notation variation.** Recharge appears as `(Recharge 6)` (single die face) or `(Recharge 5–6)` (range with en-dash, not hyphen). Per-day usage appears as `(1/Day)` parenthetically in the action name.

11. **Damage in Hit field can be multi-type.** Some actions deal mixed damage in the Hit line, e.g., Bite dealing Piercing plus Poison: `_Hit:_ 4 (1d4 + 2) Piercing damage plus 3 (1d6) Poison damage.`

12. **Action descriptions wrap across lines with hard wraps.** Long descriptions break mid-sentence at page column width. These are plain paragraph continuations; there is no special marker.

## Estimated Entry Count

- Valid animal stat blocks: **96** (confirmed by H3 heading count)
- Stray Chapter 12 entries at top of file: 2 (Ogre Zombie + partial unnamed creature fragment)
- Total `### **Name**` headings in file: 96

Breakdown by creature type:
- Beast: ~85
- Celestial: 3 (Giant Eagle, Giant Elk, Giant Owl)
- Monstrosity: 2 (Flying Snake, Giant Vulture)
- Undead: 1 stray (Ogre Zombie — belongs to Chapter 12)

Swarm entries (Beast subtype): 6 (Bats, Insects, Piranhas, Rats, Ravens, Venomous Snakes)

## Comparison with Chapter 12 (Monsters)

The stat block format is **structurally identical** between the two chapters. Every field, every markdown pattern, and every OCR artifact type documented in Chapter 12 applies here. The differences are:

| Aspect | Chapter 12 | Chapter 13 |
|---|---|---|
| Leading prose | ~3 pages of rules explanation before first stat block | None — first stat block is on the first content page |
| Entry count | 234 stat blocks | 96 stat blocks |
| Legendary Actions | Present on many entries | None |
| Lair Actions | Present on some entries | None |
| Legendary Resistance | Present on some entries | None |
| Spellcasting | Common (many monsters) | Rare (Giant Owl only) |
| Creature types | All 14 types | Primarily Beast; 3 Celestial, 2 Monstrosity, 1 stray Undead |
| Stray entries | None (chapter starts cleanly) | 2 stray Chapter 12 entries before the Animals H1 |
| `MOD SAVE` artifacts | Present | Present (7 occurrences) |
| Table tab characters | Present | Present |
| Page-split entries | Present | Present |

A parser written for Chapter 12 stat blocks can parse Chapter 13 with only these additions: (1) strip the stray preamble before the Animals H1, and (2) handle the compound swarm type string `"Swarm of Tiny Beasts"`.

## Parser Priority

**Important.**

Animals are needed for several character builder features: familiars (Find Familiar spell, Pact of the Chain), animal companions (Rangers, Beast Master subclass), wildshape forms (Druids — this is the primary lookup table for wildshape eligibility by CR and movement type), mounts (mounted combat, paladin Find Steed). Without parsed animal data, the app cannot support Druid wildshape selection, ranger companion lookup, or familiar choice. This makes Chapter 13 more immediately useful than much of Chapter 12 for a character builder specifically (as opposed to an encounter builder, which would prioritize Chapter 12).

Parsing should reuse the Chapter 12 monster parser with minimal modifications. The same `AnimalStatBlock` type can be unified with the `MonsterStatBlock` type under a shared interface, since the fields are identical.
