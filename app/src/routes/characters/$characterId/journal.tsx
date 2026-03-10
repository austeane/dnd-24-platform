import { createFileRoute } from "@tanstack/react-router";
import {
  JournalPanel,
  type JournalCardProps,
} from "../../../components/tavern/character/JournalPanel.tsx";
import { fetchJournalData, type JournalData } from "./-server.ts";

function toJournalCardProps(data: JournalData): JournalCardProps[] {
  return data.cards.map((card) => ({
    id: card.id,
    title: card.title,
    bodyMd: card.bodyMd,
    summary: card.summary,
    category: card.category,
    isPinned: card.isPinned,
    publishedAt: card.publishedAt,
  }));
}

export const Route = createFileRoute(
  "/characters/$characterId/journal",
)({
  loader: async ({ params }) => {
    return fetchJournalData({
      data: { characterId: params.characterId },
    });
  },
  component: JournalRoute,
});

function JournalRoute() {
  const data = Route.useLoaderData();
  const cards = toJournalCardProps(data);
  return (
    <div className="animate-fade-up">
      <JournalPanel cards={cards} />
    </div>
  );
}
