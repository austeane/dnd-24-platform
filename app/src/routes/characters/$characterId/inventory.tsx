import {
  createFileRoute,
  getRouteApi,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { InventoryPanel } from "../../../components/tavern/character/InventoryPanel.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import {
  type CharacterTabResponse,
  fetchInventoryItemsData,
  restoreCharacterResource,
  spendCharacterResource,
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
    }).then((response: CharacterTabResponse<TavernInventoryItemsData>) => {
      if (response.redirectTo) {
        throw redirect({ href: response.redirectTo });
      }

      return response.data;
    }),
  component: InventoryRoute,
});

function InventoryRoute() {
  const items = Route.useLoaderData();
  const data = parentApi.useLoaderData();
  const router = useRouter();
  const { inventoryRuntime } = data;
  const props = toInventoryPanelProps(items, inventoryRuntime);

  async function mutate(action: () => Promise<unknown>) {
    await action();
    await router.invalidate();
  }

  return (
    <div className="animate-fade-up space-y-4 py-4">
      <header className="tavern-page-header">
        <div className="tavern-page-kicker">Equipment & Resources</div>
        <h1
          className="font-heading text-2xl font-bold text-ink"
          {...{
            [TAVERN_ROUTE_HEADING_ATTR]: "true",
          }}
          tabIndex={-1}
        >
          Inventory
        </h1>
        <p className="text-sm text-ink-soft">
          Review equipped gear, attack profiles, and class resources without leaving the Tavern.
        </p>
      </header>
      <InventoryPanel
        {...props}
        editable={data.viewer.canEditCharacter}
        onSpendResource={(resourceName) =>
          mutate(() =>
            spendCharacterResource({
              data: {
                characterId: data.character.id,
                resourceName,
              },
            }),
          )
        }
        onRestoreResource={(resourceName) =>
          mutate(() =>
            restoreCharacterResource({
              data: {
                characterId: data.character.id,
                resourceName,
              },
            }),
          )
        }
      />
    </div>
  );
}
