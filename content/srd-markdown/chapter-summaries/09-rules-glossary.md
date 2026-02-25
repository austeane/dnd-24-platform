# Chapter 09: Rules Glossary — Parser Planning Summary

## Overview

This chapter is an alphabetically ordered glossary of game rules terms spanning pages 176–191 of the SRD 5.2.1. It defines roughly 130 discrete rules entries, including conditions, actions, hazards, areas of effect, attitudes, movement modes, and general gameplay concepts. It is the canonical source for machine-readable definitions of conditions (which are referenced everywhere in the rules engine) and for action names/tags that drive the character builder's action economy logic. The chapter also contains an abbreviations table and several embedded reference tables (damage types, carrying capacity, object AC/HP, water/food needs, skill-to-task mappings).

## Content Structure

The chapter uses the following markdown formatting patterns:

**Top-level document headings:**
- `# Rules Glossary` — document title (H1)
- `## Glossary Conventions` — preamble section (H2)
- `## Rules Definitions` — main glossary body (H2)

**Page break markers** (from PDF extraction):
- `## Page NNN` — H2 heading inserted before every page's content; these are structural artifacts, not semantic headings
- `<!-- source_txt: ... -->` and `<!-- source_image: ... -->` — HTML comments with source file references

**Entry headings:** Every glossary entry begins with a bold inline term on its own line, with no heading marker:
```
**Ability Check**
An ability check is a D20 Test...
```

**Tagged entries:** Some entries include a tag in brackets immediately after the name on the same bold line:
```
**Attack [Action]**
**Blinded [Condition]**
**Burning [Hazard]**
**Cube [Area of Effect]**
**Friendly [Attitude]**
```

**Sub-entries within an entry:** Many entries have named sub-sections using bold-italic inline text followed by body text on the same or next line:
```
_**Equipping and Unequipping Weapons.**_ You can either equip...
_**Damage.**_ If you take damage, you must succeed...
```

**See also cross-references:** Appear inline at the end of entry body text (or within it), using italic formatting:
```
_See also_ "Playing the Game" ("D20 Tests").
_See also_ "Blinded," "Darkness," and "Playing the Game" ("Exploration").
```

**Multi-column list artifacts:** Several entries reference sub-lists that were originally multi-column in the PDF. These render in the markdown as bare unformatted words split across blank-line-separated blocks, with no list markers:
```
Attack
Dash
Disengage


Dodge
Help
Hide
```

**Embedded tables:** Named tables use a heading pattern of `**Table Name**` followed immediately by a GFM pipe table. Some tables have a duplicate plain-text header row above the pipe table (PDF extraction artifact):
```
**Damage Types**

**Type** **Examples**

| Type | Examples |
| --- | --- |
| Acid | Corrosive liquids, digestive enzymes |
```

**Unordered lists:** Used within a small number of entries to enumerate items (e.g., Difficult Terrain, Long Rest interruptions, Short Rest interruptions):
```
- A creature that isn't Tiny or your ally
- Heavy snow, ice, rubble, or undergrowth
```

**Page footer lines:** Artifact lines from PDF extraction, e.g.:
```
**176** System Reference Document 5.2.1
```

## Data Types Extractable

### `GlossaryEntry` (base type for all entries)
- `name: string` — entry name without tag, e.g. `"Ability Check"`
- `tag: string | null` — bracket tag if present: `"Action"`, `"Condition"`, `"Hazard"`, `"Area of Effect"`, `"Attitude"`, or `null`
- `description: string` — full prose body (may include sub-entries)
- `subEntries: SubEntry[]` — named sub-sections parsed from `_**Label.**_` patterns
- `seeAlso: SeeAlsoRef[]` — cross-references parsed from `_See also_` patterns

### `SubEntry`
- `label: string` — the bold-italic label text, e.g. `"Equipping and Unequipping Weapons"`
- `text: string` — the body text following the label

### `SeeAlsoRef`
- `type: "glossary" | "chapter"` — whether the reference points to another glossary entry or a chapter section
- `target: string` — e.g. `"Blinded"` or `"Playing the Game"`
- `section: string | null` — parenthetical sub-section, e.g. `"D20 Tests"` or `"Exploration"`

### `Condition` (extends `GlossaryEntry`, tag === "Condition")
- `name: string` — one of the 10 condition names
- `effects: SubEntry[]` — the bulleted mechanical effects (always present in conditions)

