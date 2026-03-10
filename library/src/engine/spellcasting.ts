import type {
  CharacterComputationInput,
  CharacterSpellCapacity,
  CharacterSpellSlotPool,
  CharacterSpellcastingState,
  SpellSlotPoolDefinition,
} from "../types/character.ts";
import type {
  EffectAbilityName,
  GrantedSpellAccess,
} from "../types/effect.ts";
import { getAbilityModifier } from "./math.ts";
import {
  createExplanation,
  getNumericModifierContributors,
  sumContributors,
  type EffectEnvelope,
  uniqueSorted,
} from "./shared.ts";

function getEffectAbilityModifier(
  abilityScores: CharacterComputationInput["base"]["abilityScores"],
  ability: EffectAbilityName,
): number {
  return getAbilityModifier(abilityScores[ability]);
}

// ---------------------------------------------------------------------------
// Spell slot progression tables (D&D 5e 2024 SRD)
// ---------------------------------------------------------------------------

/**
 * Full caster spell slot progression (Bard, Cleric, Druid, Sorcerer, Wizard).
 * Index = class level (0-indexed), value = array of slots per spell level 1-9.
 */
export const FULL_CASTER_SLOT_TABLE: ReadonlyArray<readonly number[]> = [
  // Level  1st 2nd 3rd 4th 5th 6th 7th 8th 9th
  /* 1  */ [2],
  /* 2  */ [3],
  /* 3  */ [4, 2],
  /* 4  */ [4, 3],
  /* 5  */ [4, 3, 2],
  /* 6  */ [4, 3, 3],
  /* 7  */ [4, 3, 3, 1],
  /* 8  */ [4, 3, 3, 2],
  /* 9  */ [4, 3, 3, 3, 1],
  /* 10 */ [4, 3, 3, 3, 2],
  /* 11 */ [4, 3, 3, 3, 2, 1],
  /* 12 */ [4, 3, 3, 3, 2, 1],
  /* 13 */ [4, 3, 3, 3, 2, 1, 1],
  /* 14 */ [4, 3, 3, 3, 2, 1, 1],
  /* 15 */ [4, 3, 3, 3, 2, 1, 1, 1],
  /* 16 */ [4, 3, 3, 3, 2, 1, 1, 1],
  /* 17 */ [4, 3, 3, 3, 2, 1, 1, 1, 1],
  /* 18 */ [4, 3, 3, 3, 3, 1, 1, 1, 1],
  /* 19 */ [4, 3, 3, 3, 3, 2, 1, 1, 1],
  /* 20 */ [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/**
 * Half caster spell slot progression (Paladin, Ranger).
 * Index = class level (0-indexed), value = array of slots per spell level 1-5.
 */
export const HALF_CASTER_SLOT_TABLE: ReadonlyArray<readonly number[]> = [
  /* 1  */ [],
  /* 2  */ [2],
  /* 3  */ [3],
  /* 4  */ [3],
  /* 5  */ [4, 2],
  /* 6  */ [4, 2],
  /* 7  */ [4, 3],
  /* 8  */ [4, 3],
  /* 9  */ [4, 3, 2],
  /* 10 */ [4, 3, 2],
  /* 11 */ [4, 3, 3],
  /* 12 */ [4, 3, 3],
  /* 13 */ [4, 3, 3, 1],
  /* 14 */ [4, 3, 3, 1],
  /* 15 */ [4, 3, 3, 2],
  /* 16 */ [4, 3, 3, 2],
  /* 17 */ [4, 3, 3, 3, 1],
  /* 18 */ [4, 3, 3, 3, 1],
  /* 19 */ [4, 3, 3, 3, 2],
  /* 20 */ [4, 3, 3, 3, 2],
];

/**
 * Pact Magic slot progression (Warlock).
 * Index = class level (0-indexed).
 * Each entry: { count, maxLevel } — warlock gets `count` slots, all at `maxLevel`.
 */
export const PACT_MAGIC_TABLE: ReadonlyArray<{
  readonly count: number;
  readonly maxLevel: number;
}> = [
  /* 1  */ { count: 1, maxLevel: 1 },
  /* 2  */ { count: 2, maxLevel: 1 },
  /* 3  */ { count: 2, maxLevel: 2 },
  /* 4  */ { count: 2, maxLevel: 2 },
  /* 5  */ { count: 2, maxLevel: 3 },
  /* 6  */ { count: 2, maxLevel: 3 },
  /* 7  */ { count: 2, maxLevel: 4 },
  /* 8  */ { count: 2, maxLevel: 4 },
  /* 9  */ { count: 2, maxLevel: 5 },
  /* 10 */ { count: 2, maxLevel: 5 },
  /* 11 */ { count: 3, maxLevel: 5 },
  /* 12 */ { count: 3, maxLevel: 5 },
  /* 13 */ { count: 3, maxLevel: 5 },
  /* 14 */ { count: 3, maxLevel: 5 },
  /* 15 */ { count: 3, maxLevel: 5 },
  /* 16 */ { count: 3, maxLevel: 5 },
  /* 17 */ { count: 4, maxLevel: 5 },
  /* 18 */ { count: 4, maxLevel: 5 },
  /* 19 */ { count: 4, maxLevel: 5 },
  /* 20 */ { count: 4, maxLevel: 5 },
];

/**
 * Full caster cantrip progression.
 * Index = class level (0-indexed), value = cantrips known.
 */
export const FULL_CASTER_CANTRIP_TABLE: ReadonlyArray<number> = [
  /* 1  */ 2,
  /* 2  */ 2,
  /* 3  */ 2,
  /* 4  */ 3,
  /* 5  */ 3,
  /* 6  */ 3,
  /* 7  */ 3,
  /* 8  */ 3,
  /* 9  */ 3,
  /* 10 */ 4,
  /* 11 */ 4,
  /* 12 */ 4,
  /* 13 */ 4,
  /* 14 */ 4,
  /* 15 */ 4,
  /* 16 */ 4,
  /* 17 */ 4,
  /* 18 */ 4,
  /* 19 */ 4,
  /* 20 */ 4,
];

/**
 * Warlock cantrip progression.
 * Index = class level (0-indexed), value = cantrips known.
 */
export const WARLOCK_CANTRIP_TABLE: ReadonlyArray<number> = [
  /* 1  */ 2,
  /* 2  */ 2,
  /* 3  */ 2,
  /* 4  */ 3,
  /* 5  */ 3,
  /* 6  */ 3,
  /* 7  */ 3,
  /* 8  */ 3,
  /* 9  */ 3,
  /* 10 */ 4,
  /* 11 */ 4,
  /* 12 */ 4,
  /* 13 */ 4,
  /* 14 */ 4,
  /* 15 */ 4,
  /* 16 */ 4,
  /* 17 */ 4,
  /* 18 */ 4,
  /* 19 */ 4,
  /* 20 */ 4,
];

// ---------------------------------------------------------------------------
// Known spells tables (for Bard, Sorcerer, Ranger, Warlock)
// ---------------------------------------------------------------------------

/** Bard spells known (2024 SRD). Index = class level (0-indexed). */
export const BARD_KNOWN_SPELLS_TABLE: ReadonlyArray<number> = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
  15, 15, 16, 16, 17, 17, 18, 18, 19, 19,
];

/** Sorcerer spells known (2024 SRD). Index = class level (0-indexed). */
export const SORCERER_KNOWN_SPELLS_TABLE: ReadonlyArray<number> = [
  2, 4, 6, 7, 8, 9, 10, 11, 12, 14,
  15, 15, 16, 16, 17, 17, 18, 18, 19, 19,
];

/** Ranger spells known (2024 SRD). Index = class level (0-indexed). */
export const RANGER_KNOWN_SPELLS_TABLE: ReadonlyArray<number> = [
  0, 2, 3, 3, 4, 4, 5, 5, 6, 6,
  7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
];

/** Warlock spells known (2024 SRD). Index = class level (0-indexed). */
export const WARLOCK_KNOWN_SPELLS_TABLE: ReadonlyArray<number> = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 10,
  11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
];

