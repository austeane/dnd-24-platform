import { randomUUID } from "node:crypto";
import {
  computeCharacterState,
  type CharacterBaseSnapshot,
  type CharacterState,
  type Effect,
  evaluatePrerequisites,
  getCanonicalEffectsForSource,
  getCanonicalEntity,
  getCanonicalMechanicalEntity,
  getCanonicalSpellByName,
  normalizeCanonicalEntityId,
  type PackId,
  type SourceWithEffects,
  type XPLedgerEntry,
} from "@dnd/library";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  campaigns,
  type CharacterSourceKind,
  characterSources,
  characterSpendPlans,
  xpTransactions,
} from "../db/schema/index.ts";
import {
  getCharacterSpendPlanTotalXpCost,
  parseCharacterSpendPlanDocument,
} from "./plan-document.ts";
import type {
  CharacterSourceRecord,
  CharacterSpendPlanDocument,
  CharacterSpendPlanPreview,
  CharacterRuntimeState,
  CharacterSpendPlanRecord,
  CharacterSpendPlanSummary,
  CharacterXpLedgerSummary,
  CommitCharacterSpendPlanInput,
  CreateCharacterSpendPlanInput,
  CreateXpTransactionInput,
  RecordCharacterSourceInput,
  SpellAccessSpendPlanOperation,
  XpTransactionRecord,
  CanonicalSourceSpendPlanOperation,
  ClassLevelSpendPlanOperation,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEffectArray(value: unknown): value is Effect[] {
  return Array.isArray(value);
}

function mergeEffects(
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

function extractBaseSnapshot(
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

function mapCharacterSourcesToRuntime(
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

function mapXpLedger(records: XpTransactionRecord[]): XPLedgerEntry[] {
  return records.map((record) => ({
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    amount: record.amount,
    category: record.category,
    note: record.note,
    sessionId: record.sessionId ?? undefined,
  }));
}

interface PreparedSpendPlanOperation {
  sourceInsert: typeof characterSources.$inferInsert;
  xpInsert: typeof xpTransactions.$inferInsert | null;
}

interface PreparedSpendPlan {
  document: CharacterSpendPlanDocument;
  operations: PreparedSpendPlanOperation[];
  publicPreview: CharacterSpendPlanPreview;
}

function buildCharacterState(
  baseSnapshot: CharacterBaseSnapshot,
  sourceRecords: CharacterSourceRecord[],
  xpRecords: XpTransactionRecord[],
): CharacterState {
  return computeCharacterState({
    base: baseSnapshot,
    sources: mapCharacterSourcesToRuntime(sourceRecords),
    xpLedger: mapXpLedger(xpRecords),
  }) satisfies CharacterState;
}

function buildSourcePayload(
  description: string,
  inlineEffects: Effect[],
  notes: string[] | undefined,
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return {
    description,
    ...(notes && notes.length > 0 ? { notes } : {}),
    ...(inlineEffects.length > 0 ? { effects: inlineEffects } : {}),
    ...payload,
  };
}

function getNextSourceRank(
  sourceRecords: CharacterSourceRecord[],
  plannedSourceInserts: PreparedSpendPlanOperation[],
  sourceKind: CharacterSourceKind,
  sourceEntityId: string,
): number {
  const normalizedEntityId = normalizeCanonicalEntityId(sourceEntityId) ?? sourceEntityId;
  const committedCount = sourceRecords.filter((record) =>
    record.sourceKind === sourceKind &&
    (normalizeCanonicalEntityId(record.sourceEntityId) ?? record.sourceEntityId) === normalizedEntityId
  ).length;
  const plannedCount = plannedSourceInserts.filter((operation) =>
    operation.sourceInsert.sourceKind === sourceKind &&
    (normalizeCanonicalEntityId(operation.sourceInsert.sourceEntityId) ?? operation.sourceInsert.sourceEntityId) === normalizedEntityId
  ).length;

  return committedCount + plannedCount + 1;
}

async function getCampaignEnabledPackIds(campaignId: string): Promise<PackId[]> {
  const [row] = await db
    .select({ enabledPackIds: campaigns.enabledPackIds })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!row) {
    throw new Error(`Unknown campaign ${campaignId}`);
  }

  return row.enabledPackIds as PackId[];
}

function assertEnabledPack(
  enabledPackIds: PackId[],
  packId: PackId,
  path: string,
): void {
  if (!enabledPackIds.includes(packId)) {
    throw new Error(`${path}: pack ${packId} is not enabled for this campaign`);
  }
}

function buildProjectedSourceRecord(
  sourceInsert: typeof characterSources.$inferInsert,
): CharacterSourceRecord {
  return {
    id: sourceInsert.id,
    characterId: sourceInsert.characterId,
    sourceKind: sourceInsert.sourceKind,
    sourceEntityId: sourceInsert.sourceEntityId,
    sourcePackId: sourceInsert.sourcePackId ?? null,
    label: sourceInsert.label,
    rank: sourceInsert.rank ?? 1,
    payloadJson: sourceInsert.payloadJson ?? null,
    suppressedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildProjectedXpRecord(
  xpInsert: typeof xpTransactions.$inferInsert,
  createdAt: Date,
): XpTransactionRecord {
  return {
    id: xpInsert.id,
    campaignId: xpInsert.campaignId,
    characterId: xpInsert.characterId,
    sessionId: xpInsert.sessionId ?? null,
    category: xpInsert.category,
    amount: xpInsert.amount,
    note: xpInsert.note,
    createdByLabel: xpInsert.createdByLabel,
    createdAt,
  };
}

function prepareClassLevelOperation(
  operation: ClassLevelSpendPlanOperation,
  planId: string,
  operationIndex: number,
  campaignId: string,
  characterId: string,
  actorLabel: string,
  sessionId: string | null | undefined,
  sourceRecords: CharacterSourceRecord[],
  plannedSourceInserts: PreparedSpendPlanOperation[],
  enabledPackIds: PackId[],
): PreparedSpendPlanOperation {
  assertEnabledPack(enabledPackIds, operation.classPackId, `planJson.operations[${operationIndex}]`);
  const classEntityId = normalizeCanonicalEntityId(operation.classEntityId) ?? operation.classEntityId;
  const classEntity = getCanonicalMechanicalEntity(operation.classPackId, classEntityId);
  if (!classEntity || classEntity.type !== "class") {
    throw new Error(`planJson.operations[${operationIndex}]: unknown class ${operation.classPackId}:${classEntityId}`);
  }

  const sourceInsert = {
    id: `${planId}:source:${operationIndex}`,
    characterId,
    sourceKind: "class-level" as const,
    sourceEntityId: classEntity.id,
    sourcePackId: classEntity.packId,
    label: operation.label?.trim() || `${classEntity.name} +${operation.levelsGranted}`,
    rank: getNextSourceRank(
      sourceRecords,
      plannedSourceInserts,
      "class-level",
      classEntity.id,
    ),
    payloadJson: buildSourcePayload(
      `Spend-plan class advancement for ${classEntity.name}.`,
      [],
      operation.notes,
      {
        levelsGranted: operation.levelsGranted,
      },
    ),
  } satisfies typeof characterSources.$inferInsert;

  return {
    sourceInsert,
    xpInsert: operation.xpCost > 0
      ? {
          id: `${planId}:xp:${operationIndex}`,
          campaignId,
          characterId,
          sessionId: sessionId ?? null,
          category: "spend-level",
          amount: operation.xpCost,
          note: `${sourceInsert.label} (${operation.levelsGranted} level${operation.levelsGranted === 1 ? "" : "s"})`,
          createdByLabel: actorLabel.trim(),
        } satisfies typeof xpTransactions.$inferInsert
      : null,
  };
}

function prepareCanonicalSourceOperation(
  operation: CanonicalSourceSpendPlanOperation,
  planId: string,
  operationIndex: number,
  campaignId: string,
  characterId: string,
  actorLabel: string,
  sessionId: string | null | undefined,
  sourceRecords: CharacterSourceRecord[],
  plannedSourceInserts: PreparedSpendPlanOperation[],
  enabledPackIds: PackId[],
  currentState: CharacterState,
): PreparedSpendPlanOperation {
  assertEnabledPack(enabledPackIds, operation.packId, `planJson.operations[${operationIndex}]`);
  const normalizedEntityId = normalizeCanonicalEntityId(operation.entityId) ?? operation.entityId;
  const entity = getCanonicalMechanicalEntity(operation.packId, normalizedEntityId);
  if (!entity) {
    throw new Error(`planJson.operations[${operationIndex}]: unknown source ${operation.packId}:${normalizedEntityId}`);
  }

  const entityTypeBySourceKind: Partial<Record<CharacterSourceKind, typeof entity.type>> = {
    "aa-purchase": "aa-ability",
    "class-feature": "class-feature",
    "subclass-feature": "class-feature",
    equipment: "equipment",
    feat: "feat",
    species: "species",
  };
  const expectedType = entityTypeBySourceKind[operation.sourceKind];
  if (!expectedType || entity.type !== expectedType) {
    throw new Error(`planJson.operations[${operationIndex}]: ${operation.sourceKind} cannot point at ${entity.type}`);
  }

  const existingCount = sourceRecords.filter((record) =>
    record.sourceKind === operation.sourceKind &&
    (normalizeCanonicalEntityId(record.sourceEntityId) ?? record.sourceEntityId) === normalizedEntityId
  ).length + plannedSourceInserts.filter((prepared) =>
    prepared.sourceInsert.sourceKind === operation.sourceKind &&
    (normalizeCanonicalEntityId(prepared.sourceInsert.sourceEntityId) ?? prepared.sourceInsert.sourceEntityId) === normalizedEntityId
  ).length;

  if (entity.type === "aa-ability") {
    const prerequisiteResult = evaluatePrerequisites(entity.prerequisites, currentState);
    if (!prerequisiteResult.passed) {
      throw new Error(
        `planJson.operations[${operationIndex}]: prerequisites failed for ${entity.name}: ${prerequisiteResult.checks.filter((check) => !check.passed).map((check) => check.reason).join("; ")}`,
      );
    }
    if (!entity.repeatable && existingCount > 0) {
      throw new Error(`planJson.operations[${operationIndex}]: ${entity.name} is not repeatable`);
    }
  } else if (existingCount > 0) {
    throw new Error(`planJson.operations[${operationIndex}]: ${entity.name} is already present on this character`);
  }

  const sourceInsert = {
    id: `${planId}:source:${operationIndex}`,
    characterId,
    sourceKind: operation.sourceKind,
    sourceEntityId: entity.id,
    sourcePackId: entity.packId,
    label: operation.label?.trim() || entity.name,
    rank: operation.rank ?? getNextSourceRank(
      sourceRecords,
      plannedSourceInserts,
      operation.sourceKind,
      entity.id,
    ),
    payloadJson: buildSourcePayload(
      entity.summary ?? `${entity.name} from spend plan.`,
      [],
      operation.notes,
      operation.payload,
    ),
  } satisfies typeof characterSources.$inferInsert;

  const xpCategory = operation.sourceKind === "aa-purchase" ? "spend-aa" : "spend-level";

  return {
    sourceInsert,
    xpInsert: operation.xpCost > 0
      ? {
          id: `${planId}:xp:${operationIndex}`,
          campaignId,
          characterId,
          sessionId: sessionId ?? null,
          category: xpCategory,
          amount: operation.xpCost,
          note: sourceInsert.label,
          createdByLabel: actorLabel.trim(),
        } satisfies typeof xpTransactions.$inferInsert
      : null,
  };
}

function prepareSpellAccessOperation(
  operation: SpellAccessSpendPlanOperation,
  planId: string,
  operationIndex: number,
  campaignId: string,
  characterId: string,
  actorLabel: string,
  sessionId: string | null | undefined,
  sourceRecords: CharacterSourceRecord[],
  plannedSourceInserts: PreparedSpendPlanOperation[],
  enabledPackIds: PackId[],
): PreparedSpendPlanOperation {
  const spell = operation.spellPackId && operation.spellEntityId
    ? getCanonicalEntity(operation.spellPackId, operation.spellEntityId)
    : getCanonicalSpellByName(operation.spellName, enabledPackIds);
  if (!spell || spell.type !== "spell") {
    throw new Error(`planJson.operations[${operationIndex}]: unknown spell ${operation.spellName}`);
  }
  assertEnabledPack(enabledPackIds, spell.packId, `planJson.operations[${operationIndex}]`);
  if (operation.sourcePackId) {
    assertEnabledPack(enabledPackIds, operation.sourcePackId, `planJson.operations[${operationIndex}]`);
  }

  const sourceEntityId = normalizeCanonicalEntityId(operation.sourceEntityId) ??
    `spell-access:${spell.slug}`;
  const sourceInsert = {
    id: `${planId}:source:${operationIndex}`,
    characterId,
    sourceKind: operation.sourceKind,
    sourceEntityId,
    sourcePackId: operation.sourcePackId ?? null,
    label: operation.sourceLabel.trim(),
    rank: getNextSourceRank(
      sourceRecords,
      plannedSourceInserts,
      operation.sourceKind,
      sourceEntityId,
    ),
    payloadJson: buildSourcePayload(
      `Spend-plan spell access for ${spell.name}.`,
      [{
        type: "grant-spell-access",
        spell: {
          spellName: spell.name,
          spellEntityId: spell.id,
          spellPackId: spell.packId,
          alwaysPrepared: operation.alwaysPrepared ?? false,
          source: operation.sourceLabel.trim(),
        },
      }],
      operation.notes,
      undefined,
    ),
  } satisfies typeof characterSources.$inferInsert;

  const xpCategory = operation.sourceKind === "aa-purchase" ? "spend-aa" : "spend-level";

  return {
    sourceInsert,
    xpInsert: operation.xpCost > 0
      ? {
          id: `${planId}:xp:${operationIndex}`,
          campaignId,
          characterId,
          sessionId: sessionId ?? null,
          category: xpCategory,
          amount: operation.xpCost,
          note: `${operation.sourceLabel.trim()}: ${spell.name}`,
          createdByLabel: actorLabel.trim(),
        } satisfies typeof xpTransactions.$inferInsert
      : null,
  };
}

async function prepareSpendPlan(
  planId: string,
  campaignId: string,
  characterId: string,
  sessionId: string | null | undefined,
  actorLabel: string,
  planJson: unknown,
): Promise<PreparedSpendPlan> {
  const document = parseCharacterSpendPlanDocument(planJson);
  const [enabledPackIds, sourceRecords, xpRecords] = await Promise.all([
    getCampaignEnabledPackIds(campaignId),
    listCharacterSources(characterId),
    listCharacterXpTransactions(characterId),
  ]);

  const baseSnapshot = extractBaseSnapshot(sourceRecords);
  if (!baseSnapshot) {
    throw new Error(`Character ${characterId} has no base snapshot`);
  }

  const preparedOperations: PreparedSpendPlanOperation[] = [];
  let projectedSourceRecords = [...sourceRecords];
  let projectedXpRecords = [...xpRecords];
  let projectedState = buildCharacterState(baseSnapshot, projectedSourceRecords, projectedXpRecords);
  const bankedXpBefore = projectedState.xp.banked;

  document.operations.forEach((operation, operationIndex) => {
    if (operation.xpCost > projectedState.xp.banked) {
      throw new Error(`planJson.operations[${operationIndex}]: costs ${operation.xpCost} XP but only ${projectedState.xp.banked} XP is currently banked`);
    }

    const prepared = operation.type === "class-level"
      ? prepareClassLevelOperation(
          operation,
          planId,
          operationIndex,
          campaignId,
          characterId,
          actorLabel,
          sessionId,
          sourceRecords,
          preparedOperations,
          enabledPackIds,
        )
      : operation.type === "canonical-source"
        ? prepareCanonicalSourceOperation(
            operation,
            planId,
            operationIndex,
            campaignId,
            characterId,
            actorLabel,
            sessionId,
            sourceRecords,
            preparedOperations,
            enabledPackIds,
            projectedState,
          )
        : prepareSpellAccessOperation(
            operation,
            planId,
            operationIndex,
            campaignId,
            characterId,
            actorLabel,
            sessionId,
            sourceRecords,
            preparedOperations,
            enabledPackIds,
          );

    preparedOperations.push(prepared);
    projectedSourceRecords = [
      ...projectedSourceRecords,
      buildProjectedSourceRecord(prepared.sourceInsert),
    ];
    if (prepared.xpInsert) {
      projectedXpRecords = [
        ...projectedXpRecords,
        buildProjectedXpRecord(prepared.xpInsert, new Date()),
      ];
    }
    projectedState = buildCharacterState(baseSnapshot, projectedSourceRecords, projectedXpRecords);
  });

  return {
    document,
    operations: preparedOperations,
    publicPreview: {
      document,
      totalXpCost: getCharacterSpendPlanTotalXpCost(document),
      bankedXpBefore,
      bankedXpAfter: projectedState.xp.banked,
      normalizedOperationCount: preparedOperations.length,
    },
  };
}

export async function previewCharacterSpendPlan(
  campaignId: string,
  characterId: string,
  planJson: unknown,
): Promise<CharacterSpendPlanPreview> {
  const prepared = await prepareSpendPlan(
    `preview:${characterId}`,
    campaignId,
    characterId,
    null,
    "preview",
    planJson,
  );

  return prepared.publicPreview;
}

export async function recordXpTransaction(
  input: CreateXpTransactionInput,
): Promise<XpTransactionRecord> {
  const [row] = await db
    .insert(xpTransactions)
    .values({
      id: input.id ?? randomUUID(),
      campaignId: input.campaignId,
      characterId: input.characterId,
      sessionId: input.sessionId ?? null,
      category: input.category,
      amount: input.amount,
      note: input.note.trim(),
      createdByLabel: input.createdByLabel.trim(),
    })
    .returning();

  return row;
}

export async function listCharacterXpTransactions(
  characterId: string,
): Promise<XpTransactionRecord[]> {
  return db
    .select()
    .from(xpTransactions)
    .where(eq(xpTransactions.characterId, characterId))
    .orderBy(desc(xpTransactions.createdAt), desc(xpTransactions.id));
}

export async function getCharacterXpLedgerSummary(
  characterId: string,
): Promise<CharacterXpLedgerSummary> {
  const [row] = await db
    .select({
      characterId: xpTransactions.characterId,
      totalAwarded: sql<number>`coalesce(sum(case when ${xpTransactions.category} = 'award' then ${xpTransactions.amount} else 0 end), 0)`,
      totalSpentOnAa: sql<number>`coalesce(sum(case when ${xpTransactions.category} = 'spend-aa' then ${xpTransactions.amount} else 0 end), 0)`,
      totalSpentOnLevels: sql<number>`coalesce(sum(case when ${xpTransactions.category} = 'spend-level' then ${xpTransactions.amount} else 0 end), 0)`,
      totalRefunded: sql<number>`coalesce(sum(case when ${xpTransactions.category} = 'refund' then ${xpTransactions.amount} else 0 end), 0)`,
      totalAdjusted: sql<number>`coalesce(sum(case when ${xpTransactions.category} = 'adjustment' then ${xpTransactions.amount} else 0 end), 0)`,
      bankedXp: sql<number>`coalesce(sum(
        case
          when ${xpTransactions.category} in ('award', 'refund', 'adjustment') then ${xpTransactions.amount}
          when ${xpTransactions.category} in ('spend-aa', 'spend-level') then -${xpTransactions.amount}
          else 0
        end
      ), 0)`,
    })
    .from(xpTransactions)
    .where(eq(xpTransactions.characterId, characterId))
    .groupBy(xpTransactions.characterId);

  if (!row) {
    return {
      characterId,
      totalAwarded: 0,
      totalSpentOnAa: 0,
      totalSpentOnLevels: 0,
      totalRefunded: 0,
      totalAdjusted: 0,
      bankedXp: 0,
    };
  }

  return {
    characterId: row.characterId,
    totalAwarded: Number(row.totalAwarded),
    totalSpentOnAa: Number(row.totalSpentOnAa),
    totalSpentOnLevels: Number(row.totalSpentOnLevels),
    totalRefunded: Number(row.totalRefunded),
    totalAdjusted: Number(row.totalAdjusted),
    bankedXp: Number(row.bankedXp),
  };
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

export async function createCharacterSpendPlan(
  input: CreateCharacterSpendPlanInput,
): Promise<CharacterSpendPlanRecord> {
  const preview = await previewCharacterSpendPlan(
    input.campaignId,
    input.characterId,
    input.planJson,
  );

  const [row] = await db
    .insert(characterSpendPlans)
    .values({
      id: input.id ?? randomUUID(),
      campaignId: input.campaignId,
      characterId: input.characterId,
      sessionId: input.sessionId ?? null,
      kind: input.kind,
      summary: input.summary.trim(),
      notes: input.notes ?? null,
      totalXpCost: preview.totalXpCost,
      planJson: preview.document as unknown as Record<string, unknown>,
      createdByLabel: input.createdByLabel.trim(),
    })
    .returning();

  return row;
}

export async function listCharacterSpendPlans(
  characterId: string,
  state?: CharacterSpendPlanRecord["state"],
): Promise<CharacterSpendPlanSummary[]> {
  const rows = await db
    .select({
      id: characterSpendPlans.id,
      state: characterSpendPlans.state,
      kind: characterSpendPlans.kind,
      summary: characterSpendPlans.summary,
      totalXpCost: characterSpendPlans.totalXpCost,
      createdAt: characterSpendPlans.createdAt,
      committedAt: characterSpendPlans.committedAt,
    })
    .from(characterSpendPlans)
    .where(
      state
        ? and(
            eq(characterSpendPlans.characterId, characterId),
            eq(characterSpendPlans.state, state),
          )
        : eq(characterSpendPlans.characterId, characterId),
    )
    .orderBy(desc(characterSpendPlans.createdAt));

  return rows.map((row) => ({
    ...row,
    totalXpCost: Number(row.totalXpCost),
  }));
}

export async function commitCharacterSpendPlan(
  input: CommitCharacterSpendPlanInput,
): Promise<CharacterSpendPlanRecord | null> {
  const [plan] = await db
    .select()
    .from(characterSpendPlans)
    .where(eq(characterSpendPlans.id, input.planId))
    .limit(1);

  if (!plan) {
    return null;
  }
  if (plan.state !== "draft") {
    throw new Error(`Spend plan ${input.planId} is already ${plan.state}`);
  }

  const prepared = await prepareSpendPlan(
    plan.id,
    plan.campaignId,
    plan.characterId,
    plan.sessionId,
    input.actorLabel,
    plan.planJson,
  );
  const committedAt = input.committedAt ?? new Date();

  return db.transaction(async (tx) => {
    for (const operation of prepared.operations) {
      await tx.insert(characterSources).values(operation.sourceInsert);
      if (operation.xpInsert) {
        await tx.insert(xpTransactions).values(operation.xpInsert);
      }
    }

    const [row] = await tx
      .update(characterSpendPlans)
      .set({
        totalXpCost: prepared.publicPreview.totalXpCost,
        planJson: prepared.document as unknown as Record<string, unknown>,
        state: "committed",
        committedAt,
        updatedAt: committedAt,
      })
      .where(eq(characterSpendPlans.id, input.planId))
      .returning();

    return row ?? null;
  });
}

export async function getCharacterRuntimeState(
  characterId: string,
): Promise<CharacterRuntimeState | null> {
  const [sources, xpLedger] = await Promise.all([
    listCharacterSources(characterId),
    listCharacterXpTransactions(characterId),
  ]);

  const baseSnapshot = extractBaseSnapshot(sources);
  if (!baseSnapshot) {
    return null;
  }

  return computeCharacterState({
    base: baseSnapshot,
    sources: mapCharacterSourcesToRuntime(sources),
    xpLedger: mapXpLedger(xpLedger),
  }) satisfies CharacterState;
}
