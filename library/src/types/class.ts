import type { Effect } from "./effect.ts";

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
  effects: Effect[];
}

export interface SubclassFeature {
  name: string;
  level: number;
  description: string;
  effects: Effect[];
}

export interface Subclass {
  name: string;
  className: string;
  description: string;
  features: SubclassFeature[];
}

export interface ClassProgression {
  level: number;
  proficiencyBonus: number;
  features: string[];
  /** Class-specific columns (e.g. Rages, Rage Damage for Barbarian) */
  extras: Record<string, string>;
}

export interface Class {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: { options: string[]; count: number };
  armorProficiencies: string[];
  weaponProficiencies: string[];
  startingEquipment: string;
  progression: ClassProgression[];
  features: ClassFeature[];
  subclasses: Subclass[];
  /** Spellcasting ability, if any */
  spellcastingAbility: string | undefined;
}
