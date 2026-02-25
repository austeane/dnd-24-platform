# Chapter 06: Feats — Parser Planning Summary

## Overview

This chapter defines feats available in the SRD 5.2.1, covering four categories: Origin, General, Fighting Style, and Epic Boon. It begins with a short rules section explaining the parts of a feat (category, prerequisite, benefit, repeatable), then lists 18 individual feats. The chapter is highly structured and self-contained, making it one of the cleaner parsing targets in the SRD.

## Content Structure

- The file opens with a `# Feats` H1 and `## Page 87` / `## Page 88` page-break headers (OCR artifacts, not semantic).
- HTML comments (`<!-- source_txt: ... -->`, `<!-- source_image: ... -->`) appear at each page boundary.
- Category sections use `#### **Category Name**` (H4, bold).
- Individual feat entries follow a consistent 3-part pattern:
  1. `**Feat Name**` — bold text at the start of a paragraph (no heading marker).
  2. `_Category Line_` — italic text on the next line, e.g. `_Origin Feat_` or `_General Feat (Prerequisite: Level 4+)_`.
  3. Body text: free prose and/or a set of bold-italic named sub-benefits.
- Sub-benefits use `_**Benefit Name.**_` (italic-bold) inline at the start of a sentence within a paragraph.
- The `Repeatable` sub-benefit is always last when present, and uses the same `_**Repeatable.**_` pattern.
- Page number footers appear as bare lines like `**88** System Reference Document 5.2.1` — noise to strip.

## Data Types Extractable

### `FeatCategory`
- `id`: slug (e.g. `"origin"`, `"general"`, `"fighting-style"`, `"epic-boon"`)
- `name`: display name

### `Feat`
- `id`: slug (e.g. `"alert"`, `"magic-initiate"`)
- `name`: string
- `category`: `FeatCategory`
- `prerequisite`: string | null (raw text, e.g. `"Level 4+, Strength or Dexterity 13+"`)
- `prerequisiteLevel`: number | null (parsed from prerequisite)
- `prerequisiteAbilityScore`: `{ ability: string, minimum: number }[]` | null
- `prerequisiteFeature`: string | null (e.g. `"Fighting Style Feature"`, `"Spellcasting Feature"`)
- `repeatable`: boolean
- `repeatableNote`: string | null (e.g. `"must choose a different spell list each time"`)
- `benefits`: `FeatBenefit[]`
- `description`: string (full prose, for display)

### `FeatBenefit`
- `name`: string | null (named sub-benefits) or null (inline prose for simple feats)
- `description`: string

## Parsing Complexity

**Medium.**

The structure is consistent but requires inline-markdown parsing to extract feat names (bold paragraphs, not headings), category/prerequisite from an italic line, and named sub-benefits from italic-bold inline markers. The page-break headers and footer noise must be filtered. Prerequisite parsing into structured fields (level, ability score, feature name) adds a secondary parsing pass.

## Key Patterns

**Feat name line** — bold paragraph, no heading sigil:
```
**Alert**
_Origin Feat_
```

**Feat with prerequisite** — italic line includes parenthetical:
```
**Grappler**
_General Feat (Prerequisite: Level 4+, Strength or_
_Dexterity 13+)_
```

**Named sub-benefit** — italic-bold inline prefix:
```
_**Initiative Proficiency.**_ When you roll Initiative,
you can add your Proficiency Bonus to the roll.
```

**Repeatable marker**:
```
_**Repeatable.**_ You can take this feat more than
once, but you must choose a different spell list each time.
```

**Page break noise to strip**:
```
**88** System Reference Document 5.2.1
```

**Category section header** (H4 bold):
```
#### **General Feats**
```

## Edge Cases & Gotchas

1. **Feat name is not a heading.** Feat names are plain bold (`**Name**`) in paragraph position, not `##` headings. A naive heading-based splitter will miss them entirely.

2. **Prerequisite line wraps across two italic lines.** The Grappler and Boon of Spell Recall prerequisites break mid-line due to OCR column reflow (e.g. `_General Feat (Prerequisite: Level 4+, Strength or_\n_Dexterity 13+)_`). The parser must join consecutive italic lines that are part of the same category/prerequisite declaration.

3. **Page-break headers and HTML comments are noise.** `## Page 87`, `## Page 88`, `<!-- source_txt: ... -->`, `<!-- source_image: ... -->`, and footer lines like `**87** System Reference Document 5.2.1` must be stripped before parsing feat entries.

4. **The introductory rules section is not a feat.** The paragraphs under `## Feat Descriptions` and `#### Parts of a Feat` describe meta-rules (Category, Prerequisite, Benefit, Repeatable fields). These use the same `_**Label.**_` inline pattern but are not feat entries — a parser must skip content before the first category header (`#### Origin Feats`).

5. **Simple feats have no named sub-benefits.** Savage Attacker, Skilled, Archery, Defense, Great Weapon Fighting, and Two-Weapon Fighting are pure prose with no `_**SubBenefit.**_` markers. The parser must handle both structured and unstructured benefit bodies.

6. **Ability Score Increase maximum varies by category.** Origin/General feats cap at 20; Epic Boon feats cap at 30. This is data embedded in prose, not a structured field.

7. **`_Origin Feat_` vs `_General Feat (Prerequisite: ...)_`** — the category line's format differs: Origin/Fighting Style feats have no parenthetical; General and Epic Boon feats embed prerequisites inline in the same italic span.

## Estimated Entry Count

- **4** feat categories
- **18** individual feats:
  - Origin: 4 (Alert, Magic Initiate, Savage Attacker, Skilled)
  - General: 2 (Ability Score Improvement, Grappler)
  - Fighting Style: 4 (Archery, Defense, Great Weapon Fighting, Two-Weapon Fighting)
  - Epic Boon: 8 (Combat Prowess, Dimensional Travel, Fate, Irresistible Offense, Spell Recall, Night Spirit, Truesight — note: file contains 7 listed, cross-check source)
- **1** rules-intro block (Parts of a Feat) — not a parseable feat entry

## Parser Priority

**Critical.**

Feats are core character-building options referenced throughout the system (class features grant feat choices, background feats, ASIs). A character builder cannot function without them. The SRD set is small (18 feats) but the parsing patterns established here will generalize to larger feat sets. Should be parsed early.
