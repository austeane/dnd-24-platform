import {
  Outlet,
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { startTransition, useState } from "react";
import { TavernLayout } from "../../../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../../../components/tavern/layout/TavernNav.tsx";
import { ErrorCard } from "../../../components/tavern/ui/ErrorCard.tsx";
import { Loading } from "../../../components/tavern/ui/Loading.tsx";
import { NotFound } from "../../../components/tavern/ui/NotFound.tsx";
import { withBasePath } from "../../../lib/base-path.ts";
import type { CharacterShellResponse, TavernShellData } from "./-server.ts";
import { fetchCharacterShellData } from "./-server.ts";

const characterRouteId = "/characters/$characterId" as const;

export function requireCharacterShellData(
  response: CharacterShellResponse,
): TavernShellData {
  if (response.redirectTo) {
    throw redirect({ href: response.redirectTo });
  }

  if (!response.shell) {
    throw notFound({ routeId: characterRouteId });
  }

  return response.shell;
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
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const { logoutCampaignAccess } = await import(
        "../../campaigns/$campaignSlug/-server.ts"
      );
      const response = await logoutCampaignAccess({
        data: {
          campaignId: data.campaign.id,
          redirectTo: `/campaigns/${data.campaign.slug}/access`,
        },
      });
      const payload = (await response.json()) as { redirectTo?: string };
      startTransition(() => {
        router.navigate({ href: payload.redirectTo ?? withBasePath("/") });
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <TavernNav
        campaignId={data.campaign.id}
        campaignName={data.campaign.name}
        campaignSlug={data.campaign.slug}
        viewer={data.viewer}
        characterId={data.character.id}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
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
