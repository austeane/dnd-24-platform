import {
  type CharacterBaseSnapshot,
  type CharacterState,
  computeCharacterState,
  type XPLedgerEntry,
} from "@dnd/library";
import { extractBaseSnapshot, mapCharacterSourcesToRuntime } from "./character-sources.ts";
import { listCharacterSources } from "./character-sources.ts";
import { listCharacterXpTransactions } from "./xp-transactions.ts";
import type {
  CharacterRuntimeState,
  CharacterSourceRecord,
  XpTransactionRecord,
} from "./types.ts";

export function mapXpLedger(records: XpTransactionRecord[]): XPLedgerEntry[] {
  return records.map((record) => ({
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    amount: record.amount,
    category: record.category,
    note: record.note,
    sessionId: record.sessionId ?? undefined,
  }));
}

export function buildCharacterState(
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
