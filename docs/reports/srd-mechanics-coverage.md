# SRD Mechanics Coverage

This tracker uses subsystem / feature granularity rather than sentence-by-sentence SRD parsing.

Status meanings:

- `Full`: usable without outside references for the tracked mechanic.
- `Partial`: some canon/runtime/data support exists, but the mechanic still leaks to notes, manual choice state, or missing execution logic.
- `None`: not implemented beyond maybe a canon content placeholder.

## Summary

- Total tracked mechanics: 53
- Full: 20
- Partial: 26
- None: 7

## Actions and Resources

- Total: 6
- Full: 2
- Partial: 2
- None: 2

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Action / bonus action / reaction inventory | Partial | Granted actions are surfaced, but no general action execution engine exists. | `library/src/engine/character-computer.ts` |
| Resource pools | Partial | Fixed and scaling resource pools are fully tested (Second Wind, Stone's Endurance, Sorcery Points, Bardic Inspiration). Spend/restore mutations are not yet automated. | `library/src/engine/traits-and-resources.ts`, `library/tests/engine/resources.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Short-rest / long-rest recovery automation | None | Resources know their reset cadence, but there is no automated reset flow yet. | `library/src/types/effect.ts` |
| Equipment loadout and equipped state | None | Canonical equipment exists, but live equipped-state modeling is not implemented. | `content/canon/packs/srd-5e-2024/equipment/`, `app/src/server/db/schema/progression.ts` |
| Weapon and attack profiles | Full | Melee and ranged attack profiles are derived with ability selection, proficiency, damage dice, and weapon mastery. Tested for multiple weapons. | `library/src/engine/attack-profiles.ts`, `library/tests/engine/attacks.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Weapon Mastery | Full | Weapon Mastery choices are extracted and mastery properties appear on computed attack profiles. Tested for Cleave and Graze. | `library/src/engine/attack-profiles.ts`, `library/tests/engine/attacks.test.ts` |

## Class Features

- Total: 9
- Full: 3
- Partial: 6
- None: 0

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Fighter: Second Wind | Partial | Second Wind surface and use count are fully tested as a fixed resource pool. Healing resolution and spend automation are not yet implemented. | `library/src/engine/traits-and-resources.ts`, `library/tests/engine/resources.test.ts` |
| Druid: Primal Order (Warden) | Partial | Warden proficiencies are modeled, but broader class choice-state remains manual. | `content/canon/packs/srd-5e-2024/class-features/primal-order-warden.md` |
| Druid: Wild Shape | Full | Wild Shape uses, form library, and transform state (transform/revert/excess-damage) are fully implemented and tested. | `library/src/engine/wild-shape.ts`, `library/tests/engine/wild-shape.test.ts` |
| Druid: Wild Companion | Full | Wild Companion surface and familiar lifecycle (summon/dismiss/resummon/long-rest) are fully implemented and tested. | `library/src/engine/wild-shape.ts`, `library/src/engine/familiars.ts`, `library/tests/engine/wild-shape.test.ts` |
| Warlock: Magical Cunning | Partial | Magical Cunning detection, recovery trait, and resource pool are fully tested. Slot recovery execution (persistent state update) is not yet implemented. | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |
| Warlock: Pact of the Blade | Full | Pact Blade detection, bond extraction, and CHA-for-attack substitution are fully implemented and tested. | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |
| Bard: Bardic Inspiration | Partial | Bardic Inspiration max uses, die scaling, pool definition, and Musician interaction are fully tested. Die spend/consumption is not yet automated. | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |
| Sorcerer: Font of Magic | Partial | Sorcery Points max, pool definition, conversion trait, and cost table are fully tested. Slot-point conversion execution is not yet automated. | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |
| Sorcerer: Metamagic | Partial | Metamagic choice extraction, trait building, and cost computation are fully tested. Cast-time modification execution is not yet implemented. | `library/src/engine/class-features-casters.ts`, `library/tests/engine/class-features-casters.test.ts` |

## Core Character

- Total: 13
- Full: 8
- Partial: 5
- None: 0

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Ability scores and modifiers | Full | The runtime computes ability modifiers directly from stored base scores. | `library/src/engine/character-computer.ts` |
| Proficiency bonus progression | Full | Proficiency bonus is derived from computed character level. | `library/src/engine/character-computer.ts` |
| Class level tracking | Full | Class levels are stored as sources and summed into character level. | `app/src/server/progression/service.ts`, `library/src/engine/character-computer.ts` |
| Saving throw proficiencies | Full | Class and source-granted saving throw proficiencies are modeled. | `library/src/engine/character-computer.ts`, `content/canon/packs/` |
| Skill proficiencies and skill choice state | Partial | Skill proficiency grants and bonus derivation are fully tested for all 5 roster characters, but skill choice capture/persistence is not yet implemented. | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Expertise | Full | Expertise doubles proficiency bonus and is reflected in passive perception. Tested with explicit expertise scenarios. | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts` |
| Armor Class calculation | Partial | AC base fallback and formula selection are fully tested (leather, chain mail, hide, shield). Equipment-derived AC still depends on unimplemented equipped-state persistence. | `library/src/engine/defenses.ts`, `library/tests/engine/attacks.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Hit Point calculation | Partial | Max HP is tracked and explainable once present in the base snapshot, but class hit-die and level-by-level HP derivation are not modeled end to end. | `library/src/engine/character-computer.ts`, `app/src/server/db/seed-real-campaign.ts` |
| Initiative | Full | Initiative is derived from Dexterity and initiative modifiers. | `library/src/engine/character-computer.ts` |
| Speed and speed bonuses | Partial | Walk speed derivation is fully tested (Wood Elf +5 verified). Alternate movement modes (swim, climb, fly) are not yet represented. | `library/src/engine/character-computer.ts`, `library/tests/engine/feats-and-species.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Passive Perception | Full | Passive perception is derived from WIS + proficiency + expertise + modifiers. Verified for all 5 roster characters. | `library/src/engine/proficiencies.ts`, `library/tests/engine/proficiencies.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Senses | Full | Darkvision grants (Drow 120ft, Wood Elf 60ft) are verified in computed state for roster characters. | `library/src/engine/character-computer.ts`, `library/tests/engine/feats-and-species.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Resistances and immunities | Partial | The engine can store and display resistances and immunities, but live roster coverage is still shallow and no combat resolver consumes them. | `library/src/engine/character-computer.ts` |

## Feats and Species

- Total: 8
- Full: 1
- Partial: 6
- None: 1

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Feat: Magic Initiate | Partial | The feat is tracked, but chosen cantrips, prepared spell, and free-cast state are not yet represented. | `content/canon/packs/srd-5e-2024/feats/magic-initiate.md`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Skilled | Partial | The feat is tracked, but the chosen proficiencies are not captured for the live roster. | `content/canon/packs/srd-5e-2024/feats/skilled.md`, `data/real-campaign-intake/verified-characters.json` |
| Feat: Savage Attacker | None | The feat is present in canon, but there is no attack-damage resolver to apply its reroll mechanic. | `content/canon/packs/srd-5e-2024/feats/savage-attacker.md` |
| Feat: Musician | Partial | The feat is tracked, but its rest-triggered party benefit is not automated. | `content/canon/packs/srd-5e-2024/feats/musician.md` |
| Species: Goliath / Stone's Endurance | Partial | Stone's Endurance detection, pool, reduction dice, and action type are fully tested. Damage reduction execution (actual spend flow) is not yet automated. | `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts` |
| Species: Drow | Full | Drow lineage spells (Dancing Lights, Faerie Fire), Fey Ancestry, Darkvision 120ft, and Trance are all detected and tested. | `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts` |
| Species: Wood Elf | Partial | Wood Elf speed bonus, Druidcraft, Darkvision, Fey Ancestry, and Trance detection are fully tested. Trance rest interaction is not yet automated. | `library/src/engine/feats-and-species.ts`, `library/tests/engine/feats-and-species.test.ts` |
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
- Full: 2
- Partial: 0
- None: 2

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Condition: Charmed | Full | Condition state engine, apply/remove, charmed effects (attack restriction, social advantage), and DM override are all implemented and tested. | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |
| Condition: Incapacitated | Full | Incapacitated effects (action/reaction restriction, concentration broken) and DM override are implemented and tested. | `library/src/engine/conditions.ts`, `library/tests/engine/conditions.test.ts` |
| Rule: Concentration | None | The rule is stored canonically, but no active tracking or save flow exists. | `content/canon/packs/srd-5e-2024/rules/concentration.md` |
| Rule: Study action | None | Study exists as canon content only; there is no runtime action flow around it. | `content/canon/packs/srd-5e-2024/rules/study-action.md` |

## Spellcasting

- Total: 9
- Full: 3
- Partial: 4
- None: 2

| Mechanic | Status | Notes | Refs |
| --- | --- | --- | --- |
| Spell catalog lookup | Partial | Canonical lookup works for the proof batch and roster-critical spells, but the full SRD spell catalog is not yet converted. | `library/src/catalog.ts`, `content/canon/packs/srd-5e-2024/spells/` |
| Spell access and known spell lists | Partial | Spell access grants and deduplication are fully tested. Origin choice capture is partial -- spell names seeded as sources but no general choice-state model. | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Spell slot pools | Full | Standard spell slot progression fully implemented with complete levels 1-20 table. Tested for full, half, and third casters. | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Pact Magic | Full | Pact Magic slot progression fully implemented with complete levels 1-20 table. Pact slot count, level, and pool definitions tested. | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts`, `library/tests/verification/live-roster-snapshot.test.ts` |
| Spell attack bonus and spell save DC | Full | Spell attack bonus and spell save DC are derived from ability plus proficiency plus modifiers. | `library/src/engine/character-computer.ts` |
| Prepared / known spell capacity limits | Partial | Prepared and known capacity are computed from class rules. Enforcement against actual spell picks is not yet implemented. | `library/src/engine/spellcasting.ts`, `library/tests/engine/spellcasting.test.ts` |
| Concentration | None | Concentration exists as canon content, but not as runtime state or cast-resolution logic. | `content/canon/packs/srd-5e-2024/rules/concentration.md` |
| Spell cast resolution | None | The app does not resolve casting, damage, healing, saves, or ongoing spell state. | `library/src/types/spell.ts` |
| Summon and familiar state | Partial | Familiar lifecycle (summon/dismiss/resummon/long-rest) is implemented for Wild Companion. General summon state beyond familiars is not yet modeled. | `library/src/engine/familiars.ts`, `library/tests/engine/wild-shape.test.ts` |

