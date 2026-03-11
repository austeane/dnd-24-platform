import type { PackId } from "@dnd/library";
import {
  getCanonicalEntity,
  listCanonicalEntitiesForEnabledPacks,
} from "@dnd/library";
import { getTavernCharacterContext } from "./context.ts";
import { isCanonicalPackId, toCanonicalPackIds } from "./packs.ts";
import type {
  TavernCompendiumData,
  TavernCompendiumEntry,
  TavernCompendiumEntryDetail,
  TavernCompendiumQuery,
} from "./types.ts";

function buildDetail(
  packId: string,
  entityId: string,
  enabledPackIds: PackId[],
): TavernCompendiumEntryDetail | null {
  if (!isCanonicalPackId(packId) || !enabledPackIds.includes(packId)) {
    return null;
  }

  const entity = getCanonicalEntity(packId, entityId);
  if (!entity) {
    return null;
  }

  return {
    entityId: entity.id,
    packId: entity.packId,
    type: entity.type,
    name: entity.name,
    summary: entity.summary ?? null,
    tags: entity.tags ?? [],
    bodyMd: entity.bodyMd,
  };
}

export async function getCompendiumData(
  query: TavernCompendiumQuery,
): Promise<TavernCompendiumData> {
  const context = await getTavernCharacterContext(query.characterId, {
    includeRuntime: false,
  });
  if (!context) {
    return {
      entries: [],
      totalCount: 0,
      availableTypes: [],
      availablePacks: [],
      detail: null,
    };
  }

  return buildCompendiumData(context.campaign.enabledPackIds, query);
}

export function buildCompendiumData(
  enabledPacks: string[],
  query: Omit<TavernCompendiumQuery, "characterId">,
): TavernCompendiumData {
  const enabledPackIds = toCanonicalPackIds(enabledPacks);
  const allEntities = listCanonicalEntitiesForEnabledPacks(enabledPackIds);
  const availableTypes = [...new Set(allEntities.map((entity) => entity.type))].sort();
  const availablePacks = [...new Set(allEntities.map((entity) => entity.packId))].sort();

  const packFilter = query.pack && isCanonicalPackId(query.pack)
    ? query.pack
    : undefined;
  const filteredByPack = packFilter && enabledPackIds.includes(packFilter)
    ? allEntities.filter((entity) => entity.packId === packFilter)
    : query.pack
      ? []
      : allEntities;

  const filteredByType = query.type
    ? filteredByPack.filter((entity) => entity.type === query.type)
    : filteredByPack;

  const filteredByQuery = query.q
    ? filteredByType.filter((entity) => {
        const searchQuery = query.q!.toLowerCase();
        return (
          entity.name.toLowerCase().includes(searchQuery) ||
          (entity.summary?.toLowerCase().includes(searchQuery) ?? false) ||
          (entity.tags?.some((tag) => tag.toLowerCase().includes(searchQuery)) ??
            false)
        );
      })
    : filteredByType;

  const entries: TavernCompendiumEntry[] = filteredByQuery
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entity) => ({
      entityId: entity.id,
      packId: entity.packId,
      type: entity.type,
      name: entity.name,
      summary: entity.summary ?? null,
      tags: entity.tags ?? [],
    }));

  return {
    entries,
    totalCount: entries.length,
    availableTypes,
    availablePacks,
    detail: query.entry && query.entryPack
      ? buildDetail(query.entryPack, query.entry, enabledPackIds)
      : null,
  };
}
