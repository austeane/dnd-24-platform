# SRD Mechanics Coverage (Atomic)

This tracker is the execution truth for agent work. It is intentionally more granular than the coarse product-level tracker.

Status rule:

- `Full`: closed with evidence, not just partial support or canon presence.
- `Partial`: some support exists, but the mechanic still leaks to manual notes, missing state, or missing execution.
- `None`: no defensible implementation yet.

## Summary

- Total atomic mechanics: 111
- Full: 39
- Partial: 39
- None: 33

## Actions and Resources

- Total: 18
- Full: 2
- Partial: 8
- None: 8

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Action / bonus action / reaction inventory | Action inventory | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Action / bonus action / reaction inventory | Bonus action inventory | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Action / bonus action / reaction inventory | Reaction inventory | Partial |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/species/` |
| Resource pools | Fixed resource pools | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `library/tests/engine/resources.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Resource pools | Scaling resource pools | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `library/tests/engine/resources.test.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Resource pools | Resource spend mutation | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `app/src/server/progression/service.ts` |
| Resource pools | Resource restore mutation | None | `action-resource-spend-mutation` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/db/schema/progression.ts`, `app/src/server/progression/service.ts` |
| Short-rest / long-rest recovery automation | Short-rest reset engine | None | `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/rules/` |
| Short-rest / long-rest recovery automation | Long-rest reset engine | None | `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/traits-and-resources.ts`, `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/rules/` |
| Equipment loadout and equipped state | Equipment inventory persistence | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Equipment loadout and equipped state | Equipped-state persistence | None | `action-equipment-persistence` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/equipment/` |
| Equipment loadout and equipped state | Armor equipment effect application | None | `action-equipped-state-persistence` | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/equipment/`, `library/src/engine/defenses.ts` |
| Equipment loadout and equipped state | Weapon equipment effect application | None | `action-equipped-state-persistence` | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/equipment/`, `library/src/engine/character-computer.ts` |
| Weapon and attack profiles | Melee attack profile derivation | Partial | `action-weapon-effect-application` | `runtime`, `explainability`, `tests`, `fixtures`, `live-roster` | `library/src/engine/attack-profiles.ts`, `library/tests/engine/attacks.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Weapon and attack profiles | Ranged attack profile derivation | Partial | `action-weapon-effect-application` | `runtime`, `explainability`, `tests`, `fixtures`, `live-roster` | `library/src/engine/attack-profiles.ts`, `library/tests/engine/attacks.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Weapon and attack profiles | Damage package projection | Partial | `action-melee-attack-profiles`, `action-ranged-attack-profiles` | `runtime`, `tests`, `fixtures` | `library/src/engine/attack-profiles.ts`, `library/tests/engine/attacks.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Weapon Mastery | Weapon Mastery choice capture | Partial |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/tests/engine/attacks.test.ts`, `data/real-campaign-intake/verified-characters.json`, `content/canon/packs/srd-5e-2024/class-features/` |
| Weapon Mastery | Weapon Mastery runtime resolution | Partial | `action-weapon-mastery-choice-capture`, `action-melee-attack-profiles` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/attack-profiles.ts`, `library/tests/engine/attacks.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |

## Class Features

- Total: 18
- Full: 6
- Partial: 7
- None: 5

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Fighter: Second Wind | Second Wind surface and use count | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/traits-and-resources.ts`, `library/tests/engine/resources.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Fighter: Second Wind | Second Wind healing resolution | None | `feature-second-wind-surface`, `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `app/src/server/progression/service.ts` |
| Druid: Primal Order (Warden) | Primal Order (Warden) proficiencies | Partial |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/proficiencies.ts`, `data/real-campaign-intake/verified-characters.json` |
| Druid: Wild Shape | Wild Shape use tracking | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/wild-shape.ts`, `library/tests/engine/wild-shape.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Druid: Wild Shape | Wild Shape form library | Partial |  | `canon`, `runtime`, `tests`, `fixtures` | `library/src/engine/wild-shape.ts`, `library/tests/engine/wild-shape.test.ts` |
| Druid: Wild Shape | Wild Shape transform state | Partial | `feature-wild-shape-form-library`, `action-resource-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/wild-shape.ts`, `library/tests/engine/wild-shape.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Druid: Wild Companion | Wild Companion surface | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/wild-shape.ts`, `library/tests/engine/wild-shape.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Druid: Wild Companion | Wild Companion summon lifecycle | Partial | `feature-wild-companion-surface`, `spell-summon-and-familiar-state` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/familiars.ts`, `library/src/engine/wild-shape.ts`, `library/tests/engine/wild-shape.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Warlock: Magical Cunning | Magical Cunning surface | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Warlock: Magical Cunning | Magical Cunning recovery execution | None | `feature-magical-cunning-surface`, `spell-slot-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Warlock: Pact of the Blade | Pact of the Blade bond state | Partial | `action-equipment-persistence` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |
| Warlock: Pact of the Blade | Pact of the Blade Charisma substitution | Partial | `feature-pact-blade-bond-state`, `action-melee-attack-profiles` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |
| Bard: Bardic Inspiration | Bardic Inspiration surface and uses | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Bard: Bardic Inspiration | Bardic Inspiration spend and die scaling | None | `feature-bardic-inspiration-surface`, `action-resource-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Sorcerer: Font of Magic | Font of Magic point pool | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/class-features/`, `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Sorcerer: Font of Magic | Font of Magic slot-point conversion | None | `feature-font-of-magic-points`, `spell-slot-spend-mutation` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Sorcerer: Metamagic | Metamagic option capture | Partial |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts`, `data/real-campaign-intake/verified-characters.json` |
| Sorcerer: Metamagic | Metamagic cast-time modifications | None | `feature-metamagic-option-capture`, `feature-font-of-magic-points`, `spell-resolution-engine` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |

## Core Character

- Total: 20
- Full: 12
- Partial: 4
- None: 4

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Ability scores and modifiers | Ability modifier math | Full |  | `runtime`, `tests` | `library/src/engine/math.ts`, `library/tests/engine/character-computer.test.ts` |
| Class level tracking | Class level aggregation | Full |  | `runtime`, `tests` | `library/src/engine/levels.ts`, `app/src/server/progression/service.ts`, `library/tests/engine/character-computer.test.ts` |
| Proficiency bonus progression | Proficiency bonus table | Full |  | `runtime`, `tests` | `library/src/engine/math.ts`, `library/tests/engine/character-computer.test.ts` |
| Saving throw proficiencies | Saving throw proficiency grants | Full |  | `runtime`, `tests` | `library/src/engine/proficiencies.ts`, `library/tests/engine/character-computer.test.ts` |
| Skill proficiencies and skill choice state | Skill proficiency grants | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts`, `app/src/server/progression/live-roster.integration.test.ts`, `data/real-campaign-intake/verified-characters.json` |
| Skill proficiencies and skill choice state | Skill choice capture and persistence | None |  | `persistence`, `mutation`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `app/src/server/progression/service.ts`, `data/real-campaign-intake/verified-characters.json` |
| Skill proficiencies and skill choice state | Skill bonus derivation | Full | `core-skill-choice-capture` | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Expertise | Expertise grants | Partial | `core-skill-choice-capture` | `runtime`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts` |
| Initiative | Initiative derivation | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/character-computer.ts`, `library/tests/engine/character-computer.test.ts` |
| Armor Class calculation | AC base snapshot fallback | Full |  | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/defenses.ts`, `library/tests/engine/attacks.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Armor Class calculation | AC formula selection | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/defenses.ts`, `library/tests/engine/attacks.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Armor Class calculation | Equipped armor and shield contribution to AC | None | `action-equipment-persistence`, `action-equipped-state-persistence` | `persistence`, `runtime`, `mutation`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/equipment/`, `library/src/engine/defenses.ts` |
| Hit Point calculation | HP base snapshot fallback | Partial |  | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Hit Point calculation | Level-by-level HP derivation | None | `progression-class-level-commit` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/character-computer.ts`, `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/class-features/` |
| Speed and speed bonuses | Walk speed derivation | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Speed and speed bonuses | Alternate movement modes | None |  | `runtime`, `tests`, `fixtures` | `library/src/engine/traits-and-resources.ts`, `library/src/engine/character-computer.ts` |
| Passive Perception | Passive Perception derivation | Full | `core-skill-choice-capture` | `runtime`, `explainability`, `tests`, `live-roster` | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Senses | Sense grants | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/character-computer.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Resistances and immunities | Resistance grants | Partial |  | `runtime`, `tests` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/species/` |
| Resistances and immunities | Immunity grants | Partial |  | `runtime`, `tests` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/species/` |

