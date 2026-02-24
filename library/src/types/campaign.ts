export type ProgressionMode = "aa-only" | "hybrid" | "standard";

export type LevelingMethod =
  | "standard-xp"
  | "milestone"
  | "fixed-cost"
  | "aa-formula";

export interface CampaignConfig {
  progressionMode: ProgressionMode;
  levelingMethod: LevelingMethod;
  sources: {
    srd: boolean;
    advancedAdventurers: boolean;
    homebrew: boolean;
  };
}
