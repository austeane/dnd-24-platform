import type {
  ActiveCondition,
  ConditionMechanicalEffect,
  ConditionName,
} from "../types/character.ts";

/** All condition names recognized by the engine */
export const ALL_CONDITION_NAMES: readonly ConditionName[] = [
  "charmed",
  "incapacitated",
] as const;

/**
 * Compute the mechanical effects of a set of active conditions.
 * Pure function: conditions in, effects out.
 */
export function computeConditionEffects(
  conditions: ActiveCondition[],
): ConditionMechanicalEffect[] {
  const effects: ConditionMechanicalEffect[] = [];

  for (const condition of conditions) {
    effects.push(...getEffectsForCondition(condition));
  }

  return effects;
}

function getEffectsForCondition(
  condition: ActiveCondition,
): ConditionMechanicalEffect[] {
  switch (condition.conditionName) {
    case "charmed":
      return computeCharmedEffects(condition);
    case "incapacitated":
      return computeIncapacitatedEffects();
  }
}

function computeCharmedEffects(
  condition: ActiveCondition,
): ConditionMechanicalEffect[] {
  const charmer = condition.sourceCreature ?? "the charmer";

  return [
    {
      conditionName: "charmed",
      description: `Can't attack ${charmer} or target ${charmer} with harmful abilities or magical effects.`,
      tags: ["attack-restriction", "targeting-restriction"],
    },
    {
      conditionName: "charmed",
      description: `${charmer} has advantage on ability checks to interact socially with you.`,
      tags: ["disadvantage-ability-check", "social"],
    },
  ];
}

function computeIncapacitatedEffects(): ConditionMechanicalEffect[] {
  return [
    {
      conditionName: "incapacitated",
      description: "Can't take actions, bonus actions, or reactions.",
      tags: ["action-restriction", "bonus-action-restriction", "reaction-restriction"],
    },
    {
      conditionName: "incapacitated",
      description: "Concentration is broken.",
      tags: ["concentration-broken"],
    },
  ];
}

/**
 * Check whether a character with these active conditions can take actions.
 */
export function canTakeActions(conditions: ActiveCondition[]): boolean {
  return !conditions.some((c) => c.conditionName === "incapacitated");
}

/**
 * Check whether a character with these active conditions can take reactions.
 */
export function canTakeReactions(conditions: ActiveCondition[]): boolean {
  return !conditions.some((c) => c.conditionName === "incapacitated");
}

/**
 * Check whether a character with these active conditions can attack a target.
 * Returns false if the character is charmed by the target.
 */
export function canAttackTarget(
  conditions: ActiveCondition[],
  targetName: string,
): boolean {
  return !conditions.some(
    (c) =>
      c.conditionName === "charmed" &&
      c.sourceCreature !== undefined &&
      c.sourceCreature === targetName,
  );
}

/**
 * Get all condition-based tags active on a character.
 * Useful for filtering actions, determining disadvantage, etc.
 */
export function getActiveConditionTags(conditions: ActiveCondition[]): string[] {
  const effects = computeConditionEffects(conditions);
  return [...new Set(effects.flatMap((e) => e.tags))].sort();
}
