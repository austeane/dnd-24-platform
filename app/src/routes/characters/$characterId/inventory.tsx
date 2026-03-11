import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { InventoryPanel } from "../../../components/tavern/character/InventoryPanel.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import {
  fetchInventoryItemsData,
  type TavernInventoryItemsData,
  type TavernShellData,
} from "./-server.ts";

const parentApi = getRouteApi("/characters/$characterId");

function toInventoryPanelProps(
  items: TavernInventoryItemsData,
  runtime: TavernShellData["inventoryRuntime"],
) {
  return {
    equippedItems: items.equippedItems,
    carriedItems: items.carriedItems,
    attackProfiles: runtime.attackProfiles,
    resources: runtime.resources,
  };
}

export const Route = createFileRoute(
  "/characters/$characterId/inventory",
)({
  loader: ({ params }) =>
    fetchInventoryItemsData({
      data: { characterId: params.characterId },
    }),
  component: InventoryRoute,
});

function InventoryRoute() {
  const items = Route.useLoaderData();
  const { inventoryRuntime } = parentApi.useLoaderData();
  const props = toInventoryPanelProps(items, inventoryRuntime);

  return (
    <div className="animate-fade-up space-y-4 py-4">
      <h1
        className="font-heading text-2xl font-bold text-ink"
        {...{
          [TAVERN_ROUTE_HEADING_ATTR]: "true",
        }}
        tabIndex={-1}
      >
        Inventory
      </h1>
      <InventoryPanel {...props} />
    </div>
  );
}