// ---------------------------------------------------------------------------
// Caster type classification
// ---------------------------------------------------------------------------

export type CasterType = "full" | "half" | "pact" | "none";

const CASTER_TYPE_MAP: Record<string, CasterType> = {
  bard: "full",
  cleric: "full",
  druid: "full",
  sorcerer: "full",
  wizard: "full",
  paladin: "half",
  ranger: "half",
  warlock: "pact",
  fighter: "none",
  barbarian: "none",
  monk: "none",
  rogue: "none",
};

export function getCasterType(classId: string): CasterType {
  const normalized = classId.replace(/^class[-:]?/, "").toLowerCase();
  return CASTER_TYPE_MAP[normalized] ?? "none";
}

// ---------------------------------------------------------------------------
// Spell capacity classification (prepared vs known)
// ---------------------------------------------------------------------------

export type SpellLearningMode = "prepared" | "known";

const SPELL_LEARNING_MODE_MAP: Record<string, SpellLearningMode> = {
  bard: "known",
  cleric: "prepared",
  druid: "prepared",
  paladin: "prepared",
  ranger: "known",
  sorcerer: "known",
  warlock: "known",
  wizard: "prepared",
};

export function getSpellLearningMode(classId: string): SpellLearningMode | null {
  const normalized = classId.replace(/^class[-:]?/, "").toLowerCase();
  return SPELL_LEARNING_MODE_MAP[normalized] ?? null;
}

