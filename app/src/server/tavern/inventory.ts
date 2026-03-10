import { listCharacterEquipment } from "../progression/choice-state.ts";
import { getCharacterRuntimeState } from "../progression/character-state.ts";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  equipped: boolean;
  slot: string | null;
}

export interface InventoryAttackProfile {
  weaponName: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  properties: string[];
  masteryProperty: string | null;
}

export interface InventoryResource {
  name: string;
  current: number;
  max: number;
  rechargeOn: string;
  source: string;
}

export interface InventoryData {
  equippedItems: InventoryItem[];
  carriedItems: InventoryItem[];
  attackProfiles: InventoryAttackProfile[];
  resources: InventoryResource[];
}

function formatDamage(damageDice: string, damageBonus: number): string {
  if (damageBonus === 0) return damageDice;
  if (damageBonus > 0) return `${damageDice}+${damageBonus}`;
  return `${damageDice}${damageBonus}`;
}

function formatAttackBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

export async function getInventoryData(
  characterId: string,
): Promise<InventoryData> {
  const [equipmentRecords, runtime] = await Promise.all([
    listCharacterEquipment(characterId),
    getCharacterRuntimeState(characterId),
  ]);

  // Partition equipment into equipped vs carried
  const equippedItems: InventoryItem[] = [];
  const carriedItems: InventoryItem[] = [];

  for (const record of equipmentRecords) {
    const item: InventoryItem = {
      id: record.id,
      name: record.itemLabel,
      quantity: record.quantity,
      equipped: record.equipped,
      slot: record.slot,
    };

    if (record.equipped) {
      equippedItems.push(item);
    } else {
      carriedItems.push(item);
    }
  }

  // Map attack profiles from runtime
  const attackProfiles: InventoryAttackProfile[] = (
    runtime?.attackProfiles ?? []
  ).map((profile) => ({
    weaponName: profile.name,
    attackBonus: profile.attackBonus,
    damage: formatDamage(profile.damageDice, profile.damageBonus),
    damageType: profile.damageType,
    properties: profile.properties,
    masteryProperty: profile.masteryProperty ?? null,
  }));

  // Map resources from runtime
  const resources: InventoryResource[] = (runtime?.resources ?? [])
    .filter((resource) => resource.isTracked)
    .map((resource) => ({
      name: resource.name,
      current: resource.currentUses,
      max: resource.maxUses,
      rechargeOn: resource.resetOn === "short" ? "Short Rest" : "Long Rest",
      source: resource.sourceName,
    }));

  return {
    equippedItems,
    carriedItems,
    attackProfiles,
    resources,
  };
}

export { formatAttackBonus };
