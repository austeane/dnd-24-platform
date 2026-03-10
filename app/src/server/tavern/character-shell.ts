import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { campaigns, characters } from "../db/schema/index.ts";
import { getCharacterRuntimeState } from "../progression/character-state.ts";
import type { CharacterRuntimeState } from "../progression/types.ts";

export interface CharacterShellData {
  campaign: {
    id: string;
    name: string;
    progressionMode: string;
  };
  character: {
    id: string;
    slug: string;
    name: string;
    ownerLabel: string | null;
  };
  runtime: CharacterRuntimeState;
}

export async function getCharacterShellData(
  characterId: string,
): Promise<CharacterShellData | null> {
  // Look up the character and its campaign in a single join
  const [row] = await db
    .select({
      characterId: characters.id,
      characterSlug: characters.slug,
      characterName: characters.name,
      ownerLabel: characters.ownerLabel,
      campaignId: characters.campaignId,
      campaignName: campaigns.name,
      progressionMode: campaigns.progressionMode,
    })
    .from(characters)
    .innerJoin(campaigns, eq(characters.campaignId, campaigns.id))
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!row) {
    return null;
  }

  const runtime = await getCharacterRuntimeState(characterId);
  if (!runtime) {
    return null;
  }

  return {
    campaign: {
      id: row.campaignId,
      name: row.campaignName,
      progressionMode: row.progressionMode,
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
