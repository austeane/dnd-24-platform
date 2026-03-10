import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  characterSources,
  characterSpendPlans,
  xpTransactions,
} from "../db/schema/index.ts";
import { prepareSpendPlan } from "./spend-plan-preparation.ts";
import type {
  CharacterSpendPlanPreview,
  CharacterSpendPlanRecord,
  CharacterSpendPlanSummary,
  CommitCharacterSpendPlanInput,
  CreateCharacterSpendPlanInput,
} from "./types.ts";

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
