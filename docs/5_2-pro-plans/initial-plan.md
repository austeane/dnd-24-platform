Below is a “full product spec”-style feature map for what you’re describing, with an emphasis on:

* **DnDBeyond-level UX polish**
* **A rules engine that can support 2024 SRD + Advanced Adventurers (AA) + hybrid**
* **Strong integration across character sheet ↔ compendium ↔ campaign wiki ↔ DM tools**
* **Password-only access (no accounts), but still clean permission behavior**
* **Deep filtering/search (especially for spells)**

I’m going to assume you want this to feel like a *single cohesive system*, not “a bunch of pages.”

---

## North-star UX principles

If you want “best possible UX,” these principles should drive almost every feature decision:

1. **Everything is linkable, hoverable, and searchable**

   * Every spell/ability/item/rule/page/character has a stable URL.
   * Hover shows a popover card; click opens full view.

2. **The character sheet is the center of gravity**

   * Anything you do elsewhere (wiki, compendium, encounter tracker) should be able to “attach” to a character quickly.

3. **Rules data is structured, but players can still override**

   * You want automation + transparency:

     * “This is your AC”
     * “Here’s exactly where each +1 came from”
   * But also “DM override” without breaking the model.

4. **State is explicit**

   * XP is a ledger, not a number you hand-edit.
   * Resources reset via Rest buttons.
   * Purchases are items with receipts.

5. **Fast is a feature**

   * Global search (⌘K) that finds anything.
   * Spell filtering that stays snappy even with 100+ spells.

---

## The big modules

You can think of the product as 6 interconnected systems:

1. **Campaign Hub** (password access, roster, sessions, settings)
2. **Compendium** (SRD + AA catalog + homebrew overlays)
3. **Character System** (sheet, builder, leveling/spending, automation)
4. **DM Wiki & Lore** (pages, secrets, reveals, handouts)
5. **Play Tools** (dice log, initiative/encounters, conditions)
6. **Search & Reference Layer** (tooltips, filters, tags, command palette)

Everything else is a sub-feature of these.

---

## Campaign-level rules toggle: “AA Only / Hybrid / No”

You want this to be *campaign configuration*, not per-character (unless you explicitly want per-character exceptions later).

### Campaign settings: “Progression Mode”

* **AA Only**: no classes; everything purchased with XP (AA rules)
* **Hybrid**: classes exist, but XP can also buy AA purchases
* **No**: normal 2024 5e SRD behavior

### Campaign settings: “Leveling Method”

Because hybrid implies XP-as-currency, you’ll want a clean, explicit switch:

* **Standard 5e leveling** (XP thresholds or milestone)
* **Fixed-cost leveling** (your “20 XP = one class level” method)
* **AA level from total XP** (AA-only default; proficiency scaling via AA formula)

Even if you only *use* one method, model it explicitly so the system isn’t hardcoded to your current table preference.

---

## Core entity model

If you get this right early, everything integrates cleanly later.

### Entities

* **Campaign**
* **Character**
* **Session**
* **Page** (wiki/lore)
* **CompendiumEntry**

  * Spell, Item, Feat, Condition, Rule, Monster/NPC, Class, Subclass, etc.
* **AAAbility** (can be unified under CompendiumEntry type = “Feature”)
* **Transaction**

  * XP award
  * XP spend
  * “Class level purchase”
  * “Refund/respec” (optional but you’ll want it)

### Key design: “Sources” and “Effects”

Everything that modifies a character should look like:

* **Source** (where it came from: Fighter 5, Feat: X, AA Purchase: Y, Magic Item: Z)
* **Effects**

  * modifiers, proficiencies, actions, resources, spell access, etc.

This is the main trick that makes AA + classes + items all work together.

---

## Password-only access model

No accounts is fine if you implement access as **roles + secrets**.

### Campaign secrets (recommended)

* **Campaign Viewer Password**
  Can view campaign hub + public pages + public character views
* **Campaign DM Password**
  Full edit: settings, wiki, sessions, encounters, XP awards, reveals
