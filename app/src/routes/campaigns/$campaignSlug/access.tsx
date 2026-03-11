import { redirect, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { startTransition, useState } from "react";
import { TavernLayout } from "../../../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../../../components/tavern/layout/TavernNav.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import { Button } from "../../../components/tavern/ui/Button.tsx";
import { ErrorCard } from "../../../components/tavern/ui/ErrorCard.tsx";
import { Card } from "../../../components/tavern/ui/Card.tsx";
import { withBasePath } from "../../../lib/base-path.ts";
import {
  bootstrapCampaignDmAccess,
  createCampaignAccess,
  fetchCampaignAccessData,
} from "./-server.ts";

function parseSearch(search: Record<string, unknown>) {
  return {
    role: search.role === "dm" ? "dm" : search.role === "player" ? "player" : undefined,
    characterId:
      typeof search.characterId === "string" ? search.characterId : undefined,
    next: typeof search.next === "string" ? search.next : undefined,
  } as const;
}

async function parseRedirectResponse(response: Response): Promise<string> {
  const payload = (await response.json()) as { redirectTo?: string };
  if (!response.ok) {
    throw new Error("Access request failed");
  }

  return payload.redirectTo ?? withBasePath("/");
}

export const Route = createFileRoute("/campaigns/$campaignSlug/access")({
  validateSearch: parseSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const data = await fetchCampaignAccessData({
      data: {
        campaignSlug: params.campaignSlug,
        role: deps.role,
        characterId: deps.characterId,
        next: deps.next,
      },
    });

    if (!data) {
      throw notFound();
    }

    if (data.redirectTo) {
      throw redirect({ href: data.redirectTo });
    }

    return data;
  },
  errorComponent: AccessError,
  component: CampaignAccessPage,
});

function CampaignAccessPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isBootstrap = data.mode === "dm" && !data.accessStatus.hasDmPassword;

  const submit = async () => {
    setError(null);
    setIsPending(true);

    try {
      const response = isBootstrap
        ? await bootstrapCampaignDmAccess({
            data: {
              campaignSlug: data.campaign.slug,
              password,
              passwordHint: passwordHint || undefined,
              next: data.next,
            },
          })
        : await createCampaignAccess({
            data: {
              campaignSlug: data.campaign.slug,
              password,
              characterId: data.mode === "player" ? data.character?.id ?? null : null,
              next: data.next,
            },
          });

      const redirectTo = await parseRedirectResponse(response);
      startTransition(() => {
        router.navigate({ href: redirectTo });
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Access request failed");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <TavernNav />
      <TavernLayout>
        <div className="access-shell">
          <header className="tavern-page-header text-center">
            <div className="tavern-page-kicker">Campaign Access</div>
            <h1
              className="font-heading text-3xl font-bold text-ink"
              {...{
                [TAVERN_ROUTE_HEADING_ATTR]: "true",
              }}
              tabIndex={-1}
            >
              {isBootstrap ? "Set DM Password" : "Campaign Access"}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {data.campaign.name}
              {data.character ? ` · ${data.character.name}` : ""}
            </p>
          </header>

          <Card className="access-card space-y-4 p-6">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold text-ink">
                {data.mode === "dm"
                  ? isBootstrap
                    ? "Create the first DM access password"
                    : "Enter as DM"
                  : `Enter as ${data.character?.name ?? "Player"}`}
              </h2>
              <p className="text-sm text-ink-soft">
                {data.mode === "dm"
                  ? "DM access unlocks session, journal, XP, and password management."
                  : "Player access unlocks character state updates and progression."}
              </p>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-ink">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
              />
            </label>

            {isBootstrap && (
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Hint (optional)</span>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(event) => setPasswordHint(event.target.value)}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-[var(--radius-button)] border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember"
              >
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={submit}
                disabled={isPending || password.trim().length === 0}
              >
                {isPending
                  ? "Working..."
                  : isBootstrap
                    ? "Create DM Access"
                    : "Enter Campaign"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.navigate({ to: "/" })}
                disabled={isPending}
              >
                Back Home
              </Button>
            </div>
          </Card>
        </div>
      </TavernLayout>
    </>
  );
}

function AccessError({ error }: { error: Error }) {
  return (
    <>
      <TavernNav />
      <TavernLayout>
        <ErrorCard
          title="Failed to load campaign access"
          message={error.message}
        />
      </TavernLayout>
    </>
  );
}
