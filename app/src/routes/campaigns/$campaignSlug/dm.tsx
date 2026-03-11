import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { startTransition, useState } from "react";
import { TavernLayout } from "../../../components/tavern/layout/TavernLayout.tsx";
import { TavernNav } from "../../../components/tavern/layout/TavernNav.tsx";
import { TAVERN_ROUTE_HEADING_ATTR } from "../../../components/tavern/layout/accessibility.ts";
import { Button } from "../../../components/tavern/ui/Button.tsx";
import { Card } from "../../../components/tavern/ui/Card.tsx";
import { withBasePath } from "../../../lib/base-path.ts";
import {
  awardXpToRoster,
  createDmSession,
  fetchDmDashboardData,
  logoutCampaignAccess,
  publishDmCommunication,
  resetCharacterAccessPassword,
} from "./-server.ts";

export const Route = createFileRoute("/campaigns/$campaignSlug/dm")({
  loader: ({ params }) =>
    fetchDmDashboardData({
      data: { campaignSlug: params.campaignSlug },
    }).then((data) => {
      if (!data) {
        throw redirect({
          href: withBasePath(
            `/campaigns/${params.campaignSlug}/access?role=dm&next=${encodeURIComponent(withBasePath(`/campaigns/${params.campaignSlug}/dm`))}`,
          ),
        });
      }

      return data;
    }),
  component: DmDashboardRoute,
});

