import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  communicationEvents,
  communicationItems,
  communicationRefs,
  communicationTargets,
} from "../db/schema/index.ts";
import type {
  ArchiveCommunicationInput,
  ChangeCommunicationAudienceInput,
  CommunicationAudienceInput,
  CommunicationItemRecord,
  CommunicationRefInput,
  CommunicationRefView,
  CreateCommunicationDraftInput,
  DmCommunicationBoardItem,
  EditCommunicationDraftInput,
  PinCommunicationInput,
  PlayerCommunicationCard,
  PublishCommunicationNowInput,
  ScheduleCommunicationInput,
  UnpinCommunicationInput,
} from "./types.ts";

function normalizeAudience(audience: CommunicationAudienceInput): CommunicationAudienceInput {
  const targetCharacterIds = [...new Set(audience.targetCharacterIds ?? [])]
    .map((characterId) => characterId.trim())
    .filter((characterId) => characterId.length > 0);

  if (audience.audienceKind === "character" && targetCharacterIds.length === 0) {
    throw new Error("character audience requires at least one targetCharacterId");
  }

  if (audience.audienceKind !== "character" && targetCharacterIds.length > 0) {
    throw new Error("targetCharacterIds are only valid for character audience");
  }

  return {
    audienceKind: audience.audienceKind,
    targetCharacterIds,
  };
}

async function appendEvent(
  itemId: string,
  eventType: typeof communicationEvents.$inferInsert.eventType,
  actorLabel: string,
  payloadJson?: Record<string, unknown>,
): Promise<void> {
  await db.insert(communicationEvents).values({
    id: randomUUID(),
    itemId,
    eventType,
    actorLabel: actorLabel.trim(),
    payloadJson: payloadJson ?? null,
  });
}

async function replaceTargets(
  itemId: string,
  audience: CommunicationAudienceInput,
): Promise<void> {
  await db.delete(communicationTargets).where(eq(communicationTargets.itemId, itemId));

  if (audience.audienceKind !== "character") {
    return;
  }

  const targetCharacterIds = audience.targetCharacterIds ?? [];
  if (targetCharacterIds.length === 0) {
    return;
  }

  await db.insert(communicationTargets).values(
    targetCharacterIds.map((characterId) => ({
      id: randomUUID(),
      itemId,
      characterId,
    })),
  );
}

async function replaceRefs(
  itemId: string,
  refs: CommunicationRefInput[] | undefined,
): Promise<void> {
  if (refs === undefined) {
    return;
  }

  await db.delete(communicationRefs).where(eq(communicationRefs.itemId, itemId));

  if (refs.length === 0) {
    return;
  }

  await db.insert(communicationRefs).values(
    refs.map((ref, index) => ({
      id: randomUUID(),
      itemId,
      refType: ref.refType,
      refId: ref.refId.trim(),
      refPackId: ref.refPackId?.trim() || null,
      labelOverride: ref.labelOverride?.trim() || null,
      sortOrder: ref.sortOrder ?? index,
    })),
  );
}

