# SRD Mechanics Coverage (Atomic)

This tracker is the execution truth for agent work. It is intentionally more granular than the coarse product-level tracker.

Status rule:

- `Full`: closed with evidence, not just partial support or canon presence.
- `Partial`: some support exists, but the mechanic still leaks to manual notes, missing state, or missing execution.
- `None`: no defensible implementation yet.

## Summary

- Total atomic mechanics: 111
- Full: 17
- Partial: 42
- None: 52

## Actions and Resources

- Total: 18
- Full: 0
- Partial: 5
- None: 13

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Action / bonus action / reaction inventory | Action inventory | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Action / bonus action / reaction inventory | Bonus action inventory | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Action / bonus action / reaction inventory | Reaction inventory | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/species/` |
| Resource pools | Fixed resource pools | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Resource pools | Scaling resource pools | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Resource pools | Resource spend mutation | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `app/src/server/progression/service.ts` |
| Resource pools | Resource restore mutation | None | `action-resource-spend-mutation` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/db/schema/progression.ts`, `app/src/server/progression/service.ts` |
| Short-rest / long-rest recovery automation | Short-rest reset engine | None | `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/rules/` |
| Short-rest / long-rest recovery automation | Long-rest reset engine | None | `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/rules/` |
| Equipment loadout and equipped state | Equipment inventory persistence | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Equipment loadout and equipped state | Equipped-state persistence | None | `action-equipment-persistence` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Equipment loadout and equipped state | Armor equipment effect application | None | `action-equipped-state-persistence` | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/equipment/`, `library/src/engine/defenses.ts` |
| Equipment loadout and equipped state | Weapon equipment effect application | None | `action-equipped-state-persistence` | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/equipment/`, `library/src/engine/character-computer.ts` |
| Weapon and attack profiles | Melee attack profile derivation | None | `action-weapon-effect-application` | `runtime`, `explainability`, `tests`, `fixtures`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Weapon and attack profiles | Ranged attack profile derivation | None | `action-weapon-effect-application` | `runtime`, `explainability`, `tests`, `fixtures`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Weapon and attack profiles | Damage package projection | None | `action-melee-attack-profiles`, `action-ranged-attack-profiles` | `runtime`, `tests`, `fixtures` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Weapon Mastery | Weapon Mastery choice capture | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `data/real-campaign-intake/verified-characters.json`, `content/canon/packs/srd-5e-2024/class-features/` |
| Weapon Mastery | Weapon Mastery runtime resolution | None | `action-weapon-mastery-choice-capture`, `action-melee-attack-profiles` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |

## Class Features

