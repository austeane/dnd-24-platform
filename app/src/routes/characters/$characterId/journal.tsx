import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  JournalPanel,
  type JournalCardProps,
} from "../../../components/tavern/character/JournalPanel.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import {
  type CharacterTabResponse,
  fetchJournalData,
  type TavernJournalData,
} from "./-server.ts";

export function toJournalCardProps(
  cards: TavernJournalData["cards"],
): JournalCardProps[] {
  return cards.map((card) => ({
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
    }).then((response: CharacterTabResponse<TavernJournalData>) => {
      if (response.redirectTo) {
        throw redirect({ href: response.redirectTo });
      }

      return response.data;
    }),
  component: JournalRoute,
});

function JournalRoute() {
  const data = Route.useLoaderData();
  return (
    <div className="animate-fade-up space-y-4">
      <header className="tavern-page-header">
        <div className="tavern-page-kicker">Session Notes</div>
        <h1
          className="font-heading text-2xl font-bold text-ink"
          {...{
            [TAVERN_ROUTE_HEADING_ATTR]: "true",
          }}
          tabIndex={-1}
        >
          Journal
        </h1>
        <p className="text-sm text-ink-soft">
          Read handouts, rulings, and pinned table notes published for this character.
        </p>
      </header>
      <JournalPanel cards={toJournalCardProps(data.cards)} />
    </div>
  );
}
