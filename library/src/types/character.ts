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
  activeConditions?: ActiveCondition[];
  resourcePoolState?: PersistedResourcePoolState[];
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

/** The ability associated with a D&D skill */
export type SkillAbilityName = AbilityName;

/** Computed state for a single skill: bonus, proficiency, expertise, and source citations */
export interface ComputedSkill {
  skillName: string;
  ability: SkillAbilityName;
  abilityModifier: number;
  proficient: boolean;
  expertise: boolean;
  proficiencyBonus: number;
  bonus: number;
  sources: string[];
}

/** Full computed skill state for a character */
export interface ComputedSkillState {
  skills: ComputedSkill[];
  passivePerception: ModifierExplanation;
}

export interface EvaluatedAction extends GrantedAction {
  sourceName: string;
}

export interface EvaluatedResource extends GrantedResource {
  sourceName: string;
  currentUses: number;
  isTracked: boolean;
  isDepleted: boolean;
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
    current: number;
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

/**
 * A definition for a spell slot pool that can be initialized as a
 * persistent resource pool. Each slot level is a separate pool entry
 * (e.g., "Spell Slot (Level 1)", "Pact Magic Slot (Level 1)").
 */
export interface SpellSlotPoolDefinition {
  slotLevel: number;
  total: number;
  resetOn: "short" | "long";
  source: string;
  resourceName: string;
}

export interface PersistedResourcePoolState {
  resourceName: string;
  currentUses: number;
  maxUses: number;
  resetOn: "short" | "long";
  sourceName: string;
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

/** A condition name recognized by the rules engine */
export type ConditionName = "charmed" | "incapacitated";

/** An active condition on a character, as input to the engine */
export interface ActiveCondition {
  conditionName: ConditionName;
  appliedAt: string;
  appliedByLabel: string;
  /** For conditions like Charmed that target a specific creature */
  sourceCreature?: string;
  note?: string;
}

/** Mechanical effects produced by an active condition */
export interface ConditionMechanicalEffect {
  conditionName: ConditionName;
  description: string;
  tags: string[];
}

/** Breakdown of AC showing base, armor, shield, and Dex contributions */
export interface ACBreakdown {
  explanation: ModifierExplanation;
  base: number;
  armorName: string | undefined;
  armorBase: number | undefined;
  shieldBonus: number | undefined;
  dexBonus: number | undefined;
  dexCap: number | undefined;
  otherBonuses: Array<{
    sourceName: string;
    value: number;
  }>;
}

/** Which ability is used for the attack roll */
export type AttackAbility = "strength" | "dexterity" | "charisma";

/** A computed attack profile for a weapon or similar attack */
export interface AttackProfile {
  name: string;
  weaponEntityId: string | undefined;
  attackType: "melee" | "ranged";
  ability: AttackAbility;
  attackBonus: number;
  attackExplanation: ModifierExplanation;
  damageDice: string;
  damageBonus: number;
  damageType: string;
  /** Range string for ranged/thrown weapons, e.g. "30/120" */
  range: string | undefined;
  properties: string[];
  /** Weapon Mastery property, if the character has the feature and weapon qualifies */
  masteryProperty: string | undefined;
  isProficient: boolean;
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
  acBreakdown: ACBreakdown;
  attackProfiles: AttackProfile[];
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
  skillState: ComputedSkillState;
  resistances: Array<{
    damageType: string;
    condition: string | undefined;
  }>;
  immunities: string[];
  extraAttackCount: number;

  /** Active conditions and their mechanical effects */
  conditions: {
    active: ActiveCondition[];
    effects: ConditionMechanicalEffect[];
  };

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
