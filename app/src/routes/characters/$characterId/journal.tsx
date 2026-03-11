import { createFileRoute } from "@tanstack/react-router";
import {
  JournalPanel,
  type JournalCardProps,
} from "../../../components/tavern/character/JournalPanel.tsx";
import { fetchJournalData } from "./-server.ts";

export function toJournalCardProps(
  cards: Awaited<ReturnType<typeof fetchJournalData>>["cards"],
): JournalCardProps[] {
  return cards.map((card: Awaited<ReturnType<typeof fetchJournalData>>["cards"][number]) => ({
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
  loader: ({ params }) =>
    fetchJournalData({
      data: { characterId: params.characterId },
    }),
  component: JournalRoute,
});

function JournalRoute() {
  const data = Route.useLoaderData();
  return (
    <div className="animate-fade-up">
      <JournalPanel cards={toJournalCardProps(data.cards)} />
    </div>
  );
}