- Total: 18
- Full: 0
- Partial: 7
- None: 11

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Fighter: Second Wind | Second Wind surface and use count | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/traits-and-resources.ts` |
| Fighter: Second Wind | Second Wind healing resolution | None | `feature-second-wind-surface`, `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `app/src/server/progression/service.ts` |
| Druid: Primal Order (Warden) | Primal Order (Warden) proficiencies | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/proficiencies.ts`, `data/real-campaign-intake/verified-characters.json` |
| Druid: Wild Shape | Wild Shape use tracking | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/traits-and-resources.ts`, `data/real-campaign-intake/verified-characters.json` |
| Druid: Wild Shape | Wild Shape form library | None |  | `canon`, `runtime`, `tests`, `fixtures` | `content/canon/packs/srd-5e-2024/class-features/` |
| Druid: Wild Shape | Wild Shape transform state | None | `feature-wild-shape-form-library`, `action-resource-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `library/src/engine/character-computer.ts` |
| Druid: Wild Companion | Wild Companion surface | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/character-computer.ts` |
| Druid: Wild Companion | Wild Companion summon lifecycle | None | `feature-wild-companion-surface`, `spell-summon-and-familiar-state` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Warlock: Magical Cunning | Magical Cunning surface | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/character-computer.ts` |
| Warlock: Magical Cunning | Magical Cunning recovery execution | None | `feature-magical-cunning-surface`, `spell-slot-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Warlock: Pact of the Blade | Pact of the Blade bond state | None | `action-equipment-persistence` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Warlock: Pact of the Blade | Pact of the Blade Charisma substitution | None | `feature-pact-blade-bond-state`, `action-melee-attack-profiles` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Bard: Bardic Inspiration | Bardic Inspiration surface and uses | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/traits-and-resources.ts`, `data/real-campaign-intake/verified-characters.json` |
| Bard: Bardic Inspiration | Bardic Inspiration spend and die scaling | None | `feature-bardic-inspiration-surface`, `action-resource-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Sorcerer: Font of Magic | Font of Magic point pool | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/traits-and-resources.ts`, `data/real-campaign-intake/verified-characters.json` |
| Sorcerer: Font of Magic | Font of Magic slot-point conversion | None | `feature-font-of-magic-points`, `spell-slot-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Sorcerer: Metamagic | Metamagic option capture | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/class-features/`, `data/real-campaign-intake/verified-characters.json` |
| Sorcerer: Metamagic | Metamagic cast-time modifications | None | `feature-metamagic-option-capture`, `feature-font-of-magic-points`, `spell-resolution-engine` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |

## Core Character

- Total: 20
- Full: 5
- Partial: 11
- None: 4

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Ability scores and modifiers | Ability modifier math | Full |  | `runtime`, `tests` | `library/src/engine/math.ts`, `library/tests/engine/character-computer.test.ts` |
| Class level tracking | Class level aggregation | Full |  | `runtime`, `tests` | `library/src/engine/levels.ts`, `app/src/server/progression/service.ts` |
| Proficiency bonus progression | Proficiency bonus table | Full |  | `runtime`, `tests` | `library/src/engine/math.ts`, `library/tests/engine/character-computer.test.ts` |
| Saving throw proficiencies | Saving throw proficiency grants | Full |  | `runtime`, `tests` | `library/src/engine/proficiencies.ts`, `library/tests/engine/character-computer.test.ts` |
| Skill proficiencies and skill choice state | Skill proficiency grants | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `data/real-campaign-intake/verified-characters.json` |
| Skill proficiencies and skill choice state | Skill choice capture and persistence | None |  | `persistence`, `mutation`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `app/src/server/progression/service.ts`, `data/real-campaign-intake/verified-characters.json` |
| Skill proficiencies and skill choice state | Skill bonus derivation | Partial | `core-skill-choice-capture` | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `library/src/engine/proficiencies.ts` |
| Expertise | Expertise grants | Partial | `core-skill-choice-capture` | `runtime`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `library/src/engine/character-computer.ts` |
| Initiative | Initiative derivation | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/character-computer.ts`, `library/tests/engine/character-computer.test.ts` |
| Armor Class calculation | AC base snapshot fallback | Partial |  | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/defenses.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Armor Class calculation | AC formula selection | Partial |  | `runtime`, `tests`, `explainability` | `library/src/engine/defenses.ts`, `library/tests/engine/character-computer.test.ts` |
| Armor Class calculation | Equipped armor and shield contribution to AC | None | `action-equipment-persistence`, `action-equipped-state-persistence` | `persistence`, `runtime`, `mutation`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/equipment/`, `library/src/engine/defenses.ts` |
| Hit Point calculation | HP base snapshot fallback | Partial |  | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Hit Point calculation | Level-by-level HP derivation | None | `progression-class-level-commit` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/character-computer.ts`, `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Speed and speed bonuses | Walk speed derivation | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `library/src/engine/traits-and-resources.ts`, `data/real-campaign-intake/verified-characters.json` |
| Speed and speed bonuses | Alternate movement modes | None |  | `runtime`, `tests`, `fixtures` | `library/src/engine/traits-and-resources.ts`, `library/src/engine/character-computer.ts` |
| Passive Perception | Passive Perception derivation | Partial | `core-skill-choice-capture` | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `data/real-campaign-intake/verified-characters.json` |
| Senses | Sense grants | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `content/canon/packs/srd-5e-2024/species/` |
| Resistances and immunities | Resistance grants | Partial |  | `runtime`, `tests` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/species/` |
| Resistances and immunities | Immunity grants | Partial |  | `runtime`, `tests` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/species/` |

## Feats and Species

- Total: 14
- Full: 1
- Partial: 5
- None: 8

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Feat Alert | Alert-style initiative modifiers | Full |  | `runtime`, `tests` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/feats/` |
| Feat: Magic Initiate | Magic Initiate spell choice capture | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/feats/`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Magic Initiate | Magic Initiate free-cast tracking | None | `feat-magic-initiate-choice-capture`, `spell-free-cast-state` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/feats/` |
| Feat: Skilled | Skilled proficiency choice capture | None | `core-skill-choice-capture` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/feats/`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Musician | Musician rest-triggered benefit | None | `action-short-rest-reset-engine`, `action-long-rest-reset-engine` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/feats/`, `app/src/server/progression/service.ts` |
| Feat: Savage Attacker | Savage Attacker reroll resolution | None | `action-damage-package-projection` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/feats/`, `library/src/engine/character-computer.ts` |
| Species: Goliath / Stone's Endurance | Stone's Endurance surface and uses | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/traits-and-resources.ts`, `data/real-campaign-intake/verified-characters.json` |
| Species: Goliath / Stone's Endurance | Stone's Endurance damage reduction resolution | None | `species-stone-endurance-surface`, `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `app/src/server/progression/service.ts` |
| Species: Drow | Drow lineage spell grants | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/spellcasting.ts`, `data/real-campaign-intake/verified-characters.json` |
| Species: Drow | Drow Fey Ancestry mechanical effect | None | `rules-condition-state-engine`, `rules-charmed-effects` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `content/canon/packs/srd-5e-2024/conditions/` |
| Species: Wood Elf | Wood Elf speed bonus | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/character-computer.ts`, `data/real-campaign-intake/verified-characters.json` |
| Species: Wood Elf | Wood Elf Druidcraft grant | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/spellcasting.ts`, `data/real-campaign-intake/verified-characters.json` |
| Species: Wood Elf | Wood Elf Trance rest interaction | None | `action-long-rest-reset-engine` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `content/canon/packs/srd-5e-2024/rules/` |
| Reviewed sheet-derived species magic | Reviewed custom species normalization | Partial |  | `canon`, `fixtures`, `live-roster` | `data/real-campaign-intake/verified-characters.json`, `app/src/server/db/seed-real-campaign.ts` |

