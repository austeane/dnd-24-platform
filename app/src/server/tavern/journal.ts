import { listPlayerCommunicationCards } from "../communication/service.ts";
import { getTavernCharacterContext } from "./context.ts";
import type { TavernJournalData } from "./types.ts";

export async function getJournalData(
  characterId: string,
): Promise<TavernJournalData> {
  const context = await getTavernCharacterContext(characterId, {
    includeRuntime: false,
  });
  if (!context) {
    return { cards: [] };
  }

  const playerCards = await listPlayerCommunicationCards(
    context.campaign.id,
    characterId,
  );

  return {
    cards: playerCards.map((card) => ({
      id: card.id,
      title: card.title,
      bodyMd: card.bodyMd,
      summary: card.summary,
      category: card.kind,
      isPinned: card.isPinned,
      publishedAt: card.publishedAt.toISOString(),
    })),
  };
}