* **Per-character Owner Password** (one per character)

  * View/edit private character sheet
  * Manage spending/leveling for that character

### Session identity (optional but very useful)

Even without accounts, ask the user to set a **display name** after entering the campaign password:

* “Austin”
* “Soleil”
* “DM”
  This gets stored in a cookie and used for:
* Edit history
* XP transaction “awarded by”
* Notes attribution
* Dice log attribution

### Public vs private character pages

You said: “Each character would have a public and private version.”

Implement it as:

* A **single character** with **field-level visibility**
* Views:

  * **Public View** (party-facing)
  * **Private View** (owner + DM)
  * **DM View** (everything + DM tools)

This avoids duplicating data and keeps links stable.

---

## Compendium: DnDBeyond-grade reference experience

This is one of the biggest “UX multipliers.”

### Must-have Compendium features

* **Global search** with:

  * fuzzy match
  * filters
  * keyboard navigation
* **Facet filters** (multi-select):

  * Spells: level, school, casting time, range, components, duration, concentration, ritual, save/attack type, damage type, conditions inflicted, area shape, etc.
  * Items: type, rarity, attunement, tags, properties
  * Abilities/features: category, prerequisites, resource type, action economy
* **Reference cards**

  * Hover/click “popover” showing summary + key stats + links
* **Deep-linking**

  * Every entry has a canonical URL
* **Source tagging**

  * SRD vs homebrew vs AA vs campaign-custom

### “Smart tags” for spells (your line-of-sight example)

Your cleric friend’s use case is real, and SRD text alone won’t always give a clean boolean for “requires line of sight.”

Best approach:

1. **Extract structured fields** from SRD (easy)
2. Add a **tagging layer**:

   * auto-tag from heuristics (“you can see” → `requires_sight`)
   * allow manual override per spell (campaign-wide or global)

Then filters become:

* Requires sight
* Requires a creature you can see
* Can target objects
* Requires concentration
* Requires verbal only
* Has costly material component
* Creates difficult terrain
* Deals damage on a successful save, etc.

### Compendium ↔ editor integration

In your rich text editor (wiki, notes, session recap), you should support:

* `@spell Fireball`
* `@ability Rage`
* `@condition Grappled`
  Autocomplete inserts a mention node that:
* renders nicely
* shows tooltip on hover
* links to entry

This single feature makes the whole app feel “premium.”

---

## Advanced Adventurers: what “full support” means in the app

To fully support AA, you need two things:

1. **A purchase + prerequisite system**
2. **A character engine that can apply effects from purchases**

### AA “Storefront” UX

Think of AA as a “shop” where XP is currency.

Tabs/sections:

* **Core**

  * HP purchases
  * Ability score increases (with scaling cost)
  * Skills & tool proficiencies
  * Weapon/armor/shield profs
* **Spellcasting**

  * unlock cantrips
  * buy spell slots per level
  * learn spells
* **Abilities**

  * browsable catalog
  * ability trees
  * prerequisites and gating

Each purchase should show:

* XP cost
* prerequisites (and whether you meet them)
* what it grants
* what it changes on your sheet (preview)
* “why you can’t buy this” explanation

### Ability trees as a graph

Don’t render them as nested bullet lists. Do both:

* **Graph view** (nodes + prereq edges)
* **List view** (filter/sort/search)

Graph view is a “wow” feature and helps with AA comprehension.

### XP Ledger (non-negotiable)

You want:

* Transactions:

  * award XP (DM)
  * spend XP (player)
  * refund XP (DM or owner, depending on rules)
* Each transaction has:

  * date/session
  * note
  * category
  * who did it
* Summary:

  * total earned
  * total spent
  * banked XP

In hybrid mode, you additionally need:

* spent on class levels
* spent on AA
* banked toward next level

### AA spellcasting modeling

You’ll want a clean model that supports:

* “Cantrip casting unlocked”
* spells known list
* slot inventory by level
* min-level gating for higher slots
* “no preparation” casting behavior

