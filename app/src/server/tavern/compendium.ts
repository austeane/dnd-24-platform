import type { CanonEntityType, PackId } from "@dnd/library";
import {
  getCanonicalEntity,
  listCanonicalEntitiesForEnabledPacks,
} from "@dnd/library";

export interface CompendiumFilters {
  q?: string;
  type?: string;
  pack?: string;
}

export interface CompendiumEntry {
  entityId: string;
  packId: string;
  type: string;
  name: string;
  summary: string | null;
  tags: string[];
}

export interface CompendiumEntryDetail extends CompendiumEntry {
  bodyMd: string;
}

export interface CompendiumData {
  entries: CompendiumEntry[];
  totalCount: number;
  availableTypes: string[];
  availablePacks: string[];
}

const defaultEnabledPacks: PackId[] = ["srd-5e-2024", "advanced-adventurers"];

export function getCompendiumData(
  filters: CompendiumFilters,
): CompendiumData {
  const packFilter = filters.pack as PackId | undefined;
  const enabledPacks = packFilter
    ? [packFilter]
    : defaultEnabledPacks;

  let entities = listCanonicalEntitiesForEnabledPacks(enabledPacks);

  if (filters.type) {
    const typeFilter = filters.type as CanonEntityType;
    entities = entities.filter((e) => e.type === typeFilter);
  }

  if (filters.q) {
    const query = filters.q.toLowerCase();
    entities = entities.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        (e.summary && e.summary.toLowerCase().includes(query)) ||
        (e.tags && e.tags.some((tag) => tag.toLowerCase().includes(query))),
    );
  }

  const allEntities = listCanonicalEntitiesForEnabledPacks(defaultEnabledPacks);
  const availableTypes = [...new Set(allEntities.map((e) => e.type))].sort();
  const availablePacks = [...new Set(allEntities.map((e) => e.packId))].sort();

  const entries: CompendiumEntry[] = entities
    .sort((a, b) => a.name.localeCompare(b.name))
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
  };
}

export function getCompendiumEntryDetail(
  packId: string,
  entityId: string,
): CompendiumEntryDetail | null {
  const entity = getCanonicalEntity(packId as PackId, entityId);
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
