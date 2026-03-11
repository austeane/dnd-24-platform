import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  characterHitPoints,
  hitPointEvents,
} from "../db/schema/index.ts";
import {
  buildCharacterRuntimeStateFromRows,
  loadCharacterProjectionRows,
} from "./projection.ts";
import type {
  CharacterHitPointRecord,
  ClearTemporaryHitPointsInput,
  HitPointEventRecord,
  HitPointMutationInput,
  RecordHitPointEventInput,
  RestInput,
  SyncHitPointsInput,
} from "./types.ts";

function assertPositiveHitPointAmount(
  amount: number,
  verb: "damage" | "heal" | "gain" | "replace",
): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Hit point ${verb} amount must be a positive integer`);
  }
}

function clampCurrentHp(currentHP: number, maxHP: number): number {
  return Math.min(Math.max(currentHP, 0), maxHP);
}

function clampTempHp(tempHP: number): number {
  return Math.max(tempHP, 0);
}

async function getAuthoritativeRuntimeHitPoints(characterId: string): Promise<{
  maxHP: number;
  currentHP: number;
  tempHP: number;
}> {
  const rows = await loadCharacterProjectionRows(characterId);
  const runtime = buildCharacterRuntimeStateFromRows(characterId, rows);

  if (!runtime) {
    throw new Error(`Character ${characterId} is missing runtime state.`);
  }

  return {
    maxHP: runtime.maxHP,
    currentHP: runtime.currentHP,
    tempHP: runtime.tempHP,
  };
}

async function ensureSyncedHitPointState(characterId: string): Promise<{
  row: CharacterHitPointRecord;
  maxHP: number;
}> {
  const runtime = await getAuthoritativeRuntimeHitPoints(characterId);

  await syncCharacterHitPoints({
    characterId,
    maxHP: runtime.maxHP,
    currentHP: runtime.currentHP,
    tempHP: runtime.tempHP,
  });

  const row = await getCharacterHitPointState(characterId);
  if (!row) {
    throw new Error(`Hit point state was not initialized for character ${characterId}`);
  }

  return {
    row,
    maxHP: runtime.maxHP,
  };
}

export async function getCharacterHitPointState(
  characterId: string,
): Promise<CharacterHitPointRecord | null> {
  const [row] = await db
    .select()
    .from(characterHitPoints)
    .where(eq(characterHitPoints.characterId, characterId))
    .limit(1);

  return row ?? null;
}

export async function syncCharacterHitPoints(
  input: SyncHitPointsInput,
): Promise<CharacterHitPointRecord> {
  const currentHp = clampCurrentHp(input.currentHP, input.maxHP);
  const tempHp = clampTempHp(input.tempHP);

  const [row] = await db
    .insert(characterHitPoints)
    .values({
      id: randomUUID(),
      characterId: input.characterId,
      currentHp,
      tempHp,
    })
    .onConflictDoUpdate({
      target: [characterHitPoints.characterId],
      set: {
        currentHp,
        tempHp,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row!;
}

async function updateHitPoints(
  row: CharacterHitPointRecord,
  next: {
    currentHp: number;
    tempHp: number;
  },
): Promise<CharacterHitPointRecord> {
  const [updated] = await db
    .update(characterHitPoints)
    .set({
      currentHp: next.currentHp,
      tempHp: next.tempHp,
      updatedAt: new Date(),
    })
    .where(eq(characterHitPoints.id, row.id))
    .returning();

  return updated!;
}

export async function applyDamage(
  input: HitPointMutationInput,
): Promise<CharacterHitPointRecord> {
  const { row } = await ensureSyncedHitPointState(input.characterId);
  const amount = input.amount ?? 1;
  assertPositiveHitPointAmount(amount, "damage");

  const absorbedByTemp = Math.min(row.tempHp, amount);
  const remainingDamage = amount - absorbedByTemp;
  const newTempHp = row.tempHp - absorbedByTemp;
  const newCurrentHp = Math.max(row.currentHp - remainingDamage, 0);
  const updated = await updateHitPoints(row, {
    currentHp: newCurrentHp,
    tempHp: newTempHp,
  });

  await recordHitPointEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "damage",
    previousCurrentHp: row.currentHp,
    newCurrentHp,
    previousTempHp: row.tempHp,
    newTempHp,
    note: input.note ?? `Took ${amount} damage`,
    createdByLabel: input.createdByLabel,
  });

  return updated;
}

export async function healHitPoints(
  input: HitPointMutationInput,
): Promise<CharacterHitPointRecord> {
  const { row, maxHP } = await ensureSyncedHitPointState(input.characterId);
  const amount = input.amount ?? 1;
  assertPositiveHitPointAmount(amount, "heal");

  const newCurrentHp = Math.min(row.currentHp + amount, maxHP);
  const updated = await updateHitPoints(row, {
    currentHp: newCurrentHp,
    tempHp: row.tempHp,
  });

  await recordHitPointEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "heal",
    previousCurrentHp: row.currentHp,
    newCurrentHp,
    previousTempHp: row.tempHp,
    newTempHp: row.tempHp,
    note: input.note ?? `Recovered ${newCurrentHp - row.currentHp} hit points`,
    createdByLabel: input.createdByLabel,
  });

  return updated;
}

export async function gainTemporaryHitPoints(
  input: HitPointMutationInput,
): Promise<CharacterHitPointRecord> {
  const { row } = await ensureSyncedHitPointState(input.characterId);
  const amount = input.amount ?? 1;
  assertPositiveHitPointAmount(amount, "gain");

  const newTempHp = Math.max(row.tempHp, amount);
  const updated = await updateHitPoints(row, {
    currentHp: row.currentHp,
    tempHp: newTempHp,
  });

  await recordHitPointEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "temp-gain",
    previousCurrentHp: row.currentHp,
    newCurrentHp: row.currentHp,
    previousTempHp: row.tempHp,
    newTempHp,
    note: input.note ?? `Applied ${amount} temporary hit points`,
    createdByLabel: input.createdByLabel,
  });

  return updated;
}

export async function replaceTemporaryHitPoints(
  input: HitPointMutationInput,
): Promise<CharacterHitPointRecord> {
  const { row } = await ensureSyncedHitPointState(input.characterId);
  const amount = input.amount ?? 1;
  assertPositiveHitPointAmount(amount, "replace");

  const updated = await updateHitPoints(row, {
    currentHp: row.currentHp,
    tempHp: amount,
  });

  await recordHitPointEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "temp-replace",
    previousCurrentHp: row.currentHp,
    newCurrentHp: row.currentHp,
    previousTempHp: row.tempHp,
    newTempHp: amount,
    note: input.note ?? `Replaced temporary hit points with ${amount}`,
    createdByLabel: input.createdByLabel,
  });

  return updated;
}

export async function clearTemporaryHitPoints(
  input: ClearTemporaryHitPointsInput,
): Promise<CharacterHitPointRecord> {
  const { row } = await ensureSyncedHitPointState(input.characterId);
  const updated = await updateHitPoints(row, {
    currentHp: row.currentHp,
    tempHp: 0,
  });

  await recordHitPointEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "temp-clear",
    previousCurrentHp: row.currentHp,
    newCurrentHp: row.currentHp,
    previousTempHp: row.tempHp,
    newTempHp: 0,
    note: input.note ?? "Cleared temporary hit points",
    createdByLabel: input.createdByLabel,
  });

  return updated;
}

export async function restoreHitPointsForLongRest(
  input: RestInput,
): Promise<CharacterHitPointRecord> {
  const { row, maxHP } = await ensureSyncedHitPointState(input.characterId);
  const updated = await updateHitPoints(row, {
    currentHp: maxHP,
    tempHp: 0,
  });

  await recordHitPointEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "long-rest-reset",
    previousCurrentHp: row.currentHp,
    newCurrentHp: maxHP,
    previousTempHp: row.tempHp,
    newTempHp: 0,
    note: input.note ?? "Long rest: restored hit points to full",
    createdByLabel: input.createdByLabel,
  });

  return updated;
}

export async function recordHitPointEvent(
  input: RecordHitPointEventInput,
) {
  const [row] = await db
    .insert(hitPointEvents)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      sessionId: input.sessionId ?? null,
      eventKind: input.eventKind,
      previousCurrentHp: input.previousCurrentHp,
      newCurrentHp: input.newCurrentHp,
      previousTempHp: input.previousTempHp,
      newTempHp: input.newTempHp,
      note: input.note ?? null,
      createdByLabel: input.createdByLabel.trim(),
    })
    .returning();

  return row!;
}

export async function listCharacterHitPointEvents(
  characterId: string,
): Promise<HitPointEventRecord[]> {
  return db
    .select()
    .from(hitPointEvents)
    .where(eq(hitPointEvents.characterId, characterId))
    .orderBy(desc(hitPointEvents.createdAt), desc(hitPointEvents.id));
}