function DmDashboardRoute() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [sessionTitle, setSessionTitle] = useState("");
  const [communicationTitle, setCommunicationTitle] = useState("");
  const [communicationBody, setCommunicationBody] = useState("");
  const [audienceKind, setAudienceKind] = useState<"party" | "character">("party");
  const [selectedCommunicationCharacterIds, setSelectedCommunicationCharacterIds] =
    useState<string[]>([]);
  const [xpAmount, setXpAmount] = useState("5");
  const [xpNote, setXpNote] = useState("");
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
    data.roster.map((entry) => entry.id),
  );
  const [selectedSessionId, setSelectedSessionId] = useState(
    data.sessions.at(-1)?.id ?? "",
  );
  const [passwordCharacterId, setPasswordCharacterId] = useState(
    data.roster[0]?.id ?? "",
  );
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const nextSessionNumber =
    data.sessions.reduce(
      (max, session) => Math.max(max, session.sessionNumber),
      0,
    ) + 1;

  async function refresh(message: string) {
    await router.invalidate();
    setStatus(message);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
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

  async function handleCreateSession() {
    const result = await createDmSession({
      data: {
        campaignSlug: data.campaign.slug,
        sessionNumber: nextSessionNumber,
        title: sessionTitle || `Session ${nextSessionNumber}`,
      },
    });
    setSelectedSessionId(result.id);
    await refresh("Session created.");
    setSessionTitle("");
  }

  async function handlePublishCommunication() {
    await publishDmCommunication({
      data: {
        campaignSlug: data.campaign.slug,
        sessionId: selectedSessionId || null,
        kind: "rule-callout",
        audienceKind,
        targetCharacterIds:
          audienceKind === "character" ? selectedCommunicationCharacterIds : undefined,
        title: communicationTitle,
        bodyMd: communicationBody,
      },
    });
    await refresh("Journal entry published.");
    setCommunicationTitle("");
    setCommunicationBody("");
  }

  async function handleAwardXp() {
    await awardXpToRoster({
      data: {
        campaignSlug: data.campaign.slug,
        sessionId: selectedSessionId || null,
        characterIds: selectedCharacterIds,
        amount: Number(xpAmount),
        note: xpNote || "Session XP award",
      },
    });
    await refresh("XP awarded.");
  }

  async function handleResetPassword() {
    await resetCharacterAccessPassword({
      data: {
        campaignSlug: data.campaign.slug,
        characterId: passwordCharacterId,
        password,
      },
    });
    await refresh("Player password updated.");
    setPassword("");
  }

  return (
    <>
      <TavernNav
        campaignId={data.campaign.id}
        campaignSlug={data.campaign.slug}
        campaignName={data.campaign.name}
        viewer={data.viewer}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />
      <TavernLayout>
        <div className="dashboard-shell space-y-6 py-4">
          <header className="tavern-page-header space-y-2">
            <div className="tavern-page-kicker">Dungeon Master</div>
            <h1
              className="font-heading text-3xl font-bold text-ink"
              {...{
                [TAVERN_ROUTE_HEADING_ATTR]: "true",
              }}
              tabIndex={-1}
            >
              DM Dashboard
            </h1>
            <p className="text-sm text-ink-soft">
              Run sessions, publish notes, award XP, manage passwords, and launch level-up.
            </p>
            {status && (
              <p className="rounded-[var(--radius-tag)] bg-forest/10 px-3 py-1 text-sm font-medium text-forest">{status}</p>
            )}
          </header>

          <div className="dashboard-grid">
            <Card className="dashboard-card space-y-4 p-5">
              <div>
                <h2 className="font-heading text-xl font-bold text-ink">Session</h2>
                <p className="text-sm text-ink-soft">
                  Select the working session for journal posts and XP awards.
                </p>
              </div>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">Working Session</span>
                <select
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                >
                  <option value="">No session selected</option>
                  {data.sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      Session {session.sessionNumber}: {session.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">New Session Title</span>
                <input
                  value={sessionTitle}
                  onChange={(event) => setSessionTitle(event.target.value)}
                  placeholder={`Session ${nextSessionNumber}`}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
              <Button type="button" onClick={handleCreateSession}>
                Create Session {nextSessionNumber}
              </Button>
            </Card>

            <Card className="dashboard-card space-y-4 p-5">
              <div>
                <h2 className="font-heading text-xl font-bold text-ink">Journal</h2>
                <p className="text-sm text-ink-soft">
                  Publish a note to the player journal immediately.
                </p>
              </div>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">Journal Title</span>
                <input
                  value={communicationTitle}
                  onChange={(event) => setCommunicationTitle(event.target.value)}
                  placeholder="Title"
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">Journal Body</span>
                <textarea
                  value={communicationBody}
                  onChange={(event) => setCommunicationBody(event.target.value)}
                  rows={5}
                  placeholder="Body markdown"
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">Audience</span>
                <select
                  value={audienceKind}
                  onChange={(event) =>
                    setAudienceKind(event.target.value as "party" | "character")
                  }
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                >
                  <option value="party">Whole party</option>
                  <option value="character">Selected characters</option>
                </select>
              </label>
              {audienceKind === "character" && (
                <div className="dashboard-checklist">
                  {data.roster.map((character) => {
                    const checked = selectedCommunicationCharacterIds.includes(character.id);
                    return (
                      <label
                        key={character.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedCommunicationCharacterIds((current) =>
                              checked
                                ? current.filter((id) => id !== character.id)
                                : [...current, character.id],
                            )
                          }
                        />
                        <span>{character.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <Button
                type="button"
                onClick={handlePublishCommunication}
                disabled={
                  !communicationTitle ||
                  !communicationBody ||
                  (audienceKind === "character" &&
                    selectedCommunicationCharacterIds.length === 0)
                }
              >
                Publish Journal Note
              </Button>
            </Card>

            <Card className="dashboard-card space-y-4 p-5">
              <div>
                <h2 className="font-heading text-xl font-bold text-ink">XP</h2>
                <p className="text-sm text-ink-soft">
                  Award the same XP amount to the selected characters.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="dashboard-checklist">
                  {data.roster.map((character) => {
                    const checked = selectedCharacterIds.includes(character.id);
                    return (
                      <label
                        key={character.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedCharacterIds((current) =>
                              checked
                                ? current.filter((id) => id !== character.id)
                                : [...current, character.id],
                            )
                          }
                        />
                        <span>{character.name}</span>
                        <span className="text-xs text-ink-soft">
                          {character.bankedXp} XP banked
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-3 max-sm:flex-col">
                  <label className="w-24 space-y-1 text-sm max-sm:w-full">
                    <span className="font-medium text-ink">XP Amount</span>
                    <input
                      value={xpAmount}
                      onChange={(event) => setXpAmount(event.target.value)}
                      className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                    />
                  </label>
                  <label className="flex-1 space-y-1 text-sm">
                    <span className="font-medium text-ink">XP Note</span>
                    <input
                      value={xpNote}
                      onChange={(event) => setXpNote(event.target.value)}
                      placeholder="Session XP award"
                      className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                    />
                  </label>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAwardXp}
                disabled={selectedCharacterIds.length === 0}
              >
                Award XP
              </Button>
            </Card>

            <Card className="dashboard-card space-y-4 p-5">
              <div>
                <h2 className="font-heading text-xl font-bold text-ink">Access</h2>
                <p className="text-sm text-ink-soft">
                  Reset or create a player password for any roster character.
                </p>
              </div>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">Player Character</span>
                <select
                  value={passwordCharacterId}
                  onChange={(event) => setPasswordCharacterId(event.target.value)}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                >
                  {data.roster.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-ink">New Player Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New player password"
                  className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
                />
              </label>
              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={!password}
              >
                Save Player Password
              </Button>
              <div className="space-y-2 border-t border-border pt-3">
                <h3 className="font-heading text-lg font-bold text-ink">
                  Active Access Sessions
                </h3>
                {data.access.sessions.length === 0 ? (
                  <p className="text-sm text-ink-soft">No active access sessions.</p>
                ) : (
                  <div className="dashboard-session-list text-sm text-ink">
                    {data.access.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-[var(--radius-card)] border border-border bg-paper-deep/50 px-3 py-2"
                      >
                        <div className="font-medium">
                          {session.role === "dm" ? "DM" : "Player"}
                          {session.characterId
                            ? ` · ${data.roster.find((entry) => entry.id === session.characterId)?.name ?? session.characterId}`
                            : ""}
                        </div>
                        <div className="text-xs text-ink-soft">
                          {session.sessionLabel ?? "No label"} · expires {new Date(session.expiresAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="dashboard-card space-y-4 p-5">
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">Roster</h2>
              <p className="text-sm text-ink-soft">
                Launch level-up from the live roster state.
              </p>
            </div>
            <div className="dashboard-roster-grid">
              {data.roster.map((character) => (
                <div key={character.id} className="dashboard-roster-card">
                  <div className="font-heading text-lg font-bold">{character.name}</div>
                  <div className="text-xs text-ink-soft">{character.ownerLabel ?? "Unassigned"}</div>
                  <div className="mt-2 text-sm">{character.bankedXp} XP banked</div>
                  {character.spendPlans.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-ink-soft">
                      {character.spendPlans.slice(0, 2).map((plan) => (
                        <div key={plan.id}>
                          {plan.summary} · {plan.state}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    to="/characters/$characterId/level-up"
                    params={{ characterId: character.id }}
                    aria-label={`Open Level Up for ${character.name}`}
                    className="btn btn-warm mt-3 inline-flex"
                  >
                    Open Level Up
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dashboard-card space-y-4 p-5">
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Published Updates
              </h2>
              <p className="text-sm text-ink-soft">
                Recent journal and rule-callout items for this campaign.
              </p>
            </div>
            {data.communicationBoard.length === 0 ? (
              <p className="text-sm text-ink-soft">No published updates yet.</p>
            ) : (
              <div className="dashboard-updates-grid">
                {data.communicationBoard.map((item) => (
                  <div key={item.id} className="dashboard-update-card">
                    <div className="font-heading text-lg font-bold text-ink">
                      {item.title}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-ink-soft">
                      {item.kind} · {item.state}
                    </div>
                    <div className="mt-2 text-xs text-ink-soft">
                      {item.sessionId
                        ? `Session linked`
                        : "No session linked"}
                      {item.targetCharacterIds.length > 0
                        ? ` · ${item.targetCharacterIds.length} character target${item.targetCharacterIds.length === 1 ? "" : "s"}`
                        : " · Whole party"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </TavernLayout>
    </>
  );
}
