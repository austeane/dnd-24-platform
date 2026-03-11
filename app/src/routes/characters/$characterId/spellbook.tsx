import { createFileRoute, getRouteApi, useRouter } from "@tanstack/react-router";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import { SpellsPanel } from "../../../components/tavern/character/SpellsPanel.tsx";
import {
  spendCharacterFreeCast,
  spendCharacterSpellSlot,
} from "./-server.ts";

const parentApi = getRouteApi("/characters/$characterId");

export const Route = createFileRoute(
  "/characters/$characterId/spellbook",
)({
  component: SpellbookRoute,
});

function SpellbookRoute() {
  const data = parentApi.useLoaderData();
  const router = useRouter();

  async function mutate(action: () => Promise<unknown>) {
    await action();
    await router.invalidate();
  }

  return (
    <div className="animate-fade-up space-y-4 py-4">
      <header className="tavern-page-header">
        <div className="tavern-page-kicker">Character Magic</div>
        <h1
          className="font-heading text-2xl font-bold text-ink"
          {...{
            [TAVERN_ROUTE_HEADING_ATTR]: "true",
          }}
          tabIndex={-1}
        >
          Spellbook
        </h1>
        <p className="text-sm text-ink-soft">
          Track prepared spells, spend slots, and use free casts from the live sheet.
        </p>
      </header>
      <SpellsPanel
        {...data.spellbook}
        editable={data.viewer.canEditCharacter}
        onSpendSlot={(slot) =>
          mutate(() =>
            spendCharacterSpellSlot({
              data: {
                characterId: data.character.id,
                slotLevel: slot.level,
                isPactMagic: slot.kind === "pact",
              },
            }),
          )
        }
        onSpendFreeCast={(spellName) =>
          mutate(() =>
            spendCharacterFreeCast({
              data: {
                characterId: data.character.id,
                spellName,
              },
            }),
          )
        }
      />
    </div>
  );
}
