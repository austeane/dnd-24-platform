import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { withBasePath } from "../../../lib/base-path.ts";
import {
  bootstrapDmPassword,
  createAccessSession,
  getCampaignAccessStatus,
  listAccessSessions,
  setCharacterPassword,
} from "../../../server/auth/service.ts";
import {
  clearAccessSessionCookie,
  createAccessSessionCookie,
} from "../../../server/auth/web-session.ts";
import {
  createSession,
  getCampaignBySlug,
  getCharacterForCampaign,
  listCampaignRoster,
  listCampaignSessions,
} from "../../../server/campaigns/service.ts";
import {
  createCommunicationDraft,
  listDmCommunicationBoard,
  publishCommunicationNow,
} from "../../../server/communication/index.ts";
import {
  getCharacterXpLedgerSummary,
  listCharacterSpendPlans,
  recordXpTransaction,
} from "../../../server/progression/index.ts";
import type { TavernViewer } from "../../../server/tavern/types.ts";
import {
  resolveCampaignViewer,
  resolveDmViewer,
} from "../../../server/tavern/viewer.ts";

export interface CampaignAccessLoaderData {
  campaign: {
    id: string;
    slug: string;
    name: string;
  };
  mode: "dm" | "player";
  next: string;
  viewer: TavernViewer | null;
  accessStatus: {
    hasDmPassword: boolean;
    playerCharacterIds: string[];
  };
  character: {
    id: string;
    name: string;
    ownerLabel: string | null;
  } | null;
  redirectTo: string | null;
}

export interface DmDashboardData {
  campaign: {
    id: string;
    slug: string;
    name: string;
    enabledPackIds: string[];
  };
  viewer: TavernViewer;
  sessions: Array<{
    id: string;
    sessionNumber: number;
    title: string;
    startsAt: string | null;
    endedAt: string | null;
  }>;
  roster: Array<{
    id: string;
    slug: string;
    name: string;
    ownerLabel: string | null;
    bankedXp: number;
    spendPlans: Array<{
      id: string;
      summary: string;
      state: string;
      totalXpCost: number;
      createdAt: string;
    }>;
  }>;
  communicationBoard: Array<{
    id: string;
    kind: string;
    state: string;
    title: string;
    sessionId: string | null;
    publishedAt: string | null;
    targetCharacterIds: string[];
  }>;
  access: {
    status: {
      hasDmPassword: boolean;
      playerCharacterIds: string[];
    };
    sessions: Array<{
      id: string;
      role: "dm" | "player";
      characterId: string | null;
      sessionLabel: string | null;
      createdAt: string;
      expiresAt: string;
      lastUsedAt: string | null;
    }>;
  };
}

function jsonResponse(
  body: unknown,
  init?: {
    status?: number;
    headers?: HeadersInit;
  },
): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function dmActorLabel(viewer: TavernViewer): string {
  return viewer.sessionLabel ?? "dm-web";
}

export const fetchCampaignAccessData = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      role?: "dm" | "player";
      characterId?: string;
      next?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      return null;
    }

    const request = getRequest();
    const [viewer, accessStatus, roster] = await Promise.all([
      resolveCampaignViewer(request, campaign.id),
      getCampaignAccessStatus(campaign.id),
      listCampaignRoster(campaign.id),
    ]);

    const mode = data.role ?? (data.characterId ? "player" : "dm");
    const character = data.characterId
      ? roster.find((entry) => entry.id === data.characterId) ?? null
      : null;
    const next =
      withBasePath(
        data.next ??
          (mode === "dm"
            ? `/campaigns/${campaign.slug}/dm`
            : character
              ? `/characters/${character.id}`
              : "/"),
      );

    const redirectTo =
      viewer &&
        ((mode === "dm" && viewer.canManageCampaign) ||
          (mode === "player" &&
            character &&
            (viewer.canManageCampaign || viewer.characterId === character.id)))
        ? next
        : null;

    return {
      campaign: {
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
      },
      mode,
      next,
      viewer,
      accessStatus,
      character: character
        ? {
            id: character.id,
            name: character.name,
            ownerLabel: character.ownerLabel,
          }
        : null,
      redirectTo,
    } satisfies CampaignAccessLoaderData;
  });

