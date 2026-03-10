# Fleet Readiness

This report is the handoff deck for parallel agent execution.

## Summary

- Atomic mechanics: 111 total, 50 full, 28 partial, 33 none
- Fleet batches: 15 total
- Ready now: 4
- Blocked on dependencies: 11
- CSV handoff: `docs/reports/fleet-work-items.csv`

## Bottlenecks

- `resource-spend-and-rest-engine` (Add resource spend, restore, and rest reset flows): blocks 5 downstream batches
- `progression-service-boundary-split` (Split progression service into stable submodules): blocks 4 downstream batches
- `condition-state-and-dm-overrides` (Add condition state, mechanical effects, and DM overrides): blocks 3 downstream batches

## Ready Now

| Batch | Lane | Goal | Owned Paths | Gates |
| --- | --- | --- | --- | --- |
| `progression-service-boundary-split` | progression | Remove the remaining server-side serial bottleneck by extracting progression preview, commit, runtime projection, and helper queries into dedicated files. | `app/src/server/progression/service.ts`, `app/src/server/progression/`, `app/src/server/progression/*.test.ts` | `runtime`, `tests` |
| `content-roster-srd-expansion` | content | Finish the SRD canon needed by the seeded roster and by the immediate runtime batches: spells, class features, feats, species, and equipment actually in play. | `content/canon/packs/srd-5e-2024/spells/`, `content/canon/packs/srd-5e-2024/class-features/`, `content/canon/packs/srd-5e-2024/classes/`, `content/canon/packs/srd-5e-2024/feats/`, `content/canon/packs/srd-5e-2024/species/`, `content/canon/packs/srd-5e-2024/equipment/`, `library/tests/canon/srd-roster-batch.test.ts` | `canon`, `tests`, `fixtures`, `live-roster` |
| `content-aa-overlay-expansion` | content | Increase AA coverage around the roster and immediate hybrid-progression path while preserving explicit judgment metadata and pack provenance. | `content/canon/packs/advanced-adventurers/`, `library/tests/canon/aa-overlay-batch.test.ts` | `canon`, `tests`, `fixtures` |
| `verification-harness-and-live-snapshots` | verification | Turn status changes into evidence by adding live-roster snapshot checks, fixture coverage, and report generation that agents can update safely. | `data/mechanics-coverage/`, `data/fleet/`, `docs/reports/`, `scripts/report-mechanics-coverage.ts`, `scripts/report-fleet-readiness.ts`, `worklog.md` | `tests`, `fixtures`, `live-roster` |

## Ready-Now Write Scope Check

- No exact owned-path collisions across ready-now batches.

## Wave 1

| Batch | Lane | Depends On | Mechanics |
| --- | --- | --- | --- |
| `content-aa-overlay-expansion` | content |  | `spell-enabled-pack-visibility`, `spell-origin-choice-capture`, `spell-roster-canon-coverage` |
| `content-roster-srd-expansion` | content |  | `spell-lookup-by-id`, `spell-lookup-by-name-alias`, `spell-roster-canon-coverage`, `spell-slot-pools-from-class-features`, `spell-pact-magic-progression`, `feature-primal-order-warden`, `feature-second-wind-surface`, `feature-bardic-inspiration-surface`, `feature-font-of-magic-points`, `species-drow-lineage-spells`, `species-wood-elf-druidcraft` |
| `progression-service-boundary-split` | progression |  | `progression-spend-plan-preview`, `progression-class-level-commit`, `progression-canonical-source-commit`, `progression-spell-access-commit` |
| `verification-harness-and-live-snapshots` | verification |  | `core-skill-bonus-derivation`, `core-passive-perception-derivation`, `spell-roster-canon-coverage` |

## Wave 2

| Batch | Lane | Depends On | Mechanics |
| --- | --- | --- | --- |
| `choice-state-and-equipment-persistence` | progression | `progression-service-boundary-split` | `core-skill-choice-capture`, `feat-magic-initiate-choice-capture`, `feat-skilled-choice-capture`, `action-equipment-persistence`, `action-equipped-state-persistence`, `action-weapon-mastery-choice-capture`, `feature-metamagic-option-capture`, `feature-pact-blade-bond-state` |
| `resource-spend-and-rest-engine` | runtime | `progression-service-boundary-split` | `action-fixed-resource-pools`, `action-scaling-resource-pools`, `action-resource-spend-mutation`, `action-resource-restore-mutation`, `action-short-rest-reset-engine`, `action-long-rest-reset-engine`, `rules-rest-flow-event-recording` |
| `runtime-skill-and-passive-loop` | runtime | `choice-state-and-equipment-persistence` | `core-skill-proficiency-grants`, `core-skill-bonus-derivation`, `core-expertise-grants`, `core-passive-perception-derivation` |

## Wave 3

| Batch | Lane | Depends On | Mechanics |
| --- | --- | --- | --- |
| `condition-state-and-dm-overrides` | rules | `progression-service-boundary-split` | `rules-condition-state-engine`, `rules-condition-apply-remove`, `rules-charmed-effects`, `rules-incapacitated-effects`, `rules-dm-condition-override` |
| `runtime-ac-and-attack-foundation` | runtime | `choice-state-and-equipment-persistence`, `content-roster-srd-expansion` | `core-ac-base-fallback`, `core-ac-formula-selection`, `core-equipped-armor-and-shield-ac`, `action-armor-effect-application`, `action-weapon-effect-application`, `action-melee-attack-profiles`, `action-ranged-attack-profiles`, `action-damage-package-projection`, `action-weapon-mastery-runtime` |
| `runtime-slot-capacity-and-cast-state` | runtime | `progression-service-boundary-split`, `content-roster-srd-expansion`, `content-aa-overlay-expansion`, `resource-spend-and-rest-engine` | `spell-access-grants`, `spell-origin-choice-capture`, `spell-slot-pools-from-class-features`, `spell-pact-magic-progression`, `spell-prepared-capacity-grants`, `spell-known-capacity-grants`, `spell-capacity-enforcement`, `spell-slot-spend-mutation`, `spell-free-cast-state` |

