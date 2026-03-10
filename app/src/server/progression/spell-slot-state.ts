import type { SpellSlotPoolDefinition } from "@dnd/library";
import {
  initializeResourcePools,
  spendResource,
  restoreResource,
  getCharacterResourcePool,
} from "./resource-state.ts";
import type {
  CharacterResourcePoolRecord,
  SpendResourceInput,
  RestoreResourceInput,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Spell slot initialization (delegates to generic resource pools)
// ---------------------------------------------------------------------------

/**
 * Initialize or sync spell slot pools for a character from computed state.
 * Each slot level becomes a separate resource pool with the naming convention:
 * - "Spell Slot (Level N)" for standard caster slots
 * - "Pact Magic Slot (Level N)" for warlock pact slots
 *
 * This integrates with the existing resource pool system so that rest-based
 * recovery works automatically via performShortRest / performLongRest.
 */
export async function initializeSpellSlotPools(
  characterId: string,
  slotDefinitions: SpellSlotPoolDefinition[],
): Promise<CharacterResourcePoolRecord[]> {
  return initializeResourcePools({
    characterId,
    pools: slotDefinitions.map((def) => ({
      resourceName: def.resourceName,
      maxUses: def.total,
      resetOn: def.resetOn,
      sourceName: def.source,
    })),
  });
}

// ---------------------------------------------------------------------------
// Spell slot spend
// ---------------------------------------------------------------------------

export interface SpendSpellSlotInput {
  characterId: string;
  slotLevel: number;
  isPactMagic?: boolean;
  sessionId?: string | null;
  note?: string;
  createdByLabel: string;
}

/**
 * Spend one spell slot of the given level.
 * Throws if the character has no slots of that level or all are expended.
 */
export async function spendSpellSlot(
  input: SpendSpellSlotInput,
): Promise<CharacterResourcePoolRecord> {
  const resourceName = input.isPactMagic
    ? `Pact Magic Slot (Level ${input.slotLevel})`
    : `Spell Slot (Level ${input.slotLevel})`;

  const spendInput: SpendResourceInput = {
    characterId: input.characterId,
    resourceName,
    amount: 1,
    sessionId: input.sessionId,
    note: input.note ?? `Cast using ${resourceName}`,
    createdByLabel: input.createdByLabel,
  };

  return spendResource(spendInput);
}

// ---------------------------------------------------------------------------
// Spell slot restore (manual recovery, e.g. Arcane Recovery)
// ---------------------------------------------------------------------------

export interface RestoreSpellSlotInput {
  characterId: string;
  slotLevel: number;
  isPactMagic?: boolean;
  amount?: number;
  sessionId?: string | null;
  note?: string;
  createdByLabel: string;
}

/**
 * Restore spell slots of the given level.
 * Used for features like Arcane Recovery or Magical Cunning.
 */
export async function restoreSpellSlot(
  input: RestoreSpellSlotInput,
): Promise<CharacterResourcePoolRecord> {
  const resourceName = input.isPactMagic
    ? `Pact Magic Slot (Level ${input.slotLevel})`
    : `Spell Slot (Level ${input.slotLevel})`;

  const restoreInput: RestoreResourceInput = {
    characterId: input.characterId,
    resourceName,
    amount: input.amount ?? 1,
    sessionId: input.sessionId,
    note: input.note ?? `Recovered ${resourceName}`,
    createdByLabel: input.createdByLabel,
  };

  return restoreResource(restoreInput);
}

// ---------------------------------------------------------------------------
// Free cast state (once-per-day racial/feature spells)
// ---------------------------------------------------------------------------

/**
 * Spend a free cast charge. Free casts are stored as resource pools
 * with the naming convention "Free Cast: <SpellName>".
 */
export async function spendFreeCast(input: {
  characterId: string;
  spellName: string;
  sessionId?: string | null;
  note?: string;
  createdByLabel: string;
}): Promise<CharacterResourcePoolRecord> {
  const resourceName = `Free Cast: ${input.spellName}`;

  return spendResource({
    characterId: input.characterId,
    resourceName,
    amount: 1,
    sessionId: input.sessionId,
    note: input.note ?? `Free cast of ${input.spellName}`,
    createdByLabel: input.createdByLabel,
  });
}

/**
 * Check if a free cast is available for a spell.
 */
export async function hasFreeCastAvailable(
  characterId: string,
  spellName: string,
): Promise<boolean> {
  const resourceName = `Free Cast: ${spellName}`;
  const pool = await getCharacterResourcePool(characterId, resourceName);

  if (!pool) {
    return false;
  }

  return pool.currentUses > 0;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Get the current state of a specific spell slot level.
 */
export async function getSpellSlotState(
  characterId: string,
  slotLevel: number,
  isPactMagic?: boolean,
): Promise<{ current: number; max: number } | null> {
  const resourceName = isPactMagic
    ? `Pact Magic Slot (Level ${slotLevel})`
    : `Spell Slot (Level ${slotLevel})`;

  const pool = await getCharacterResourcePool(characterId, resourceName);
  if (!pool) {
    return null;
  }

  return {
    current: pool.currentUses,
    max: pool.maxUses,
  };
}
