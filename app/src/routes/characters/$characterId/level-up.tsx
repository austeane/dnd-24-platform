import { createFileRoute, getRouteApi, useRouter } from "@tanstack/react-router";
import { startTransition, useState } from "react";
import { Card } from "../../../components/tavern/ui/Card.tsx";
import { Button } from "../../../components/tavern/ui/Button.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import {
  commitCharacterLevelUp,
  previewCharacterLevelUp,
} from "./-server.ts";

const parentApi = getRouteApi("/characters/$characterId");
type LevelUpPreview = {
  totalXpCost: number;
  bankedXpBefore: number;
  bankedXpAfter: number;
};

export const Route = createFileRoute("/characters/$characterId/level-up")({
  component: LevelUpRoute,
});

function LevelUpRoute() {
  const data = parentApi.useLoaderData();
  const router = useRouter();
  const [levelsGranted, setLevelsGranted] = useState("1");
  const [xpCost, setXpCost] = useState(String(Math.max(data.summary.xp.banked, 1)));
  const [preview, setPreview] = useState<null | {
    totalXpCost: number;
    bankedXpBefore: number;
    bankedXpAfter: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  async function handlePreview() {
    setError(null);
    setIsPreviewing(true);
    try {
      const result = (await previewCharacterLevelUp({
        data: {
          characterId: data.character.id,
          levelsGranted: Number(levelsGranted),
          xpCost: Number(xpCost),
        },
      })) as LevelUpPreview;
      setPreview({
        totalXpCost: result.totalXpCost,
        bankedXpBefore: result.bankedXpBefore,
        bankedXpAfter: result.bankedXpAfter,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preview failed");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleCommit() {
    setError(null);
    setIsCommitting(true);
    try {
      await commitCharacterLevelUp({
        data: {
          characterId: data.character.id,
          levelsGranted: Number(levelsGranted),
          xpCost: Number(xpCost),
        },
      });
      await router.invalidate();
      startTransition(() => {
        router.navigate({ to: "/characters/$characterId", params: { characterId: data.character.id } });
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Commit failed");
    } finally {
      setIsCommitting(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-4 py-4">
      <header className="tavern-page-header">
        <div className="tavern-page-kicker">Progression</div>
        <h1
          className="font-heading text-2xl font-bold text-ink"
          {...{
            [TAVERN_ROUTE_HEADING_ATTR]: "true",
          }}
          tabIndex={-1}
        >
          Level Up
        </h1>
        <p className="text-sm text-ink-soft">
          Spend banked XP and preview the next class level before committing it to the live sheet.
        </p>
      </header>

      <Card className="level-up-card space-y-4 p-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">
            {data.character.name}
          </h2>
          <p className="text-sm text-ink-soft">
            Current level {data.summary.level} · {data.summary.xp.banked} XP banked
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Levels to gain</span>
            <input
              type="number"
              min={1}
              value={levelsGranted}
              onChange={(event) => setLevelsGranted(event.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">XP cost</span>
            <input
              type="number"
              min={1}
              value={xpCost}
              onChange={(event) => setXpCost(event.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
            />
          </label>
        </div>

        {preview && (
          <div className="level-up-preview">
            <div>Total cost: {preview.totalXpCost} XP</div>
            <div>Banked before: {preview.bankedXpBefore} XP</div>
            <div>Banked after: {preview.bankedXpAfter} XP</div>
          </div>
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
          <Button type="button" onClick={handlePreview} disabled={isPreviewing || isCommitting}>
            {isPreviewing ? "Previewing..." : "Preview"}
          </Button>
          <Button
            type="button"
            onClick={handleCommit}
            disabled={!preview || isCommitting}
          >
            {isCommitting ? "Committing..." : "Commit Level Up"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.navigate({
                to: "/characters/$characterId",
                params: { characterId: data.character.id },
              })
            }
            disabled={isPreviewing || isCommitting}
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-ink-soft">
          This MVP route supports current-class level gains only. Post-commit choice capture is not yet surfaced here.
        </p>
      </Card>
    </div>
  );
}
