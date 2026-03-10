import { buildSpellSlotPoolDefinitions } from "@dnd/library";
import { buildCharacterRuntimeStateFromRows, loadCharacterProjectionRows } from "./projection.ts";
import { syncCharacterResourcePools } from "./resource-state.ts";
import type { CharacterRuntimeState } from "./types.ts";

function buildAuthoritativeResourcePools(
  state: CharacterRuntimeState,
): Array<{
  resourceName: string;
  maxUses: number;
  resetOn: "short" | "long";
  sourceName: string;
}> {
  const definitions = new Map<
    string,
    {
      resourceName: string;
      maxUses: number;
      resetOn: "short" | "long";
      sourceName: string;
    }
  >();

  for (const resource of state.resources) {
    definitions.set(resource.name, {
      resourceName: resource.name,
      maxUses: resource.maxUses,
      resetOn: resource.resetOn,
      sourceName: resource.sourceName,
    });
  }

  for (const slotPool of buildSpellSlotPoolDefinitions(state.spellcasting?.slotPools ?? [])) {
    definitions.set(slotPool.resourceName, {
      resourceName: slotPool.resourceName,
      maxUses: slotPool.total,
      resetOn: slotPool.resetOn,
      sourceName: slotPool.source,
    });
  }

  return [...definitions.values()].sort((left, right) =>
    left.resourceName.localeCompare(right.resourceName)
  );
}

export async function syncCharacterDerivedState(
  characterId: string,
): Promise<CharacterRuntimeState | null> {
  const rows = await loadCharacterProjectionRows(characterId);
  const runtimeState = buildCharacterRuntimeStateFromRows(characterId, rows);

  if (!runtimeState) {
    return null;
  }

  const authoritativePools = buildAuthoritativeResourcePools(runtimeState);
  await syncCharacterResourcePools({
    characterId,
    pools: authoritativePools,
  });

  const syncedRows = await loadCharacterProjectionRows(characterId);
  return buildCharacterRuntimeStateFromRows(characterId, syncedRows);
}
