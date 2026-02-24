import type { Effect } from "./effect.ts";

export type AAAbilityCategory =
  | "offensive-combat"
  | "defensive"
  | "general-utility"
  | "adventuring-exploration"
  | "spellcasting"
  | "racial"
  | "ability-tree";

export type AAPrerequisiteType =
  | "ability"
  | "ability-score"
  | "level"
  | "proficiency"
  | "spellcasting";

export interface AAPrerequisite {
  type: AAPrerequisiteType;
  /** Human-readable value, e.g. "Rage", "STR 16", "Level 8" */
  value: string;
}

export interface AAAbilityTier {
  expCost: number;
  description: string;
  effects: Effect[];
}

export interface AAAbility {
  name: string;
  expCost: number;
  prerequisites: AAPrerequisite[];
  description: string;
  repeatable: boolean;
  /** For tiered abilities like Rage with scaling costs/benefits */
  tiers: AAAbilityTier[] | undefined;
  effects: Effect[];
  category: AAAbilityCategory;
  /** Which ability tree this belongs to, e.g. "Rage Tree", "Ki Tree" */
  treeName: string | undefined;
}