export const createCampaignAccess = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      password: string;
      characterId?: string | null;
      next: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      throw new Error(`Campaign ${data.campaignSlug} not found`);
    }

    if (data.characterId) {
      const character = await getCharacterForCampaign(campaign.id, data.characterId);
      if (!character) {
        throw new Error("Character is not part of this campaign");
      }
    }

    const session = await createAccessSession({
      campaignId: campaign.id,
      password: data.password,
      actorLabel: "web-access",
      characterId: data.characterId ?? null,
      sessionLabel: data.characterId ? "player-web" : "dm-web",
    });

    return jsonResponse(
      {
        redirectTo: withBasePath(data.next),
      },
      {
        headers: {
          "set-cookie": createAccessSessionCookie(
            campaign.id,
            session.token,
            session.expiresAt,
          ),
        },
      },
    );
  });

export const bootstrapCampaignDmAccess = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      password: string;
      passwordHint?: string | null;
      next: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      throw new Error(`Campaign ${data.campaignSlug} not found`);
    }

    await bootstrapDmPassword({
      campaignId: campaign.id,
      password: data.password,
      passwordHint: data.passwordHint ?? null,
      actorLabel: "web-access-bootstrap",
    });

    const session = await createAccessSession({
      campaignId: campaign.id,
      password: data.password,
      actorLabel: "web-access-bootstrap",
      sessionLabel: "dm-web",
    });

    return jsonResponse(
      {
        redirectTo: withBasePath(data.next),
      },
      {
        headers: {
          "set-cookie": createAccessSessionCookie(
            campaign.id,
            session.token,
            session.expiresAt,
          ),
        },
      },
    );
  });

export const logoutCampaignAccess = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignId: string;
      redirectTo?: string;
    }) => input,
  )
  .handler(async ({ data }) =>
    jsonResponse(
      {
        redirectTo: withBasePath(data.redirectTo ?? "/"),
      },
      {
        headers: {
          "set-cookie": clearAccessSessionCookie(data.campaignId),
        },
      },
    ));

export const fetchDmDashboardData = createServerFn({ method: "GET" })
  .inputValidator((input: { campaignSlug: string }) => input)
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      return null;
    }

    const viewer = await resolveDmViewer(getRequest(), campaign.id);
    if (!viewer) {
      return null;
    }

    const [roster, sessions, communicationBoard, accessStatus] = await Promise.all([
      listCampaignRoster(campaign.id),
      listCampaignSessions(campaign.id),
      listDmCommunicationBoard(campaign.id),
      getCampaignAccessStatus(campaign.id),
    ]);
    const accessSessions = await listAccessSessions({
      campaignId: campaign.id,
    });

    const rosterWithProgress = await Promise.all(
      roster.map(async (character) => {
        const [xpSummary, spendPlans] = await Promise.all([
          getCharacterXpLedgerSummary(character.id),
          listCharacterSpendPlans(character.id),
        ]);

        return {
          id: character.id,
          slug: character.slug,
          name: character.name,
          ownerLabel: character.ownerLabel,
          bankedXp: xpSummary?.bankedXp ?? 0,
          spendPlans: spendPlans.map((plan) => ({
            id: plan.id,
            summary: plan.summary,
            state: plan.state,
            totalXpCost: plan.totalXpCost,
            createdAt: plan.createdAt.toISOString(),
          })),
        };
      }),
    );

    return {
      campaign: {
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        enabledPackIds: campaign.enabledPackIds,
      },
      viewer,
      sessions: sessions.map((session) => ({
        id: session.id,
        sessionNumber: session.sessionNumber,
        title: session.title,
        startsAt: session.startsAt?.toISOString() ?? null,
        endedAt: session.endedAt?.toISOString() ?? null,
      })),
      roster: rosterWithProgress,
      communicationBoard: communicationBoard.map((item) => ({
        id: item.id,
        kind: item.kind,
        state: item.state,
        title: item.title,
        sessionId: item.sessionId,
        publishedAt: item.publishedAt?.toISOString() ?? null,
        targetCharacterIds: item.targetCharacterIds,
      })),
      access: {
        status: accessStatus,
        sessions: accessSessions.map((session) => ({
          id: session.id,
          role: session.role,
          characterId: session.characterId,
          sessionLabel: session.sessionLabel,
          createdAt: session.createdAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
        })),
      },
    } satisfies DmDashboardData;
  });