In UI, you should show:

* slots by level with “spent/remaining”
* spell list with filters + quick cast
* “learn new spell” flow that opens compendium filtered appropriately

---

## Standard 5e 2024: what “full support” means

For “No (just regular 5e 2024)” to feel real, you need the DnDBeyond core:

### Character creation

* species, background, class, starting equipment
* ability scores (roll/point buy/manual)
* proficiencies and languages
* starting spells if applicable

### Level-up wizard (critical)

* select class/subclass features
* ASI/feat choices
* spell selection & preparation (where applicable)
* HP increase per level (roll/average)
* update derived stats

### Multiclassing support

Even if your table rarely uses it, “full support” implies:

* multiple classes
* combined proficiency rules
* combined spell slot progression (standard 5e multiclass rules)
* class feature tracking

### Rest and resource automation

* Short rest / long rest buttons
* Reset appropriate features
* Track hit dice usage
* Track exhaustion/conditions (depending on 2024 rules you’re using)

---

## Hybrid: the “hard mode” that you actually want

Hybrid is where architecture decisions matter most.

### Hybrid character model recommendation

Treat a character as a union of “sources”:

* Class levels (standard 5e)
* AA purchases (XP store)
* items & equipment
* species/background
* homebrew overrides

Then compute:

* derived stats from all sources
* resource pools from all sources
* actions/features list from all sources

### Class levels purchased with XP

You described: “save XP until 20, then level up.”

So in Hybrid, implement a specific “Class Level Purchase” transaction:

* Cost: 20 XP
* Grants: +1 level in a chosen class (or forced single-class if your table wants that)

This creates a really clean UX:

* When banked XP >= 20, character gets a “Level available” banner.
* Clicking it opens the level-up wizard.
* Completing wizard creates a transaction and applies feature grants.

### Conflict and stacking rules

Hybrid creates collisions like:

* AA “Extra Attack” vs Fighter extra attack progression
* AA armor prof purchase vs class prof
* AA spell slots vs class slots

Your UI should handle this with:

* **Deduplication rules** (same exact proficiency should not double-count)
* **Stackability rules** (some features can stack; others can’t)
* **Conflict warnings** when ambiguous

For Extra Attack specifically:

* Model it as `extraAttackCount = 0..N`
* Class features set it to at least some number
* AA purchases increment it (or set it to min)
  Then the sheet displays:
* “Attacks per Attack action: 2 (Source: Fighter 5, AA Extra Attack I)”
  …and it becomes explainable.

### Spells in hybrid

You’ll want to show spells by **source**:

* “Known from Cleric”
* “Known from AA”
* “Prepared” vs “Always Prepared” vs “AA (no prep)”
  This avoids the UI turning into mush.

---

## Character sheet: what “DnDBeyond-level” implies

### Sheet structure (tabs that matter)

* **Overview**

  * core stats, saves, skills, AC, initiative, speed
  * conditions
  * passive perception/investigation/insight
* **Actions**

  * attacks with to-hit + damage + riders
  * spell attacks
  * feature actions (bonus/reaction/other)
* **Spells**

  * slots + casting stats
  * known/prepared lists
  * filterable spell list
  * “add spell” flow (opens compendium filtered)
* **Inventory**

  * equipment, attunement, containers
  * weight + encumbrance
  * currency
* **Features**

  * grouped by source (class / AA / items / species)
  * filterable/searchable
* **Notes**

  * private notes
  * shared notes
  * pinned references

### Click-to-roll dice (and a dice log)

This is part of the “DnDBeyond feel.”

* Click skill → rolls d20 + modifiers
* Click attack → to-hit + damage
* Click save → roll
* Dice log shows:

  * who rolled
  * what
  * result
  * timestamp
  * optional “public to campaign” vs “private roll” (DM-only)

### Explainability inspector

Every computed number should be inspectable:

* AC breakdown
* attack bonus breakdown
* spell save DC breakdown
* skill bonuses breakdown

