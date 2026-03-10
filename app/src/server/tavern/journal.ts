import { eq } from "drizzle-orm";
import { listPlayerCommunicationCards } from "../communication/service.ts";
import { db } from "../db/index.ts";
import { characters } from "../db/schema/index.ts";
import type { CommunicationKind } from "../db/schema/index.ts";

export interface JournalCard {
  id: string;
  title: string;
  bodyMd: string;
  summary: string | null;
  category: CommunicationKind;
  isPinned: boolean;
  publishedAt: string;
}

export interface JournalData {
  cards: JournalCard[];
}

export async function getJournalData(
  characterId: string,
): Promise<JournalData> {
  const [character] = await db
    .select({ campaignId: characters.campaignId })
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!character) {
    return { cards: [] };
  }

  const playerCards = await listPlayerCommunicationCards(
    character.campaignId,
    characterId,
  );

  const cards: JournalCard[] = playerCards.map((card) => ({
    id: card.id,
    title: card.title,
    bodyMd: card.bodyMd,
    summary: card.summary,
    category: card.kind,
    isPinned: card.isPinned,
    publishedAt: card.publishedAt.toISOString(),
  }));

  return { cards };
}
