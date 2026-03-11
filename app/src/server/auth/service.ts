import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  accessCredentials,
  accessSessions,
  type AccessCredentialRole,
} from "../db/schema/index.ts";
import {
  createSessionToken,
  hashSecret,
  hashSessionToken,
  verifySecret,
} from "./crypto.ts";
import type {
  AccessCredentialRecord,
  CampaignAccessStatus,
  AccessSessionRecord,
  AccessSessionToken,
  CreateAccessSessionInput,
  ListAccessSessionsInput,
  SetAccessCredentialInput,
  SetCharacterPasswordInput,
  SetDmPasswordInput,
  ValidateAccessSessionInput,
  VerifyAccessCredentialInput,
} from "./types.ts";

const DEFAULT_SESSION_TTL_HOURS = 24 * 30;

function buildScopeKey(
  role: AccessCredentialRole,
  characterId: string | null | undefined,
): string {
  if (role === "dm") {
    return "dm";
  }

  if (!characterId) {
    throw new Error("Player credentials require a characterId");
  }

  return `character:${characterId}`;
}

async function setAccessCredential(
  input: SetAccessCredentialInput,
): Promise<AccessCredentialRecord> {
  const password = input.password.trim();
  if (password.length < 8) {
    throw new Error("Access passwords must be at least 8 characters long");
  }

  const secret = await hashSecret(password);
  const scopeKey = buildScopeKey(input.role, input.characterId);
  const [row] = await db
    .insert(accessCredentials)
    .values({
      id: randomUUID(),
      campaignId: input.campaignId,
      role: input.role,
      characterId: input.characterId ?? null,
      scopeKey,
      passwordHash: secret.hash,
      passwordSalt: secret.salt,
      passwordHint: input.passwordHint?.trim() || null,
      setByLabel: input.actorLabel.trim(),
    })
    .onConflictDoUpdate({
      target: [accessCredentials.campaignId, accessCredentials.scopeKey],
      set: {
        role: input.role,
        characterId: input.characterId ?? null,
        passwordHash: secret.hash,
        passwordSalt: secret.salt,
        passwordHint: input.passwordHint?.trim() || null,
        version: sql`${accessCredentials.version} + 1`,
        setByLabel: input.actorLabel.trim(),
        revokedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

async function verifyAccessCredential(
  input: VerifyAccessCredentialInput,
): Promise<AccessCredentialRecord | null> {
  const scopeKey = buildScopeKey(input.role, input.characterId);
  const [row] = await db
    .select()
    .from(accessCredentials)
    .where(
      and(
        eq(accessCredentials.campaignId, input.campaignId),
        eq(accessCredentials.scopeKey, scopeKey),
        isNull(accessCredentials.revokedAt),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const verified = await verifySecret(input.password, {
    salt: row.passwordSalt,
    hash: row.passwordHash,
  });

  return verified ? row : null;
}

export async function setDmPassword(
  input: SetDmPasswordInput,
): Promise<AccessCredentialRecord> {
  return setAccessCredential({
    campaignId: input.campaignId,
    role: "dm",
    characterId: null,
    password: input.password,
    passwordHint: input.passwordHint,
    actorLabel: input.actorLabel,
  });
}

export async function setCharacterPassword(
  input: SetCharacterPasswordInput,
): Promise<AccessCredentialRecord> {
  return setAccessCredential({
    campaignId: input.campaignId,
    role: "player",
    characterId: input.characterId,
    password: input.password,
    passwordHint: input.passwordHint,
    actorLabel: input.actorLabel,
  });
}

export async function createAccessSession(
  input: CreateAccessSessionInput,
): Promise<AccessSessionToken> {
  const role = input.characterId ? "player" : "dm";
  const credential = await verifyAccessCredential({
    campaignId: input.campaignId,
    role,
    characterId: input.characterId ?? null,
    password: input.password,
  });
  if (!credential) {
    throw new Error("Invalid access password");
  }

  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(
    Date.now() + (input.ttlHours ?? DEFAULT_SESSION_TTL_HOURS) * 60 * 60 * 1000,
  );

  await db.insert(accessSessions).values({
    id: randomUUID(),
    campaignId: input.campaignId,
    credentialId: credential.id,
    role: credential.role,
    characterId: credential.characterId,
    tokenHash,
    sessionLabel: input.sessionLabel?.trim() || null,
    createdByLabel: input.actorLabel.trim(),
    expiresAt,
  });

  return {
    token,
    role: credential.role,
    characterId: credential.characterId,
    expiresAt,
  };
}

export async function validateAccessSession(
  input: ValidateAccessSessionInput,
): Promise<AccessSessionRecord | null> {
  const tokenHash = hashSessionToken(input.token);
  const [row] = await db
    .select()
    .from(accessSessions)
    .where(
      and(
        eq(accessSessions.campaignId, input.campaignId),
        eq(accessSessions.tokenHash, tokenHash),
        isNull(accessSessions.revokedAt),
        gt(accessSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [updated] = await db
    .update(accessSessions)
    .set({
      lastUsedAt: new Date(),
    })
    .where(eq(accessSessions.id, row.id))
    .returning();

  return updated ?? row;
}

export async function revokeAccessSession(
  sessionId: string,
): Promise<AccessSessionRecord | null> {
  const [row] = await db
    .update(accessSessions)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(accessSessions.id, sessionId))
    .returning();

  return row ?? null;
}

export async function listAccessSessions(
  input: ListAccessSessionsInput,
): Promise<AccessSessionRecord[]> {
  const conditions = [eq(accessSessions.campaignId, input.campaignId)];
  if (input.role) {
    conditions.push(eq(accessSessions.role, input.role));
  }
  if (input.characterId !== undefined) {
    if (input.characterId === null) {
      conditions.push(isNull(accessSessions.characterId));
    } else {
      conditions.push(eq(accessSessions.characterId, input.characterId));
    }
  }

  return db
    .select()
    .from(accessSessions)
    .where(and(...conditions));
}

export async function getCampaignAccessStatus(
  campaignId: string,
): Promise<CampaignAccessStatus> {
  const rows = await db
    .select({
      role: accessCredentials.role,
      characterId: accessCredentials.characterId,
    })
    .from(accessCredentials)
    .where(
      and(
        eq(accessCredentials.campaignId, campaignId),
        isNull(accessCredentials.revokedAt),
      ),
    );

  return {
    campaignId,
    hasDmPassword: rows.some((row) => row.role === "dm"),
    playerCharacterIds: rows
      .filter((row) => row.role === "player" && row.characterId !== null)
      .map((row) => row.characterId!)
      .filter((characterId) => characterId.length > 0),
  };
}

export async function bootstrapDmPassword(
  input: SetDmPasswordInput,
): Promise<AccessCredentialRecord> {
  const status = await getCampaignAccessStatus(input.campaignId);
  if (status.hasDmPassword) {
    throw new Error("DM password is already configured for this campaign");
  }

  return setDmPassword(input);
}

export function isDmAccessSession(
  session: Pick<AccessSessionRecord, "role" | "characterId">,
): boolean {
  return session.role === "dm" && session.characterId === null;
}

export function requireDmAccess(
  session: Pick<AccessSessionRecord, "role" | "characterId"> | null | undefined,
): void {
  if (!session || !isDmAccessSession(session)) {
    throw new Error("DM access required");
  }
}

export function requireCampaignAccess(
  session: Pick<AccessSessionRecord, "campaignId"> | null | undefined,
  campaignId: string,
): void {
  if (!session || session.campaignId !== campaignId) {
    throw new Error("Campaign access required");
  }
}

export function requireCharacterAccess(
  session: Pick<AccessSessionRecord, "campaignId" | "role" | "characterId"> | null | undefined,
  campaignId: string,
  characterId: string,
): void {
  requireCampaignAccess(session, campaignId);
  if (session && session.role === "dm") {
    return;
  }
  if (!session || session.characterId !== characterId) {
    throw new Error("Character access required");
  }
}