export const createDmSession = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      sessionNumber: number;
      title: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      throw new Error(`Campaign ${data.campaignSlug} not found`);
    }

    const viewer = await resolveDmViewer(getRequest(), campaign.id);
    if (!viewer) {
      throw new Error("DM access required");
    }

    const session = await createSession({
      campaignId: campaign.id,
      sessionNumber: data.sessionNumber,
      title: data.title,
    });

    return {
      id: session.id,
    };
  });

export const publishDmCommunication = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      sessionId?: string | null;
      kind: "message" | "handout" | "rule-callout";
      audienceKind: "party" | "character";
      targetCharacterIds?: string[];
      title: string;
      summary?: string;
      bodyMd: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      throw new Error(`Campaign ${data.campaignSlug} not found`);
    }

    const viewer = await resolveDmViewer(getRequest(), campaign.id);
    if (!viewer) {
      throw new Error("DM access required");
    }

    const draft = await createCommunicationDraft({
      campaignId: campaign.id,
      sessionId: data.sessionId ?? null,
      kind: data.kind,
      audience: {
        audienceKind: data.audienceKind,
        targetCharacterIds:
          data.audienceKind === "character" ? data.targetCharacterIds : undefined,
      },
      title: data.title,
      summary: data.summary,
      bodyMd: data.bodyMd,
      createdByLabel: dmActorLabel(viewer),
    });

    await publishCommunicationNow({
      itemId: draft.id,
      actorLabel: dmActorLabel(viewer),
    });

    return {
      id: draft.id,
    };
  });

export const awardXpToRoster = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      sessionId: string | null;
      characterIds: string[];
      amount: number;
      note: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      throw new Error(`Campaign ${data.campaignSlug} not found`);
    }

    const viewer = await resolveDmViewer(getRequest(), campaign.id);
    if (!viewer) {
      throw new Error("DM access required");
    }

    await Promise.all(
      data.characterIds.map((characterId) =>
        recordXpTransaction({
          campaignId: campaign.id,
          characterId,
          sessionId: data.sessionId,
          category: "award",
          amount: data.amount,
          note: data.note,
          createdByLabel: dmActorLabel(viewer),
        }),
      ),
    );

    return {
      awarded: data.characterIds.length,
    };
  });

export const resetCharacterAccessPassword = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      campaignSlug: string;
      characterId: string;
      password: string;
      passwordHint?: string | null;
    }) => input,
  )
  .handler(async ({ data }) => {
    const campaign = await getCampaignBySlug(data.campaignSlug);
    if (!campaign) {
      throw new Error(`Campaign ${data.campaignSlug} not found`);
    }

    const viewer = await resolveDmViewer(getRequest(), campaign.id);
    if (!viewer) {
      throw new Error("DM access required");
    }

    const character = await getCharacterForCampaign(campaign.id, data.characterId);
    if (!character) {
      throw new Error("Character is not part of this campaign");
    }

    await setCharacterPassword({
      campaignId: campaign.id,
      characterId: character.id,
      password: data.password,
      passwordHint: data.passwordHint ?? null,
      actorLabel: dmActorLabel(viewer),
    });

    return {
      ok: true,
    };
  });
