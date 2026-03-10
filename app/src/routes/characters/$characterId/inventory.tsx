import { createFileRoute } from "@tanstack/react-router";
import { InventoryPanel } from "../../../components/tavern/character/InventoryPanel.tsx";
import type { InventoryPanelProps } from "../../../components/tavern/character/InventoryPanel.tsx";
import { fetchInventoryData, type InventoryData } from "./-server.ts";

function formatAttackBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function toInventoryPanelProps(data: InventoryData): InventoryPanelProps {
  return {
    equippedItems: data.equippedItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      equipped: item.equipped,
      slot: item.slot,
    })),
    carriedItems: data.carriedItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      equipped: item.equipped,
      slot: item.slot,
    })),
    attackProfiles: data.attackProfiles.map((profile) => ({
      weaponName: profile.weaponName,
      attackBonus: formatAttackBonus(profile.attackBonus),
      damage: profile.damage,
      damageType: profile.damageType,
      properties: profile.properties,
      masteryProperty: profile.masteryProperty,
    })),
    resources: data.resources.map((resource) => ({
      name: resource.name,
      current: resource.current,
      max: resource.max,
      rechargeOn: resource.rechargeOn,
      source: resource.source,
    })),
  };
}

export const Route = createFileRoute(
  "/characters/$characterId/inventory",
)({
  loader: async ({ params }) => {
    const data = await fetchInventoryData({
      data: { characterId: params.characterId },
    });
    return { inventory: data };
  },
  component: InventoryRoute,
});

function InventoryRoute() {
  const { inventory } = Route.useLoaderData();
  const props = toInventoryPanelProps(inventory);

  return (
    <div className="animate-fade-up py-4">
      <InventoryPanel {...props} />
    </div>
  );
}
