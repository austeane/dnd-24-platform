import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { InventoryPanel } from "../../../components/tavern/character/InventoryPanel.tsx";
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
    <div className="animate-fade-up py-4">
      <InventoryPanel {...props} />
    </div>
  );
}