// ---------------------------------------------------------------------------
// Slot derivation from class levels
// ---------------------------------------------------------------------------

/**
 * Given a set of sources, derive the full-caster or half-caster standard
 * spell slot progression. Does not include Pact Magic.
 */
export function deriveStandardSlots(
  classId: string,
  classLevel: number,
): number[] {
  const casterType = getCasterType(classId);
  if (casterType === "none" || casterType === "pact") {
    return [];
  }

  const clampedLevel = Math.min(Math.max(classLevel, 1), 20);
  const table = casterType === "full" ? FULL_CASTER_SLOT_TABLE : HALF_CASTER_SLOT_TABLE;
  const row = table[clampedLevel - 1];
  return row ? [...row] : [];
}

/**
 * Derive Pact Magic slots for a warlock at a given class level.
 * Returns an array of slot counts indexed by spell level (1-indexed in output).
 */
export function derivePactMagicSlots(
  classLevel: number,
): { count: number; maxLevel: number } {
  const clampedLevel = Math.min(Math.max(classLevel, 1), 20);
  const entry = PACT_MAGIC_TABLE[clampedLevel - 1]!;
  return { count: entry.count, maxLevel: entry.maxLevel };
}

// ---------------------------------------------------------------------------
// Prepared/known capacity derivation
// ---------------------------------------------------------------------------

/**
 * Compute the number of prepared spells for a class that uses ability-based
 * preparation (Cleric, Druid, Paladin, Wizard).
 * Formula: class level + ability modifier (minimum 1).
 */
export function computePreparedSpellCapacity(
  classLevel: number,
  abilityModifier: number,
): number {
  return Math.max(classLevel + abilityModifier, 1);
}

/**
 * Look up the number of known spells from a class-specific table.
 */
export function getKnownSpellCount(
  classId: string,
  classLevel: number,
): number | null {
  const normalized = classId.replace(/^class[-:]?/, "").toLowerCase();
  const clampedLevel = Math.min(Math.max(classLevel, 1), 20);

  const tableMap: Record<string, ReadonlyArray<number>> = {
    bard: BARD_KNOWN_SPELLS_TABLE,
    sorcerer: SORCERER_KNOWN_SPELLS_TABLE,
    ranger: RANGER_KNOWN_SPELLS_TABLE,
    warlock: WARLOCK_KNOWN_SPELLS_TABLE,
  };

  const table = tableMap[normalized];
  if (!table) {
    return null;
  }

  return table[clampedLevel - 1] ?? null;
}

/**
 * Look up cantrip count from class and level.
 */
