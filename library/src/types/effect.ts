/** Where an effect originates */
export type SourceKind =
  | "class-level"
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
  description?: string;
  entityId?: string;
  packId?: string;
  rank?: number;
  payload?: Record<string, unknown>;
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
  | "passive-perception"
  | "proficiency-bonus"
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

export type EffectAbilityName =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

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

export interface GrantedScalingResource {
  name: string;
  baseUses: number;
  ability?: EffectAbilityName;
  mode?: "ability-modifier" | "proficiency-bonus";
  bonus?: number;
  minimum: number;
  resetOn: RestType;
}

export interface GrantedSpellAccess {
  spellName: string;
  spellEntityId?: string;
  spellPackId?: string;
  alwaysPrepared: boolean;
  source: string;
}

export interface GrantedSpellSlotPool {
  slots: number[];
  resetOn: RestType;
  source: string;
}

export interface GrantedTrait {
  name: string;
  description: string;
  tags?: string[];
}

export interface GrantedSense {
  sense: string;
  range: number;
}

export interface GrantedSpellCapacity {
  kind: "cantrips" | "prepared-spells" | "known-spells";
  count: number;
}

export interface ACFormula {
  base: number;
  /** Ability modifiers to add, e.g. ["dexterity"] or ["dexterity", "constitution"] */
  abilityModifiers: string[];
  /** Maximum AC from this formula, if any */
  maxAC?: number;
}

/** A single modification to character state. Discriminated union on `type`. */
export type Effect =
  | { type: "modifier"; target: ModifierTarget; value: number; condition?: string }
  | { type: "proficiency"; category: ProficiencyCategory; value: string }
  | { type: "expertise"; skill: string }
  | { type: "resistance"; damageType: string; condition?: string }
  | { type: "immunity"; damageType: string }
  | { type: "grant-action"; action: GrantedAction }
  | { type: "grant-resource"; resource: GrantedResource }
  | { type: "grant-scaling-resource"; resource: GrantedScalingResource }
  | { type: "grant-spell-access"; spell: GrantedSpellAccess }
  | { type: "grant-spell-slots"; pool: GrantedSpellSlotPool }
  | { type: "grant-spell-capacity"; capacity: GrantedSpellCapacity }
  | { type: "grant-trait"; trait: GrantedTrait }
  | { type: "grant-sense"; sense: GrantedSense }
  | { type: "set-ac-formula"; formula: ACFormula }
  | { type: "extra-attack"; count: number }
  | { type: "speed-bonus"; value: number; movementType: string }
  | { type: "unmodeled"; description: string };

/** A source paired with the effects it grants */
export interface SourceWithEffects {
  source: Source;
  effects: Effect[];
}
