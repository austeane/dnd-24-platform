import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SpellsPanel } from "../../../components/tavern/character/SpellsPanel.tsx";

const parentApi = getRouteApi("/characters/$characterId");

export const Route = createFileRoute(
  "/characters/$characterId/spellbook",
)({
  component: SpellbookRoute,
});

function SpellbookRoute() {
  const { spellbook } = parentApi.useLoaderData();

  return (
    <div className="animate-fade-up py-4">
      <SpellsPanel {...spellbook} />
    </div>
  );
}
