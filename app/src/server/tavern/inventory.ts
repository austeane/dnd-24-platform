import type {
  AttackProfile,
  CharacterState,
  EvaluatedResource,
} from "@dnd/library";
import { listCharacterEquipment } from "../progression/choice-state.ts";
import type { CharacterEquipmentRecord } from "../progression/types.ts";
import { getTavernCharacterContext } from "./context.ts";
import type {
  TavernInventoryData,
  TavernInventoryItemsData,
  TavernInventoryRuntimeData,
} from "./types.ts";

function formatDamage(damageDice: string, damageBonus: number): string {
  if (damageBonus === 0) {
    return damageDice;
  }

  return damageBonus > 0 ? `${damageDice}+${damageBonus}` : `${damageDice}${damageBonus}`;
}

export function formatAttackBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function mapAttackProfiles(
  attackProfiles: AttackProfile[],
): TavernInventoryRuntimeData["attackProfiles"] {
  return attackProfiles.map((profile) => ({
    weaponName: profile.name,
    attackBonus: formatAttackBonus(profile.attackBonus),
    damage: formatDamage(profile.damageDice, profile.damageBonus),
    damageType: profile.damageType,
    properties: profile.properties,
    masteryProperty: profile.masteryProperty ?? null,
  }));
}

function mapResources(
  resources: EvaluatedResource[],
): TavernInventoryRuntimeData["resources"] {
  return resources
    .filter((resource) => resource.isTracked)
    .map((resource) => ({
      name: resource.name,
      current: resource.currentUses,
      max: resource.maxUses,
      rechargeOn: resource.resetOn === "short" ? "Short Rest" : "Long Rest",
      source: resource.sourceName,
    }));
}

export function buildInventoryRuntimeData(
  runtime: Pick<CharacterState, "attackProfiles" | "resources"> | null,
): TavernInventoryRuntimeData {
  return {
    attackProfiles: mapAttackProfiles(runtime?.attackProfiles ?? []),
    resources: mapResources(runtime?.resources ?? []),
  };
}

export function partitionInventoryItems(
  equipmentRecords: CharacterEquipmentRecord[],
): TavernInventoryItemsData {
  const equippedItems: TavernInventoryItemsData["equippedItems"] = [];
  const carriedItems: TavernInventoryItemsData["carriedItems"] = [];

  for (const record of equipmentRecords) {
    const item = {
      id: record.id,
      name: record.itemLabel,
      quantity: record.quantity,
      equipped: record.equipped,
      slot: record.slot,
    };

    if (record.equipped) {
      equippedItems.push(item);
      continue;
    }

    carriedItems.push(item);
  }

  return {
    equippedItems,
    carriedItems,
  };
}

export async function getInventoryItemsData(
  characterId: string,
): Promise<TavernInventoryItemsData> {
  return partitionInventoryItems(await listCharacterEquipment(characterId));
}

export async function getInventoryData(
  characterId: string,
): Promise<TavernInventoryData> {
  const [context, items] = await Promise.all([
    getTavernCharacterContext(characterId),
    getInventoryItemsData(characterId),
  ]);

  if (!context) {
    return {
      ...items,
      attackProfiles: [],
      resources: [],
    };
  }

  return {
    ...items,
    ...buildInventoryRuntimeData(context.runtime),
  };
}
