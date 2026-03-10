# SRD Mechanics Coverage

This tracker uses subsystem / feature granularity rather than sentence-by-sentence SRD parsing.

Status meanings:

- `Full`: usable without outside references for the tracked mechanic.
- `Partial`: some canon/runtime/data support exists, but the mechanic still leaks to notes, manual choice state, or missing execution logic.
- `None`: not implemented beyond maybe a canon content placeholder.

## Summary

- Total tracked mechanics: 53
- Full: 7
- Partial: 33
- None: 13

## Actions and Resources

- Total: 6
- Full: 0
- Partial: 2
- None: 4

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Action / bonus action / reaction inventory | Partial | Granted actions are surfaced, but no general action execution engine exists. | `library/src/engine/character-computer.ts` |
| Resource pools | Partial | Uses, reset cadence, and scaling pools are represented, but spend and refresh automation are still manual. | `library/src/engine/character-computer.ts` |
| Short-rest / long-rest recovery automation | None | Resources know their reset cadence, but there is no automated reset flow yet. | `library/src/types/effect.ts` |
| Equipment loadout and equipped state | None | Canonical equipment exists, but live equipped-state modeling is not implemented. | `content/canon/packs/srd-5e-2024/equipment/`, `app/src/server/db/schema/progression.ts` |
| Weapon and attack profiles | None | There is no derived attack-profile engine for weapons, spell attacks, or damage packages. | `library/src/types/effect.ts` |
| Weapon Mastery | None | Weapon Mastery is present as a reviewed source note, but mastery choices and mastery effects are not implemented. | `data/real-campaign-intake/verified-characters.json` |

## Class Features

- Total: 9
- Full: 0
- Partial: 9
- None: 0

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Fighter: Second Wind | Partial | Second Wind action text and use count are modeled, but actual healing resolution and spend automation are not. | `content/canon/packs/srd-5e-2024/class-features/second-wind.md` |
| Druid: Primal Order (Warden) | Partial | Warden proficiencies are modeled, but broader class choice-state remains manual. | `content/canon/packs/srd-5e-2024/class-features/primal-order-warden.md` |
| Druid: Wild Shape | Partial | Uses and a descriptive trait exist, but there is no form library, transform state, or beast-stat replacement engine. | `content/canon/packs/srd-5e-2024/class-features/wild-shape.md` |
| Druid: Wild Companion | Partial | The action is represented, but familiar lifecycle and the slot-or-Wild-Shape spend path are not automated. | `content/canon/packs/srd-5e-2024/class-features/wild-companion.md` |
| Warlock: Magical Cunning | Partial | The once-per-long-rest rite is surfaced, but slot recovery execution is not implemented. | `content/canon/packs/srd-5e-2024/class-features/magical-cunning.md` |
| Warlock: Pact of the Blade | Partial | The feature exists in canon, but bonded-weapon state and Charisma-for-attack/damage substitution are not modeled. | `content/canon/packs/srd-5e-2024/class-features/pact-of-the-blade.md` |
| Bard: Bardic Inspiration | Partial | Uses and action text are modeled, but die spend/consumption and later scaling behavior are not fully implemented. | `content/canon/packs/srd-5e-2024/class-features/bardic-inspiration.md` |
| Sorcerer: Font of Magic | Partial | Sorcery Points and the related actions/traits exist, but slot-point conversion is not automated. | `content/canon/packs/srd-5e-2024/class-features/font-of-magic.md` |
| Sorcerer: Metamagic | Partial | Metamagic is present as a trait and sheet note, but option choice-state and casting-time effects are not modeled. | `content/canon/packs/srd-5e-2024/class-features/metamagic.md` |

## Core Character

- Total: 13
- Full: 5
- Partial: 8
- None: 0

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Ability scores and modifiers | Full | The runtime computes ability modifiers directly from stored base scores. | `library/src/engine/character-computer.ts` |
| Proficiency bonus progression | Full | Proficiency bonus is derived from computed character level. | `library/src/engine/character-computer.ts` |
| Class level tracking | Full | Class levels are stored as sources and summed into character level. | `app/src/server/progression/service.ts`, `library/src/engine/character-computer.ts` |
| Saving throw proficiencies | Full | Class and source-granted saving throw proficiencies are modeled. | `library/src/engine/character-computer.ts`, `content/canon/packs/` |
| Skill proficiencies and skill choice state | Partial | Proficiency effects exist, but exact chosen skills are still missing for some reviewed characters and passive skills still rely on sheet baselines in places. | `library/src/engine/character-computer.ts`, `data/real-campaign-intake/verified-characters.json` |
| Expertise | Partial | The engine understands expertise effects, but no broad choice-state or roster coverage exists yet. | `library/src/engine/character-computer.ts` |
| Armor Class calculation | Partial | AC formulas and modifiers exist, but most live characters still use reviewed sheet baselines rather than fully source-derived equipment state. | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Hit Point calculation | Partial | Max HP is tracked and explainable once present in the base snapshot, but class hit-die and level-by-level HP derivation are not modeled end to end. | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Initiative | Full | Initiative is derived from Dexterity and initiative modifiers. | `library/src/engine/character-computer.ts` |
| Speed and speed bonuses | Partial | Walk-speed bonuses are modeled, but movement-mode coverage and full source derivation are still incomplete. | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Passive Perception | Partial | The engine can derive passive perception, but some reviewed characters still carry photographed baseline values while skill choice coverage catches up. | `library/src/engine/character-computer.ts` |
| Senses | Partial | Darkvision and similar senses can be granted and surfaced, but broader sensory rule effects are not modeled. | `library/src/engine/character-computer.ts`, `content/canon/packs/` |
| Resistances and immunities | Partial | The engine can store and display resistances and immunities, but live roster coverage is still shallow and no combat resolver consumes them. | `library/src/engine/character-computer.ts` |

