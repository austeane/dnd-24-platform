import { createMiddleware } from "@tanstack/react-start";
import {
  type AccessSessionRecord,
} from "./types.ts";
import { validateAccessSession } from "./service.ts";

const ACCESS_SESSION_COOKIE_PREFIX = "dnd_access_";

function buildCookieName(campaignId: string): string {
  return `${ACCESS_SESSION_COOKIE_PREFIX}${campaignId}`;
}

function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const name = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    if (!name) {
      continue;
    }

    cookies.set(name, decodeURIComponent(value));
  }

  return cookies;
}

export const requestContextMiddleware = createMiddleware().server(
  ({ request, next }) =>
    next({
      context: {
        request,
      },
    }),
);

export function readAccessSessionToken(
  request: Request,
  campaignId: string,
): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  return parseCookieHeader(cookieHeader).get(buildCookieName(campaignId)) ?? null;
}

export async function resolveCampaignAccessSession(
  request: Request,
  campaignId: string,
): Promise<AccessSessionRecord | null> {
  const token = readAccessSessionToken(request, campaignId);
  if (!token) {
    return null;
  }

  return validateAccessSession({
    campaignId,
    token,
  });
}

export function createAccessSessionCookie(
  campaignId: string,
  token: string,
  expiresAt: Date,
): string {
  const maxAge = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  );

  return [
    `${buildCookieName(campaignId)}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    `Expires=${expiresAt.toUTCString()}`,
  ].join("; ");
}

export function clearAccessSessionCookie(campaignId: string): string {
  return [
    `${buildCookieName(campaignId)}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ].join("; ");
}
