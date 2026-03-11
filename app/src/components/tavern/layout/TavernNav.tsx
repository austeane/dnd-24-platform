import { Link, useMatches, type LinkProps } from "@tanstack/react-router";

export interface TavernNavProps {
  brandName?: string;
  campaignName?: string;
  characterId?: string;
}

interface NavTab {
  label: string;
  to: string;
}

export function TavernNav({
  brandName = "Hearthstone",
  campaignName,
  characterId,
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

  return (
    <nav className="tavern-nav" aria-label="Main navigation">
      <div className="relative z-10 mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link
          to="/"
          className="font-heading text-lg font-bold text-cream hover:text-brass transition-colors"
        >
          {brandName}
        </Link>

        {campaignName && (
          <span className="hidden text-sm text-cream/60 sm:inline">
            {campaignName}
          </span>
        )}

        {characterTabs.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
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
                  className={`rounded-[var(--radius-button)] px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-cream/15 text-cream"
                      : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
