import type { PackId } from "@dnd/library";

const DEFAULT_ENABLED_PACK_IDS: PackId[] = ["srd-5e-2024"];
const KNOWN_PACK_IDS = new Set<string>([
  "srd-5e-2024",
  "advanced-adventurers",
  "campaign-private",
]);

export function isCanonicalPackId(packId: string | undefined): packId is PackId {
  return !!packId && KNOWN_PACK_IDS.has(packId);
}

export function toCanonicalPackIds(enabledPackIds: string[]): PackId[] {
  const canonicalPackIds = enabledPackIds.filter(isCanonicalPackId);
  if (canonicalPackIds.length > 0) {
    return canonicalPackIds;
  }

  return DEFAULT_ENABLED_PACK_IDS;
}

export { DEFAULT_ENABLED_PACK_IDS };