## Progression

- Total: 13
- Full: 8
- Partial: 5
- None: 0

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| XP ledger | XP award ledger | Full |  | `persistence`, `runtime`, `tests` | `app/src/server/db/schema/progression.ts`, `library/src/engine/xp.ts` |
| XP ledger | XP spend ledger | Full |  | `persistence`, `runtime`, `tests` | `app/src/server/db/schema/progression.ts`, `library/src/engine/xp.ts` |
| XP ledger | XP refund and adjustment ledger | Full |  | `persistence`, `runtime`, `tests` | `app/src/server/db/schema/progression.ts`, `library/src/engine/xp.ts` |
| AA and level-up spend-plan preview | Spend-plan document parse and normalization | Full |  | `runtime`, `tests` | `app/src/server/progression/service.ts`, `app/src/server/progression/plan-document.test.ts` |
| AA and level-up spend-plan preview | Spend-plan preview validation | Partial | `progression-spend-plan-parse` | `runtime`, `tests`, `fixtures` | `app/src/server/progression/service.ts`, `library/src/engine/prerequisite-evaluator.ts` |
| AA and level-up spend-plan commit | Spend-plan class-level commit | Partial | `progression-spend-plan-preview` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/progression/service.ts`, `app/src/server/db/schema/progression.ts` |
| AA and level-up spend-plan commit | Spend-plan canonical-source commit | Partial | `progression-spend-plan-preview` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/progression/service.ts`, `app/src/server/db/schema/progression.ts` |
| AA and level-up spend-plan commit | Spend-plan spell-access commit | Partial | `progression-spend-plan-preview` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/progression/service.ts`, `app/src/server/db/schema/progression.ts` |
| Prerequisite evaluation | Prerequisite: level | Full |  | `runtime`, `tests` | `library/src/engine/prerequisite-evaluator.ts`, `library/tests/engine/character-computer.test.ts` |
| Prerequisite evaluation | Prerequisite: spellcasting | Full |  | `runtime`, `tests` | `library/src/engine/prerequisite-evaluator.ts`, `library/tests/engine/character-computer.test.ts` |
| Prerequisite evaluation | Prerequisite: proficiency | Full |  | `runtime`, `tests` | `library/src/engine/prerequisite-evaluator.ts`, `library/tests/engine/character-computer.test.ts` |
| Prerequisite evaluation | Prerequisite: ability score | Full |  | `runtime`, `tests` | `library/src/engine/prerequisite-evaluator.ts`, `library/tests/engine/character-computer.test.ts` |
| Prerequisite evaluation | Prerequisite: source or ability match | Partial |  | `runtime`, `tests`, `fixtures` | `library/src/engine/prerequisite-evaluator.ts`, `app/src/server/progression/service.ts` |

## Rules and Conditions

- Total: 8
- Full: 0
- Partial: 1
- None: 7

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Condition: Charmed | Condition state engine | None |  | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/conditions/`, `app/src/server/progression/service.ts` |
| Condition: Charmed | Condition apply/remove mutation | None | `rules-condition-state-engine` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/conditions/` |
| Condition: Charmed | Charmed mechanical effects | None | `rules-condition-state-engine` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/conditions/`, `library/src/engine/character-computer.ts` |
| Condition: Incapacitated | Incapacitated mechanical effects | None | `rules-condition-state-engine` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/conditions/`, `library/src/engine/character-computer.ts` |
| Rule: Concentration | Concentration rule canon linkage | Partial |  | `canon`, `tests` | `content/canon/packs/srd-5e-2024/rules/`, `content/canon/packs/srd-5e-2024/spells/` |
| Rule: Study action | Study action availability | None |  | `runtime`, `tests`, `fixtures` | `content/canon/packs/srd-5e-2024/rules/`, `library/src/engine/character-computer.ts` |
| Short-rest / long-rest recovery automation | Rest flow event recording | None | `action-short-rest-reset-engine`, `action-long-rest-reset-engine` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `app/src/server/db/schema/progression.ts` |
| Condition: Incapacitated | DM condition override support | None | `rules-condition-apply-remove` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts` |

