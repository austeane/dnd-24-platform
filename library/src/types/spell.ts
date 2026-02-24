export type SpellSchool =
  | "Abjuration"
  | "Conjuration"
  | "Divination"
  | "Enchantment"
  | "Evocation"
  | "Illusion"
  | "Necromancy"
  | "Transmutation";

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  /** Material component description, or undefined if no M component */
  material: string | undefined;
}

export interface Spell {
  name: string;
  /** 0 for cantrips, 1-9 for leveled spells */
  level: number;
  school: SpellSchool;
  /** Classes that have access to this spell */
  classes: string[];
  castingTime: string;
  ritual: boolean;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  /** Raw markdown of the spell effect description */
  description: string;
  /** "Using a Higher-Level Spell Slot" text, if present */
  higherLevels: string | undefined;
}