async function getRefsForItems(itemIds: string[]): Promise<Map<string, CommunicationRefView[]>> {
  if (itemIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(communicationRefs)
    .where(inArray(communicationRefs.itemId, itemIds))
    .orderBy(asc(communicationRefs.sortOrder), asc(communicationRefs.refId));

  const refsByItemId = new Map<string, CommunicationRefView[]>();
  for (const row of rows) {
    const refs = refsByItemId.get(row.itemId) ?? [];
    refs.push({
      refType: row.refType,
      refId: row.refId,
      refPackId: row.refPackId,
      label: row.labelOverride ?? row.refId,
    });
    refsByItemId.set(row.itemId, refs);
  }

  return refsByItemId;
}

async function getTargetCharacterIdsByItem(itemIds: string[]): Promise<Map<string, string[]>> {
  if (itemIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(communicationTargets)
    .where(inArray(communicationTargets.itemId, itemIds))
    .orderBy(asc(communicationTargets.createdAt));

  const targetsByItemId = new Map<string, string[]>();
  for (const row of rows) {
    const targets = targetsByItemId.get(row.itemId) ?? [];
    targets.push(row.characterId);
    targetsByItemId.set(row.itemId, targets);
  }

  return targetsByItemId;
}

async function getItem(itemId: string): Promise<CommunicationItemRecord | null> {
  const [row] = await db
    .select()
    .from(communicationItems)
    .where(eq(communicationItems.id, itemId))
    .limit(1);

  return row ?? null;
}

export async function createCommunicationDraft(
  input: CreateCommunicationDraftInput,
): Promise<CommunicationItemRecord> {
  const audience = normalizeAudience(input.audience);
  const [row] = await db
    .insert(communicationItems)
    .values({
      id: input.id ?? randomUUID(),
      campaignId: input.campaignId,
      sessionId: input.sessionId ?? null,
      kind: input.kind,
      audienceKind: audience.audienceKind,
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      bodyMd: input.bodyMd.trim(),
      createdByLabel: input.createdByLabel.trim(),
    })
    .returning();

  await replaceTargets(row.id, audience);
  await replaceRefs(row.id, input.refs);
  await appendEvent(row.id, "created", input.createdByLabel, {
    audienceKind: audience.audienceKind,
    targetCharacterIds: audience.targetCharacterIds ?? [],
  });

  return row;
}

export async function editCommunicationDraft(
  input: EditCommunicationDraftInput,
): Promise<CommunicationItemRecord | null> {
  const existing = await getItem(input.itemId);
  if (!existing) {
    return null;
  }

  const [row] = await db
    .update(communicationItems)
    .set({
      title: input.title?.trim() ?? existing.title,
      summary: input.summary === undefined ? existing.summary : input.summary?.trim() || null,
      bodyMd: input.bodyMd?.trim() ?? existing.bodyMd,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  await replaceRefs(input.itemId, input.refs);
  await appendEvent(input.itemId, "edited", input.actorLabel);

  return row ?? null;
}

export async function scheduleCommunication(
  input: ScheduleCommunicationInput,
): Promise<CommunicationItemRecord | null> {
  const [row] = await db
    .update(communicationItems)
    .set({
      state: "scheduled",
      scheduledFor: input.scheduledFor,
      publishedAt: null,
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  if (!row) {
    return null;
  }

  await appendEvent(input.itemId, "scheduled", input.actorLabel, {
    scheduledFor: input.scheduledFor.toISOString(),
  });
  return row;
}

export async function publishCommunicationNow(
  input: PublishCommunicationNowInput,
): Promise<CommunicationItemRecord | null> {
  const publishedAt = input.publishedAt ?? new Date();
  const [row] = await db
    .update(communicationItems)
    .set({
      state: "published",
      publishedAt,
      archivedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  if (!row) {
    return null;
  }

  await appendEvent(input.itemId, "published", input.actorLabel, {
    publishedAt: publishedAt.toISOString(),
  });
  return row;
}

export async function changeCommunicationAudience(
  input: ChangeCommunicationAudienceInput,
): Promise<CommunicationItemRecord | null> {
  const audience = normalizeAudience(input.audience);
  const [row] = await db
    .update(communicationItems)
    .set({
      audienceKind: audience.audienceKind,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  if (!row) {
    return null;
  }

  await replaceTargets(input.itemId, audience);
  await appendEvent(input.itemId, "audience-changed", input.actorLabel, {
    audienceKind: audience.audienceKind,
    targetCharacterIds: audience.targetCharacterIds ?? [],
  });
  return row;
}

export async function pinCommunication(
  input: PinCommunicationInput,
): Promise<CommunicationItemRecord | null> {
  const pinnedAt = input.pinnedAt ?? new Date();
  const [row] = await db
    .update(communicationItems)
    .set({
      pinRank: input.pinRank,
      pinnedAt,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  if (!row) {
    return null;
  }

  await appendEvent(input.itemId, "pinned", input.actorLabel, {
    pinRank: input.pinRank,
    pinnedAt: pinnedAt.toISOString(),
  });
  return row;
}

export async function unpinCommunication(
  input: UnpinCommunicationInput,
): Promise<CommunicationItemRecord | null> {
  const [row] = await db
    .update(communicationItems)
    .set({
      pinRank: null,
      pinnedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  if (!row) {
    return null;
  }

  await appendEvent(input.itemId, "unpinned", input.actorLabel);
  return row;
}

export async function archiveCommunication(
  input: ArchiveCommunicationInput,
): Promise<CommunicationItemRecord | null> {
  const archivedAt = input.archivedAt ?? new Date();
  const [row] = await db
    .update(communicationItems)
    .set({
      state: "archived",
      archivedAt,
      pinRank: null,
      pinnedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(communicationItems.id, input.itemId))
    .returning();

  if (!row) {
    return null;
  }

  await appendEvent(input.itemId, "archived", input.actorLabel, {
    archivedAt: archivedAt.toISOString(),
  });
  return row;
}

export async function listDmCommunicationBoard(
  campaignId: string,
): Promise<DmCommunicationBoardItem[]> {
  const rows = await db
    .select()
    .from(communicationItems)
    .where(eq(communicationItems.campaignId, campaignId))
    .orderBy(desc(communicationItems.updatedAt), asc(communicationItems.title));

  const targetCharacterIdsByItem = await getTargetCharacterIdsByItem(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    state: row.state,
    audienceKind: row.audienceKind,
    title: row.title,
    sessionId: row.sessionId,
    scheduledFor: row.scheduledFor,
    publishedAt: row.publishedAt,
    pinnedAt: row.pinnedAt,
    targetCharacterIds: targetCharacterIdsByItem.get(row.id) ?? [],
  }));
}

export async function listPlayerCommunicationCards(
  campaignId: string,
  characterId?: string,
): Promise<PlayerCommunicationCard[]> {
  const conditions = [
    and(
      eq(communicationItems.campaignId, campaignId),
      eq(communicationItems.state, "published"),
      eq(communicationItems.audienceKind, "party"),
    ),
  ];

  if (characterId) {
    const targetRows = await db
      .select({ itemId: communicationTargets.itemId })
      .from(communicationTargets)
      .where(eq(communicationTargets.characterId, characterId));

    const targetItemIds = targetRows.map((row) => row.itemId);
    if (targetItemIds.length > 0) {
      conditions.push(
        and(
          eq(communicationItems.campaignId, campaignId),
          eq(communicationItems.state, "published"),
          eq(communicationItems.audienceKind, "character"),
          inArray(communicationItems.id, targetItemIds),
        ),
      );
    }
  }

  const rows = await db
    .select()
    .from(communicationItems)
    .where(or(...conditions))
    .orderBy(
      desc(communicationItems.pinnedAt),
      asc(communicationItems.pinRank),
      desc(communicationItems.publishedAt),
      asc(communicationItems.title),
    );

  const refsByItemId = await getRefsForItems(rows.map((row) => row.id));

  return rows.flatMap((row) => {
    if (!row.publishedAt) {
      return [];
    }

    return [{
      id: row.id,
      kind: row.kind,
      title: row.title,
      summary: row.summary,
      bodyMd: row.bodyMd,
      isPinned: row.pinnedAt !== null,
      publishedAt: row.publishedAt,
      refs: refsByItemId.get(row.id) ?? [],
    }];
  });
}
