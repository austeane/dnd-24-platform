export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface MonsterAction {
  name: string;
  description: string;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface Monster {
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  armorDescription: string | undefined;
  hitPoints: string;
  speed: string;
  abilityScores: AbilityScores;
  savingThrows: Record<string, number>;
  skills: Record<string, number>;
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string;
  languages: string;
  challengeRating: string;
  traits: MonsterTrait[];
  actions: MonsterAction[];
  reactions: MonsterAction[];
  legendaryActions: MonsterAction[];
}
