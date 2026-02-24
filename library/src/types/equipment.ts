export type WeaponCategory = "simple" | "martial";
export type WeaponRange = "melee" | "ranged";

export interface Weapon {
  name: string;
  category: WeaponCategory;
  range: WeaponRange;
  damage: string;
  damageType: string;
  weight: string;
  cost: string;
  properties: string[];
}

export type ArmorCategory = "light" | "medium" | "heavy" | "shield";

export interface Armor {
  name: string;
  category: ArmorCategory;
  ac: number;
  /** Whether Dex modifier is added (and max bonus if applicable) */
  dexBonus: boolean;
  maxDexBonus: number | undefined;
  strengthRequirement: number | undefined;
  stealthDisadvantage: boolean;
  weight: string;
  cost: string;
}

export interface Gear {
  name: string;
  cost: string;
  weight: string;
  description: string;
}

export type Equipment = Weapon | Armor | Gear;
