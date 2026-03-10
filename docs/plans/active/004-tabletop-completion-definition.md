# Plan 004: Tabletop Completion Definition

## Goal

Ship a campaign tool that lets players in our in-person 5e + Advanced Adventurers game run and level their characters from the app alone.

No paper character sheet. No PHB/SRD tab. No AA document during play or level-up.

## Completion Criteria

The product is table-ready when all of the following are true:

1. A player can open one character page and see the current numbers that matter at the table: HP, AC, speed, initiative, proficiency bonus, saves, skills, attacks, spell attack, spell save DC, resources, conditions, and available actions.
2. Every spell, feature, item, condition, and rule shown on that page has an in-app detail view with full rules text and clear usage guidance.
3. A player can level up or spend XP in the app without consulting outside material. That includes class levels, AA abilities, HP, ability scores, proficiencies, spells known, and spell slots.
4. The app explains why a derived value is what it is. If AC is 18 or a feature is unavailable, the system shows the sources and prerequisites that produced that result.
5. The DM can award XP, trigger rests, apply conditions, and override edge cases without breaking the character model.
6. Campaign data persists cleanly and survives real-session use.
7. The system treats the 5e SRD as the base ruleset and treats enabled ruleset extensions as native parts of play. If AA is enabled for a campaign, AA content appears in the same compendium, character, and leveling flows as base SRD content.
8. The DM can communicate to players inside the product: reveal handouts, pin rules or reminders, send session-specific instructions, and control who can see what.

## Required Systems

- A ruleset-pack model: base 5e SRD plus opt-in extensions that can add content and mechanics without forking the whole app.
- Canonical content for all player-facing rules content: spells, classes, class features, subclasses, species, backgrounds, feats, equipment, conditions, core rules, AA abilities.
- A character source ledger that records where every capability came from: class level, species, feat, AA purchase, item, override.
- A rules engine that computes character state from those sources and emits explanations.
- A player play surface tuned for turn-time use rather than sheet browsing.
- A guided level-up and XP-spend flow with prerequisite checks and previews.
- A fast compendium and inline reference layer so every linked rule resolves in-app.
- Minimal DM operations for campaign settings, XP awards, rests, and corrections.
- A DM communication layer for player-facing reveals, handouts, pinned updates, and audience targeting.

## Non-Critical Path

These are useful, but they do not block the goal above:

- Rich wiki and lore editing beyond the communication layer
- Public/private view polish beyond what real players need
- Monster compendium depth beyond what the DM needs for the current campaign
- Fancy account systems
- Deployment polish beyond stable private use

## Sequencing Rule

Do not treat "all D&D content" as the goal. Treat "player can run a hybrid character at the table without outside references" as the goal.

That means player-critical content, ruleset enablement, character computation, and focused DM communication come first. Monsters, broad lore tooling, and general CMS work come later.