This is a *huge* UX win when you have AA + hybrid complexity.

### Public/private rendering

Public view should:

* hide private notes
* optionally hide inventory details (or “private items”)
* optionally hide HP exact value (show % or status) — campaign toggle
* show only “publicly shared” features/notes

---

## DM wiki & lore: “campaign website” part

This is where your “rich text editor + google docs links + reveal controls” shines.

### Wiki pages

* Hierarchical pages with tags:

  * Locations
  * NPCs
  * Factions
  * Quests
  * Items
  * Session recaps
* Rich editor features:

  * headings, callouts, tables
  * image embeds
  * checklists
  * mention links to compendium + characters
* Visibility controls:

  * DM-only
  * Party-visible
  * Visible to specific characters (optional, but amazing)
* “Reveal” workflow:

  * DM writes secret sections
  * clicks “Reveal to party” or “Reveal to X”
  * system logs the reveal event (so you can see when it became known)

### Google Docs integration

Keep it simple but nice:

* Store a “Doc Link” block
* Show:

  * title
  * owner (if available)
  * last opened (local)
* If you want embed:

  * iframe embed for published docs (with warning about Google sharing settings)

### Handouts

A dedicated handouts area:

* images
* PDFs
* links
* “reveal to party” button
* optionally pin a handout to the campaign dashboard

---

## Session management: where XP, notes, and play connect

Even if you don’t run combat in-app, session tooling is a big glue layer.

### Session page

* date
* attendees
* recap notes (rich text)
* DM private notes
* loot awarded
* XP awarded (per character)
* “open questions / to-do”

### XP award flow (DM)

* Choose session
* See party roster
* Enter XP per character (or same for all)
* Creates transactions automatically
* Players immediately see updated banked XP

### “After session” player flow

* Banner: “You gained 8 XP”
* Button: “Spend XP”
* Opens AA storefront / level-up if available

This is exactly the loop you described.

---

## Encounters & initiative: optional, but if you want “best possible,” it’s worth it

### Encounter builder

* search monsters (SRD) + homebrew
* add NPCs/custom statblocks
* track HP, AC, conditions
* initiative order
* quick damage/heal buttons
* link encounter to session

### Party dashboard during play

* DM sees:

  * party HP summaries
  * resources (optional)
  * conditions
* Players see:

  * their own combat view (mobile-friendly)

If you integrate click-to-roll, this becomes a “light VTT” even without maps.

---

## Homebrew support (especially important for AA)

AA’s philosophy explicitly encourages inventing abilities. Your app should treat that as first-class.

### Homebrew content types

* AA abilities
* feats/features
* spells
* items
* monsters/NPCs
* backgrounds/species (optional)

### Homebrew workflow

* Duplicate an existing entry → edit → publish to campaign
* Add prerequisites (builder UI)
* Add effects (builder UI)
* Add tags and categories
* Versioning:

  * if edited later, show which characters are using which version

---

## Search & filtering: make it a first-class system

This is what makes the “cleric spell spreadsheet” unnecessary.

### Global command palette (⌘K)

* search:

  * spells
  * items
  * abilities
  * wiki pages
  * characters
  * conditions/rules
* quick actions:

  * “Add spell to character…”
  * “Award XP…”
  * “Create page…”
  * “Start encounter…”

### Saved filters / saved views

For spells especially:

* “My combat staples”
* “Line of sight spells”
* “No concentration”
* “Bonus action”
* “Ritual utility”

Allow per-character saved views.

### Character-aware compendium views

When a character browses spells, they should be able to toggle:

* **All spells**
* **Spells I know**
* **Spells I can add** (based on mode)
* **Spells I can cast now** (based on slots/resources)

This is a premium UX differentiator.

---

## Rules engine: the “make or break” system

To support AA-only + standard 5e + hybrid without spaghetti, build a **data-driven effect engine**.

### Requirements

* Typed effects:

  * add proficiency
  * grant skill
  * add resource (uses, reset type)
  * add AC formula
  * add conditional modifier (“while raging”, “while wearing armor”)
  * grant action (attack, bonus, reaction)
  * grant spell access
