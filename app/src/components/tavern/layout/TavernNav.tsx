import { Link, useMatches, type LinkProps } from "@tanstack/react-router";
import type { TavernViewer } from "../../../server/tavern/types.ts";

export interface TavernNavProps {
  brandName?: string;
  campaignId?: string;
  campaignSlug?: string;
  campaignName?: string;
  characterId?: string;
  viewer?: TavernViewer;
  isLoggingOut?: boolean;
  onLogout?: () => void;
}

interface NavTab {
  label: string;
  to: string;
}

export function TavernNav({
  brandName = "Campaignion",
  campaignId,
  campaignSlug,
  campaignName,
  characterId,
  viewer,
  isLoggingOut = false,
  onLogout,
}: TavernNavProps) {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const currentPath = lastMatch?.pathname ?? "/";

  const characterTabs: NavTab[] = characterId
    ? [
        { label: "Character", to: `/characters/${characterId}` },
        { label: "Spellbook", to: `/characters/${characterId}/spellbook` },
        { label: "Inventory", to: `/characters/${characterId}/inventory` },
        { label: "Journal", to: `/characters/${characterId}/journal` },
        { label: "Compendium", to: `/characters/${characterId}/compendium` },
      ]
    : [];

  const viewerLabel = viewer
    ? viewer.role === "dm"
      ? "DM"
      : "Player"
    : null;
  const dmDashboardPath = campaignSlug ? `/campaigns/${campaignSlug}/dm` : null;
  const showDashboardLink =
    viewer?.canManageCampaign &&
    campaignSlug &&
    dmDashboardPath !== null &&
    currentPath !== dmDashboardPath;

  return (
    <nav className="tavern-nav" aria-label="Main navigation">
      <div className="tavern-nav-shell">
        <Link to="/" className="tavern-nav-brand">
          <span className="nav-brand-icon" aria-hidden="true">
            &#9878;
          </span>
          <span>{brandName}</span>
        </Link>

        {characterTabs.length > 0 && (
          <div className="tavern-nav-tabs" role="list">
            {characterTabs.map((tab) => {
              const isActive =
                currentPath === tab.to ||
                (tab.to === `/characters/${characterId}` &&
                  currentPath === `/characters/${characterId}/`);

              const linkProps: LinkProps = {
                to: tab.to as never,
                search: {} as never,
              };

              return (
                <Link
                  key={tab.to}
                  {...linkProps}
                  aria-current={isActive ? "page" : undefined}
                  className={`tavern-nav-tab ${isActive ? "is-active" : ""}`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}

        <div className="tavern-nav-right">
          {campaignName && (
            <span className="campaign-badge">
              {viewerLabel ? `${campaignName} · ${viewerLabel}` : campaignName}
            </span>
          )}
          {showDashboardLink && (
            <Link
              to="/campaigns/$campaignSlug/dm"
              params={{ campaignSlug }}
              className="tavern-nav-utility"
            >
              Dashboard
            </Link>
          )}
          {viewer && campaignId && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="tavern-nav-button"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