The 10 conditions: Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious

Note: The chapter lists 15 conditions in the "Condition" entry enumerator but the Exhaustion entry notes it stacks uniquely.

### `Action` (extends `GlossaryEntry`, tag === "Action")
- `name: string` — e.g. `"Attack"`, `"Dash"`, `"Help"`
- `subEntries: SubEntry[]` — named sub-procedures

The tagged actions: Attack, Dash, Disengage, Dodge, Help, Hide, Influence, Magic, Ready, Search, Study, Utilize

### `Hazard` (extends `GlossaryEntry`, tag === "Hazard")
- Named hazards: Burning, Dehydration, Falling, Malnutrition, Suffocation

### `AreaOfEffect` (extends `GlossaryEntry`, tag === "Area of Effect")
- `name: string` — Cone, Cube, Cylinder, Emanation, Line, Sphere
- `hasPointOfOriginInArea: boolean` — always stated explicitly in each entry

### `Attitude` (extends `GlossaryEntry`, tag === "Attitude")
- Named attitudes: Friendly, Hostile, Indifferent

### `AbbreviationEntry`
- `abbreviation: string` — e.g. `"AC"`, `"PB"`, `"CR"`
- `expansion: string` — e.g. `"Armor Class"`, `"Proficiency Bonus"`

### `DamageType`
- `name: string` — e.g. `"Acid"`, `"Bludgeoning"` (13 total)
- `examples: string` — example description from the Damage Types table

### Reference tables (structured data embedded in entries):
- **Object Armor Class** — substance → AC mapping
- **Object Hit Points** — size × fragility → HP die expression
- **Carrying Capacity** — creature size → carry weight / drag weight formula
- **Water Needs per Day** — creature size → gallons/day
- **Food Needs per Day** — creature size → pounds/day
- **Influence Checks** — ability check name → interaction type
- **Search** — skill → thing to detect
- **Areas of Knowledge** — skill → knowledge domains

## Parsing Complexity

**Rating: Medium**

The structure is highly regular once the PDF-extraction artifacts are identified and stripped. The core challenge is that entries are not marked with heading-level syntax — they use inline `**Bold**` at the start of a paragraph, which means a parser cannot use standard heading-based document traversal. Instead it must detect the entry-name pattern (`^\*\*[A-Z][^*]+\*\*(\s+\[.+\])?\s*$`) at the paragraph level.

Additional complexity comes from:
1. Multi-column list artifacts (bare words with no list markers — must be reconstructed from context)
2. Duplicate plain-text header rows above GFM tables
3. Page break H2 headings and HTML comment lines that must be filtered out as structural noise
4. The `_See also_` pattern spans lines in some entries and mixes glossary entries with chapter references in a single comma-separated list
5. A handful of entries (Long Rest, Short Rest, Truesight, Unarmed Strike) use `**Bold.**` (no italic) for sub-entry labels, deviating from the `_**Bold.**_` italic-bold pattern used in most entries

## Key Patterns

**Entry name with no tag:**
```
**Ability Check**
An ability check is a D20 Test that represents...
```

**Entry name with tag:**
```
**Blinded [Condition]**
While you have the Blinded condition, you experience the following effects.
```

**Sub-entry (bold-italic label, most common form):**
```
_**Can't See.**_ You can't see and automatically fail any
ability check that requires sight.
```

**Sub-entry (bold label only, used in Long Rest / Short Rest / Truesight):**
```
**Regain All HP.** You regain all lost Hit Points and all
spent Hit Point Dice.
```

**See also — glossary-only refs:**
```
_See also_ "Blinded," "Darkness," and "Playing the Game" ("Exploration").
```

**See also — chapter section ref:**
```
_See also_ "Playing the Game" ("D20 Tests" and "Proficiency").
```

**Table with duplicate plain-text header (PDF artifact):**
```
**Type** **Examples**

| Type | Examples |
| --- | --- |
| Acid | Corrosive liquids, digestive enzymes |
```

**Multi-column list artifact (no list markers, whitespace-separated blocks):**
```
Attack
Dash
Disengage


Dodge
Help
Hide
```

**Page footer noise:**
```
**176** System Reference Document 5.2.1
```

## Edge Cases & Gotchas

