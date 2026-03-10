import type { CharacterState, PackId } from "@dnd/library";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  CharacterSourceKind,
  CharacterSpendPlanKind,
  CharacterSpendPlanState,
  XpTransactionCategory,
} from "../db/schema/index.ts";
import {
  characterSources,
  characterSpendPlans,
  xpTransactions,
} from "../db/schema/index.ts";

export type XpTransactionRecord = InferSelectModel<typeof xpTransactions>;
export type NewXpTransactionRecord = InferInsertModel<typeof xpTransactions>;

export type CharacterSourceRecord = InferSelectModel<typeof characterSources>;
export type NewCharacterSourceRecord = InferInsertModel<typeof characterSources>;

export type CharacterSpendPlanRecord = InferSelectModel<
  typeof characterSpendPlans
>;
export type NewCharacterSpendPlanRecord = InferInsertModel<
  typeof characterSpendPlans
>;

export interface ClassLevelSpendPlanOperation {
  type: "class-level";
  classEntityId: string;
  classPackId: PackId;
  levelsGranted: number;
  xpCost: number;
  label?: string;
  notes?: string[];
}

export interface CanonicalSourceSpendPlanOperation {
  type: "canonical-source";
  sourceKind: Exclude<CharacterSourceKind, "override" | "condition">;
  entityId: string;
  packId: PackId;
  xpCost: number;
  label?: string;
  rank?: number;
  notes?: string[];
  payload?: Record<string, unknown>;
}

export interface SpellAccessSpendPlanOperation {
  type: "spell-access";
  spellName: string;
  spellEntityId?: string;
  spellPackId?: PackId;
  sourceKind: "class-feature" | "aa-purchase";
  sourceEntityId?: string;
  sourcePackId?: PackId;
  sourceLabel: string;
  alwaysPrepared?: boolean;
  xpCost: number;
  notes?: string[];
}

export type CharacterSpendPlanOperation =
  | ClassLevelSpendPlanOperation
  | CanonicalSourceSpendPlanOperation
  | SpellAccessSpendPlanOperation;

export interface CharacterSpendPlanDocument {
  version: 1;
  operations: CharacterSpendPlanOperation[];
}

export interface CreateXpTransactionInput {
  id?: string;
  campaignId: string;
  characterId: string;
  sessionId?: string | null;
  category: XpTransactionCategory;
  amount: number;
  note: string;
  createdByLabel: string;
}

export interface RecordCharacterSourceInput {
  id?: string;
  characterId: string;
  sourceKind: CharacterSourceKind;
  sourceEntityId: string;
  sourcePackId?: string | null;
  label: string;
  rank?: number;
  payloadJson?: Record<string, unknown> | null;
}

export interface CreateCharacterSpendPlanInput {
  id?: string;
  campaignId: string;
  characterId: string;
  sessionId?: string | null;
  kind: CharacterSpendPlanKind;
  summary: string;
  notes?: string | null;
  totalXpCost?: number;
  planJson: Record<string, unknown>;
  createdByLabel: string;
}

export interface CommitCharacterSpendPlanInput {
  planId: string;
  actorLabel: string;
  committedAt?: Date;
}

export interface CharacterXpLedgerSummary {
  characterId: string;
  totalAwarded: number;
  totalSpentOnAa: number;
  totalSpentOnLevels: number;
  totalRefunded: number;
  totalAdjusted: number;
  bankedXp: number;
}

export interface CharacterSpendPlanSummary {
  id: string;
  state: CharacterSpendPlanState;
  kind: CharacterSpendPlanKind;
  summary: string;
  totalXpCost: number;
  createdAt: Date;
  committedAt: Date | null;
}

export type CharacterRuntimeState = CharacterState;

export interface CharacterSpendPlanPreview {
  document: CharacterSpendPlanDocument;
  totalXpCost: number;
  bankedXpBefore: number;
  bankedXpAfter: number;
  normalizedOperationCount: number;
}
