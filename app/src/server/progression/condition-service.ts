/**
 * Condition apply/remove/override operations with mechanical effect resolution.
 *
 * This file wraps condition-state.ts with higher-level orchestration:
 * - Mechanical effect computation via the engine
 * - DM condition management workflows
 * - Condition immunity checking (stub for future expansion)
 */

import {
  computeConditionEffects,
  type ActiveCondition,
} from "@dnd/library";
import {
  applyCondition,
  listActiveConditions,
  overrideCondition,
  removeCondition,
} from "./condition-state.ts";
import type {
  ApplyConditionInput,
  CharacterConditionRecord,
  OverrideConditionInput,
  RemoveConditionInput,
} from "./types.ts";

function recordToActiveCondition(
  record: CharacterConditionRecord,
): ActiveCondition {
  return {
    conditionName: record.conditionName,
    appliedAt: record.appliedAt.toISOString(),
    appliedByLabel: record.appliedByLabel,
    sourceCreature: record.sourceCreature ?? undefined,
    note: record.note ?? undefined,
  };
}

function effectDescriptions(effects: ReturnType<typeof computeConditionEffects>): string[] {
  return effects.map((e) => e.description);
}

export async function clearActiveConditionsByName(input: {
  characterId: string;
  conditionName: ApplyConditionInput["conditionName"];
  removedByLabel: string;
  note?: string | null;
  sessionId?: string | null;
}): Promise<CharacterConditionRecord[]> {
  const activeConditions = await listActiveConditions(input.characterId);
  const matchingConditions = activeConditions.filter((condition) =>
    condition.conditionName === input.conditionName
  );

  const removedConditions: CharacterConditionRecord[] = [];
  for (const condition of matchingConditions) {
    removedConditions.push(
      await removeCondition({
        conditionId: condition.id,
        removedByLabel: input.removedByLabel,
        note: input.note,
        sessionId: input.sessionId,
      }),
    );
  }

  return removedConditions;
}

/**
 * Apply a condition with full mechanical effect resolution.
 * Persists the condition and returns the computed mechanical effects.
 */
export async function applyConditionWithEffects(
  input: ApplyConditionInput,
): Promise<{
  condition: CharacterConditionRecord;
  mechanicalEffects: string[];
}> {
  if (input.conditionName === "concentration") {
    await clearActiveConditionsByName({
      characterId: input.characterId,
      conditionName: "concentration",
      removedByLabel: input.appliedByLabel,
      note: "Previous concentration ended.",
      sessionId: input.sessionId,
    });
  }

  if (input.conditionName === "incapacitated") {
    await clearActiveConditionsByName({
      characterId: input.characterId,
      conditionName: "concentration",
      removedByLabel: input.appliedByLabel,
      note: "Concentration ended after becoming incapacitated.",
      sessionId: input.sessionId,
    });
  }

  const condition = await applyCondition(input);
  const activeCondition = recordToActiveCondition(condition);
  const effects = computeConditionEffects([activeCondition]);

  return {
    condition,
    mechanicalEffects: effectDescriptions(effects),
  };
}

/**
 * Remove a condition and report which mechanical effects were removed.
 */
export async function removeConditionWithEffects(
  input: RemoveConditionInput,
): Promise<{
  condition: CharacterConditionRecord;
  effectsRemoved: string[];
}> {
  const condition = await removeCondition(input);
  const activeCondition = recordToActiveCondition(condition);
  const effects = computeConditionEffects([activeCondition]);

  return {
    condition,
    effectsRemoved: effectDescriptions(effects),
  };
}

/**
 * DM override with full audit trail and effect recalculation.
 * Removes the existing condition, optionally applies a replacement,
 * and reports effects removed and applied.
 */
export async function overrideConditionWithEffects(
  input: OverrideConditionInput,
): Promise<{
  removed: CharacterConditionRecord;
  replacement: CharacterConditionRecord | null;
  effectsRemoved: string[];
  effectsApplied: string[];
}> {
  const { removed, replacement } = await overrideCondition(input);

  const removedActiveCondition = recordToActiveCondition(removed);
  const removedEffects = computeConditionEffects([removedActiveCondition]);

  let appliedEffects: ReturnType<typeof computeConditionEffects> = [];
  if (replacement) {
    const replacementActiveCondition = recordToActiveCondition(replacement);
    appliedEffects = computeConditionEffects([replacementActiveCondition]);
  }

  return {
    removed,
    replacement,
    effectsRemoved: effectDescriptions(removedEffects),
    effectsApplied: effectDescriptions(appliedEffects),
  };
}

/**
 * Get all active conditions with their computed mechanical effects.
 * Useful for runtime character state projection.
 */
export async function getActiveConditionsWithEffects(
  characterId: string,
): Promise<
  Array<{
    condition: CharacterConditionRecord;
    mechanicalEffects: string[];
  }>
> {
  const records = await listActiveConditions(characterId);

  return records.map((record) => {
    const activeCondition = recordToActiveCondition(record);
    const effects = computeConditionEffects([activeCondition]);
    return {
      condition: record,
      mechanicalEffects: effectDescriptions(effects),
    };
  });
}

/**
 * Check whether a character is immune to a specific condition.
 * Reads from species traits, class features, and active effects.
 *
 * Note: Currently returns { immune: false } as condition immunity
 * requires full species/feat trait resolution. The Fey Ancestry
 * trait (charmed advantage) is tracked in the engine as a separate
 * mechanic and does not grant full immunity.
 */
export async function checkConditionImmunity(
  _characterId: string,
  _conditionName: string,
): Promise<{ immune: boolean; source?: string }> {
  // Condition immunities require full trait resolution which is tracked
  // separately in the species mechanics. The charmed advantage from
  // Fey Ancestry is not full immunity — it grants advantage on saves.
  return { immune: false };
}
