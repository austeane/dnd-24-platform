import type { AAPrerequisite } from "./aa-ability.ts";
import type {
  GrantedAction,
  GrantedResource,
  GrantedSense,
  GrantedSpellCapacity,
  GrantedSpellAccess,
  GrantedTrait,
  SourceWithEffects,
} from "./effect.ts";
import type { ProgressionMode } from "./campaign.ts";

export type AbilityName =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export interface AbilityScoreSet {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CharacterBaseSnapshot {
  name: string;
  progressionMode: ProgressionMode;
  abilityScores: AbilityScoreSet;
  baseArmorClass: number;
  baseMaxHP: number;
  baseSpeed: number;
  basePassivePerception?: number;
  spellcastingAbility?: AbilityName;
}

export interface CharacterComputationInput {
  base: CharacterBaseSnapshot;
  sources: SourceWithEffects[];
  xpLedger: XPLedgerEntry[];
}

export interface XPLedgerEntry {
  id: string;
  timestamp: string;
  amount: number;
  category: "award" | "spend-aa" | "spend-level" | "refund" | "adjustment";
  note: string;
  sessionId: string | undefined;
}

/** A modifier breakdown for explainability: "Why is my AC 18?" */
export interface ModifierExplanation {
  total: number;
  contributors: Array<{
    sourceName: string;
    value: number;
    condition: string | undefined;
  }>;
}

export interface CharacterProficiencySet {
  savingThrows: string[];
  skills: string[];
  weapons: string[];
  armors: string[];
  tools: string[];
  languages: string[];
}

export interface EvaluatedAction extends GrantedAction {
  sourceName: string;
}

export interface EvaluatedResource extends GrantedResource {
  sourceName: string;
}

/**
 * A computed resource pool definition: the "truth" of what a resource
 * pool looks like for a character, derived from their sources.
 * Used to initialize or sync persistent resource pool state.
 */
export interface ResourcePoolDefinition {
  resourceName: string;
  maxUses: number;
  resetOn: "short" | "long";
  sourceName: string;
}

export interface EvaluatedTrait extends GrantedTrait {
  sourceName: string;
}

export interface EvaluatedSense extends GrantedSense {
  sourceName: string;
}

export interface CharacterSpellSlotPool {
  sourceName: string;
  source: string;
  resetOn: "short" | "long";
  slots: Array<{
    level: number;
    total: number;
  }>;
}

export interface CharacterSpellCapacity extends GrantedSpellCapacity {
  sourceName: string;
}

export interface CharacterSpellcastingState {
  ability: AbilityName;
  grantedSpells: GrantedSpellAccess[];
  grantedSpellNames: string[];
  slotPools: CharacterSpellSlotPool[];
  capacities: CharacterSpellCapacity[];
  spellAttackBonus: number;
  spellAttackExplanation: ModifierExplanation;
  spellSaveDc: number;
  spellSaveExplanation: ModifierExplanation;
}

export interface PrerequisiteCheck {
  prerequisite: AAPrerequisite;
  passed: boolean;
  reason: string;
}

export interface PrerequisiteEvaluation {
  passed: boolean;
  checks: PrerequisiteCheck[];
}

/** The fully computed state of a character, derived from all stored sources */
export interface CharacterState {
  name: string;
  level: number;
  proficiencyBonus: number;
  proficiencyBonusExplanation: ModifierExplanation;
  progressionMode: ProgressionMode;

  abilityScores: AbilityScoreSet;
  maxHP: number;
  maxHPExplanation: ModifierExplanation;
  armorClass: ModifierExplanation;
  initiative: ModifierExplanation;
  speed: number;
  passivePerception: ModifierExplanation;

  spellcasting: CharacterSpellcastingState | null;
  actions: EvaluatedAction[];
  resources: EvaluatedResource[];
  traits: EvaluatedTrait[];
  senses: EvaluatedSense[];
  notes: string[];
  proficiencies: CharacterProficiencySet;
  resistances: Array<{
    damageType: string;
    condition: string | undefined;
  }>;
  immunities: string[];
  extraAttackCount: number;

  /** All sources contributing to this character */
  sources: SourceWithEffects[];

  /** XP tracking (relevant for AA and Hybrid modes) */
  xp: {
    totalEarned: number;
    totalSpent: number;
    totalSpentOnLevels: number;
    totalSpentOnAA: number;
    totalRefunded: number;
    totalAdjusted: number;
    banked: number;
    entries: XPLedgerEntry[];
  };
}
