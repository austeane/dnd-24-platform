import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { xpTransactions } from "../db/schema/index.ts";
import type {
  CharacterXpLedgerSummary,
  CreateXpTransactionInput,
  XpTransactionRecord,
} from "./types.ts";

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
