import {
  type CharacterState,
  type Effect,
  evaluatePrerequisites,
  getCanonicalEntity,
  getCanonicalMechanicalEntity,
  getCanonicalSpellByName,
  normalizeCanonicalEntityId,
  type PackId,
} from "@dnd/library";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  campaigns,
  type CharacterSourceKind,
  characterSources,
  xpTransactions,
} from "../db/schema/index.ts";
import { extractBaseSnapshot } from "./character-sources.ts";
import { listCharacterSources } from "./character-sources.ts";
import { buildCharacterState } from "./character-state.ts";
import {
  getCharacterSpendPlanTotalXpCost,
  parseCharacterSpendPlanDocument,
} from "./plan-document.ts";
import { listCharacterXpTransactions } from "./xp-transactions.ts";
import type {
  CanonicalSourceSpendPlanOperation,
  CharacterSourceRecord,
  CharacterSpendPlanDocument,
  CharacterSpendPlanPreview,
  ClassLevelSpendPlanOperation,
  SpellAccessSpendPlanOperation,
  XpTransactionRecord,
} from "./types.ts";

export interface PreparedSpendPlanOperation {
  sourceInsert: typeof characterSources.$inferInsert;
  xpInsert: typeof xpTransactions.$inferInsert | null;
}

export interface PreparedSpendPlan {
  document: CharacterSpendPlanDocument;
  operations: PreparedSpendPlanOperation[];
  publicPreview: CharacterSpendPlanPreview;
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

export async function prepareSpendPlan(
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