export function getCantripCount(
  classId: string,
  classLevel: number,
): number | null {
  const casterType = getCasterType(classId);
  if (casterType === "none") {
    return null;
  }

  const clampedLevel = Math.min(Math.max(classLevel, 1), 20);
  const table = casterType === "pact" ? WARLOCK_CANTRIP_TABLE : FULL_CASTER_CANTRIP_TABLE;
  return table[clampedLevel - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Spell slot pool definition builder (for persistence integration)
// ---------------------------------------------------------------------------

/**
 * Build SpellSlotPoolDefinition[] from CharacterSpellcastingState.
 * These can be used with the resource pool system to track spell slot usage.
 */
export function buildSpellSlotPoolDefinitions(
  slotPools: CharacterSpellSlotPool[],
): SpellSlotPoolDefinition[] {
  const definitions: SpellSlotPoolDefinition[] = [];

  for (const pool of slotPools) {
    const prefix = pool.source === "Pact Magic" ? "Pact Magic Slot" : "Spell Slot";
    for (const slot of pool.slots) {
      definitions.push({
        slotLevel: slot.level,
        total: slot.total,
        resetOn: pool.resetOn,
        source: pool.source,
        resourceName: `${prefix} (Level ${slot.level})`,
      });
    }
  }

  return definitions;
}

// ---------------------------------------------------------------------------
// Main spellcasting state builder
// ---------------------------------------------------------------------------

export function buildSpellcastingState(
  input: CharacterComputationInput,
  effects: EffectEnvelope[],
  proficiencyBonus: number,
): CharacterSpellcastingState | null {
  const grantedSpellMap = new Map<string, GrantedSpellAccess>();

  for (const entry of effects) {
    if (entry.effect.type !== "grant-spell-access") {
      continue;
    }

    const key =
      entry.effect.spell.spellPackId && entry.effect.spell.spellEntityId
        ? `${entry.effect.spell.spellPackId}:${entry.effect.spell.spellEntityId}`
        : entry.effect.spell.spellName.trim().toLowerCase();
    const existing = grantedSpellMap.get(key);

    if (!existing) {
      grantedSpellMap.set(key, { ...entry.effect.spell });
      continue;
    }

    grantedSpellMap.set(key, {
      ...existing,
      spellEntityId: existing.spellEntityId ?? entry.effect.spell.spellEntityId,
      spellPackId: existing.spellPackId ?? entry.effect.spell.spellPackId,
      alwaysPrepared: existing.alwaysPrepared || entry.effect.spell.alwaysPrepared,
      source: [existing.source, entry.effect.spell.source]
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(", "),
    });
  }

  const grantedSpells = [...grantedSpellMap.values()]
    .sort((left, right) => left.spellName.localeCompare(right.spellName));
  const grantedSpellNames = uniqueSorted(grantedSpells.map((spell) => spell.spellName));
  const slotPools = effects.flatMap((entry) =>
    entry.effect.type === "grant-spell-slots"
      ? [{
          sourceName: entry.sourceName,
          source: entry.effect.pool.source,
          resetOn: entry.effect.pool.resetOn,
          slots: entry.effect.pool.slots
            .map((total, index) => ({
              level: index + 1,
              total,
            }))
            .filter((slot) => slot.total > 0),
        } satisfies CharacterSpellSlotPool]
      : []
  );
  const capacities = effects.flatMap((entry) =>
    entry.effect.type === "grant-spell-capacity"
      ? [{
          ...entry.effect.capacity,
          sourceName: entry.sourceName,
        } satisfies CharacterSpellCapacity]
      : []
  );

  if (
    !input.base.spellcastingAbility &&
    grantedSpellNames.length === 0 &&
    slotPools.length === 0 &&
    capacities.length === 0
  ) {
    return null;
  }

  const ability = input.base.spellcastingAbility ?? "charisma";
  const abilityModifier = getEffectAbilityModifier(input.base.abilityScores, ability);
  const spellAttackContributors = getNumericModifierContributors(effects, "spell-attack");
  const spellSaveContributors = getNumericModifierContributors(effects, "spell-dc");

  return {
    ability,
    grantedSpells,
    grantedSpellNames,
    slotPools,
    capacities,
    spellAttackBonus:
      abilityModifier + proficiencyBonus + sumContributors(spellAttackContributors),
    spellAttackExplanation: createExplanation(
      `${ability} spellcasting`,
      abilityModifier + proficiencyBonus,
      spellAttackContributors,
    ),
    spellSaveDc:
      8 + abilityModifier + proficiencyBonus + sumContributors(spellSaveContributors),
    spellSaveExplanation: createExplanation(
      `${ability} spellcasting`,
      8 + abilityModifier + proficiencyBonus,
      spellSaveContributors,
    ),
  };
}
