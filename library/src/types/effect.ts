/** Where an effect originates */
export type SourceKind =
  | "class-feature"
  | "subclass-feature"
  | "species"
  | "background"
  | "feat"
  | "aa-purchase"
  | "magic-item"
  | "equipment"
  | "condition"
  | "override";

export interface Source {
  id: string;
  kind: SourceKind;
  /** Human-readable label, e.g. "Fighter 5", "AA: Extra Attack", "Feat: Alert" */
  name: string;
  description: string | undefined;
}

/** What a modifier targets on a character */
export type ModifierTarget =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma"
  | "ac"
  | "initiative"
  | "speed"
  | "hp-max"
  | "melee-attack"
  | "ranged-attack"
  | "spell-attack"
  | "melee-damage"
  | "ranged-damage"
  | "spell-dc";

export type ProficiencyCategory =
  | "saving-throw"
  | "skill"
  | "weapon"
  | "armor"
  | "tool"
  | "language";

export type ActionTiming = "action" | "bonus-action" | "reaction" | "free" | "special";

export type RestType = "short" | "long";

export interface GrantedAction {
  name: string;
  timing: ActionTiming;
  description: string;
}

export interface GrantedResource {
  name: string;
  maxUses: number;
  resetOn: RestType;
}

export interface ACFormula {
  base: number;
  /** Ability modifiers to add, e.g. ["dexterity"] or ["dexterity", "constitution"] */
  abilityModifiers: string[];
  /** Maximum AC from this formula, if any */
  maxAC: number | undefined;
}

/** A single modification to character state. Discriminated union on `type`. */
export type Effect =
  | { type: "modifier"; target: ModifierTarget; value: number; condition: string | undefined }
  | { type: "proficiency"; category: ProficiencyCategory; value: string }
  | { type: "expertise"; skill: string }
  | { type: "resistance"; damageType: string; condition: string | undefined }
  | { type: "immunity"; damageType: string }
  | { type: "grant-action"; action: GrantedAction }
  | { type: "grant-resource"; resource: GrantedResource }
  | { type: "grant-spell-access"; spellName: string; alwaysPrepared: boolean; source: string }
  | { type: "set-ac-formula"; formula: ACFormula }
  | { type: "extra-attack"; count: number }
  | { type: "speed-bonus"; value: number; movementType: string }
  | { type: "unmodeled"; description: string };

/** A source paired with the effects it grants */
export interface SourceWithEffects {
  source: Source;
  effects: Effect[];
}