### Wave 3 Write-Scope Collisions

These batches can run in parallel but share write paths. Resolve before launching this wave by splitting files or serializing the batches.

| Path A | Path B | Batch A | Batch B |
| --- | --- | --- | --- |
| `library/src/types/character.ts` | `library/src/types/character.ts` | `condition-state-and-dm-overrides` | `runtime-ac-and-attack-foundation` |
| `app/src/server/progression/condition-service.ts` | `app/src/server/progression/` | `condition-state-and-dm-overrides` | `runtime-slot-capacity-and-cast-state` |
| `app/src/server/progression/condition-state.ts` | `app/src/server/progression/` | `condition-state-and-dm-overrides` | `runtime-slot-capacity-and-cast-state` |
| `library/src/types/character.ts` | `library/src/types/character.ts` | `condition-state-and-dm-overrides` | `runtime-slot-capacity-and-cast-state` |
| `library/src/types/character.ts` | `library/src/types/character.ts` | `runtime-ac-and-attack-foundation` | `runtime-slot-capacity-and-cast-state` |

## Wave 4

| Batch | Lane | Depends On | Mechanics |
| --- | --- | --- | --- |
| `feature-feats-and-species-closures` | runtime | `resource-spend-and-rest-engine`, `runtime-ac-and-attack-foundation`, `runtime-slot-capacity-and-cast-state`, `condition-state-and-dm-overrides` | `feat-magic-initiate-choice-capture`, `feat-magic-initiate-free-cast-tracking`, `feat-skilled-choice-capture`, `feat-musician-rest-benefit`, `feat-savage-attacker-reroll`, `species-stone-endurance-surface`, `species-stone-endurance-resolution`, `species-drow-lineage-spells`, `species-drow-fey-ancestry`, `species-wood-elf-speed-bonus`, `species-wood-elf-druidcraft`, `species-wood-elf-trance`, `species-reviewed-custom-normalization` |
| `feature-warlock-bard-sorcerer-closures` | runtime | `resource-spend-and-rest-engine`, `runtime-ac-and-attack-foundation`, `runtime-slot-capacity-and-cast-state` | `feature-magical-cunning-surface`, `feature-magical-cunning-recovery`, `feature-pact-blade-bond-state`, `feature-pact-blade-charisma-substitution`, `feature-bardic-inspiration-surface`, `feature-bardic-inspiration-spend-and-scaling`, `feature-font-of-magic-points`, `feature-font-of-magic-conversion`, `feature-metamagic-option-capture`, `feature-metamagic-cast-modifiers` |
| `feature-wild-shape-and-companion` | runtime | `resource-spend-and-rest-engine`, `content-roster-srd-expansion`, `condition-state-and-dm-overrides` | `feature-wild-shape-uses`, `feature-wild-shape-form-library`, `feature-wild-shape-transform-state`, `feature-wild-companion-surface`, `feature-wild-companion-lifecycle`, `spell-summon-and-familiar-state` |

### Wave 4 Write-Scope Collisions

These batches can run in parallel but share write paths. Resolve before launching this wave by splitting files or serializing the batches.

| Path A | Path B | Batch A | Batch B |
| --- | --- | --- | --- |
| `app/src/server/progression/` | `app/src/server/progression/` | `feature-feats-and-species-closures` | `feature-warlock-bard-sorcerer-closures` |
| `data/real-campaign-intake/verified-characters.json` | `data/real-campaign-intake/verified-characters.json` | `feature-feats-and-species-closures` | `feature-warlock-bard-sorcerer-closures` |
| `app/src/server/progression/` | `app/src/server/progression/` | `feature-feats-and-species-closures` | `feature-wild-shape-and-companion` |
| `content/canon/packs/srd-5e-2024/class-features/` | `content/canon/packs/srd-5e-2024/class-features/wild-shape.md` | `feature-warlock-bard-sorcerer-closures` | `feature-wild-shape-and-companion` |
| `content/canon/packs/srd-5e-2024/class-features/` | `content/canon/packs/srd-5e-2024/class-features/wild-companion.md` | `feature-warlock-bard-sorcerer-closures` | `feature-wild-shape-and-companion` |
| `app/src/server/progression/` | `app/src/server/progression/` | `feature-warlock-bard-sorcerer-closures` | `feature-wild-shape-and-companion` |

## Wave 5

| Batch | Lane | Depends On | Mechanics |
| --- | --- | --- | --- |
| `roster-normalization-and-live-acceptance` | verification | `runtime-skill-and-passive-loop`, `resource-spend-and-rest-engine`, `runtime-ac-and-attack-foundation`, `runtime-slot-capacity-and-cast-state`, `condition-state-and-dm-overrides`, `feature-wild-shape-and-companion`, `feature-warlock-bard-sorcerer-closures`, `feature-feats-and-species-closures` | `core-skill-choice-capture`, `core-ac-base-fallback`, `core-hp-base-fallback`, `core-walk-speed-derivation`, `spell-origin-choice-capture`, `species-reviewed-custom-normalization` |
| `status-audit-and-closeout` | verification | `roster-normalization-and-live-acceptance` |  |

## Execution Notes

- Parallelize across ready-now batches first.
- If a later batch needs a file already claimed by another batch in the same wave, serialize by lane or split the file first.
- Do not mark a mechanic `full` without linked tests, fixtures, or live-roster evidence.
- Keep UI out of scope until these non-UI batches are closed.

