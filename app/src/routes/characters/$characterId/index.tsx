import { createFileRoute, getRouteApi, useRouter } from "@tanstack/react-router";
import { AbilityScoreRow } from "../../../components/tavern/character/AbilityScoreRow.tsx";
import { CharacterCard } from "../../../components/tavern/character/CharacterCard.tsx";
import { CombatPanel } from "../../../components/tavern/character/CombatPanel.tsx";
import { FeaturesPanel } from "../../../components/tavern/character/FeaturesPanel.tsx";
import { SkillsPanel } from "../../../components/tavern/character/SkillsPanel.tsx";
import { XPProgressBar } from "../../../components/tavern/character/XPProgressBar.tsx";
import {
  applyCharacterCondition,
  applyCharacterDamage,
  clearCharacterTemporaryHitPoints,
  grantTemporaryHitPoints,
  healCharacter,
  performCharacterLongRest,
  performCharacterShortRest,
  removeCharacterCondition,
} from "./-server.ts";
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
  const data = parentApi.useLoaderData();
  const router = useRouter();
  const editable = data.viewer.canEditCharacter;

  async function mutate(action: () => Promise<unknown>) {
    await action();
    await router.invalidate();
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <CharacterCard {...toCharacterCardProps(data)} />
      <XPProgressBar {...toXPBarProps(data)} />
      <AbilityScoreRow abilities={toAbilityScoreProps(data)} />
      <div className="content-grid">
        <CombatPanel
          {...toCombatPanelProps(data)}
          editable={editable}
          onApplyDamage={(amount) =>
            mutate(() =>
              applyCharacterDamage({
                data: { characterId: data.character.id, amount },
              }),
            )
          }
          onHeal={(amount) =>
            mutate(() =>
              healCharacter({
                data: { characterId: data.character.id, amount },
              }),
            )
          }
          onGainTempHp={(amount) =>
            mutate(() =>
              grantTemporaryHitPoints({
                data: { characterId: data.character.id, amount },
              }),
            )
          }
          onClearTempHp={() =>
            mutate(() =>
              clearCharacterTemporaryHitPoints({
                data: { characterId: data.character.id },
              }),
            )
          }
          onShortRest={() =>
            mutate(() =>
              performCharacterShortRest({
                data: { characterId: data.character.id },
              }),
            )
          }
          onLongRest={() =>
            mutate(() =>
              performCharacterLongRest({
                data: { characterId: data.character.id },
              }),
            )
          }
          onApplyCondition={(conditionName) =>
            mutate(() =>
              applyCharacterCondition({
                data: { characterId: data.character.id, conditionName },
              }),
            )
          }
          onRemoveCondition={(conditionId) =>
            mutate(() =>
              removeCharacterCondition({
                data: { characterId: data.character.id, conditionId },
              }),
            )
          }
        />
        <SkillsPanel {...toSkillsPanelProps(data)} />
        <FeaturesPanel {...toFeaturesPanelProps(data)} />
      </div>
    </div>
  );
}
