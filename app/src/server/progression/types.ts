import type { CharacterState, PackId, ResourcePoolDefinition } from "@dnd/library";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  CharacterSourceKind,
  CharacterSpendPlanKind,
  CharacterSpendPlanState,
  EquipmentSlot,
  ResourceEventChange,
  ResourceEventKind,
  SkillChoiceSource,
  XpTransactionCategory,
} from "../db/schema/index.ts";
import {
  characterEquipment,
  characterFeatChoices,
  characterMetamagicChoices,
  characterPactBladeBonds,
  characterResourcePools,
  characterSkillChoices,
  characterSources,
  characterSpendPlans,
  characterWeaponMasteries,
  resourceEvents,
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

// --- Choice-State Record Types ---

export type CharacterSkillChoiceRecord = InferSelectModel<typeof characterSkillChoices>;
export type CharacterFeatChoiceRecord = InferSelectModel<typeof characterFeatChoices>;
export type CharacterEquipmentRecord = InferSelectModel<typeof characterEquipment>;
export type CharacterWeaponMasteryRecord = InferSelectModel<typeof characterWeaponMasteries>;
export type CharacterMetamagicChoiceRecord = InferSelectModel<typeof characterMetamagicChoices>;
export type CharacterPactBladeBondRecord = InferSelectModel<typeof characterPactBladeBonds>;

// --- Choice-State Input Types ---

export interface RecordSkillChoiceInput {
  id?: string;
  characterId: string;
  skillName: string;
  source: SkillChoiceSource;
  sourceLabel: string;
  hasExpertise?: boolean;
}

export interface RecordFeatChoiceInput {
  id?: string;
  characterId: string;
  featEntityId: string;
  featPackId?: string | null;
  featLabel: string;
  subChoicesJson?: Record<string, unknown> | null;
  sourceLabel: string;
}

export interface RecordEquipmentInput {
  id?: string;
  characterId: string;
  itemEntityId: string;
  itemPackId?: string | null;
  itemLabel: string;
  quantity?: number;
  equipped?: boolean;
  slot?: EquipmentSlot | null;
  stateJson?: Record<string, unknown> | null;
}

export interface UpdateEquipmentInput {
  id: string;
  equipped?: boolean;
  slot?: EquipmentSlot | null;
  quantity?: number;
  stateJson?: Record<string, unknown> | null;
}

export interface RecordWeaponMasteryInput {
  id?: string;
  characterId: string;
  weaponEntityId: string;
  weaponPackId?: string | null;
  weaponLabel: string;
  masteryProperty: string;
}

export interface RecordMetamagicChoiceInput {
  id?: string;
  characterId: string;
  metamagicOption: string;
  sourceLabel: string;
}

export interface RecordPactBladeBondInput {
  id?: string;
  characterId: string;
  weaponEntityId?: string | null;
  weaponPackId?: string | null;
  weaponLabel: string;
  isMagicWeapon?: boolean;
  bondedAt?: Date;
}

// --- Resource Pool Record Types ---

export type CharacterResourcePoolRecord = InferSelectModel<typeof characterResourcePools>;
export type ResourceEventRecord = InferSelectModel<typeof resourceEvents>;

// --- Resource Pool Input Types ---

export interface InitializeResourcePoolsInput {
  characterId: string;
  pools: ResourcePoolDefinition[];
}

export interface SpendResourceInput {
  characterId: string;
  resourceName: string;
  amount?: number;
  sessionId?: string | null;
  note?: string;
  createdByLabel: string;
}

export interface RestoreResourceInput {
  characterId: string;
  resourceName: string;
  amount?: number;
  sessionId?: string | null;
  note?: string;
  createdByLabel: string;
}

export interface RestInput {
  characterId: string;
  sessionId?: string | null;
  note?: string;
  createdByLabel: string;
}

export interface RecordResourceEventInput {
  id?: string;
  characterId: string;
  sessionId?: string | null;
  eventKind: ResourceEventKind;
  changes: ResourceEventChange[];
  note?: string;
  createdByLabel: string;
}
