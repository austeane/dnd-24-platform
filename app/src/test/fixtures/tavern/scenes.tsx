import { HomePageView } from "../../../components/tavern/home/HomePageView.tsx";
import { AbilityScoreRow } from "../../../components/tavern/character/AbilityScoreRow.tsx";
import { CharacterCard } from "../../../components/tavern/character/CharacterCard.tsx";
import { CombatPanel } from "../../../components/tavern/character/CombatPanel.tsx";
import { CompendiumPanel } from "../../../components/tavern/character/CompendiumPanel.tsx";
import { FeaturesPanel } from "../../../components/tavern/character/FeaturesPanel.tsx";
import { InventoryPanel } from "../../../components/tavern/character/InventoryPanel.tsx";
import { JournalPanel } from "../../../components/tavern/character/JournalPanel.tsx";
import { SkillsPanel } from "../../../components/tavern/character/SkillsPanel.tsx";
import { SpellsPanel } from "../../../components/tavern/character/SpellsPanel.tsx";
import { XPProgressBar } from "../../../components/tavern/character/XPProgressBar.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import type {
  TavernCompendiumViewFixture,
  TavernFixtureBundle,
} from "./fixtures.ts";
import {
  toAbilityScoreProps,
  toCharacterCardProps,
  toCombatPanelProps,
  toFeaturesPanelProps,
  toSkillsPanelProps,
  toXPBarProps,
} from "../../../routes/characters/$characterId/-adapters.ts";

export function TavernHomeFixtureScene({
  fixture,
}: {
  fixture: TavernFixtureBundle["home"];
}) {
  return <HomePageView campaigns={fixture.campaigns} />;
}

export function TavernCharacterFixtureScene({
  fixture,
}: {
  fixture: TavernFixtureBundle["shell"];
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <CharacterCard {...toCharacterCardProps(fixture)} />
      <XPProgressBar {...toXPBarProps(fixture)} />
      <AbilityScoreRow abilities={toAbilityScoreProps(fixture)} />
      <div className="content-grid">
        <CombatPanel {...toCombatPanelProps(fixture)} />
        <SkillsPanel {...toSkillsPanelProps(fixture)} />
        <FeaturesPanel {...toFeaturesPanelProps(fixture)} />
      </div>
    </div>
  );
}

export function TavernSpellbookFixtureScene({
  fixture,
}: {
  fixture: TavernFixtureBundle["shell"]["spellbook"];
}) {
  return (
    <div className="animate-fade-up space-y-4 py-4">
      <FixtureHeading>Spellbook</FixtureHeading>
      <SpellsPanel {...fixture} />
    </div>
  );
}

export function TavernInventoryFixtureScene({
  fixture,
}: {
  fixture: TavernFixtureBundle["inventory"];
}) {
  return (
    <div className="animate-fade-up space-y-4 py-4">
      <FixtureHeading>Inventory</FixtureHeading>
      <InventoryPanel {...fixture} />
    </div>
  );
}

export function TavernJournalFixtureScene({
  fixture,
}: {
  fixture: TavernFixtureBundle["journal"];
}) {
  return (
    <div className="animate-fade-up space-y-4">
      <FixtureHeading>Journal</FixtureHeading>
      <JournalPanel cards={fixture.cards} />
    </div>
  );
}

export function TavernCompendiumFixtureScene({
  fixture,
}: {
  fixture: TavernCompendiumViewFixture;
}) {
  return (
    <div className="animate-fade-up space-y-4">
      <FixtureHeading>Compendium</FixtureHeading>
      <CompendiumPanel
        entries={fixture.data.entries}
        totalCount={fixture.data.totalCount}
        availableTypes={fixture.data.availableTypes}
        availablePacks={fixture.data.availablePacks}
        detail={fixture.data.detail}
        query={fixture.query}
        activeType={fixture.activeType}
        activePack={fixture.activePack}
        onQueryChange={() => undefined}
        onTypeChange={() => undefined}
        onPackChange={() => undefined}
        onEntrySelect={() => undefined}
        onBackToList={() => undefined}
      />
    </div>
  );
}

function FixtureHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="font-heading text-2xl font-bold text-ink"
      {...{
        [TAVERN_ROUTE_HEADING_ATTR]: "true",
      }}
      tabIndex={-1}
    >
      {children}
    </h1>
  );
}
