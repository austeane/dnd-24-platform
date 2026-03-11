import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { CompendiumPanel } from "../../../components/tavern/character/CompendiumPanel.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import {
  type CharacterTabResponse,
  fetchCompendiumData,
  type TavernCompendiumData,
  type TavernCompendiumQuery,
} from "./-server.ts";

interface CompendiumSearchParams {
  q?: string;
  type?: string;
  pack?: string;
  entry?: string;
  entryPack?: string;
}

export function validateCompendiumSearch(
  search: Record<string, unknown>,
): CompendiumSearchParams {
  return {
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
    type:
      typeof search.type === "string" && search.type.length > 0
        ? search.type
        : undefined,
    pack:
      typeof search.pack === "string" && search.pack.length > 0
        ? search.pack
        : undefined,
    entry:
      typeof search.entry === "string" && search.entry.length > 0
        ? search.entry
        : undefined,
    entryPack:
      typeof search.entryPack === "string" && search.entryPack.length > 0
        ? search.entryPack
        : undefined,
  };
}

function toCompendiumQuery(
  characterId: string,
  search: CompendiumSearchParams,
): TavernCompendiumQuery {
  return {
    characterId,
    q: search.q,
    type: search.type,
    pack: search.pack,
    entry: search.entry,
    entryPack: search.entryPack,
  };
}

export const Route = createFileRoute(
  "/characters/$characterId/compendium",
)({
  validateSearch: validateCompendiumSearch,
  loaderDeps: ({ search }) => ({
    q: search.q,
    type: search.type,
    pack: search.pack,
    entry: search.entry,
    entryPack: search.entryPack,
  }),
  loader: ({ params, deps }) =>
    fetchCompendiumData({
      data: toCompendiumQuery(params.characterId, deps),
    }).then((response: CharacterTabResponse<TavernCompendiumData>) => {
      if (response.redirectTo) {
        throw redirect({ href: response.redirectTo });
      }

      return response.data;
    }),
  component: CompendiumRoute,
});

function CompendiumRoute() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <div className="animate-fade-up space-y-4">
      <header className="tavern-page-header">
        <div className="tavern-page-kicker">Library</div>
        <h1
          className="font-heading text-2xl font-bold text-ink"
          {...{
            [TAVERN_ROUTE_HEADING_ATTR]: "true",
          }}
          tabIndex={-1}
        >
          Compendium
        </h1>
        <p className="text-sm text-ink-soft">
          Search SRD, Advanced Adventurers, and campaign references without leaving the current character.
        </p>
      </header>
      <CompendiumPanel
        entries={data.entries}
        totalCount={data.totalCount}
        availableTypes={data.availableTypes}
        availablePacks={data.availablePacks}
        query={search.q ?? ""}
        activeType={search.type ?? ""}
        activePack={search.pack ?? ""}
        detail={data.detail}
        onQueryChange={(q) =>
          navigate({ search: { ...search, q: q || undefined } })
        }
        onTypeChange={(type) =>
          navigate({
            search: {
              ...search,
              type: type || undefined,
              entry: undefined,
              entryPack: undefined,
            },
          })
        }
        onPackChange={(pack) =>
          navigate({
            search: {
              ...search,
              pack: pack || undefined,
              entry: undefined,
              entryPack: undefined,
            },
          })
        }
        onEntrySelect={(packId, entityId) =>
          navigate({
            search: { ...search, entry: entityId, entryPack: packId },
          })
        }
        onBackToList={() =>
          navigate({
            search: { ...search, entry: undefined, entryPack: undefined },
          })
        }
      />
    </div>
  );
}
