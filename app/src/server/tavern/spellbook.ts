import { getCanonicalSpellByName, type PackId } from "@dnd/library";
import { getCharacterRuntimeState } from "../progression/character-state.ts";

export interface SpellbookSpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  concentration: boolean;
  ritual: boolean;
  alwaysPrepared: boolean;
  source: string;
}

export interface SpellbookSlotPool {
  level: number;
  total: number;
  current: number;
}

export interface SpellbookGroup {
  level: number;
  label: string;
  spells: SpellbookSpell[];
  slots: SpellbookSlotPool | null;
}

export interface SpellbookData {
  castingAbility: string | null;
  spellSaveDC: number | null;
  spellAttackBonus: number | null;
  groups: SpellbookGroup[];
}

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function getSpellbookData(
  characterId: string,
): Promise<SpellbookData> {
  const runtime = await getCharacterRuntimeState(characterId);
  if (!runtime) {
    return {
      castingAbility: null,
      spellSaveDC: null,
      spellAttackBonus: null,
      groups: [],
    };
  }

  const spellcasting = runtime.spellcasting;
  if (!spellcasting) {
    return {
      castingAbility: null,
      spellSaveDC: null,
      spellAttackBonus: null,
      groups: [],
    };
  }

  const enabledPacks: PackId[] = ["srd-5e-2024", "advanced-adventurers"];

  // Enrich granted spells with canonical metadata
  const enrichedSpells: SpellbookSpell[] = spellcasting.grantedSpells.map(
    (granted) => {
      const canonical = getCanonicalSpellByName(granted.spellName, enabledPacks);
      return {
        name: granted.spellName,
        level: canonical?.level ?? 0,
        school: canonical?.school ?? "Unknown",
        castingTime: canonical?.castingTime ?? "1 action",
        concentration: canonical?.concentration ?? false,
        ritual: canonical?.ritual ?? false,
        alwaysPrepared: granted.alwaysPrepared,
        source: granted.source,
      };
    },
  );

  // Group spells by level
  const spellsByLevel = new Map<number, SpellbookSpell[]>();
  for (const spell of enrichedSpells) {
    const existing = spellsByLevel.get(spell.level) ?? [];
    existing.push(spell);
    spellsByLevel.set(spell.level, existing);
  }

  // Build slot lookup from all slot pools
  const slotsByLevel = new Map<number, SpellbookSlotPool>();
  for (const pool of spellcasting.slotPools) {
    for (const slot of pool.slots) {
      const existing = slotsByLevel.get(slot.level);
      if (existing) {
        existing.total += slot.total;
        existing.current += slot.current;
      } else {
        slotsByLevel.set(slot.level, {
          level: slot.level,
          total: slot.total,
          current: slot.current,
        });
      }
    }
  }

  // Build groups, sorted by level
  const allLevels = new Set([
    ...spellsByLevel.keys(),
    ...slotsByLevel.keys(),
  ]);
  const sortedLevels = [...allLevels].sort((a, b) => a - b);

  const groups: SpellbookGroup[] = sortedLevels.map((level) => {
    const spells = spellsByLevel.get(level) ?? [];
    spells.sort((a, b) => a.name.localeCompare(b.name));

    return {
      level,
      label: LEVEL_LABELS[level] ?? `Level ${level}`,
      spells,
      slots: level > 0 ? (slotsByLevel.get(level) ?? null) : null,
    };
  });

  return {
    castingAbility: capitalize(spellcasting.ability),
    spellSaveDC: spellcasting.spellSaveDc,
    spellAttackBonus: spellcasting.spellAttackBonus,
    groups,
  };
}
