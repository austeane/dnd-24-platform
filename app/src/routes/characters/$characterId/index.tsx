import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { AbilityScoreRow } from "../../../components/tavern/character/AbilityScoreRow.tsx";
import { CharacterCard } from "../../../components/tavern/character/CharacterCard.tsx";
import { CombatPanel } from "../../../components/tavern/character/CombatPanel.tsx";
import { FeaturesPanel } from "../../../components/tavern/character/FeaturesPanel.tsx";
import { SkillsPanel } from "../../../components/tavern/character/SkillsPanel.tsx";
import { XPProgressBar } from "../../../components/tavern/character/XPProgressBar.tsx";
import type { CharacterShellData } from "./-server.ts";
import {
  toAbilityScoreProps,
  toCharacterCardProps,
  toCombatPanelProps,
  toFeaturesPanelProps,
  toSkillsPanelProps,
  toXPBarProps,
} from "./-adapters.ts";

const parentApi = getRouteApi("/characters/$characterId");

export const Route = createFileRoute("/characters/$characterId/")({
  component: CharacterTab,
});

function CharacterTab() {
  // Cast required: parent loader type is erased due to serialization workaround
  const data = parentApi.useLoaderData() as CharacterShellData;

  return (
    <div className="space-y-4 animate-fade-up">
      <CharacterCard {...toCharacterCardProps(data)} />
      <XPProgressBar {...toXPBarProps(data)} />
      <AbilityScoreRow abilities={toAbilityScoreProps(data)} />
      <div className="content-grid">
        <CombatPanel {...toCombatPanelProps(data)} />
        <SkillsPanel {...toSkillsPanelProps(data)} />
        <FeaturesPanel {...toFeaturesPanelProps(data)} />
      </div>
    </div>
  );
}
