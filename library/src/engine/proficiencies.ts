import type {
  AbilityScoreSet,
  CharacterProficiencySet,
  ModifierExplanation,
} from "../types/character.ts";
import type { ProficiencyCategory } from "../types/effect.ts";
import { getAbilityModifier } from "./math.ts";
import {
  createExplanation,
  getNumericModifierContributors,
  type EffectEnvelope,
  uniqueSorted,
} from "./shared.ts";

export function buildProficiencies(effects: EffectEnvelope[]): CharacterProficiencySet {
  const buckets: Record<ProficiencyCategory, Set<string>> = {
    "saving-throw": new Set<string>(),
    skill: new Set<string>(),
    weapon: new Set<string>(),
    armor: new Set<string>(),
    tool: new Set<string>(),
    language: new Set<string>(),
  };

  for (const entry of effects) {
    if (entry.effect.type !== "proficiency") {
      continue;
    }

    buckets[entry.effect.category].add(entry.effect.value);
  }

  return {
    savingThrows: uniqueSorted(buckets["saving-throw"]),
    skills: uniqueSorted(buckets.skill),
    weapons: uniqueSorted(buckets.weapon),
    armors: uniqueSorted(buckets.armor),
    tools: uniqueSorted(buckets.tool),
    languages: uniqueSorted(buckets.language),
  };
}

export function buildPassivePerception(
  basePassivePerception: number | undefined,
  abilityScores: AbilityScoreSet,
  proficiencyBonus: number,
  proficiencies: CharacterProficiencySet,
  effects: EffectEnvelope[],
): ModifierExplanation {
  const wisdomModifier = getAbilityModifier(abilityScores.wisdom);
  const hasPerception = proficiencies.skills.some((skill) => skill.toLowerCase() === "perception");
  const hasExpertise = effects.some(
    (entry) =>
      entry.effect.type === "expertise" &&
      entry.effect.skill.toLowerCase() === "perception",
  );
  const base = basePassivePerception ??
    (10 +
      wisdomModifier +
      (hasPerception ? proficiencyBonus : 0) +
      (hasExpertise ? proficiencyBonus : 0));

  return createExplanation(
    "Passive Perception",
    base,
    getNumericModifierContributors(effects, "passive-perception"),
  );
}
