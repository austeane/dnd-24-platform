import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  characterResourcePools,
  resourceEvents,
} from "../db/schema/index.ts";
import type {
  CharacterResourcePoolRecord,
  InitializeResourcePoolsInput,
  RecordResourceEventInput,
  ResourceEventRecord,
  RestInput,
  RestoreResourceInput,
  SpendResourceInput,
} from "./types.ts";

function assertPositiveResourceAmount(
  amount: number,
  verb: "spend" | "restore",
): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Resource ${verb} amount must be a positive integer`);
  }
}

// --- Resource Pool CRUD ---

export async function listCharacterResourcePools(
  characterId: string,
): Promise<CharacterResourcePoolRecord[]> {
  return db
    .select()
    .from(characterResourcePools)
    .where(eq(characterResourcePools.characterId, characterId))
    .orderBy(asc(characterResourcePools.resourceName));
}

export async function getCharacterResourcePool(
  characterId: string,
  resourceName: string,
): Promise<CharacterResourcePoolRecord | null> {
  const [row] = await db
    .select()
    .from(characterResourcePools)
    .where(
      and(
        eq(characterResourcePools.characterId, characterId),
        eq(characterResourcePools.resourceName, resourceName),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Initialize or sync resource pools from computed character state.
 * New pools are created at max uses. Existing pools have maxUses updated
 * but currentUses are preserved (clamped to new max).
 */
export async function initializeResourcePools(
  input: InitializeResourcePoolsInput,
): Promise<CharacterResourcePoolRecord[]> {
  const results: CharacterResourcePoolRecord[] = [];

  for (const pool of input.pools) {
    const [row] = await db
      .insert(characterResourcePools)
      .values({
        id: randomUUID(),
        characterId: input.characterId,
        resourceName: pool.resourceName,
        currentUses: pool.maxUses,
        maxUses: pool.maxUses,
        resetOn: pool.resetOn,
        sourceName: pool.sourceName,
      })
      .onConflictDoUpdate({
        target: [
          characterResourcePools.characterId,
          characterResourcePools.resourceName,
        ],
        set: {
          currentUses: sql<number>`least(${characterResourcePools.currentUses}, ${pool.maxUses})`,
          maxUses: pool.maxUses,
          resetOn: pool.resetOn,
          sourceName: pool.sourceName,
          updatedAt: new Date(),
        },
      })
      .returning();

    results.push(row!);
  }

  return results;
}

export async function syncCharacterResourcePools(
  input: InitializeResourcePoolsInput,
): Promise<CharacterResourcePoolRecord[]> {
  const syncedRows = await initializeResourcePools(input);
  const desiredResourceNames = new Set(input.pools.map((pool) => pool.resourceName));
  const existingRows = await listCharacterResourcePools(input.characterId);
  const staleIds = existingRows
    .filter((row) => !desiredResourceNames.has(row.resourceName))
    .map((row) => row.id);

  if (staleIds.length > 0) {
    await db
      .delete(characterResourcePools)
      .where(inArray(characterResourcePools.id, staleIds));
  }

  return syncedRows;
}

// --- Spend ---

export async function spendResource(
  input: SpendResourceInput,
): Promise<CharacterResourcePoolRecord> {
  const pool = await getCharacterResourcePool(
    input.characterId,
    input.resourceName,
  );

  if (!pool) {
    throw new Error(
      `Resource pool "${input.resourceName}" not found for character ${input.characterId}`,
    );
  }

  const amount = input.amount ?? 1;
  assertPositiveResourceAmount(amount, "spend");
  if (pool.currentUses < amount) {
    throw new Error(
      `Insufficient uses for "${input.resourceName}": ${pool.currentUses} available, ${amount} requested`,
    );
  }

  const previousUses = pool.currentUses;
  const newUses = pool.currentUses - amount;

  const [updated] = await db
    .update(characterResourcePools)
    .set({
      currentUses: newUses,
      updatedAt: new Date(),
    })
    .where(eq(characterResourcePools.id, pool.id))
    .returning();

  await recordResourceEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "spend",
    changes: [
      {
        resourceName: input.resourceName,
        previousUses,
        newUses,
      },
    ],
    note: input.note ?? `Spent ${amount} ${input.resourceName}`,
    createdByLabel: input.createdByLabel,
  });

  return updated!;
}

// --- Restore ---

export async function restoreResource(
  input: RestoreResourceInput,
): Promise<CharacterResourcePoolRecord> {
  const pool = await getCharacterResourcePool(
    input.characterId,
    input.resourceName,
  );

  if (!pool) {
    throw new Error(
      `Resource pool "${input.resourceName}" not found for character ${input.characterId}`,
    );
  }

  const amount = input.amount ?? 1;
  assertPositiveResourceAmount(amount, "restore");
  const previousUses = pool.currentUses;
  const newUses = Math.min(pool.currentUses + amount, pool.maxUses);

  const [updated] = await db
    .update(characterResourcePools)
    .set({
      currentUses: newUses,
      updatedAt: new Date(),
    })
    .where(eq(characterResourcePools.id, pool.id))
    .returning();

  await recordResourceEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind: "restore",
    changes: [
      {
        resourceName: input.resourceName,
        previousUses,
        newUses,
      },
    ],
    note: input.note ?? `Restored ${newUses - previousUses} ${input.resourceName}`,
    createdByLabel: input.createdByLabel,
  });

  return updated!;
}

// --- Rest Engines ---

export async function performShortRest(
  input: RestInput,
): Promise<ResourceEventRecord> {
  return performRest(input, "short");
}

export async function performLongRest(
  input: RestInput,
): Promise<ResourceEventRecord> {
  return performRest(input, "long");
}

async function performRest(
  input: RestInput,
  restType: "short" | "long",
): Promise<ResourceEventRecord> {
  const pools = await listCharacterResourcePools(input.characterId);

  // Determine which pools should reset on this rest type
  const poolDefsForRest = restType === "long"
    ? pools
    : pools.filter((pool) => pool.resetOn === "short");

  const changes: Array<{
    resourceName: string;
    previousUses: number;
    newUses: number;
  }> = [];

  for (const pool of poolDefsForRest) {
    if (pool.currentUses < pool.maxUses) {
      const previousUses = pool.currentUses;
      await db
        .update(characterResourcePools)
        .set({
          currentUses: pool.maxUses,
          updatedAt: new Date(),
        })
        .where(eq(characterResourcePools.id, pool.id));

      changes.push({
        resourceName: pool.resourceName,
        previousUses,
        newUses: pool.maxUses,
      });
    }
  }

  const eventKind = restType === "short" ? "short-rest-reset" as const : "long-rest-reset" as const;

  return recordResourceEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    eventKind,
    changes,
    note:
      input.note ??
      `${restType === "short" ? "Short" : "Long"} rest: restored ${changes.length} pool(s)`,
    createdByLabel: input.createdByLabel,
  });
}

// --- Event Recording ---

export async function recordResourceEvent(
  input: RecordResourceEventInput,
): Promise<ResourceEventRecord> {
  const [row] = await db
    .insert(resourceEvents)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      sessionId: input.sessionId ?? null,
      eventKind: input.eventKind,
      changesJson: input.changes,
      note: input.note ?? null,
      createdByLabel: input.createdByLabel.trim(),
    })
    .returning();

  return row!;
}

export async function listCharacterResourceEvents(
  characterId: string,
): Promise<ResourceEventRecord[]> {
  return db
    .select()
    .from(resourceEvents)
    .where(eq(resourceEvents.characterId, characterId))
    .orderBy(desc(resourceEvents.createdAt), desc(resourceEvents.id));
}
