import { Link, createFileRoute } from "@tanstack/react-router";
import { TavernLayout } from "../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../components/tavern/layout/TavernNav.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../components/tavern/layout/accessibility.ts";
import { Card } from "../components/tavern/ui/Card.tsx";
import { ErrorCard } from "../components/tavern/ui/ErrorCard.tsx";
import { Loading } from "../components/tavern/ui/Loading.tsx";
import { StatBadge } from "../components/tavern/ui/StatBadge.tsx";
import { fetchHomeData } from "./index/-server.ts";
import { toHomePageProps, type CampaignCardProps, type RosterCardProps } from "./index/-adapters.ts";

export const Route = createFileRoute("/")({
  loader: async () => {
    const data = await fetchHomeData();
    return toHomePageProps(data);
  },
  pendingComponent: HomePending,
  errorComponent: HomeError,
  component: HomePage,
});

function HomePage() {
  const { campaigns } = Route.useLoaderData();

  return (
    <>
      <TavernNav />
      <TavernLayout>
        <div className="space-y-8 animate-fade-up">
          <header className="text-center">
            <h1
              className="font-heading text-3xl font-bold text-ink sm:text-4xl"
              {...{
                [TAVERN_ROUTE_HEADING_ATTR]: "true",
              }}
              tabIndex={-1}
            >
              Campaign Platform
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              D&D 2024 with Advanced Adventurers support
            </p>
          </header>

          {campaigns.map((campaign) => (
            <CampaignSection key={campaign.campaignId} campaign={campaign} />
          ))}
        </div>
      </TavernLayout>
    </>
  );
}

function CampaignSection({ campaign }: { campaign: CampaignCardProps }) {
  const modeLabels: Record<string, string> = {
    "aa-only": "AA Only",
    hybrid: "Hybrid",
    standard: "Standard",
  };

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-heading text-xl font-bold text-ink">
          {campaign.campaignName}
        </h2>
        <StatBadge
          label={modeLabels[campaign.progressionMode] ?? campaign.progressionMode}
          variant="forest"
        />
        <span className="text-xs text-ink-soft">
          {campaign.characterCount} character{campaign.characterCount !== 1 ? "s" : ""}
          {" \u00B7 "}
          {campaign.sessionCount} session{campaign.sessionCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {campaign.roster.map((entry) => (
          <RosterCard key={entry.characterId} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function RosterCard({ entry }: { entry: RosterCardProps }) {
  return (
    <Link
      to="/characters/$characterId"
      params={{ characterId: entry.characterId }}
      aria-label={`Open ${entry.characterName}`}
      className="block transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment font-heading text-lg font-bold text-wood">
            {entry.characterName.charAt(0)}
          </div>
          <div>
            <div className="font-heading text-base font-bold text-ink">
              {entry.characterName}
            </div>
            {entry.ownerLabel && (
              <div className="text-xs text-ink-soft">
                {entry.ownerLabel}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function HomePending() {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <Loading label="Loading campaigns..." />
      </TavernLayout>
    </>
  );
}

function HomeError({ error }: { error: Error }) {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <ErrorCard
          title="Failed to load campaigns"
          message={error.message}
        />
      </TavernLayout>
    </>
  );
}
