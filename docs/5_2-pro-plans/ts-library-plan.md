Please help me figure out my next steps for my ambitious dnd app (not looking to tone it down at all)

<------ conversation turn ends ------>
You don’t need to tone anything down. You do need to get ruthless about sequencing—because in this codebase, the ambitious “hybrid everything” vision only becomes real once two things are true:
	1.	SRD data is reliably parsed into typed arrays, and
	2.	Sources → Effects → CharacterState actually runs end‑to‑end with explainability.

Right now you have excellent planning docs, types, and scaffolding—but the “next steps” are about turning that plan into a mechanical feedback loop that can’t drift.

Below is the fastest path to “this app is inevitable” without shrinking scope.

⸻

The actual critical path (what unlocks everything)

Critical path A — SRD → typed data

If the library can export allSpells, allWeapons, allClasses, etc. with tests + validation, then:
	•	Compendium UI becomes trivial.
	•	Character builder becomes mostly wiring.
	•	Effects extraction becomes a second-pass, not a parsing mess.
	•	You can ship Standard, AA, and Hybrid without rewriting content ingestion later.

Critical path B — Effects engine (even a minimal slice)

If you can take a few Sources and compute:
	•	PB
	•	AC breakdown
	•	Initiative breakdown
	•	speed
	•	proficiencies
…then your “Hybrid conflict rules” become enforceable code instead of doc promises.

⸻

The single biggest “do this first” issue in your repo

You’re missing GFM table parsing support

Your plan depends heavily on remark Table nodes (parseMarkdownTable(node: Table)), but remark-parse alone won’t reliably produce table nodes for pipe tables unless you enable GFM parsing.

So before you write any serious parser: add remark-gfm and wire it into parseMarkdown.

If you skip this, equipment/classes/creation tables/rules tables will silently parse as paragraphs and you’ll lose days debugging “why are there no tables?”

Next step #0: add:
	•	remark-gfm
	•	mdast-util-to-markdown (already in your plan for nodesToMarkdown)

⸻

Next steps: do these in order (no hand-waving)

Step 1 — Make shared parsing utilities real (Wave 0, but start minimal)

You already have parseMarkdown, splitByHeading, etc. Great. Now you need the SRD-specific “noise stripping + normalization” layer or every parser becomes bespoke suffering.

Implement in library/src/parsers/shared.ts:
	•	normalizeUnicode(text: string): string
	•	Replace U+2212 with -
	•	Replace U+2013 with -
	•	Replace tabs with spaces
	•	preprocessMarkdown(markdown: string): string
	•	Strip ## Page N
	•	Strip <!-- source_* -->
	•	Strip SRD footer lines like **104** System Reference Document 5.2.1
	•	Strip MOD SAVE MOD SAVE... artifact lines (monsters)
	•	(Optional but good early) remove the duplicate “bold header row” lines immediately preceding pipe tables
	•	joinWrappedItalicLines(nodes: Content[]): Content[]
	•	Needed immediately for spells and magic items
	•	extractBoldField(nodes, fieldName)
	•	Needed immediately for spells/background/species
	•	splitByBoldParagraph(nodes)
	•	Needed immediately for spells/feats/magic items/rules

Definition of done for Step 1:
	•	You can write a unit test that feeds a tiny markdown snippet with:
	•	a ## Page 10
	•	an HTML comment line
	•	a bold footer line
	•	a wrapped italic metadata line
…and confirm your preprocess/normalize/join behave exactly as expected.

This is the “trust layer” every future parser will lean on.

⸻

Step 2 — Update types now, not later (because tests will force it anyway)

Your Plan 002 type changes aren’t implemented yet. Do them early so you don’t build parsers against the wrong contracts.

Immediate type changes:
	•	Weapon: add mastery: string
	•	Monster: add
	•	initiative: { modifier: number; score: number }
	•	proficiencyBonus: number
	•	bonusActions: MonsterAction[]

New types (per plan):
	•	Species, SpeciesTrait
	•	Background
	•	LevelAdvancement, AbilityScoreModifier

Definition of done:
	•	pnpm -F @dnd/library check passes.
	•	No parser code is blocked on missing fields later.

⸻

Step 3 — Decide how you expose parsed SRD data (this is a trap if you ignore it)

