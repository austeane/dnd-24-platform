import { randomUUID } from "node:crypto";
import {
  type CharacterBaseSnapshot,
  type Effect,
  getCanonicalEffectsForSource,
  type SourceWithEffects,
} from "@dnd/library";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { characterSources } from "../db/schema/index.ts";
import type {
  CharacterSourceRecord,
  RecordCharacterSourceInput,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEffectArray(value: unknown): value is Effect[] {
  return Array.isArray(value);
}

export function mergeEffects(
  canonicalEffects: Effect[],
  inlineEffects: Effect[],
): Effect[] {
  const merged = [...canonicalEffects, ...inlineEffects];
  const seen = new Set<string>();

  return merged.filter((effect) => {
    const key = JSON.stringify(effect);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isAbilityScoreSet(value: unknown): value is CharacterBaseSnapshot["abilityScores"] {
  if (!isRecord(value)) {
    return false;
  }

  return ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    .every((ability) => typeof value[ability] === "number");
}

function isCharacterBaseSnapshot(value: unknown): value is CharacterBaseSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.progressionMode === "string" &&
    typeof value.baseArmorClass === "number" &&
    typeof value.baseMaxHP === "number" &&
    typeof value.baseSpeed === "number" &&
    isAbilityScoreSet(value.abilityScores)
  );
}

export function extractBaseSnapshot(
  records: CharacterSourceRecord[],
): CharacterBaseSnapshot | null {
  for (const record of records) {
    if (record.sourceKind !== "override" || !isRecord(record.payloadJson)) {
      continue;
    }

    const baseSnapshot = record.payloadJson.baseSnapshot;
    if (isCharacterBaseSnapshot(baseSnapshot)) {
      return baseSnapshot;
    }
  }

  return null;
}

export function mapCharacterSourcesToRuntime(
  records: CharacterSourceRecord[],
): SourceWithEffects[] {
  return records.map((record) => {
    const payload = isRecord(record.payloadJson) ? record.payloadJson : undefined;
    const rawEffects = payload?.effects;
    const canonicalEffects = payload?.disableCanonicalEffects === true
      ? []
      : getCanonicalEffectsForSource(
          record.sourcePackId ?? undefined,
          record.sourceEntityId,
        );
    const inlineEffects = isEffectArray(rawEffects) ? rawEffects : [];

    return {
      source: {
        id: record.id,
        kind: record.sourceKind,
        name: record.label,
        description:
          typeof payload?.description === "string" ? payload.description : undefined,
        entityId: record.sourceEntityId,
        packId: record.sourcePackId ?? undefined,
        rank: record.rank,
        payload,
      },
      effects: mergeEffects(canonicalEffects, inlineEffects),
    } satisfies SourceWithEffects;
  });
}

export async function recordCharacterSource(
  input: RecordCharacterSourceInput,
): Promise<CharacterSourceRecord> {
  const [row] = await db
    .insert(characterSources)
    .values({
      id: input.id ?? randomUUID(),
      characterId: input.characterId,
      sourceKind: input.sourceKind,
      sourceEntityId: input.sourceEntityId,
      sourcePackId: input.sourcePackId ?? null,
      label: input.label.trim(),
      rank: input.rank ?? 1,
      payloadJson: input.payloadJson ?? null,
    })
    .returning();

  return row;
}

export async function listCharacterSources(
  characterId: string,
): Promise<CharacterSourceRecord[]> {
  return db
    .select()
    .from(characterSources)
    .where(eq(characterSources.characterId, characterId))
    .orderBy(asc(characterSources.sourceKind), asc(characterSources.rank));
}
