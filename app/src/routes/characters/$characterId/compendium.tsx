import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CompendiumPanel,
  type CompendiumEntryDetailProps,
  type CompendiumEntryProps,
} from "../../../components/tavern/character/CompendiumPanel.tsx";
import {
  fetchCompendiumData,
  fetchCompendiumEntryDetail as fetchCompendiumDetail,
  type CompendiumData,
  type CompendiumEntryDetail,
} from "./-server.ts";

interface CompendiumSearchParams {
  q?: string;
  type?: string;
  pack?: string;
  entry?: string;
  entryPack?: string;
}

function toEntryProps(data: CompendiumData): CompendiumEntryProps[] {
  return data.entries.map((entry) => ({
    entityId: entry.entityId,
    packId: entry.packId,
    type: entry.type,
    name: entry.name,
    summary: entry.summary,
    tags: entry.tags,
  }));
}

function toDetailProps(
  detail: CompendiumEntryDetail | null,
): CompendiumEntryDetailProps | null {
  if (!detail) return null;
  return {
    entityId: detail.entityId,
    packId: detail.packId,
    type: detail.type,
    name: detail.name,
    summary: detail.summary,
    tags: detail.tags,
    bodyMd: detail.bodyMd,
  };
}

export const Route = createFileRoute(
  "/characters/$characterId/compendium",
)({
  validateSearch: (
    search: Record<string, unknown>,
  ): CompendiumSearchParams => ({
    q: (search.q as string) ?? undefined,
    type: (search.type as string) ?? undefined,
    pack: (search.pack as string) ?? undefined,
    entry: (search.entry as string) ?? undefined,
    entryPack: (search.entryPack as string) ?? undefined,
  }),
  loaderDeps: ({ search }) => ({
    q: search.q,
    type: search.type,
    pack: search.pack,
    entry: search.entry,
    entryPack: search.entryPack,
  }),
  loader: async ({ deps }) => {
    const listData = await fetchCompendiumData({
      data: {
        q: deps.q,
        type: deps.type,
        pack: deps.pack,
      },
    });

    let detail: CompendiumEntryDetail | null = null;
    if (deps.entry && deps.entryPack) {
      detail = await fetchCompendiumDetail({
        data: { packId: deps.entryPack, entityId: deps.entry },
      });
    }

    return { listData, detail };
  },
  component: CompendiumRoute,
});

function CompendiumRoute() {
  const { listData, detail } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const entries = toEntryProps(listData);
  const detailProps = toDetailProps(detail);

  return (
    <div className="animate-fade-up">
      <CompendiumPanel
        entries={entries}
        totalCount={listData.totalCount}
        availableTypes={listData.availableTypes}
        availablePacks={listData.availablePacks}
        query={search.q ?? ""}
        activeType={search.type ?? ""}
        activePack={search.pack ?? ""}
        detail={detailProps}
        onQueryChange={(q) =>
          navigate({ search: { ...search, q: q || undefined } })
        }
        onTypeChange={(type) =>
          navigate({
            search: { ...search, type: type || undefined, entry: undefined, entryPack: undefined },
          })
        }
        onPackChange={(pack) =>
          navigate({
            search: { ...search, pack: pack || undefined, entry: undefined, entryPack: undefined },
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