Your plan says: library/src/data/*.ts reads markdown via fs.readFileSync at module import time.

That’s fine on the server, but it can blow up if client bundles touch it (because browser bundles don’t have fs).

Do this cleanly:
	•	Keep @dnd/library entrypoint pure (types + parsers, no Node fs).
	•	Add a separate export path for Node-only parsed data:

Example approach:
	•	@dnd/library → types/parsers only
	•	@dnd/library/data → Node-only allSpells, etc.

This prevents accidental imports from client code from detonating your build.

Definition of done:
	•	You can import @dnd/library from client-safe code without Node polyfills.
	•	Only server routes import @dnd/library/data.

(Alternative: build-time generate JSON/TS so it becomes client-safe. That’s a later upgrade, not required today.)

⸻

Step 4 — Implement the first real parser: Spells (because it’s the cleanest format)

You already chose the right order. Now make it real.

What to do next for spells
	1.	Expand tests/fixtures/spell-sample.md to include:
	•	cantrip + leveled
	•	a spell with “Action or Ritual”
	•	a spell with wrapped class list across 2 italic lines
	•	a spell where metadata is interrupted by a page break artifact (simulate it)
	•	a spell with _**Using a Higher-Level Spell Slot.**_
	2.	Convert it.todo tests in library/tests/parsers/spells.test.ts into real assertions.
	3.	Implement parseSpells() using these rules:
	•	A spell entry starts at a paragraph that is only a bold name (strong-only paragraph)
	•	The next paragraph(s) include the italic metadata line; join wrapped italics first
	•	Then extract Casting Time / Range / Components / Duration
	•	Everything after that is description, with upgrade section split out

Definition of done:
	•	Fixture tests pass.
	•	No “false spells” are emitted from _**Using a Higher-Level Spell Slot.**_ or embedded stat blocks.

This gives you your first end-to-end “SRD → typed array” win.

⸻

Step 5 — Immediately wire “data export + count validation” for spells

Even before other parsers exist, do this for spells.
	•	Create library/src/data/spells.ts that exports allSpells
	•	Add tests/validation/counts.test.ts with expect(allSpells.length).toBeGreaterThanOrEqual(300) (or whatever the full chapter yields once you wire real chapter input)

Why do this early:
	•	It catches “parser works on fixture but fails on real SRD” immediately.
	•	It creates the pattern every future parser will follow.

⸻

Step 6 — Run the “Wave 1 trio” next: Feats + Equipment

Once spells is stable, do feats and equipment next because they also unlock UI quickly.

Feats
	•	Same “split by bold name → parse italic category line → body markdown” pattern.
	•	Early effect extraction win: Alert can populate Effect[] (initiative modifier) right away.

Equipment

This is where the table parsing decision pays off.
	•	Weapons table: emit mastery, parse properties with parenthesis-aware splitting.
	•	Armor table: parse AC formulas and flags.
	•	Gear: start with “good enough” parsing (name/cost/weight/description). You can refine later.

Definition of done for Wave 1:
	•	allSpells, allFeats, allWeapons, allArmor exist and have sane counts.
	•	Spot-check tests for Fireball / Alert / Longsword / Plate pass.

At that point, your app can already have a compelling compendium.

⸻

What I’d build in the app as soon as spells exist (vertical slice, still ambitious)

Even though your focus is library-first, you should cash in on morale + validation fast:
	1.	Compendium “Spells” page
	•	search by name
	•	filter by class, level, school
	•	open spell detail page
	2.	Character sheet prototype
	•	hardcode one sample character
	•	show derived initiative/ac/speed with explanation breakdown (even if explanation is trivial at first)

This doesn’t reduce ambition—it creates a proving ground for every library change.

⸻

A blunt “don’t get stuck” rule for the next month

Do not start the full CharacterComputer until:
	•	spells + feats + equipment + origins + creation tables are parsed and exported
	•	you have at least one “effects heuristic” pass working on some feats/species traits

Otherwise you’ll end up inventing engine rules while the content shape is still unstable, and you’ll redo work.

⸻

Your immediate TODO list (copy/paste)

If you want a clean checklist you can literally execute:
	•	Add remark-gfm + mdast-util-to-markdown deps to @dnd/library
	•	Update parseMarkdown() to use GFM so tables parse as table nodes
	•	Implement normalizeUnicode() + preprocessMarkdown() in shared.ts
	•	Implement splitByBoldParagraph(), extractBoldField(), joinWrappedItalicLines()
	•	Update types: Weapon.mastery, monster initiative/PB/bonusActions, add Species/Background/Creation types
	•	Expand spell fixture to include the ugly edge cases you documented
	•	Turn the it.todo spell tests into real tests
	•	Implement parseSpells() until tests pass
	•	Add @dnd/library/data export path (Node-only) and wire allSpells
	•	Add a count validation test for spells against the real chapter input

⸻

If you want, I can also propose the exact structure for @dnd/library exports so you never accidentally bundle Node-only fs code into the client (this is the #1 monorepo footgun once you add data/).


<------ conversation turn ends ------>

I think what I actually want to do instead is not refer to the md really at all once this is built... And just truly convert everything into markdown. A ton of manual coding, but I can have a full fleet of codex agents do it for me, I just need to be able to steer them and verify correctness.
<------ conversation turn ends ------>
Yep — this is a good instinct, and it’s not “toning down.” It’s you saying: “I want a clean canonical content layer, and I never want to think about the ugly extracted SRD chapter markdown again.”

One important correction though:
	•	You already have markdown (the SRD chapter dumps).
	•	What you’re describing is canonicalizing it into your own clean, stable content format (often “Markdown + frontmatter”), and then compiling that into typed TS/JSON so the app/library never touches the raw SRD markdown again.

That gives you three huge wins:
	1.	the original SRD noise becomes an ingestion detail you can forget,
	2.	agents can safely mass-produce files in a predictable format,
	3.	correctness becomes mechanically verifiable.

Here’s the plan I’d run.

⸻

The target state: a 2-step “content compiler”

Layer 1: Canonical content (human/agent-friendly)

You store one file per entity (spell, feat, item, monster, etc.) in a canonical format:
	•	content/canon/spells/acid-arrow.md
	•	content/canon/feats/alert.md
	•	content/canon/equipment/weapons/longsword.md
	•	content/canon/monsters/aboleth.md
	•	etc.

Each file is:
	•	frontmatter = the structured fields you need for code
	•	markdown body = the description text you render in UI

Layer 2: Compiled artifacts (runtime-friendly)

A generator script compiles canonical files into pure TypeScript constants (or JSON) that your app consumes:
	•	library/src/generated/spells.ts exporting allSpells: Spell[]
	•	library/src/generated/feats.ts
	•	etc.

At runtime: no remark, no SRD parsing, no fs reads, just imports.

⸻

Canonical file format that scales with your ambition

Use Markdown + YAML frontmatter (this is the “CMS in git” approach).

Example: content/canon/spells/acid-arrow.md

---
type: spell
name: Acid Arrow
level: 2
school: Evocation
classes: [Wizard]
castingTime: Action
range: 90 feet
components:
  verbal: true
  somatic: true
  material: powdered rhubarb leaf
duration: Instantaneous
concentration: false
ritual: false
---

A shimmering green arrow streaks toward a target…

## Using a Higher-Level Spell Slot
When you cast this spell using…

Example: content/canon/feats/alert.md

---
type: feat
name: Alert
category: origin
prerequisite:
repeatable: false
---

Always on the lookout for danger…

This format is perfect for a fleet of agents because:
	•	the required fields are explicit,
	•	the body stays freeform markdown,
	•	diffs are readable,
	•	you can add a source: block later without breaking everything.

⸻

Steering agents: give them a “content contract” + a failing test

If you want agents to crank through hundreds of entries without you babysitting, you need one thing:

A validator that fails loudly and specifically.

Add a “canonical content validator” test suite

Create something like:
	•	library/tests/content/validate-canon.test.ts
	•	It loads content/canon/**.md
	•	Parses frontmatter
	•	Validates shape (by type: spell/feat/etc.)
	•	Ensures naming + uniqueness + invariants

This is how you steer: agents don’t “finish” when they wrote files — they finish when the validator is green.

⸻

Verification layers that actually catch mistakes

You want correctness you can trust without reading 10,000 lines.

Here’s the stack that works:

1) Schema validation (hard fail)

For each entity:
	•	required fields present
	•	field types correct
	•	enums enforced (SpellSchool, FeatCategory, etc.)
	•	numeric ranges enforced (spell level 0–9)

You can do this with:
	•	Zod (super clear error messages), or
	•	TypeScript-only (harder to validate frontmatter at runtime)

If you’re serious about agent scale, Zod is worth it because the error output becomes your steering wheel.

2) Completeness + uniqueness (hard fail)
	•	No duplicate names within a type
	•	Slug matches name (or a deterministic slug function)
	•	Required counts (spells >= 300, classes = 12, etc.)

3) Spot checks (hard fail, low effort)

Exactly what you already planned:
	•	Fireball fields
	•	Alert feat category/prereq
	•	Longsword damage/mastery
	•	Aboleth CR/AC/HP/etc.

This catches “looks valid but wrong.”

4) Optional but extremely powerful: Manifest comparison vs raw SRD (dev/CI only)

Even if you never ship the raw SRD markdown, keep it around in repo and CI and do a lightweight check:
	•	Extract just the list of entity names from the SRD chapters (very shallow parsing)
	•	Compare against canonical file set
	•	Fail if anything is missing/extra

This prevents “we accidentally forgot 37 spells” — which is the #1 failure mode in manual conversions.

If you truly want to delete raw SRD markdown entirely later, do it only after you’ve produced a frozen manifest file you trust.

⸻

How to partition work for a fleet of agents

Don’t assign “spells” to an agent. Assign a bounded slice with a measurable deliverable.

Good task partitioning:
	•	spells A–C
	•	spells D–F
	•	magic-items A–D
	•	monsters CR 0–1
	•	etc.

Each agent must deliver:
	1.	X new canonical markdown files
	2.	validator passes
	3.	zero duplicates
	4.	stable formatting (frontmatter keys in fixed order)

You also want a “progress dashboard” script

Something like:
	•	pnpm content:report
	•	prints counts by type, spells by level, spells by class, etc.
This is how you sanity-check the dataset in 30 seconds.

⸻

What to build first (the smallest proof that your approach works)

Don’t start by converting 300 spells.

Do this:
	1.	Implement the canonical validator + compiler
	2.	Create canonical files for 5 spells manually
	3.	Compile them into library/src/generated/spells.ts
	4.	Import allSpells somewhere and prove it’s usable

Once that loop is solid, agents can scale it.

Minimal initial scope (still ambitious, but executable)
	•	spells: 5
	•	feats: 3
	•	weapons: 5
	•	1 monster

Just enough to prove:
	•	frontmatter parsing works
	•	compilation works
	•	types are enforced
	•	rendering markdown body works
	•	tests catch errors

⸻

Implementation choices you should decide now

These are the “fork in the road” decisions that affect everything:

A) Do you want canonical markdown to be the long-term source of truth?

If yes:
	•	great for homebrew and editing
	•	good for future content beyond SRD
	•	“content pipeline” becomes a core asset

If no (you only want TS objects):
	•	skip canonical markdown
	•	agents write generated/*.ts directly
	•	harder to diff / harder to edit / harder to extend for homebrew

Given your app vision (campaign platform + homebrew eventually), I’d bet on canonical markdown + compilation.

B) Do you want runtime to ship markdown bodies?

Two options:
	•	Ship markdown strings inside TS (fine)
	•	Pre-render to HTML at build time (faster UI, but more tooling and XSS considerations)

Start with shipping markdown strings. Don’t over-engineer.

⸻

One blunt warning (so you don’t get burned)

If you go “fully manual conversion” without any reference cross-check (manifest vs SRD), you will ship subtle mistakes:
	•	wrong class lists
	•	missing concentration flags
	•	missing items
	•	mis-typed AC formulas
…and you won’t notice until users hit them.

So even if you “never refer to raw SRD markdown at runtime,” keep it as verification input in CI until you have extremely high confidence.

That’s not compromise — that’s how you keep your ambition from collapsing under entropy.

⸻

If you want, I can draft the exact file/folder + scripts layout

For example:
	•	content/canon/** schema conventions
	•	a library/scripts/compile-canon.mjs generator
	•	a library/tests/content/validate-canon.test.ts validator
	•	a library/src/generated/ output format that avoids Node fs entirely

But even without that: if you adopt the “canonical markdown + validator + compiler” loop, you’ll be able to unleash agents safely and only spend human time on real review, not babysitting.
<------ conversation turn ends ------>
