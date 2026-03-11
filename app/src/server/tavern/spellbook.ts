import {
  type CharacterSpellcastingState,
  type CharacterState,
  getCanonicalEntity,
  getCanonicalSpellByName,
  type PackId,
} from "@dnd/library";
import { getTavernCharacterContext } from "./context.ts";
import { isCanonicalPackId, toCanonicalPackIds } from "./packs.ts";
import type { TavernSpellData, TavernSpellbookData } from "./types.ts";

const LEVEL_LABELS: Record<number, string> = {
  0: "Cantrips",
  1: "1st Level",
  2: "2nd Level",
  3: "3rd Level",
  4: "4th Level",
  5: "5th Level",
  6: "6th Level",
  7: "7th Level",
  8: "8th Level",
  9: "9th Level",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEmptySpellbookData(): TavernSpellbookData {
  return {
    castingAbility: null,
    spellSaveDC: null,
    spellAttackBonus: null,
    groups: [],
  };
}

export function resolveGrantedSpell(
  grantedSpell: CharacterSpellcastingState["grantedSpells"][number],
  enabledPackIds: PackId[],
) {
  if (
    isCanonicalPackId(grantedSpell.spellPackId) &&
    grantedSpell.spellEntityId &&
    enabledPackIds.includes(grantedSpell.spellPackId)
  ) {
    const canonical = getCanonicalEntity(
      grantedSpell.spellPackId,
      grantedSpell.spellEntityId,
    );

    if (canonical?.type === "spell") {
      return canonical;
    }
  }

  return getCanonicalSpellByName(grantedSpell.spellName, enabledPackIds);
}

export function buildSpellbookData(
  runtime: Pick<CharacterState, "spellcasting" | "resources"> | null | undefined,
  enabledPackIds: string[],
): TavernSpellbookData {
  const spellcasting = runtime?.spellcasting;
  if (!spellcasting) {
    return getEmptySpellbookData();
  }

  const canonicalPackIds = toCanonicalPackIds(enabledPackIds);
  const freeCastBySpell = new Map(
    (runtime?.resources ?? [])
      .filter((resource) => resource.name.startsWith("Free Cast: "))
      .map((resource) => [
        resource.name.replace(/^Free Cast:\s*/, ""),
        {
          resourceName: resource.name,
          current: resource.currentUses,
          max: resource.maxUses,
        },
      ]),
  );
  const enrichedSpells: Array<TavernSpellData & { level: number }> =
    spellcasting.grantedSpells.map((grantedSpell) => {
      const canonical = resolveGrantedSpell(grantedSpell, canonicalPackIds);
      return {
        name: grantedSpell.spellName,
        level: canonical?.level ?? 0,
        school: canonical?.school ?? "Unknown",
        castingTime: canonical?.castingTime ?? "1 action",
        concentration: canonical?.concentration ?? false,
        ritual: canonical?.ritual ?? false,
        alwaysPrepared: grantedSpell.alwaysPrepared,
        freeCast: freeCastBySpell.get(grantedSpell.spellName) ?? null,
      };
    });

  const spellsByLevel = new Map<number, Array<TavernSpellData & { level: number }>>();
  for (const spell of enrichedSpells) {
    const levelSpells = spellsByLevel.get(spell.level) ?? [];
    levelSpells.push(spell);
    spellsByLevel.set(spell.level, levelSpells);
  }

  const slotsByLevel = new Map<number, TavernSpellbookData["groups"][number]["slots"]>();

  for (const pool of spellcasting.slotPools) {
    for (const slot of pool.slots) {
      const levelSlots = slotsByLevel.get(slot.level) ?? [];
      levelSlots.push({
        resourceName:
          pool.source === "pact-magic"
            ? `Pact Magic Slot (Level ${slot.level})`
            : `Spell Slot (Level ${slot.level})`,
        kind: pool.source === "pact-magic" ? "pact" : "standard",
        level: slot.level,
        total: slot.total,
        current: slot.current,
      });
      slotsByLevel.set(slot.level, levelSlots);
    }
  }

  const sortedLevels = [...new Set([...spellsByLevel.keys(), ...slotsByLevel.keys()])].sort(
    (left, right) => left - right,
  );

  return {
    castingAbility: capitalize(spellcasting.ability),
    spellSaveDC: spellcasting.spellSaveDc,
    spellAttackBonus: spellcasting.spellAttackBonus,
    groups: sortedLevels.map((level) => {
      const spells = (spellsByLevel.get(level) ?? [])
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(({ level: _level, ...spell }) => spell);

      return {
        level,
        label: LEVEL_LABELS[level] ?? `Level ${level}`,
        spells,
        slots: level > 0 ? (slotsByLevel.get(level) ?? []) : [],
      };
    }),
  };
}

export async function getSpellbookData(
  characterId: string,
): Promise<TavernSpellbookData> {
  const context = await getTavernCharacterContext(characterId);
  if (!context?.runtime) {
    return getEmptySpellbookData();
  }

  return buildSpellbookData(
    context.runtime,
    context.campaign.enabledPackIds,
  );
}
