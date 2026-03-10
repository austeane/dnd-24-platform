/**
 * Rest reset engine service stub.
 *
 * This file is owned by the `resource-spend-and-rest-engine` batch.
 * Handles the orchestration of rest flows including resource pool resets,
 * condition clearance, hit dice recovery, and rest-triggered effects.
 *
 * TODO: Implement full rest orchestration with cross-domain coordination.
 * TODO: Implement hit dice spending during short rests.
 * TODO: Implement hit dice recovery during long rests.
 */

import type {
  ResourceEventRecord,
  RestInput,
} from "./types.ts";

/**
 * Execute a full short rest flow.
 * Resets short-rest resource pools, offers hit dice spending,
 * and applies rest-triggered effects from features/feats.
 *
 * TODO: Implement — coordinate resource-state.performShortRest with
 * hit dice spending and feat-triggered rest effects (e.g. Musician).
 */
export async function executeShortRest(
  _input: RestInput,
): Promise<{
  resourceEvent: ResourceEventRecord;
  hitDiceSpent: number;
  additionalEffects: string[];
}> {
  // TODO: Implement in resource-spend-and-rest-engine batch
  throw new Error("Not implemented: executeShortRest");
}

/**
 * Execute a full long rest flow.
 * Resets all resource pools, recovers hit dice, clears eligible conditions,
 * and applies rest-triggered effects.
 *
 * TODO: Implement — coordinate resource-state.performLongRest with
 * hit dice recovery (half max, minimum 1) and condition clearance.
 */
export async function executeLongRest(
  _input: RestInput,
): Promise<{
  resourceEvent: ResourceEventRecord;
  hitDiceRecovered: number;
  conditionsCleared: string[];
  additionalEffects: string[];
}> {
  // TODO: Implement in resource-spend-and-rest-engine batch
  throw new Error("Not implemented: executeLongRest");
}

/**
 * Calculate which resource pools would reset on a given rest type.
 * Preview function for UI display before confirming rest.
 *
 * TODO: Implement — read character resource pools and filter by resetOn,
 * compute which would change (current < max).
 */
export async function previewRestReset(
  _characterId: string,
  _restType: "short" | "long",
): Promise<
  Array<{
    resourceName: string;
    currentUses: number;
    maxUses: number;
    wouldReset: boolean;
  }>
> {
  // TODO: Implement in resource-spend-and-rest-engine batch
  throw new Error("Not implemented: previewRestReset");
}
