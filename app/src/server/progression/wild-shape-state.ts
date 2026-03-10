/**
 * Server-side Wild Shape and Familiar state mutations.
 *
 * These functions orchestrate resource pool spending alongside
 * transform/familiar state changes. They depend on the resource-state
 * module for pool operations and the library engine for state computation.
 */

import {
  createIdleWildShapeState,
  revertFromBeast,
  transformIntoBeast,
  createEmptyFamiliarState,
  dismissFamiliar,
  handleFamiliarLongRest,
  removeFamiliar,
  resummonFamiliar,
  summonWildCompanionFamiliar,
} from "@dnd/library";
import type {
  BeastFormStats,
  WildShapeTransformState,
  FamiliarForm,
  FamiliarState,
} from "@dnd/library";
import { spendResource } from "./resource-state.ts";

// ---------------------------------------------------------------------------
// Wild Shape transform mutations
// ---------------------------------------------------------------------------

export interface WildShapeTransformInput {
  characterId: string;
  beastForm: BeastFormStats;
  druidLevel: number;
  sessionId?: string | null;
  createdByLabel: string;
}

export interface WildShapeTransformResult {
  transformState: WildShapeTransformState;
  resourcePoolAfterSpend: Awaited<ReturnType<typeof spendResource>>;
}

/**
 * Spend a Wild Shape use and enter beast form.
 * Spends from the "Wild Shape" resource pool, then computes transform state.
 */
export async function performWildShapeTransform(
  input: WildShapeTransformInput,
): Promise<WildShapeTransformResult> {
  const resourcePoolAfterSpend = await spendResource({
    characterId: input.characterId,
    resourceName: "Wild Shape",
    amount: 1,
    sessionId: input.sessionId,
    note: `Wild Shape: transformed into ${input.beastForm.name}`,
    createdByLabel: input.createdByLabel,
  });

  const transformState = transformIntoBeast(
    input.beastForm,
    input.druidLevel,
  );

  return { transformState, resourcePoolAfterSpend };
}

export interface WildShapeRevertInput {
  currentState: WildShapeTransformState;
  damageTaken?: number;
}

export interface WildShapeRevertResult {
  transformState: WildShapeTransformState;
  excessDamage: number;
}

/**
 * Revert from beast form. No resource spend needed.
 * Returns the new idle state and any excess damage to apply to normal form HP.
 */
export function performWildShapeRevert(
  input: WildShapeRevertInput,
): WildShapeRevertResult {
  const { newState, excessDamage } = revertFromBeast(
    input.currentState,
    input.damageTaken,
  );

  return { transformState: newState, excessDamage };
}

// ---------------------------------------------------------------------------
// Wild Companion familiar mutations
// ---------------------------------------------------------------------------

export interface WildCompanionSummonInput {
  characterId: string;
  familiarForm: FamiliarForm;
  sessionId?: string | null;
  createdByLabel: string;
}

export interface WildCompanionSummonResult {
  familiarState: FamiliarState;
  resourcePoolAfterSpend: Awaited<ReturnType<typeof spendResource>>;
}

/**
 * Spend a Wild Shape use and summon a familiar via Wild Companion.
 */
export async function performWildCompanionSummon(
  input: WildCompanionSummonInput,
): Promise<WildCompanionSummonResult> {
  const resourcePoolAfterSpend = await spendResource({
    characterId: input.characterId,
    resourceName: "Wild Shape",
    amount: 1,
    sessionId: input.sessionId,
    note: `Wild Companion: summoned ${input.familiarForm} familiar`,
    createdByLabel: input.createdByLabel,
  });

  const familiarState = summonWildCompanionFamiliar(input.familiarForm);

  return { familiarState, resourcePoolAfterSpend };
}

/**
 * Dismiss a familiar to its pocket dimension. No resource spend.
 */
export function performFamiliarDismiss(
  currentState: FamiliarState,
): FamiliarState {
  return dismissFamiliar(currentState);
}

/**
 * Re-summon a previously dismissed familiar. No resource spend.
 */
export function performFamiliarResummon(
  currentState: FamiliarState,
): FamiliarState {
  return resummonFamiliar(currentState);
}

/**
 * Permanently remove a familiar.
 */
export function performFamiliarRemove(): FamiliarState {
  return removeFamiliar();
}

/**
 * Handle long rest effects on familiar state.
 * Wild Companion familiars disappear; spell-cast familiars persist.
 */
export function handleFamiliarStateOnLongRest(
  currentState: FamiliarState,
): FamiliarState {
  return handleFamiliarLongRest(currentState);
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { createIdleWildShapeState, createEmptyFamiliarState };
