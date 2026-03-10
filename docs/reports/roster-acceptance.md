# Roster Acceptance Report

Generated: 2026-03-10

## Summary

All 5 roster characters compute end-to-end through the engine with no note-only mechanics in the covered areas. Skill proficiencies, equipment attack profiles, resource pools, species traits, spell access, and class features flow from `verified-characters.json` through the fixture pipeline into `computeCharacterState`.

## Character Verification Matrix

| Character | Class/Lvl | Skills | AC | HP | Attacks | Spellcasting | Resources | Species | Feats |
|-----------|-----------|--------|----|----|---------|--------------|-----------|---------|-------|
| Ronan Wildspark | Fighter 2 | Athletics, Intimidation | 14 | 22 | Longsword (Sap) | None | Second Wind, Stone's Endurance | Goliath | Savage Attacker |
| Tali | Druid 2 | Nature, Perception | 13 | 19 | Quarterstaff | DC 13, +5 atk | Wild Shape | Custom (reviewed) | None |
| Oriana | Warlock 2 | Arcana, Deception, Perception, Persuasion, Stealth | 12 | 18 | None (Pact Blade modeled) | DC 13, +5 atk | Magical Cunning | Drow | Skilled |
| Vivennah | Bard 2 | Acrobatics, Performance, Persuasion | 13 | 15 | Rapier | DC 13, +5 atk | Bardic Inspiration (3 uses) | Wood Elf | Musician |
| Nara | Sorcerer 2 | Arcana, Insight | 10 | 12 | None | DC 13, +5 atk | Sorcery Points (2) | Unresolved | Magic Initiate (Wizard) |

## Covered Mechanics (computed, not note-only)

- **Skill proficiencies**: All 5 characters have computed skill bonuses from `skillChoices` data
- **Passive perception**: Derived from WIS + proficiency when applicable
- **AC**: From sheet baselines (armor AC formula integration deferred; sheet value is truth)
- **HP**: From sheet baselines
- **Speed**: Computed with Wood Elf +5 bonus for Vivennah
- **Attack profiles**: Longsword (Ronan), Quarterstaff (Tali), Rapier (Vivennah)
- **Weapon mastery**: Sap (Longsword) for Ronan when Weapon Mastery feature present
- **Spellcasting**: Spell save DC, spell attack bonus, slot pools, granted spells
- **Pact Magic**: Short rest slot recovery for Oriana (2 level-1 slots)
- **Resource pools**: Second Wind, Stone's Endurance, Wild Shape, Magical Cunning, Bardic Inspiration, Sorcery Points
- **Species traits**: Goliath (Stone's Endurance, Giant Ancestry), Drow (Darkvision 120, Fey Ancestry, Trance), Wood Elf (Darkvision 60, speed +5, Druidcraft, Fey Ancestry, Trance)
- **Feat mechanics**: Savage Attacker (trait), Skilled (proficiency grants), Musician (BI short rest reset)

## Residual Gaps (explicit, documented)

### Class weapon/armor proficiency
- Class-level sources do not yet emit `proficiency` effects for weapon and armor categories
- Impact: Attack profiles show `isProficient=false`, so attack bonuses lack proficiency bonus
- This is a canonical content gap, not a runtime engine gap

### Metamagic/Font of Magic dynamic traits
- `buildCasterClassFeatureEffects` and `buildFeatAndSpeciesDynamicEffects` produce supplemental traits (Metamagic options, Font of Magic Conversion, Alert initiative bonus)
- These are not called by `computeCharacterState` directly; they're designed for the app-side progression service
- Impact: Nara's metamagic option names and Font of Magic conversion trait don't appear in pure engine output

### Saving throw proficiencies
- No class-granted saving throw proficiencies are modeled yet (e.g., Fighter: STR/CON)
- Impact: `proficiencies.savingThrows` is empty for all characters

### Language and tool proficiencies
- Not modeled; `proficiencies.languages` and `proficiencies.tools` are empty

### Nara species
- Species text is faint on the sheet and remains unresolved
- Marked as explicit unresolved in `verified-characters.json`

### Tali species
- Custom reviewed lineage; handwritten name not fully legible
- Species effects (Darkvision, Feerie Tollen, Hex Magic) are preserved as inline effects

### Magic Initiate spell choices (Nara)
- Exact wizard cantrips and level-1 spell not legible from sheet photo
- Marked as explicit unresolved in `verified-characters.json`

### AC formula vs sheet baseline
- Equipment AC formulas (leather armor, shield) are not used in fixtures
- The sheet AC value serves as the authoritative baseline
- Full AC computation from equipment sources is deferred to avoid double-counting

## Test Evidence

- `library/tests/verification/live-roster-snapshot.test.ts`: 26 tests covering all 5 characters
- `data/fleet/snapshots/live-roster-baseline.json`: Deterministic snapshot with skill proficiencies, attack profiles, resources
- Verification: `pnpm check && pnpm test && pnpm lint` all pass (409 tests, 0 lint errors)
