import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { campaigns, characters, sessions } from "../db/schema/index.ts";
import type {
  CampaignRosterEntry,
  CampaignSettingsView,
  CampaignSummary,
  CharacterRecord,
  CreateCampaignInput,
  CreateCharacterInput,
  CreateSessionInput,
  SessionListItem,
  SessionRecord,
  UpdateCampaignSettingsInput,
  UpdateCharacterIdentityInput,
  UpdateSessionInput,
} from "./types.ts";

const BASE_PACK_ID = "srd-5e-2024";

function normalizeEnabledPackIds(packIds: string[] | undefined): string[] {
  const values = new Set(
    (packIds ?? [BASE_PACK_ID])
      .map((packId) => packId.trim())
      .filter((packId) => packId.length > 0),
  );

  values.add(BASE_PACK_ID);

  return [...values];
}

function mapCampaignSettings(row: typeof campaigns.$inferSelect): CampaignSettingsView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    progressionMode: row.progressionMode,
    levelingMethod: row.levelingMethod,
    enabledPackIds: row.enabledPackIds,
  };
}

function mapSessionListItem(row: typeof sessions.$inferSelect): SessionListItem {
  return {
    id: row.id,
    sessionNumber: row.sessionNumber,
    title: row.title,
    startsAt: row.startsAt,
    endedAt: row.endedAt,
  };
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<CampaignSettingsView> {
  const [row] = await db
    .insert(campaigns)
    .values({
      id: input.id ?? randomUUID(),
      slug: input.slug.trim(),
      name: input.name.trim(),
      progressionMode: input.progressionMode ?? "hybrid",
      levelingMethod: input.levelingMethod ?? "fixed-cost",
      enabledPackIds: normalizeEnabledPackIds(input.enabledPackIds),
    })
    .returning();

  return mapCampaignSettings(row!);
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const rows = await db
    .select({
      id: campaigns.id,
      slug: campaigns.slug,
      name: campaigns.name,
      progressionMode: campaigns.progressionMode,
      levelingMethod: campaigns.levelingMethod,
      enabledPackIds: campaigns.enabledPackIds,
      characterCount: sql<number>`(
        select count(*)::int
        from ${characters}
        where ${characters.campaignId} = ${campaigns.id}
      )`,
      sessionCount: sql<number>`(
        select count(*)::int
        from ${sessions}
        where ${sessions.campaignId} = ${campaigns.id}
      )`,
    })
    .from(campaigns)
    .orderBy(asc(campaigns.name));

  return rows.map((row) => ({
    ...row,
    characterCount: Number(row.characterCount),
    sessionCount: Number(row.sessionCount),
  }));
}

export async function getCampaignSettings(
  campaignId: string,
): Promise<CampaignSettingsView | null> {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return row ? mapCampaignSettings(row) : null;
}

export async function getCampaignBySlug(
  slug: string,
): Promise<CampaignSettingsView | null> {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);

  return row ? mapCampaignSettings(row) : null;
}

export async function updateCampaignSettings(
  input: UpdateCampaignSettingsInput,
): Promise<CampaignSettingsView | null> {
  const updates: Partial<typeof campaigns.$inferInsert> = {};

  if (input.name !== undefined) {
    updates.name = input.name.trim();
  }
  if (input.progressionMode !== undefined) {
    updates.progressionMode = input.progressionMode;
  }
  if (input.levelingMethod !== undefined) {
    updates.levelingMethod = input.levelingMethod;
  }
  if (input.enabledPackIds !== undefined) {
    updates.enabledPackIds = normalizeEnabledPackIds(input.enabledPackIds);
  }

  if (Object.keys(updates).length === 0) {
    return getCampaignSettings(input.campaignId);
  }

  const [row] = await db
    .update(campaigns)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, input.campaignId))
    .returning();

  return row ? mapCampaignSettings(row) : null;
}

export async function createCharacter(
  input: CreateCharacterInput,
): Promise<CharacterRecord> {
  const [row] = await db
    .insert(characters)
    .values({
      id: input.id ?? randomUUID(),
      campaignId: input.campaignId,
      slug: input.slug.trim(),
      name: input.name.trim(),
      ownerLabel: input.ownerLabel?.trim() || null,
    })
    .returning();

  return row!;
}

export async function listCampaignRoster(
  campaignId: string,
): Promise<CampaignRosterEntry[]> {
  const rows = await db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      ownerLabel: characters.ownerLabel,
    })
    .from(characters)
    .where(eq(characters.campaignId, campaignId))
    .orderBy(asc(characters.name));

  return rows;
}

export async function updateCharacterIdentity(
  input: UpdateCharacterIdentityInput,
): Promise<CharacterRecord | null> {
  const updates: Partial<typeof characters.$inferInsert> = {};

  if (input.slug !== undefined) {
    updates.slug = input.slug.trim();
  }
  if (input.name !== undefined) {
    updates.name = input.name.trim();
  }
  if (input.ownerLabel !== undefined) {
    updates.ownerLabel = input.ownerLabel?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    const [row] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, input.characterId))
      .limit(1);

    return row ?? null;
  }

  const [row] = await db
    .update(characters)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(characters.id, input.characterId))
    .returning();

  return row ?? null;
}

export async function createSession(
  input: CreateSessionInput,
): Promise<SessionRecord> {
  const [row] = await db
    .insert(sessions)
    .values({
      id: input.id ?? randomUUID(),
      campaignId: input.campaignId,
      sessionNumber: input.sessionNumber,
      title: input.title.trim(),
      startsAt: input.startsAt ?? null,
      endedAt: input.endedAt ?? null,
      recapMd: input.recapMd ?? null,
      dmNotesMd: input.dmNotesMd ?? null,
    })
    .returning();

  return row!;
}

export async function listCampaignSessions(
  campaignId: string,
): Promise<SessionListItem[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.campaignId, campaignId))
    .orderBy(asc(sessions.sessionNumber), asc(sessions.startsAt));

  return rows.map(mapSessionListItem);
}

export async function updateSession(
  input: UpdateSessionInput,
): Promise<SessionRecord | null> {
  const [current] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, input.sessionId))
    .limit(1);

  if (!current) {
    return null;
  }

  const [row] = await db
    .update(sessions)
    .set({
      title: input.title?.trim() ?? current.title,
      startsAt: input.startsAt ?? current.startsAt,
      endedAt: input.endedAt ?? current.endedAt,
      recapMd: input.recapMd ?? current.recapMd,
      dmNotesMd: input.dmNotesMd ?? current.dmNotesMd,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, input.sessionId))
    .returning();

  return row ?? null;
}

export async function getCharacterForCampaign(
  campaignId: string,
  characterId: string,
): Promise<CharacterRecord | null> {
  const [row] = await db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.campaignId, campaignId),
        eq(characters.id, characterId),
      ),
    )
    .limit(1);

  return row ?? null;
}
