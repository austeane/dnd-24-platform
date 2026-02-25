# Chapter 01: Legal Information — Parser Planning Summary

## Overview

This file covers pages 1–4 of the SRD 5.2.1. It contains two distinct sections:
1. The CC-BY-4.0 license notice and attribution requirements (page 1).
2. A full table of contents for the SRD (pages 2–4), including chapter headings, section titles, and page numbers — presented as a dot-leader style index. Pages 2–4 also include an "Index of Stat Blocks" in the same format, listing every named monster/NPC with its page number.

Neither section contains game mechanics. The value to a parser is almost entirely in the ToC and stat block index as a cross-reference map (name → page number).

## Content Structure

- The file opens with a `# Legal Information` H1 and italic page-range metadata (`_Pages 1-4_`).
- Pages are delimited by `## Page N` H2 headings.
- Each page boundary is preceded by two HTML comments: `<!-- source_txt: ... -->` and `<!-- source_image: ... -->`.
- A duplicate `# **Legal Information**` H1 with bold wrapping appears inside page 1 (an OCR artifact from the original PDF header).
- Page 1 is free-running prose paragraphs. No lists, tables, or structured data.
- Pages 2–4 are two-column index-style content rendered as flat text with dot leaders (ellipsis+period padding). Formatted examples:

```
**Playing the Game.....................................5**
Rhythm of Play.................................................5
The Six Abilities **.** ..............................................5
```

```
**Classes...................................................... 28**
Barbarian.........................................................28
Barbarian Subclass:
Path of the Berserker..........................30
```

```
Aboleth...........................................................258
Adult Black Dragon **.** .................................264
```

- Top-level ToC entries are bold; sub-entries are plain text.
- Some bold markers appear mid-line as ` **.** ` (a period wrapped in bold markdown), which is an OCR artifact representing a real typographic dot leader in the original PDF.
- Page number footers appear as standalone lines: `**1** System Reference Document 5.2.1`, `**2** System Reference Document 5.2.1`, etc.
- The stat block index begins with a misplaced `# **Index of Stat Blocks**` H1 embedded mid-flow on page 2, without a `## Page` delimiter before it.

## Data Types Extractable

### `TocEntry`
- `title: string` — section or subsection name
- `page: number` — page reference
- `level: "chapter" | "section" | "subsection"` — inferred from bold formatting
- `parent?: string` — for subsections that span two lines (e.g., "Barbarian Subclass: / Path of the Berserker")

### `StatBlockIndexEntry`
- `name: string` — monster or NPC name
- `page: number` — page reference in the SRD PDF

### `LicenseMetadata`
- `licenseType: "CC-BY-4.0"`
- `documentTitle: "System Reference Document 5.2.1"`
- `publisher: "Wizards of the Coast LLC"`
- `attributionUrl: string`
- `licenseUrl: string`

## Parsing Complexity

**Medium.**

The prose section (page 1) is trivial. The index sections (pages 2–4) appear simple but have several complications: dot-leader padding must be stripped, the ` **.** ` bold-dot artifact must be handled, two-line entries for subclass names must be joined, bold formatting signals hierarchy, and the stat block index starts with no clear structural separator from the ToC. Page footer lines must also be filtered out.

## Key Patterns

Dot-leader line with page number (regex target: `^(.+?)[\s.]+(\d+)$` after stripping markdown):

```
Rhythm of Play.................................................5
```

Bold-wrapped chapter entry:

```
**Playing the Game.....................................5**
```

Mid-line OCR bold-dot artifact:

```
The Six Abilities **.** ..............................................5
```

Two-line subclass entry (must be joined with previous line):

```
Barbarian Subclass:
Path of the Berserker..........................30
```

Page footer (must be discarded):

```
**2** System Reference Document 5.2.1
```

HTML comment metadata (can be used for page-tracking):

```
<!-- source_txt: srd_extract/run2/pages/p002.txt -->
<!-- source_image: srd_extract/run2/images/p002.png -->
```

## Edge Cases & Gotchas

1. **Duplicate H1**: The file has both `# Legal Information` (file-level) and `# **Legal Information**` (OCR artifact inside page 1). A parser matching H1s will hit both.
2. **Mid-line bold-dot artifact** (` **.** `): Occurs ~30 times. Must be stripped before extracting the entry name, or it will corrupt the title string.
3. **Two-line entries**: Subclass names like "Barbarian Subclass: / Path of the Berserker" span two lines. The first line ends with a colon and has no page number; the continuation carries the page number. A naive line-by-line parser will produce a malformed entry.
4. **Stat block index embedded mid-ToC**: The `# **Index of Stat Blocks**` heading appears inline on page 2 without a new `## Page` section, meaning a page-boundary parser must not assume sections are cleanly separated.
5. **No blank line between ToC columns**: The two-column PDF layout was linearized, so there are no structural separators between what were visually distinct columns. The flat list is internally consistent but the column-break positions are unpredictable.
6. **Page footer noise**: Lines matching `**N** System Reference Document 5.2.1` appear after each page section and must be excluded from parsed entries.
7. **"Animals" section**: Listed as a top-level chapter in the ToC (`**Animals................................................. 344**`) but has no sub-entries — likely a section that continues directly into the stat block index.

## Estimated Entry Count

- License metadata: 1 structured record
- ToC entries: ~90 (chapters + sections + subsections)
- Stat block index entries: ~250–260 named monsters/NPCs

Total parseable entries: approximately 350.

## Parser Priority

**Skip** (for a character builder / compendium / rules engine).

The license text has no mechanical value. The ToC and stat block index are useful only as a cross-reference to original PDF page numbers, which are irrelevant once the actual content is parsed from its own chapter files. If a "jump to page" or PDF-link feature is ever needed, the stat block index could be parsed at that point. Otherwise this chapter yields nothing actionable for gameplay logic, character state, or rules enforcement.
