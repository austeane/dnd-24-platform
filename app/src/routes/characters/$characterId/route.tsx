import { Outlet, createFileRoute } from "@tanstack/react-router";
import { TavernLayout } from "../../../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../../../components/tavern/layout/TavernNav.tsx";
import { ErrorCard } from "../../../components/tavern/ui/ErrorCard.tsx";
import { Loading } from "../../../components/tavern/ui/Loading.tsx";
import { NotFound } from "../../../components/tavern/ui/NotFound.tsx";
import type { CharacterShellData } from "./-server.ts";
import { fetchCharacterShellData } from "./-server.ts";

export const Route = createFileRoute("/characters/$characterId")({
  loader: (async ({ params }: { params: { characterId: string } }) => {
    const data = await fetchCharacterShellData({
      data: { characterId: params.characterId },
    });

    if (!data) {
      throw new Error("Character not found");
    }

    return data;
  }) as never,
  pendingComponent: CharacterShellPending,
  errorComponent: CharacterShellError,
  notFoundComponent: CharacterShellNotFound,
  component: CharacterShellLayout,
});

function CharacterShellLayout() {
  // Cast useLoaderData since the loader's return type is erased by `as never`
  const data = Route.useLoaderData() as CharacterShellData;

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
