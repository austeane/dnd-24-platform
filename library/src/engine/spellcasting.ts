import type {
  CharacterComputationInput,
  CharacterSpellCapacity,
  CharacterSpellSlotPool,
  CharacterSpellcastingState,
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
