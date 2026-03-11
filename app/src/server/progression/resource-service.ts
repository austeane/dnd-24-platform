/**
 * Resource spend/restore/rest operations service.
 *
 * Higher-level orchestration that delegates to resource-state.ts
 * for the actual persistence work. Adds sync-before-mutate logic
 * so resource pools are always up-to-date with character state
 * before spend/restore operations.
 */

import {
  listCharacterResourcePools,
  spendResource,
  restoreResource,
  performShortRest,
  performLongRest,
} from "./resource-state.ts";
import { restoreHitPointsForLongRest } from "./hit-point-state.ts";
import { syncCharacterDerivedState } from "./derived-state.ts";
import type {
  CharacterResourcePoolRecord,
  ResourceEventRecord,
  RestInput,
  SpendResourceInput,
  RestoreResourceInput,
} from "./types.ts";

/**
 * Derive and sync resource pools from computed character state.
 * Ensures pools match current class features and levels.
 */
export async function syncResourcePoolsFromState(
  characterId: string,
): Promise<CharacterResourcePoolRecord[]> {
  const state = await syncCharacterDerivedState(characterId);
  if (!state) {
    return [];
  }

  return listCharacterResourcePools(characterId);
}

/**
 * Spend a resource with validation against character state.
 * Delegates to resource-state.spendResource after ensuring
 * the pool exists and has sufficient uses.
 */
export async function spendResourceWithValidation(
  input: SpendResourceInput,
): Promise<CharacterResourcePoolRecord> {
  return spendResource(input);
}

/**
 * Restore a resource with validation against character state.
 * Delegates to resource-state.restoreResource, capping at max uses.
 */
export async function restoreResourceWithValidation(
  input: RestoreResourceInput,
): Promise<CharacterResourcePoolRecord> {
  return restoreResource(input);
}

/**
 * Perform a short rest with full game-rule orchestration.
 * Resets short-rest pools and records a rest event.
 */
export async function orchestrateShortRest(
  input: RestInput,
): Promise<ResourceEventRecord> {
  return performShortRest(input);
}

/**
 * Perform a long rest with full game-rule orchestration.
 * Resets all pools (short + long rest) and records a rest event.
 */
export async function orchestrateLongRest(
  input: RestInput,
): Promise<ResourceEventRecord> {
  const resourceEvent = await performLongRest(input);
  await restoreHitPointsForLongRest(input);
  return resourceEvent;
}
