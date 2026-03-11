import {
  requireCharacterAccess,
  requireDmAccess,
} from "../auth/service.ts";
import type { AccessSessionRecord } from "../auth/types.ts";
import { resolveCampaignAccessSession } from "../auth/web-session.ts";
import { withBasePath } from "../../lib/base-path.ts";
import type { TavernViewer } from "./types.ts";

function mapSessionToViewer(
  session: AccessSessionRecord,
  characterId: string | null,
): TavernViewer {
  return {
    role: session.role,
    characterId: session.characterId,
    sessionLabel: session.sessionLabel ?? null,
    canEditCharacter:
      session.role === "dm" ||
      (characterId !== null && session.characterId === characterId),
    canManageCampaign: session.role === "dm",
  };
}

export function buildAccessRedirectPath(input: {
  campaignSlug: string;
  next: string;
  role?: "dm" | "player";
  characterId?: string;
}): string {
  const search = new URLSearchParams();
  search.set("next", withBasePath(input.next));
  if (input.role) {
    search.set("role", input.role);
  }
  if (input.characterId) {
    search.set("characterId", input.characterId);
  }

  return withBasePath(
    `/campaigns/${input.campaignSlug}/access?${search.toString()}`,
  );
}

export async function resolveCampaignViewer(
  request: Request,
  campaignId: string,
): Promise<TavernViewer | null> {
  const session = await resolveCampaignAccessSession(request, campaignId);
  if (!session) {
    return null;
  }

  return mapSessionToViewer(session, null);
}

export async function resolveCharacterViewer(
  request: Request,
  campaignId: string,
  characterId: string,
): Promise<TavernViewer | null> {
  const session = await resolveCampaignAccessSession(request, campaignId);
  if (!session) {
    return null;
  }

  requireCharacterAccess(session, campaignId, characterId);
  return mapSessionToViewer(session, characterId);
}

export async function resolveDmViewer(
  request: Request,
  campaignId: string,
): Promise<TavernViewer | null> {
  const session = await resolveCampaignAccessSession(request, campaignId);
  if (!session) {
    return null;
  }

  requireDmAccess(session);
  return mapSessionToViewer(session, null);
}
