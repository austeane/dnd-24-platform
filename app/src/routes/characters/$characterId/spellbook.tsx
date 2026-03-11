import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
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
    <div className="animate-fade-up space-y-4 py-4">
      <h1
        className="font-heading text-2xl font-bold text-ink"
        {...{
          [TAVERN_ROUTE_HEADING_ATTR]: "true",
        }}
        tabIndex={-1}
      >
        Spellbook
      </h1>
      <SpellsPanel {...spellbook} />
    </div>
  );
}
