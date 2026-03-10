/**
 * Condition apply/remove/override operations service stub.
 *
 * This file is owned by the `condition-state-and-dm-overrides` batch.
 * The existing condition-state.ts contains the base CRUD operations;
 * this file will hold higher-level orchestration for condition state
 * management, including mechanical effect application and DM workflows.
 *
 * TODO: Implement condition mechanical effect resolution.
 * TODO: Implement condition interaction rules (e.g. stacking, immunity).
 * TODO: Implement DM condition management workflows.
 */

import type {
  ApplyConditionInput,
  CharacterConditionRecord,
  OverrideConditionInput,
  RemoveConditionInput,
} from "./types.ts";

/**
 * Apply a condition with full mechanical effect resolution.
 * Beyond persisting the condition, computes and applies the mechanical
 * effects (e.g. Charmed prevents attacking the charmer).
 *
 * TODO: Implement — validate condition can be applied (check immunities),
 * apply via condition-state.applyCondition, then resolve mechanical effects.
 */
export async function applyConditionWithEffects(
  _input: ApplyConditionInput,
): Promise<{
  condition: CharacterConditionRecord;
  mechanicalEffects: string[];
}> {
  // TODO: Implement in condition-state-and-dm-overrides batch
  throw new Error("Not implemented: applyConditionWithEffects");
}

/**
 * Remove a condition and clean up any mechanical effects it produced.
 *
 * TODO: Implement — remove via condition-state.removeCondition, then
 * recalculate character state without the condition's effects.
 */
export async function removeConditionWithEffects(
  _input: RemoveConditionInput,
): Promise<{
  condition: CharacterConditionRecord;
  effectsRemoved: string[];
}> {
  // TODO: Implement in condition-state-and-dm-overrides batch
  throw new Error("Not implemented: removeConditionWithEffects");
}

/**
 * DM override with full audit trail and effect recalculation.
 * Wraps condition-state.overrideCondition with effect cleanup/reapplication.
 *
 * TODO: Implement — call overrideCondition, recalculate effects for
 * both the removed and replacement conditions.
 */
export async function overrideConditionWithEffects(
  _input: OverrideConditionInput,
): Promise<{
  removed: CharacterConditionRecord;
  replacement: CharacterConditionRecord | null;
  effectsRemoved: string[];
  effectsApplied: string[];
}> {
  // TODO: Implement in condition-state-and-dm-overrides batch
  throw new Error("Not implemented: overrideConditionWithEffects");
}

/**
 * Get all active conditions with their computed mechanical effects.
 * Useful for runtime character state projection.
 *
 * TODO: Implement — list active conditions and resolve each condition's
 * mechanical effects from canonical condition definitions.
 */
export async function getActiveConditionsWithEffects(
  _characterId: string,
): Promise<
  Array<{
    condition: CharacterConditionRecord;
    mechanicalEffects: string[];
  }>
> {
  // TODO: Implement in condition-state-and-dm-overrides batch
  throw new Error("Not implemented: getActiveConditionsWithEffects");
}

/**
 * Check whether a character is immune to a specific condition.
 * Reads from species traits, class features, and active effects.
 *
 * TODO: Implement — read character sources for condition immunities
 * (e.g. Fey Ancestry for Charmed), return immunity status and source.
 */
export async function checkConditionImmunity(
  _characterId: string,
  _conditionName: string,
): Promise<{ immune: boolean; source?: string }> {
  // TODO: Implement in condition-state-and-dm-overrides batch
  throw new Error("Not implemented: checkConditionImmunity");
}
