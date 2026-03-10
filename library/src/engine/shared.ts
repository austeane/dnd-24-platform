import type { ModifierExplanation } from "../types/character.ts";
import type { Effect, SourceWithEffects } from "../types/effect.ts";

export interface EffectEnvelope {
  sourceName: string;
  sourceDescription: string | undefined;
  effect: Effect;
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function createExplanation(
  baseLabel: string,
  baseValue: number,
  contributors: Array<{
    sourceName: string;
    value: number;
    condition: string | undefined;
  }>,
): ModifierExplanation {
  return {
    total: baseValue + contributors.reduce((sum, contributor) => sum + contributor.value, 0),
    contributors: [
      {
        sourceName: baseLabel,
        value: baseValue,
        condition: undefined,
      },
      ...contributors,
    ],
  };
}

export function flattenEffects(sources: SourceWithEffects[]): EffectEnvelope[] {
  return sources.flatMap(({ source, effects }) =>
    effects.map((effect) => ({
      sourceName: source.name,
      sourceDescription: source.description,
      effect,
    }))
  );
}

export function getNumericModifierContributors(
  effects: EffectEnvelope[],
  target: Extract<Effect, { type: "modifier" }>["target"],
): ModifierExplanation["contributors"] {
  return effects
    .filter((entry): entry is EffectEnvelope & { effect: Extract<Effect, { type: "modifier" }> } =>
      entry.effect.type === "modifier" && entry.effect.target === target
    )
    .map((entry) => ({
      sourceName: entry.sourceName,
      value: entry.effect.value,
      condition: entry.effect.condition,
    }));
}

export function sumContributors(contributors: ModifierExplanation["contributors"]): number {
  return contributors.reduce((sum, contributor) => sum + contributor.value, 0);
}