* Prerequisite evaluator:

  * ability score thresholds
  * level thresholds
  * has feature X
  * has spellcasting enabled
  * has armor proficiency etc.
* Explanation output:

  * every computed value returns:

    * total
    * list of contributors (“+2 prof from level”, “+1 AC from Defense style”)

This is how you avoid impossible-to-debug hybrid builds.

---

## Tech stack recommendations that fit TanStack Start + SST/Railway

You already have strong preferences; here’s what tends to work best for this style of app.

### App + server

* **TanStack Start** (SSR + server functions)
* Type-safe validation: **zod**
* DB: **Postgres**
* ORM: **Drizzle** (or Kysely; Drizzle is popular with TS)
* Migrations: drizzle-kit
* Background tasks:

  * optional, but nice for indexing/search rebuilds

### Search

If you want *DnDBeyond-feel* search/filter responsiveness:

* **Meilisearch** or **Typesense** (both great)
* Keep Postgres as source of truth; index compendium + wiki + characters for search UI.

### Rich text editor

* **TipTap** (ProseMirror-based) is a strong fit for:

  * mentions
  * embeds
  * tables
  * custom nodes (compendium reference blocks)

### File storage

* S3-compatible (AWS S3 / Cloudflare R2)
* Store images/handouts; serve via CDN

### Deployment

* **Railway**: easiest for Postgres + app + search service
* **SST**: great if you want AWS-native infra, Lambda, etc.
  Either is fine; choose based on your “infra vibe.”

### Auth (password-only)

* Argon2/bcrypt hashing
* HTTP-only session cookies
* Rate limiting for password attempts
* Audit log of major actions

---

## A feature matrix for your three modes

Here’s the “integration truth table” that keeps you honest:

| System area          |                           AA Only |                                    Hybrid |                Standard 5e |
| -------------------- | --------------------------------: | ----------------------------------------: | -------------------------: |
| Classes & subclasses |                                 ❌ |                                         ✅ |                          ✅ |
| XP as currency       |                                 ✅ |                                         ✅ |                   optional |
| Level progression    | XP-based (20 XP/level equivalent) | XP purchase (20 XP/level) or configurable | XP thresholds or milestone |
| Spell access         |           universal (buy + learn) |          class rules + AA universal layer |                class rules |
| Preparation          |                              none |                         mixed (by source) |             by class rules |
| Saving throw prof    |                  top 2 stats rule |                      class rule (default) |                 class rule |
| Armor/weapon prof    |                         purchased |                                     mixed |         class/species/feat |

Make these explicit in campaign settings, and you avoid “why does this character behave differently” confusion.

---

## The “premium” features that will make this feel exceptional

If you want the app to feel truly elite, these are the add-ons that create delight:

* **Build Planner**

  * “shopping cart” of abilities/spells/levels
  * shows future XP requirements
  * shareable build links
* **Diff & version history**

  * for characters and wiki pages
  * “what changed since last session”
* **DM reveal log**

  * when secrets became public
* **Mobile combat view**

  * simplified sheet + actions + spells + quick rolls
* **Pinned references**

  * DM pins rules/spells/abilities to campaign dashboard
* **Quality-of-life macros**

  * e.g., “cast fireball at level 5” auto consumes slot and rolls damage

---

## If you do only one thing “architecturally right”

Make **features/abilities/classes/items** all produce effects through the same mechanism.

If AA purchases are “special-cased,” hybrid will become a mess.
If everything is “a source that grants effects,” hybrid becomes *mechanically straightforward* (even if content is complex).

---

If you want, next I can turn this into:

* a concrete **data schema** (tables + types) for Postgres/Drizzle, and/or
* a concrete **rules DSL** sketch in TypeScript for “effects” + “prereqs” + “explanations,” and/or
* a **navigation map** (routes + page layouts) that matches the UX goals.

No timelines—just the blueprint.