## Feats and Species

- Total: 8
- Full: 0
- Partial: 7
- None: 1

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Feat: Magic Initiate | Partial | The feat is tracked, but chosen cantrips, prepared spell, and free-cast state are not yet represented. | `content/canon/packs/srd-5e-2024/feats/magic-initiate.md`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Skilled | Partial | The feat is tracked, but the chosen proficiencies are not captured for the live roster. | `content/canon/packs/srd-5e-2024/feats/skilled.md`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Savage Attacker | None | The feat is present in canon, but there is no attack-damage resolver to apply its reroll mechanic. | `content/canon/packs/srd-5e-2024/feats/savage-attacker.md` |
| Feat: Musician | Partial | The feat is tracked, but its rest-triggered party benefit is not automated. | `content/canon/packs/srd-5e-2024/feats/musician.md` |
| Species: Goliath / Stone's Endurance | Partial | Stone's Endurance uses and reaction text are modeled, but damage-reduction execution is not. | `content/canon/packs/srd-5e-2024/species/goliath.md` |
| Species: Drow | Partial | Darkvision and lineage spell access are modeled, but condition-resistant behavior like Fey Ancestry is only descriptive. | `content/canon/packs/srd-5e-2024/species/drow.md` |
| Species: Wood Elf | Partial | Speed and Druidcraft are modeled, but trance and charm-avoidance effects remain descriptive traits. | `content/canon/packs/srd-5e-2024/species/wood-elf.md` |
| Reviewed sheet-derived species magic | Partial | A reviewed custom species source exists for Tali, but the exact named lineage and its broader rules basis are still unresolved. | `data/real-campaign-intake/verified-characters.json` |

## Progression

- Total: 4
- Full: 1
- Partial: 3
- None: 0

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| XP ledger | Full | Awards, spends, refunds, and adjustments are stored and summarized in runtime state. | `app/src/server/db/schema/progression.ts`, `library/src/engine/character-computer.ts` |
| AA and level-up spend-plan preview | Partial | Preview and normalization exist, but the deeper mechanic catalog for all purchases and class choices is not complete. | `app/src/server/progression/service.ts` |
| AA and level-up spend-plan commit | Partial | Commit writes sources and XP transactions, but broad SRD/AA choice coverage is still limited. | `app/src/server/progression/service.ts` |
| Prerequisite evaluation | Partial | Level, spellcasting, proficiency, and ability-score checks exist, but full SRD feature/feat prerequisites are not exhaustively modeled. | `library/src/engine/prerequisite-evaluator.ts` |

## Rules and Conditions

- Total: 4
- Full: 0
- Partial: 0
- None: 4

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Condition: Charmed | None | The condition exists in canon content, but there is no runtime condition-state engine. | `content/canon/packs/srd-5e-2024/conditions/charmed.md` |
| Condition: Incapacitated | None | The condition exists in canon content, but there is no runtime condition-state engine. | `content/canon/packs/srd-5e-2024/conditions/incapacitated.md` |
| Rule: Concentration | None | The rule is stored canonically, but no active tracking or save flow exists. | `content/canon/packs/srd-5e-2024/rules/concentration.md` |
| Rule: Study action | None | Study exists as canon content only; there is no runtime action flow around it. | `content/canon/packs/srd-5e-2024/rules/study-action.md` |

## Spellcasting

- Total: 9
- Full: 1
- Partial: 4
- None: 4

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Spell catalog lookup | Partial | Canonical lookup works for the proof batch and roster-critical spells, but the full SRD spell catalog is not yet converted. | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell access and known spell lists | Partial | Granted spell access is tracked and deduped, but exact origin choices and full class-list coverage are still incomplete. | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Spell slot pools | Partial | Current live level-2 druid, bard, sorcerer, and warlock slot pools are modeled, but broader level progression is not yet complete. | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Pact Magic | Partial | Level-2 pact slots and Magical Cunning exist, but higher-level pact progression and recovery details are not fully modeled. | `content/canon/packs/srd-5e-2024/class-features/pact-magic-2.md`, `content/canon/packs/srd-5e-2024/class-features/magical-cunning.md` |
| Spell attack bonus and spell save DC | Full | Spell attack bonus and spell save DC are derived from ability plus proficiency plus modifiers. | `library/src/engine/character-computer.ts` |
| Prepared / known spell capacity limits | None | There is no generalized capacity engine for prepared or known spell counts. | `library/src/types/effect.ts` |
| Concentration | None | Concentration exists as canon content, but not as runtime state or cast-resolution logic. | `content/canon/packs/srd-5e-2024/rules/concentration.md` |
| Spell cast resolution | None | The app does not resolve casting, damage, healing, saves, or ongoing spell state. | `library/src/types/spell.ts` |
| Summon and familiar state | None | Wild Companion and familiar state are not represented beyond notes and traits. | `content/canon/packs/srd-5e-2024/class-features/wild-companion.md`, `content/canon/packs/srd-5e-2024/spells/find-familiar.md` |

