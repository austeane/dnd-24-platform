import type {
  AbilityName,
  CharacterComputationInput,
  ModifierExplanation,
} from "../types/character.ts";
import type { Effect } from "../types/effect.ts";
import { getAbilityModifier } from "./math.ts";
import {
  createExplanation,
  getNumericModifierContributors,
  type EffectEnvelope,
} from "./shared.ts";

export function buildArmorClass(
  input: CharacterComputationInput,
  effects: EffectEnvelope[],
): ModifierExplanation {
  const acContributors = getNumericModifierContributors(effects, "ac");
  const baseAc = createExplanation("Base AC", input.base.baseArmorClass, acContributors);

  const formulaCandidates = effects.filter(
    (entry): entry is EffectEnvelope & { effect: Extract<Effect, { type: "set-ac-formula" }> } =>
      entry.effect.type === "set-ac-formula",
  );

  const candidateExplanations = formulaCandidates.map((entry) => {
    const abilityContributors = entry.effect.formula.abilityModifiers.map((ability) => ({
      sourceName: `${entry.sourceName} (${ability})`,
      value: getAbilityModifier(input.base.abilityScores[ability as AbilityName]),
      condition: undefined,
    }));
    const explanation = createExplanation(
      `${entry.sourceName} AC formula`,
      entry.effect.formula.base,
      [...abilityContributors, ...acContributors],
    );

    if (entry.effect.formula.maxAC !== undefined && explanation.total > entry.effect.formula.maxAC) {
      return {
        total: entry.effect.formula.maxAC,
        contributors: [
          ...explanation.contributors,
          {
            sourceName: `${entry.sourceName} AC cap`,
            value: entry.effect.formula.maxAC - explanation.total,
            condition: undefined,
          },
        ],
      } satisfies ModifierExplanation;
    }

    return explanation;
  });

  return candidateExplanations.reduce(
    (best, candidate) => (candidate.total > best.total ? candidate : best),
    baseAc,
  );
}
