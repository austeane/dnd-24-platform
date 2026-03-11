/**
 * Rest reset engine service.
 *
 * Handles orchestration of rest flows including resource pool resets
 * and event recording. Delegates to resource-state.ts for the actual
 * reset logic and wraps it with rest-flow metadata.
 */

import {
  listCharacterResourcePools,
  performShortRest,
  performLongRest,
} from "./resource-state.ts";
import { restoreHitPointsForLongRest } from "./hit-point-state.ts";
import { clearActiveConditionsByName } from "./condition-service.ts";
import type {
  ResourceEventRecord,
  RestInput,
} from "./types.ts";

/**
 * Execute a full short rest flow.
 * Resets short-rest resource pools and records a rest event.
 */
export async function executeShortRest(
  input: RestInput,
): Promise<{
  resourceEvent: ResourceEventRecord;
  hitDiceSpent: number;
  additionalEffects: string[];
}> {
  const resourceEvent = await performShortRest(input);

  return {
    resourceEvent,
    hitDiceSpent: 0, // TODO: hit dice spending during short rests
    additionalEffects: [],
  };
}

/**
 * Execute a full long rest flow.
 * Resets all resource pools and records a rest event.
 */
export async function executeLongRest(
  input: RestInput,
): Promise<{
  resourceEvent: ResourceEventRecord;
  hitDiceRecovered: number;
  conditionsCleared: string[];
  additionalEffects: string[];
}> {
  const resourceEvent = await performLongRest(input);
  await restoreHitPointsForLongRest(input);
  const clearedConcentration = await clearActiveConditionsByName({
    characterId: input.characterId,
    conditionName: "concentration",
    removedByLabel: input.createdByLabel,
    note: "Concentration ended during a long rest.",
    sessionId: input.sessionId,
  });

  return {
    resourceEvent,
    hitDiceRecovered: 0, // TODO: hit dice recovery during long rests
    conditionsCleared: clearedConcentration.length > 0 ? ["concentration"] : [],
    additionalEffects: [],
  };
}

/**
 * Calculate which resource pools would reset on a given rest type.
 * Preview function for UI display before confirming rest.
 */
export async function previewRestReset(
  characterId: string,
  restType: "short" | "long",
): Promise<
  Array<{
    resourceName: string;
    currentUses: number;
    maxUses: number;
    wouldReset: boolean;
  }>
> {
  const pools = await listCharacterResourcePools(characterId);

  const eligiblePools = restType === "long"
    ? pools
    : pools.filter((pool) => pool.resetOn === "short");

  return eligiblePools.map((pool) => ({
    resourceName: pool.resourceName,
    currentUses: pool.currentUses,
    maxUses: pool.maxUses,
    wouldReset: pool.currentUses < pool.maxUses,
  }));
}
