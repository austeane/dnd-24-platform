import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  characterConditions,
  conditionEvents,
} from "../db/schema/index.ts";
import type { ConditionName } from "../db/schema/index.ts";
import type {
  ApplyConditionInput,
  CharacterConditionRecord,
  ConditionEventRecord,
  RemoveConditionInput,
  OverrideConditionInput,
} from "./types.ts";

/**
 * List all currently active (non-removed) conditions for a character.
 */
export async function listActiveConditions(
  characterId: string,
): Promise<CharacterConditionRecord[]> {
  return db
    .select()
    .from(characterConditions)
    .where(
      and(
        eq(characterConditions.characterId, characterId),
        isNull(characterConditions.removedAt),
      ),
    )
    .orderBy(asc(characterConditions.appliedAt));
}

/**
 * Apply a condition to a character (DM action).
 * Creates the condition record and an audit event.
 */
export async function applyCondition(
  input: ApplyConditionInput,
): Promise<CharacterConditionRecord> {
  const conditionId = input.id ?? randomUUID();

  const [row] = await db
    .insert(characterConditions)
    .values({
      id: conditionId,
      characterId: input.characterId,
      conditionName: input.conditionName,
      sourceCreature: input.sourceCreature ?? null,
      note: input.note ?? null,
      appliedByLabel: input.appliedByLabel.trim(),
      appliedAt: input.appliedAt ?? new Date(),
    })
    .returning();

  await recordConditionEvent({
    characterId: input.characterId,
    sessionId: input.sessionId,
    conditionId,
    eventKind: "apply",
    conditionName: input.conditionName,
    note: input.note ?? `Applied ${input.conditionName}`,
    createdByLabel: input.appliedByLabel.trim(),
  });

  return row!;
}

/**
 * Remove a condition from a character (DM action).
 * Marks the condition as removed and creates an audit event.
 */
export async function removeCondition(
  input: RemoveConditionInput,
): Promise<CharacterConditionRecord> {
  const [row] = await db
    .update(characterConditions)
    .set({
      removedByLabel: input.removedByLabel.trim(),
      removedAt: input.removedAt ?? new Date(),
    })
    .where(
      and(
        eq(characterConditions.id, input.conditionId),
        isNull(characterConditions.removedAt),
      ),
    )
    .returning();

  if (!row) {
    throw new Error(
      `Condition ${input.conditionId} not found or already removed`,
    );
  }

  await recordConditionEvent({
    characterId: row.characterId,
    sessionId: input.sessionId,
    conditionId: input.conditionId,
    eventKind: "remove",
    conditionName: row.conditionName,
    note: input.note ?? `Removed ${row.conditionName}`,
    createdByLabel: input.removedByLabel.trim(),
  });

  return row!;
}

/**
 * DM override/correction: remove an existing condition and optionally
 * apply a corrected version. Creates "override" audit events.
 */
export async function overrideCondition(
  input: OverrideConditionInput,
): Promise<{
  removed: CharacterConditionRecord;
  replacement: CharacterConditionRecord | null;
}> {
  // Remove the existing condition
  const [removed] = await db
    .update(characterConditions)
    .set({
      removedByLabel: input.correctedByLabel.trim(),
      removedAt: new Date(),
    })
    .where(
      and(
        eq(characterConditions.id, input.conditionId),
        isNull(characterConditions.removedAt),
      ),
    )
    .returning();

  if (!removed) {
    throw new Error(
      `Condition ${input.conditionId} not found or already removed`,
    );
  }

  await recordConditionEvent({
    characterId: removed.characterId,
    sessionId: input.sessionId,
    conditionId: input.conditionId,
    eventKind: "override",
    conditionName: removed.conditionName,
    note: input.note ?? `DM override: corrected ${removed.conditionName}`,
    createdByLabel: input.correctedByLabel.trim(),
  });

  // Optionally apply a replacement
  let replacement: CharacterConditionRecord | null = null;
  if (input.replacement) {
    replacement = await applyCondition({
      characterId: removed.characterId,
      conditionName: input.replacement.conditionName,
      sourceCreature: input.replacement.sourceCreature,
      note: input.replacement.note ?? `Replacement via DM override`,
      appliedByLabel: input.correctedByLabel,
      sessionId: input.sessionId,
    });
  }

  return { removed, replacement };
}

/**
 * List all condition events for a character (audit trail).
 */
export async function listConditionEvents(
  characterId: string,
): Promise<ConditionEventRecord[]> {
  return db
    .select()
    .from(conditionEvents)
    .where(eq(conditionEvents.characterId, characterId))
    .orderBy(desc(conditionEvents.createdAt), desc(conditionEvents.id));
}

// --- Internal helpers ---

async function recordConditionEvent(input: {
  characterId: string;
  sessionId?: string | null;
  conditionId: string;
  eventKind: "apply" | "remove" | "override";
  conditionName: ConditionName;
  note: string;
  createdByLabel: string;
}): Promise<ConditionEventRecord> {
  const [row] = await db
    .insert(conditionEvents)
    .values({
      id: randomUUID(),
      characterId: input.characterId,
      sessionId: input.sessionId ?? null,
      conditionId: input.conditionId,
      eventKind: input.eventKind,
      conditionName: input.conditionName,
      note: input.note,
      createdByLabel: input.createdByLabel,
    })
    .returning();

  return row!;
}
