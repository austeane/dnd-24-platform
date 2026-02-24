import type { SourceWithEffects } from "./effect.ts";
import type { ProgressionMode } from "./campaign.ts";

export interface AbilityScoreSet {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface XPLedgerEntry {
  id: string;
  timestamp: string;
  amount: number;
  /** "award" = DM grants XP, "spend-aa" = buy AA ability, "spend-level" = buy class level, "refund" */
  category: "award" | "spend-aa" | "spend-level" | "refund";
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

/** The fully computed state of a character, derived from all sources */
export interface CharacterState {
  name: string;
  level: number;
  proficiencyBonus: number;
  progressionMode: ProgressionMode;

  abilityScores: AbilityScoreSet;
  maxHP: number;
  armorClass: ModifierExplanation;
  initiative: ModifierExplanation;
  speed: number;

  /** All sources contributing to this character */
  sources: SourceWithEffects[];

  /** XP tracking (relevant for AA and Hybrid modes) */
  xp: {
    totalEarned: number;
    totalSpent: number;
    banked: number;
    spentOnLevels: number;
    spentOnAA: number;
  };
}
