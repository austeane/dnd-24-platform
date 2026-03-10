import type {
  AbilityScoreSet,
  CharacterProficiencySet,
  ComputedSkill,
  ComputedSkillState,
  ModifierExplanation,
  SkillAbilityName,
} from "../types/character.ts";
import type { ProficiencyCategory } from "../types/effect.ts";
import { getAbilityModifier } from "./math.ts";
import {
  createExplanation,
  getNumericModifierContributors,
  type EffectEnvelope,
  uniqueSorted,
} from "./shared.ts";

/**
 * Canonical mapping of D&D 5e (2024) skill names to their governing ability.
 */
export const SKILL_ABILITY_MAP: ReadonlyMap<string, SkillAbilityName> = new Map([
  ["Acrobatics", "dexterity"],
  ["Animal Handling", "wisdom"],
  ["Arcana", "intelligence"],
  ["Athletics", "strength"],
  ["Deception", "charisma"],
  ["History", "intelligence"],
  ["Insight", "wisdom"],
  ["Intimidation", "charisma"],
  ["Investigation", "intelligence"],
  ["Medicine", "wisdom"],
  ["Nature", "intelligence"],
  ["Perception", "wisdom"],
  ["Performance", "charisma"],
  ["Persuasion", "charisma"],
  ["Religion", "intelligence"],
  ["Sleight of Hand", "dexterity"],
  ["Stealth", "dexterity"],
  ["Survival", "wisdom"],
]);

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

/**
 * Compute the full skill state for a character from effects.
 *
 * For each of the 18 D&D skills, derives:
 *  - ability modifier from the governing ability
 *  - proficiency (from proficiency effects with category "skill")
 *  - expertise (from expertise effects, doubles proficiency bonus)
 *  - total bonus = ability modifier + (proficient ? proficiency bonus : 0) + (expertise ? proficiency bonus : 0)
 *  - source citations for every grant
 *
 * Also derives passive Perception = 10 + Perception bonus + any passive-perception modifiers.
 */
export function buildSkillState(
  abilityScores: AbilityScoreSet,
  proficiencyBonus: number,
  effects: EffectEnvelope[],
): ComputedSkillState {
  // Collect proficiency grants with their source names
  const profSources = new Map<string, string[]>();
  for (const entry of effects) {
    if (entry.effect.type === "proficiency" && entry.effect.category === "skill") {
      const skillName = entry.effect.value;
      const existing = profSources.get(skillName);
      if (existing) {
        existing.push(entry.sourceName);
      } else {
        profSources.set(skillName, [entry.sourceName]);
      }
    }
  }

  // Collect expertise grants with their source names
  const expertiseSources = new Map<string, string[]>();
  for (const entry of effects) {
    if (entry.effect.type === "expertise") {
      const skillName = entry.effect.skill;
      const existing = expertiseSources.get(skillName);
      if (existing) {
        existing.push(entry.sourceName);
      } else {
        expertiseSources.set(skillName, [entry.sourceName]);
      }
    }
  }

  const skills: ComputedSkill[] = [];

  for (const [skillName, ability] of SKILL_ABILITY_MAP) {
    const abilityMod = getAbilityModifier(abilityScores[ability]);
    const proficient = profSources.has(skillName);
    const expertise = expertiseSources.has(skillName);
    const profBonus = proficient ? proficiencyBonus : 0;
    const expertiseBonus = expertise ? proficiencyBonus : 0;
    const bonus = abilityMod + profBonus + expertiseBonus;

    const sources: string[] = [];
    if (proficient) {
      for (const src of profSources.get(skillName)!) {
        sources.push(src);
      }
    }
    if (expertise) {
      for (const src of expertiseSources.get(skillName)!) {
        sources.push(`${src} (expertise)`);
      }
    }

    skills.push({
      skillName,
      ability,
      abilityModifier: abilityMod,
      proficient,
      expertise,
      proficiencyBonus: profBonus + expertiseBonus,
      bonus,
      sources,
    });
  }

  // Derive passive perception from the computed Perception skill
  const perceptionSkill = skills.find((s) => s.skillName === "Perception")!;
  const passiveBase = 10 + perceptionSkill.bonus;
  const passiveModifiers = getNumericModifierContributors(effects, "passive-perception");

  const passivePerception = createExplanation(
    "Passive Perception",
    passiveBase,
    passiveModifiers,
  );

  return { skills, passivePerception };
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