1. **No heading markers on entries.** Every entry name is `**Bold**` inline text at the top of a paragraph, not an H3/H4. A parser relying on heading levels will miss all entries. Detection requires a regex match at the paragraph level: a line matching `^\*\*[A-Za-z].*\*\*(\s+\[.+\])?$` with no other content on that line.

2. **Two sub-entry label styles.** Most conditions and multi-part entries use `_**Label.**_` (bold-italic). Long Rest, Short Rest, Truesight, and Unarmed Strike use `**Label.**` (bold only). A parser must handle both. The difference appears to correlate with PDF layout differences in the original source (block quotes vs inline text).

3. **Page `## Page NNN` headings are noise.** These H2 headings were inserted during PDF extraction and are not part of the glossary's logical structure. They will interrupt an entry body mid-paragraph. Entries routinely span across page breaks; the parser must ignore these headings and join the text on either side.

4. **The abbreviations table is split across two pages.** The two halves (AC through LN, then M through XP) appear at different points in the file, separated by the "Rules Definitions" section header and several full entries (Ability Check, Ability Score and Modifier, Action). A parser wanting a complete abbreviations table must detect and merge both fragments.

5. **Multi-column lists have no list markers.** The Action entry lists its sub-actions as bare words in multi-column groups separated by blank lines. The Condition entry lists its 15 conditions the same way. A parser must detect these as enumeration lists by context (the entry text says "These actions are defined elsewhere in this glossary:" or "This glossary defines these conditions:") and not attempt to parse them as prose.

6. **Damage Types table is split across a page break.** The table `| Type | Examples |` is interrupted mid-table by a page footer and `## Page 180` marker. The GFM table is split into two separate tables with duplicated header rows.

7. **Some entries have no `_See also_` at all.** Ally, Bloodied, Cantrip, Damage, Enemy, Occupied Space, Per Day, Round Down, Save, Simultaneous Effects, Spell, Target, Unoccupied Space all lack `_See also_` lines. The field must be nullable/optional.

8. **`_See also_` references are unparsed prose, not a structured list.** References mix glossary entry names (quoted strings) with chapter titles and sub-section names in arbitrary comma/semicolon structures. Example: `_See also_ "Playing the Game" ("D20 Tests" and "Proficiency")` vs `_See also_ "Blinded," "Darkness," and "Playing the Game" ("Exploration")`.

9. **The `Condition` entry enumerator lists 15 conditions** but the bracketed `[Condition]` tag appears on exactly 10 entries in the main body (Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious — actually 15 when counted; the list in the text body matches). All 15 have `[Condition]` tags.

10. **`Exhaustion` is a condition with cumulative stacking**, explicitly called out in the `Condition` entry. Any conditions model must treat it differently from the other 14.

11. **Creature type list and condition list** appear as multi-column word blocks under their respective parent entries (`Creature Type` and `Condition`) — not as standalone entries. These are enumerations embedded inside an entry body, not their own entries.

12. **Page footer lines** match `^\*\*\d+\*\* System Reference Document 5\.2\.1$` and must be stripped before parsing.

## Estimated Entry Count

- Tagged entries:
  - Conditions: 15
  - Actions: 12
  - Hazards: 5
  - Areas of Effect: 6
  - Attitudes: 3
  - **Tagged subtotal: 41**
- Untagged rule entries: approximately 90
- **Total distinct parseable entries: ~131**
- Embedded named tables: 9
- Abbreviations: 28 (split across two table fragments)

## Parser Priority

**Critical**

This chapter is the most important in the SRD for a rules engine. Specifically:

- **Conditions** are referenced in every combat-related rule, every spell that imposes a status, and every monster ability. A character state model cannot function correctly without a typed, machine-readable condition registry. The structured `[Condition]` entries here are the canonical source.
- **Actions** (tagged `[Action]`) define the legal action economy choices available each turn. These map directly to UI affordances in a turn tracker or character sheet.
- **Hazards** define mechanical damage/exhaustion rules for survival scenarios.
- **Areas of Effect** define spell targeting geometry needed for any spell compendium feature.
- Cross-references (`_See also_`) are valuable for building a hyperlinked rules compendium and for validating that the parser has coverage of terms used elsewhere in the SRD.

The glossary should be parsed as the first or second chapter (alongside the core "Playing the Game" chapter) because its type definitions are prerequisites for correctly interpreting every other chapter.