## Feats and Species

- Total: 14
- Full: 5
- Partial: 2
- None: 7

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Feat Alert | Alert-style initiative modifiers | Full |  | `runtime`, `tests` | `library/src/engine/character-computer.ts`, `content/canon/packs/srd-5e-2024/feats/`, `library/tests/engine/character-computer.test.ts` |
| Feat: Magic Initiate | Magic Initiate spell choice capture | None |  | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/feats/`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Magic Initiate | Magic Initiate free-cast tracking | None | `feat-magic-initiate-choice-capture`, `spell-free-cast-state` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/feats/` |
| Feat: Skilled | Skilled proficiency choice capture | None | `core-skill-choice-capture` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/db/schema/progression.ts`, `content/canon/packs/srd-5e-2024/feats/`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Musician | Musician rest-triggered benefit | None | `action-short-rest-reset-engine`, `action-long-rest-reset-engine` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/feats/`, `app/src/server/progression/service.ts` |
| Feat: Savage Attacker | Savage Attacker reroll resolution | None | `action-damage-package-projection` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/feats/`, `library/src/engine/character-computer.ts` |
| Species: Goliath / Stone's Endurance | Stone's Endurance surface and uses | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Species: Goliath / Stone's Endurance | Stone's Endurance damage reduction resolution | None | `species-stone-endurance-surface`, `action-resource-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `app/src/server/progression/service.ts` |
| Species: Drow | Drow lineage spell grants | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Species: Drow | Drow Fey Ancestry mechanical effect | Partial | `rules-condition-state-engine`, `rules-charmed-effects` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts`, `library/src/engine/conditions.ts` |
| Species: Wood Elf | Wood Elf speed bonus | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Species: Wood Elf | Wood Elf Druidcraft grant | Full |  | `runtime`, `tests`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Species: Wood Elf | Wood Elf Trance rest interaction | None | `action-long-rest-reset-engine` | `runtime`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/species/`, `content/canon/packs/srd-5e-2024/rules/` |
| Reviewed sheet-derived species magic | Reviewed custom species normalization | Partial |  | `canon`, `fixtures`, `live-roster` | `data/real-campaign-intake/verified-characters.json`, `app/src/server/db/seed-real-campaign.ts` |