## Spellcasting

- Total: 20
- Full: 3
- Partial: 8
- None: 9

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Spell catalog lookup | Spell lookup by canonical id | Partial |  | `canon`, `runtime`, `tests` | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell catalog lookup | Spell lookup by name alias | Partial |  | `canon`, `runtime`, `tests` | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell catalog lookup | Enabled-pack spell visibility | Partial |  | `canon`, `runtime`, `tests` | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell access and known spell lists | Spell access grants | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/spellcasting.ts`, `app/src/server/progression/service.ts`, `data/real-campaign-intake/verified-characters.json` |
| Spell access and known spell lists | Spell access dedupe | Full |  | `runtime`, `tests` | `library/src/engine/spellcasting.ts`, `library/tests/engine/character-computer.test.ts` |
| Spell access and known spell lists | Spell origin choice capture | Partial |  | `persistence`, `runtime`, `tests`, `live-roster` | `app/src/server/progression/service.ts`, `data/real-campaign-intake/verified-characters.json` |
| Spell catalog lookup | Roster spell canon coverage | Partial |  | `canon`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/spells/`, `data/real-campaign-intake/verified-characters.json` |
| Spell slot pools | Spell slot pools from class features | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/spellcasting.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Pact Magic | Pact Magic progression | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/spellcasting.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Spell attack bonus and spell save DC | Spell save DC math | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/spellcasting.ts`, `library/tests/engine/character-computer.test.ts` |
| Spell attack bonus and spell save DC | Spell attack bonus math | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/spellcasting.ts`, `library/tests/engine/character-computer.test.ts` |
| Prepared / known spell capacity limits | Prepared spell capacity grants | None |  | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/spellcasting.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Prepared / known spell capacity limits | Known spell capacity grants | None |  | `runtime`, `tests`, `fixtures` | `library/src/engine/spellcasting.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Prepared / known spell capacity limits | Prepared and known spell capacity enforcement | None | `spell-prepared-capacity-grants`, `spell-known-capacity-grants` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `library/src/engine/spellcasting.ts` |
| Spell cast resolution | Spell slot spend mutation | None | `action-resource-spend-mutation` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `library/src/engine/spellcasting.ts` |
| Spell cast resolution | Free-cast and no-slot cast tracking | None | `spell-slot-spend-mutation` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/feats/` |
| Concentration | Concentration state tracking | None |  | `canon`, `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/rules/`, `app/src/server/progression/service.ts` |
| Concentration | Concentration save flow | None | `spell-concentration-state` | `runtime`, `mutation`, `tests`, `fixtures` | `content/canon/packs/srd-5e-2024/rules/`, `app/src/server/progression/service.ts` |
| Spell cast resolution | Spell resolution engine | None | `spell-slot-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures` | `library/src/engine/spellcasting.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Summon and familiar state | Summon and familiar state | None | `spell-resolution-engine` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/spells/`, `content/canon/packs/srd-5e-2024/class-features/`, `app/src/server/progression/service.ts` |

