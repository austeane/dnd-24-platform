import type {
  AbilityScoreSet,
  EvaluatedResource,
  EvaluatedSense,
  EvaluatedTrait,
  ResourcePoolDefinition,
} from "../types/character.ts";
import type {
  EffectAbilityName,
  RestType,
  SourceWithEffects,
} from "../types/effect.ts";
import { getAbilityModifier } from "./math.ts";
import { type EffectEnvelope, uniqueSorted } from "./shared.ts";

function getEffectAbilityModifier(
  abilityScores: AbilityScoreSet,
  ability: EffectAbilityName,
): number {
  return getAbilityModifier(abilityScores[ability]);
}

export function buildResources(
  effects: EffectEnvelope[],
  abilityScores: AbilityScoreSet,
  proficiencyBonus: number,
): EvaluatedResource[] {
  return effects.flatMap((entry) => {
    if (entry.effect.type === "grant-resource") {
      return [{
        ...entry.effect.resource,
        sourceName: entry.sourceName,
      }];
    }

    if (entry.effect.type === "grant-scaling-resource") {
      const { resource } = entry.effect;
      const resolvedUses = resource.mode === "proficiency-bonus"
        ? resource.baseUses + proficiencyBonus + (resource.bonus ?? 0)
        : resource.baseUses +
          getEffectAbilityModifier(abilityScores, resource.ability ?? "charisma") +
          (resource.bonus ?? 0);
      return [{
        name: resource.name,
        maxUses: Math.max(
          resolvedUses,
          resource.minimum,
        ),
        resetOn: resource.resetOn,
        sourceName: entry.sourceName,
      }];
    }

    return [];
  });
}

export function buildTraits(
  sources: SourceWithEffects[],
  effects: EffectEnvelope[],
): EvaluatedTrait[] {
  const directTraits = effects.flatMap((entry) => {
    if (entry.effect.type === "grant-trait") {
      return [{
        ...entry.effect.trait,
        sourceName: entry.sourceName,
      } satisfies EvaluatedTrait];
    }

    if (entry.effect.type === "unmodeled") {
      return [{
        name: entry.sourceName,
        description: entry.effect.description,
        tags: ["unmodeled"],
        sourceName: entry.sourceName,
      } satisfies EvaluatedTrait];
    }

    return [];
  });

  const fallbackTraits = sources.flatMap(({ source, effects: sourceEffects }) => {
    if (!source.description || sourceEffects.some((effect) => effect.type === "grant-trait")) {
      return [];
    }

    return [{
      name: source.name,
      description: source.description,
      sourceName: source.name,
    } satisfies EvaluatedTrait];
  });

  return [...directTraits, ...fallbackTraits].sort((left, right) =>
    left.name.localeCompare(right.name) || left.sourceName.localeCompare(right.sourceName)
  );
}

export function buildSenses(effects: EffectEnvelope[]): EvaluatedSense[] {
  return effects
    .flatMap((entry) =>
      entry.effect.type === "grant-sense"
        ? [{
            ...entry.effect.sense,
            sourceName: entry.sourceName,
          } satisfies EvaluatedSense]
        : []
    )
    .sort((left, right) =>
      left.sense.localeCompare(right.sense) ||
      left.range - right.range ||
      left.sourceName.localeCompare(right.sourceName)
    );
}

export function buildNotes(sources: SourceWithEffects[], effects: EffectEnvelope[]): string[] {
  const notes = [
    ...effects.flatMap((entry) =>
      entry.effect.type === "unmodeled" ? [`${entry.sourceName}: ${entry.effect.description}`] : []
    ),
    ...sources.flatMap(({ source }) =>
      source.description ? [`${source.name}: ${source.description}`] : []
    ),
  ];

  return uniqueSorted(notes);
}

/**
 * Builds pool definitions for all resources a character possesses.
 * These are the "truth" definitions derived from sources/effects that can
 * be used to initialize or sync persistent resource pool state.
 */
export function buildResourcePoolDefinitions(
  effects: EffectEnvelope[],
  abilityScores: AbilityScoreSet,
  proficiencyBonus: number,
): ResourcePoolDefinition[] {
  const pools: ResourcePoolDefinition[] = [];

  for (const entry of effects) {
    if (entry.effect.type === "grant-resource") {
      pools.push({
        resourceName: entry.effect.resource.name,
        maxUses: entry.effect.resource.maxUses,
        resetOn: entry.effect.resource.resetOn,
        sourceName: entry.sourceName,
      });
    }

    if (entry.effect.type === "grant-scaling-resource") {
      const { resource } = entry.effect;
      const resolvedUses = resource.mode === "proficiency-bonus"
        ? resource.baseUses + proficiencyBonus + (resource.bonus ?? 0)
        : resource.baseUses +
          getEffectAbilityModifier(abilityScores, resource.ability ?? "charisma") +
          (resource.bonus ?? 0);
      pools.push({
        resourceName: resource.name,
        maxUses: Math.max(resolvedUses, resource.minimum),
        resetOn: resource.resetOn,
        sourceName: entry.sourceName,
      });
    }
  }

  return pools;
}

/**
 * Returns the names of all resource pools that reset on the given rest type.
 * Long rest resets both short-rest and long-rest pools.
 */
export function getPoolsForRestType(
  pools: ResourcePoolDefinition[],
  restType: RestType,
): ResourcePoolDefinition[] {
  if (restType === "long") {
    return pools;
  }

  return pools.filter((pool) => pool.resetOn === "short");
}
