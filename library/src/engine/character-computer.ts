import type {
  CharacterComputationInput,
  CharacterState,
} from "../types/character.ts";
import { buildACBreakdown, buildArmorClass } from "./defenses.ts";
import { buildAttackProfiles } from "./attack-profiles.ts";
import {
  applyPactBladeCharismaSubstitution,
  buildCasterClassFeatureEffects,
  extractPactBladeBond,
} from "./class-features-casters.ts";
import {
  applyFeatAndSpeciesSourceOverrides,
  buildFeatAndSpeciesDynamicEffects,
} from "./feats-and-species.ts";
import { getCharacterLevel } from "./levels.ts";
import { getAbilityModifier, getProficiencyBonusForLevel } from "./math.ts";
import { buildPassivePerception, buildProficiencies, buildSkillState } from "./proficiencies.ts";
import { buildSpellcastingState } from "./spellcasting.ts";
import {
  buildNotes,
  buildResources,
  buildSenses,
  buildTraits,
} from "./traits-and-resources.ts";
import {
  createExplanation,
  flattenEffects,
  getNumericModifierContributors,
  sumContributors,
  uniqueSorted,
} from "./shared.ts";
import { buildXpSummary } from "./xp.ts";
import { computeConditionEffects } from "./conditions.ts";

export { getAbilityModifier } from "./math.ts";

export function computeCharacterState(input: CharacterComputationInput): CharacterState {
  const effectiveSources = applyFeatAndSpeciesSourceOverrides(input.sources);
  const baseEffects = flattenEffects(effectiveSources);
  const level = getCharacterLevel(effectiveSources);
  const baseProficiencyBonus = getProficiencyBonusForLevel(level);
  const proficiencyBonusModifiers = getNumericModifierContributors(baseEffects, "proficiency-bonus");
  const proficiencyBonus = baseProficiencyBonus + sumContributors(proficiencyBonusModifiers);
  const dynamicEffects = [
    ...buildFeatAndSpeciesDynamicEffects(effectiveSources, proficiencyBonus),
    ...buildCasterClassFeatureEffects(effectiveSources),
  ];
  const effects = [...baseEffects, ...dynamicEffects];
  const proficiencies = buildProficiencies(effects);

  const dexterityModifier = getAbilityModifier(input.base.abilityScores.dexterity);
  const initiativeContributors = getNumericModifierContributors(effects, "initiative");
  const hpContributors = getNumericModifierContributors(effects, "hp-max");
  const speedContributors = getNumericModifierContributors(effects, "speed");
  const speedBonuses = effects
    .filter((entry): entry is typeof entry & { effect: Extract<typeof entry.effect, { type: "speed-bonus" }> } =>
      entry.effect.type === "speed-bonus" && entry.effect.movementType === "walk"
    )
    .map((entry) => entry.effect.value);

  const pactBladeBond = extractPactBladeBond(effectiveSources);
  const attackProfiles = buildAttackProfiles(input, effects, proficiencyBonus, proficiencies)
    .map((profile) =>
      applyPactBladeCharismaSubstitution(
        profile,
        input.base.abilityScores,
        pactBladeBond?.weaponEntityId,
        proficiencyBonus,
      )
    );

  const maxHP = input.base.baseMaxHP + sumContributors(hpContributors);
  const currentHP = Math.min(
    Math.max(input.hitPointState?.currentHP ?? maxHP, 0),
    maxHP,
  );
  const tempHP = Math.max(input.hitPointState?.tempHP ?? 0, 0);

  return {
    name: input.base.name,
    level,
    proficiencyBonus,
    proficiencyBonusExplanation: createExplanation(
      `Level ${level}`,
      baseProficiencyBonus,
      proficiencyBonusModifiers,
    ),
    progressionMode: input.base.progressionMode,
    abilityScores: input.base.abilityScores,
    maxHP,
    currentHP,
    tempHP,
    maxHPExplanation: createExplanation("Base HP", input.base.baseMaxHP, hpContributors),
    armorClass: buildArmorClass(input, effects),
    acBreakdown: buildACBreakdown(input, effects),
    attackProfiles,
    initiative: createExplanation("Dexterity", dexterityModifier, initiativeContributors),
    speed:
      input.base.baseSpeed +
      sumContributors(speedContributors) +
      speedBonuses.reduce((sum, value) => sum + value, 0),
    passivePerception: buildPassivePerception(
      input.base.basePassivePerception,
      input.base.abilityScores,
      proficiencyBonus,
      proficiencies,
      effects,
    ),
    spellcasting: buildSpellcastingState(input, effects, proficiencyBonus),
    actions: effects.flatMap((entry) =>
      entry.effect.type === "grant-action"
        ? [{
            ...entry.effect.action,
            sourceName: entry.sourceName,
          }]
        : []
    ),
    resources: buildResources(
      effects,
      input.base.abilityScores,
      proficiencyBonus,
      input.resourcePoolState,
    ),
    traits: buildTraits(effectiveSources, effects),
    senses: buildSenses(effects),
    notes: buildNotes(effectiveSources, effects),
    proficiencies,
    skillState: buildSkillState(input.base.abilityScores, proficiencyBonus, effects),
    resistances: effects.flatMap((entry) =>
      entry.effect.type === "resistance"
        ? [{
            damageType: entry.effect.damageType,
            condition: entry.effect.condition,
          }]
        : []
    ),
    immunities: uniqueSorted(
      effects.flatMap((entry) =>
        entry.effect.type === "immunity" ? [entry.effect.damageType] : []
      ),
    ),
    extraAttackCount: effects.reduce((maxCount, entry) => {
      if (entry.effect.type !== "extra-attack") {
        return maxCount;
      }

      return Math.max(maxCount, entry.effect.count);
    }, 0),
    conditions: {
      active: input.activeConditions ?? [],
      effects: computeConditionEffects(input.activeConditions ?? []),
    },
    sources: effectiveSources,
    xp: buildXpSummary(input.xpLedger),
  };
}
