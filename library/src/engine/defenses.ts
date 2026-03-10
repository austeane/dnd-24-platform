import type {
  AbilityName,
  ACBreakdown,
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
  return buildACBreakdown(input, effects).explanation;
}

export function buildACBreakdown(
  input: CharacterComputationInput,
  effects: EffectEnvelope[],
): ACBreakdown {
  const acContributors = getNumericModifierContributors(effects, "ac");

  const shieldContributors = acContributors.filter(
    (c) => c.sourceName.toLowerCase().includes("shield"),
  );
  const otherContributors = acContributors.filter(
    (c) => !c.sourceName.toLowerCase().includes("shield"),
  );

  const shieldBonus = shieldContributors.reduce((sum, c) => sum + c.value, 0) || undefined;
  const acModTotal = acContributors.reduce((sum, c) => sum + c.value, 0);

  const baseAc = createExplanation("Base AC", input.base.baseArmorClass, acContributors);

  const formulaCandidates = effects.filter(
    (entry): entry is EffectEnvelope & { effect: Extract<Effect, { type: "set-ac-formula" }> } =>
      entry.effect.type === "set-ac-formula",
  );

  if (formulaCandidates.length === 0) {
    return {
      explanation: baseAc,
      base: input.base.baseArmorClass,
      armorName: undefined,
      armorBase: undefined,
      shieldBonus,
      dexBonus: undefined,
      dexCap: undefined,
      otherBonuses: otherContributors.map((c) => ({
        sourceName: c.sourceName,
        value: c.value,
      })),
    };
  }

  interface FormulaCandidate {
    entry: EffectEnvelope & { effect: Extract<Effect, { type: "set-ac-formula" }> };
    explanation: ModifierExplanation;
    dexBonus: number | undefined;
    dexCap: number | undefined;
  }

  const candidates: FormulaCandidate[] = formulaCandidates.map((entry) => {
    const formula = entry.effect.formula;
    const abilityContributors = formula.abilityModifiers.map((ability) => ({
      sourceName: `${entry.sourceName} (${ability})`,
      value: getAbilityModifier(input.base.abilityScores[ability as AbilityName]),
      condition: undefined,
    }));

    // Compute formula-only total (base + ability mods), before external modifiers
    const formulaOnlyTotal = formula.base + abilityContributors.reduce((s, c) => s + c.value, 0);

    const rawDex = formula.abilityModifiers.includes("dexterity")
      ? getAbilityModifier(input.base.abilityScores.dexterity)
      : undefined;

    let dexBonus = rawDex;
    let dexCap: number | undefined;

    // maxAC caps the formula itself (base + ability mods), not external modifiers
    if (formula.maxAC !== undefined && formulaOnlyTotal > formula.maxAC) {
      const cappedFormulaTotal = formula.maxAC;
      const totalWithModifiers = cappedFormulaTotal + acModTotal;

      if (rawDex !== undefined) {
        const maxDexBonus = formula.maxAC - formula.base;
        dexBonus = Math.min(rawDex, Math.max(0, maxDexBonus));
        dexCap = maxDexBonus;
      }

      return {
        entry,
        explanation: {
          total: totalWithModifiers,
          contributors: [
            { sourceName: `${entry.sourceName} AC formula`, value: formula.base, condition: undefined },
            ...abilityContributors,
            { sourceName: `${entry.sourceName} AC cap`, value: cappedFormulaTotal - formulaOnlyTotal, condition: undefined },
            ...acContributors,
          ],
        },
        dexBonus,
        dexCap,
      };
    }

    // No cap needed: formula total + external modifiers
    const explanation = createExplanation(
      `${entry.sourceName} AC formula`,
      formula.base,
      [...abilityContributors, ...acContributors],
    );

    return { entry, explanation, dexBonus, dexCap };
  });

  const best = candidates.reduce(
    (bestSoFar, candidate) =>
      candidate.explanation.total > bestSoFar.explanation.total ? candidate : bestSoFar,
  );

  if (best.explanation.total < baseAc.total) {
    return {
      explanation: baseAc,
      base: input.base.baseArmorClass,
      armorName: undefined,
      armorBase: undefined,
      shieldBonus,
      dexBonus: undefined,
      dexCap: undefined,
      otherBonuses: otherContributors.map((c) => ({
        sourceName: c.sourceName,
        value: c.value,
      })),
    };
  }

  return {
    explanation: best.explanation,
    base: best.entry.effect.formula.base,
    armorName: best.entry.sourceName,
    armorBase: best.entry.effect.formula.base,
    shieldBonus,
    dexBonus: best.dexBonus,
    dexCap: best.dexCap,
    otherBonuses: otherContributors.map((c) => ({
      sourceName: c.sourceName,
      value: c.value,
    })),
  };
}
