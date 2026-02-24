import type { Effect } from "./effect.ts";

export type FeatCategory = "general" | "origin" | "fighting-style" | "epic-boon";

export interface Feat {
  name: string;
  category: FeatCategory;
  prerequisite: string | undefined;
  repeatable: boolean;
  description: string;
  effects: Effect[];
}
