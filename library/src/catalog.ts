import type {
  CanonicalAAAbility,
  CanonicalClass,
  CanonicalClassFeature,
  CanonicalEntity,
  CanonicalEquipment,
  CanonicalFeat,
  CanonicalSpecies,
  CanonicalSpell,
  PackId,
} from "./canon/index.ts";
import {
  getCanonicalEntityIdCandidates,
  normalizeCanonicalEntityId,
} from "./canon/index.ts";
import type { Effect } from "./types/effect.ts";
import { allCanonEntities, allCanonSpells } from "./generated/index.ts";

const spellNameAliases = new Map<string, string>([
  ["tasha's hideous laughter", "hideous laughter"],
]);

export type CanonicalMechanicalEntity =
  | CanonicalAAAbility
  | CanonicalClass
  | CanonicalClassFeature
  | CanonicalEquipment
  | CanonicalFeat
  | CanonicalSpecies;

function byPackPriority(
  left: { packId: PackId },
  right: { packId: PackId },
  enabledPackIds: PackId[],
): number {
  const leftIndex = enabledPackIds.indexOf(left.packId);
  const rightIndex = enabledPackIds.indexOf(right.packId);
  return rightIndex - leftIndex;
}

export function getCanonicalEntity(
  packId: PackId | string,
  entityId: string,
): CanonicalEntity | undefined {
  const entityIdCandidates = getCanonicalEntityIdCandidates(entityId);
  if (entityIdCandidates.length === 0) {
    return undefined;
  }

  return allCanonEntities.find(
    (entity) => entity.packId === packId && entityIdCandidates.includes(entity.id),
  );
}

export function getCanonicalMechanicalEntity(
  packId: PackId,
  entityId: string,
): CanonicalMechanicalEntity | undefined {
  const entity = getCanonicalEntity(packId, entityId);
  if (!entity) {
    return undefined;
  }

  switch (entity.type) {
    case "aa-ability":
    case "class":
    case "class-feature":
    case "equipment":
    case "feat":
    case "species":
      return entity;
    default:
      return undefined;
  }
}

export function getCanonicalEntityEffects(
  entity: CanonicalEntity | undefined,
): Effect[] {
  if (!entity) {
    return [];
  }

  switch (entity.type) {
    case "aa-ability":
    case "class":
    case "class-feature":
    case "equipment":
    case "feat":
    case "species":
      return entity.effects;
    default:
      return [];
  }
}

export function getCanonicalEffectsForSource(
  packId: PackId | string | undefined,
  entityId: string,
): Effect[] {
  if (!packId) {
    return [];
  }

  return getCanonicalEntityEffects(getCanonicalEntity(packId as PackId, entityId));
}

export function getCanonicalSpellByName(
  spellName: string,
  enabledPackIds: PackId[] = ["srd-5e-2024", "advanced-adventurers"],
): CanonicalSpell | undefined {
  const normalizedInput = spellName.trim().toLowerCase();
  const normalized = spellNameAliases.get(normalizedInput) ?? normalizedInput;
  const matches = allCanonSpells.filter(
    (spell) => spell.name.trim().toLowerCase() === normalized,
  );

  return [...matches].sort((left, right) =>
    byPackPriority(left, right, enabledPackIds)
  )[0];
}

export function listCanonicalEntitiesForEnabledPacks(
  enabledPackIds: PackId[],
): CanonicalEntity[] {
  const enabled = new Set(enabledPackIds);
  return allCanonEntities.filter((entity) => enabled.has(entity.packId));
}

export function listPackVisibleSpells(
  enabledPackIds: PackId[],
): CanonicalSpell[] {
  const visibleByName = new Map<string, CanonicalSpell>();

  for (const spell of [...allCanonSpells].sort((left, right) =>
    byPackPriority(left, right, enabledPackIds)
  )) {
    const nameKey = spell.name.trim().toLowerCase();
    if (!enabledPackIds.includes(spell.packId)) {
      continue;
    }
    if (!visibleByName.has(nameKey)) {
      visibleByName.set(nameKey, spell);
    }
  }

  return [...visibleByName.values()].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

export { normalizeCanonicalEntityId };
