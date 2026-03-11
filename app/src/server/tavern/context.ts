import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { campaigns, characters } from "../db/schema/index.ts";
import { getCharacterRuntimeState } from "../progression/character-state.ts";
import type { CharacterRuntimeState } from "../progression/types.ts";
import { DEFAULT_ENABLED_PACK_IDS } from "./packs.ts";
import type { TavernCampaignData, TavernCharacterData } from "./types.ts";

export interface TavernCharacterContext {
  campaign: TavernCampaignData;
  character: TavernCharacterData;
  runtime: CharacterRuntimeState | null;
}

export async function getTavernCharacterContext(
  characterId: string,
  options: { includeRuntime?: boolean } = {},
): Promise<TavernCharacterContext | null> {
  const [row] = await db
    .select({
      characterId: characters.id,
      characterSlug: characters.slug,
      characterName: characters.name,
      ownerLabel: characters.ownerLabel,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      progressionMode: campaigns.progressionMode,
      enabledPackIds: campaigns.enabledPackIds,
    })
    .from(characters)
    .innerJoin(campaigns, eq(characters.campaignId, campaigns.id))
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!row) {
    return null;
  }

  const includeRuntime = options.includeRuntime ?? true;
  const runtime = includeRuntime
    ? await getCharacterRuntimeState(characterId)
    : null;

  if (includeRuntime && !runtime) {
    return null;
  }

  return {
    campaign: {
      id: row.campaignId,
      name: row.campaignName,
      progressionMode: row.progressionMode,
      enabledPackIds:
        row.enabledPackIds.length > 0
          ? [...new Set(row.enabledPackIds)]
          : DEFAULT_ENABLED_PACK_IDS,
    },
    character: {
      id: row.characterId,
      slug: row.characterSlug,
      name: row.characterName,
      ownerLabel: row.ownerLabel,
    },
    runtime,
  };
}
