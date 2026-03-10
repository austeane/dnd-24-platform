import type {
  AAAbilityCategory,
  AAPrerequisite,
} from "../types/aa-ability.ts";
import type { AbilityName } from "../types/character.ts";
import type { Effect } from "../types/effect.ts";
import type { SpellComponents, SpellSchool } from "../types/spell.ts";

export const packIds = ["srd-5e-2024", "advanced-adventurers", "campaign-private"] as const;
export type PackId = (typeof packIds)[number];

export const canonEntityTypes = [
  "spell",
  "rule",
  "condition",
  "equipment",
  "feat",
  "species",
  "class",
  "class-feature",
  "aa-ability",
] as const;
export type CanonEntityType = (typeof canonEntityTypes)[number];

export const sourceEditions = [
  "srd-2014",
  "srd-2024",
  "aa-2014",
  "aa-2024-adapted",
  "campaign-private",
] as const;
export type SourceEdition = (typeof sourceEditions)[number];

export const adaptationModes = [
  "verbatim",
  "ported-unchanged",
  "ported-with-judgement",
  "original",
] as const;
export type AdaptationMode = (typeof adaptationModes)[number];

export const reviewStatuses = [
  "draft",
  "reviewed",
  "verified",
  "llm-judgement",
] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const spellInteractionTypes = [
  "prerequisite",
  "grant",
  "at-will",
  "ritual-only",
  "modifier",
  "example-reference",
] as const;
export type SpellInteractionType = (typeof spellInteractionTypes)[number];

export interface SourceReference {
  sourceTitle: string;
  locator: string;
}

export interface DerivedFromReference {
  label: string;
  sourceEdition: SourceEdition;
  sourceReference: SourceReference;
  packId?: PackId;
  entityId?: string;
}

export interface JudgementCall {
  isJudgementCall: true;
  judgementBasis: string;
  derivedFrom: [DerivedFromReference, DerivedFromReference, ...DerivedFromReference[]];
}

export interface CanonEntityBase {
  type: CanonEntityType;
  id: string;
  slug: string;
  name: string;
  packId: PackId;
  sourceEdition: SourceEdition;
  sourceReference: SourceReference;
  adaptationMode: AdaptationMode;
  judgement: JudgementCall | null;
  reviewStatus: ReviewStatus;
  summary?: string;
  tags?: string[];
  bodyMd: string;
}

export interface CanonicalOverlayTarget {
  packId: PackId;
  entityId: string;
}

export type SpellAvailability = "class-list" | "aa-universal";

export interface CanonicalSpell extends CanonEntityBase {
  type: "spell";
  level: number;
  school: SpellSchool;
  classes: string[];
  availability: SpellAvailability;
  castingTime: string;
  ritual: boolean;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  higherLevelsLabel?: string;
  higherLevelsMd?: string;
  overlayTarget?: CanonicalOverlayTarget;
  aaSourcePage?: number;
  aaSourceImage?: string;
  aaSection?: string;
  linkedAaAbilityIds?: string[];
  interactionTypes?: SpellInteractionType[];
}

export interface CanonicalRule extends CanonEntityBase {
  type: "rule";
  ruleCategory: "core" | "spellcasting" | "combat" | "conditions";
}

export interface CanonicalCondition extends CanonEntityBase {
  type: "condition";
  effects: string[];
}

export interface CanonicalEquipment extends CanonEntityBase {
  type: "equipment";
  equipmentCategory: string;
  effects: Effect[];
}

export interface CanonicalFeat extends CanonEntityBase {
  type: "feat";
  featCategory: string;
  prerequisites: string[];
  effects: Effect[];
}

export interface CanonicalSpecies extends CanonEntityBase {
  type: "species";
  traits: string[];
  effects: Effect[];
}

export interface CanonicalClass extends CanonEntityBase {
  type: "class";
  hitDie: number;
  primaryAbilities: string[];
  savingThrowProficiencies: string[];
  skillOptions: string[];
  skillChoiceCount: number;
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  spellcastingAbility?: AbilityName;
  effects: Effect[];
}

export interface CanonicalClassFeature extends CanonEntityBase {
  type: "class-feature";
  classId: string;
  level: number;
  effects: Effect[];
}

export interface CanonicalAAAbility extends CanonEntityBase {
  type: "aa-ability";
  expCost: number;
  category: AAAbilityCategory;
  repeatable: boolean;
  prerequisites: AAPrerequisite[];
  effects: Effect[];
}

export type CanonicalEntity =
  | CanonicalSpell
  | CanonicalRule
  | CanonicalCondition
  | CanonicalEquipment
  | CanonicalFeat
  | CanonicalSpecies
  | CanonicalClass
  | CanonicalClassFeature
  | CanonicalAAAbility;

export interface CanonicalContentManifest {
  totalEntities: number;
  packs: Record<PackId, number>;
  byType: Record<CanonEntityType, number>;
}
