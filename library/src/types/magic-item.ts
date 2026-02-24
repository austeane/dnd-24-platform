import type { Effect } from "./effect.ts";

export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "very-rare"
  | "legendary"
  | "artifact";

export interface MagicItem {
  name: string;
  rarity: ItemRarity;
  category: string;
  requiresAttunement: boolean;
  attunementRequirement: string | undefined;
  description: string;
  effects: Effect[];
}
