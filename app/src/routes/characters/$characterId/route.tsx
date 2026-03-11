import {
  Outlet,
  createFileRoute,
  notFound,
} from "@tanstack/react-router";
import { TavernLayout } from "../../../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../../../components/tavern/layout/TavernNav.tsx";
import { ErrorCard } from "../../../components/tavern/ui/ErrorCard.tsx";
import { Loading } from "../../../components/tavern/ui/Loading.tsx";
import { NotFound } from "../../../components/tavern/ui/NotFound.tsx";
import type { TavernShellData } from "./-server.ts";
import { fetchCharacterShellData } from "./-server.ts";

const characterRouteId = "/characters/$characterId" as const;

export function requireCharacterShellData(
  data: TavernShellData | null,
): TavernShellData {
  if (!data) {
    throw notFound({ routeId: characterRouteId });
  }

  return data;
}

export async function loadCharacterShellData(
  characterId: string,
): Promise<TavernShellData> {
  const data = await fetchCharacterShellData({
    data: { characterId },
  });

  return requireCharacterShellData(data);
}

export const Route = createFileRoute("/characters/$characterId")({
  loader: ({ params }) => loadCharacterShellData(params.characterId),
  pendingComponent: CharacterShellPending,
  errorComponent: CharacterShellError,
  notFoundComponent: CharacterShellNotFound,
  component: CharacterShellLayout,
});

function CharacterShellLayout() {
  const data = Route.useLoaderData();

  return (
    <>
      <TavernNav
        campaignName={data.campaign.name}
        characterId={data.character.id}
      />
      <TavernLayout>
        <Outlet />
      </TavernLayout>
    </>
  );
}

function CharacterShellPending() {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <Loading label="Loading character..." />
      </TavernLayout>
    </>
  );
}

function CharacterShellError({ error }: { error: Error }) {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <ErrorCard
          title="Failed to load character"
          message={error.message}
        />
      </TavernLayout>
    </>
  );
}

function CharacterShellNotFound() {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <NotFound entity="Character" />
      </TavernLayout>
    </>
  );
}
