import { TAVERN_ROUTE_HEADING_ATTR } from "../layout/accessibility.ts";
import { TavernLayout } from "../layout/TavernLayout.tsx";
import { Card } from "../ui/Card.tsx";
import { StatBadge } from "../ui/StatBadge.tsx";

export interface HomeRosterCardProps {
  characterId: string;
  characterName: string;
  ownerLabel: string | null;
  launchHref: string;
  requiresAccess: boolean;
}

export interface HomeCampaignCardProps {
  campaignId: string;
  campaignSlug: string;
  campaignName: string;
  progressionMode: string;
  characterCount: number;
  sessionCount: number;
  viewer: {
    role: "dm" | "player";
    characterId: string | null;
    sessionLabel?: string | null;
  } | null;
  dmHref: string;
  dmRequiresAccess: boolean;
  roster: HomeRosterCardProps[];
}

export interface HomePageViewProps {
  campaigns: HomeCampaignCardProps[];
}

export function HomePageView({ campaigns }: HomePageViewProps) {
  return (
    <TavernLayout>
      <div className="space-y-8 animate-fade-up">
        <header className="home-hero">
          <div className="tavern-page-kicker">Warm Tavern</div>
          <h1
            className="font-heading text-3xl font-bold text-ink sm:text-5xl"
            {...{
              [TAVERN_ROUTE_HEADING_ATTR]: "true",
            }}
            tabIndex={-1}
          >
            Campaign Platform
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-soft sm:text-base">
            Launch characters, switch campaigns, and step directly into the live Tavern session flow.
          </p>
        </header>

        {campaigns.map((campaign) => (
          <CampaignSection key={campaign.campaignId} campaign={campaign} />
        ))}
      </div>
    </TavernLayout>
  );
}

function CampaignSection({ campaign }: { campaign: HomeCampaignCardProps }) {
  const modeLabels: Record<string, string> = {
    "aa-only": "AA Only",
    hybrid: "Hybrid",
    standard: "Standard",
  };

  return (
    <section className="campaign-shell">
      <div className="campaign-shell-header">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-ink">
            {campaign.campaignName}
          </h2>
          <StatBadge
            label={modeLabels[campaign.progressionMode] ?? campaign.progressionMode}
            variant="forest"
          />
          <span className="campaign-stats">
            {campaign.characterCount} character{campaign.characterCount !== 1 ? "s" : ""}
            {" \u00B7 "}
            {campaign.sessionCount} session{campaign.sessionCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {campaign.viewer && (
            <span className="rounded-[var(--radius-tag)] bg-wood/10 px-2 py-1 text-[11px] font-medium text-wood">
              Signed in as {campaign.viewer.role === "dm" ? "DM" : "Player"}
            </span>
          )}
          <a
            href={campaign.dmHref}
            className="btn btn-outline"
          >
            {campaign.dmRequiresAccess ? "DM Access" : "DM Dashboard"}
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {campaign.roster.map((entry) => (
          <RosterCard key={entry.characterId} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function RosterCard({ entry }: { entry: HomeRosterCardProps }) {
  return (
    <a
      href={entry.launchHref}
      aria-label={`Open ${entry.characterName}`}
      className="roster-card"
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="roster-avatar">
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
            <div className="mt-1 text-[11px] font-medium text-wood">
              {entry.requiresAccess ? "Enter with password" : "Open character"}
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}