## Progression

- Total: 13
- Full: 8
- Partial: 5
- None: 0

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| XP ledger | XP award ledger | Full |  | `persistence`, `runtime`, `tests` | `app/src/server/db/schema/progression.ts`, `library/src/engine/xp.ts`, `library/tests/engine/character-computer.test.ts` |
| XP ledger | XP spend ledger | Full |  | `persistence`, `runtime`, `tests` | `app/src/server/db/schema/progression.ts`, `library/src/engine/xp.ts`, `library/tests/engine/character-computer.test.ts` |
| XP ledger | XP refund and adjustment ledger | Full |  | `persistence`, `runtime`, `tests` | `app/src/server/db/schema/progression.ts`, `library/src/engine/xp.ts`, `library/tests/engine/character-computer.test.ts` |
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
- Partial: 6
- None: 2

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Condition: Charmed | Condition state engine | Partial |  | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |
| Condition: Charmed | Condition apply/remove mutation | Partial | `rules-condition-state-engine` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |
| Condition: Charmed | Charmed mechanical effects | Partial | `rules-condition-state-engine` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |
| Condition: Incapacitated | Incapacitated mechanical effects | Partial | `rules-condition-state-engine` | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |
| Rule: Concentration | Concentration rule canon linkage | Partial |  | `canon`, `tests` | `content/canon/packs/srd-5e-2024/rules/`, `content/canon/packs/srd-5e-2024/spells/` |
| Rule: Study action | Study action availability | None |  | `runtime`, `tests`, `fixtures` | `content/canon/packs/srd-5e-2024/rules/`, `library/src/engine/character-computer.ts` |
| Short-rest / long-rest recovery automation | Rest flow event recording | None | `action-short-rest-reset-engine`, `action-long-rest-reset-engine` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `app/src/server/db/schema/progression.ts` |
| Condition: Incapacitated | DM condition override support | Partial | `rules-condition-apply-remove` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |

## Spellcasting

- Total: 20
- Full: 6
- Partial: 7
- None: 7

| Parent | Atomic Mechanic | Status | Depends On | Gates | Refs |
| --- | --- | --- | --- | --- | --- |
| Spell catalog lookup | Spell lookup by canonical id | Partial |  | `canon`, `runtime`, `tests` | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell catalog lookup | Spell lookup by name alias | Partial |  | `canon`, `runtime`, `tests` | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell catalog lookup | Enabled-pack spell visibility | Partial |  | `canon`, `runtime`, `tests` | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell access and known spell lists | Spell access grants | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `app/src/server/progression/live-roster.integration.test.ts`, `data/real-campaign-intake/verified-characters.json` |
| Spell access and known spell lists | Spell access dedupe | Full |  | `runtime`, `tests` | `library/src/engine/spellcasting.ts`, `library/tests/engine/character-computer.test.ts` |
| Spell access and known spell lists | Spell origin choice capture | Partial |  | `persistence`, `runtime`, `tests`, `live-roster` | `app/src/server/progression/service.ts`, `data/real-campaign-intake/verified-characters.json` |
| Spell catalog lookup | Roster spell canon coverage | Partial |  | `canon`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/spells/`, `data/real-campaign-intake/verified-characters.json` |
| Spell slot pools | Spell slot pools from class features | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Pact Magic | Pact Magic progression | Full |  | `runtime`, `tests`, `live-roster` | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Spell attack bonus and spell save DC | Spell save DC math | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/spellcasting.ts`, `library/tests/engine/character-computer.test.ts` |
| Spell attack bonus and spell save DC | Spell attack bonus math | Full |  | `runtime`, `tests`, `explainability` | `library/src/engine/spellcasting.ts`, `library/tests/engine/character-computer.test.ts` |
| Prepared / known spell capacity limits | Prepared spell capacity grants | Partial |  | `runtime`, `tests`, `fixtures`, `live-roster` | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `app/src/server/progression/live-roster.integration.test.ts` |
| Prepared / known spell capacity limits | Known spell capacity grants | Partial |  | `runtime`, `tests`, `fixtures` | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts` |
| Prepared / known spell capacity limits | Prepared and known spell capacity enforcement | None | `spell-prepared-capacity-grants`, `spell-known-capacity-grants` | `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `library/src/engine/spellcasting.ts` |
| Spell cast resolution | Spell slot spend mutation | None | `action-resource-spend-mutation` | `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `app/src/server/progression/service.ts`, `library/src/engine/spellcasting.ts` |
| Spell cast resolution | Free-cast and no-slot cast tracking | None | `spell-slot-spend-mutation` | `persistence`, `mutation`, `tests`, `fixtures` | `app/src/server/progression/service.ts`, `content/canon/packs/srd-5e-2024/feats/` |
| Concentration | Concentration state tracking | None |  | `canon`, `persistence`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/rules/`, `app/src/server/progression/service.ts` |
| Concentration | Concentration save flow | None | `spell-concentration-state` | `runtime`, `mutation`, `tests`, `fixtures` | `content/canon/packs/srd-5e-2024/rules/`, `app/src/server/progression/service.ts` |
| Spell cast resolution | Spell resolution engine | None | `spell-slot-spend-mutation` | `runtime`, `mutation`, `tests`, `fixtures` | `library/src/engine/spellcasting.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Summon and familiar state | Summon and familiar state | None | `spell-resolution-engine` | `persistence`, `runtime`, `mutation`, `tests`, `fixtures`, `live-roster` | `content/canon/packs/srd-5e-2024/spells/`, `content/canon/packs/srd-5e-2024/class-features/`, `app/src/server/progression/service.ts` |

