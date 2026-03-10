import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { characters } from "./campaigns.ts";

export const skillChoiceSources = [
  "class",
  "background",
  "species",
  "feat",
  "aa-purchase",
  "other",
] as const;
export type SkillChoiceSource = (typeof skillChoiceSources)[number];

export const equipmentSlots = [
  "armor",
  "main-hand",
  "off-hand",
  "two-hand",
  "ammunition",
  "worn",
  "carried",
  "stowed",
] as const;
export type EquipmentSlot = (typeof equipmentSlots)[number];

export const skillChoiceSourceEnum = pgEnum(
  "skill_choice_source",
  skillChoiceSources,
);
export const equipmentSlotEnum = pgEnum("equipment_slot", equipmentSlots);

/**
 * Tracks which skills a character is proficient in, and where the proficiency
 * came from (class, background, feat, etc). Each row = one skill pick.
 */
export const characterSkillChoices = pgTable(
  "character_skill_choices",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    skillName: text("skill_name").notNull(),
    source: skillChoiceSourceEnum("source").notNull(),
    sourceLabel: text("source_label").notNull(),
    hasExpertise: boolean("has_expertise").notNull().default(false),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("character_skill_choices_character_idx").on(table.characterId),
    uniqueIndex("character_skill_choices_character_skill_uidx").on(
      table.characterId,
      table.skillName,
    ),
    check(
      "character_skill_choices_skill_name_nonempty",
      sql`char_length(${table.skillName}) > 0`,
    ),
    check(
      "character_skill_choices_source_label_nonempty",
      sql`char_length(${table.sourceLabel}) > 0`,
    ),
  ],
);

/**
 * Tracks feat choices, including sub-choices (e.g. Magic Initiate spell picks,
 * Skilled extra proficiency picks).
 */
export const characterFeatChoices = pgTable(
  "character_feat_choices",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    featEntityId: text("feat_entity_id").notNull(),
    featPackId: text("feat_pack_id"),
    featLabel: text("feat_label").notNull(),
    /** Sub-choices for the feat, e.g. Magic Initiate spell list, Skilled skill picks */
    subChoicesJson: jsonb("sub_choices_json").$type<Record<string, unknown>>(),
    sourceLabel: text("source_label").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("character_feat_choices_character_idx").on(table.characterId),
    index("character_feat_choices_feat_entity_idx").on(table.featEntityId),
    uniqueIndex("character_feat_choices_character_feat_uidx").on(
      table.characterId,
      table.featEntityId,
    ),
    check(
      "character_feat_choices_feat_label_nonempty",
      sql`char_length(${table.featLabel}) > 0`,
    ),
    check(
      "character_feat_choices_source_label_nonempty",
      sql`char_length(${table.sourceLabel}) > 0`,
    ),
  ],
);

/**
 * Equipment inventory: items owned by a character, with equipped/slot state.
 */
export const characterEquipment = pgTable(
  "character_equipment",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    itemEntityId: text("item_entity_id").notNull(),
    itemPackId: text("item_pack_id"),
    itemLabel: text("item_label").notNull(),
    quantity: integer("quantity").notNull().default(1),
    equipped: boolean("equipped").notNull().default(false),
    slot: equipmentSlotEnum("slot"),
    /** Extra state like attuned, charges remaining, custom properties */
    stateJson: jsonb("state_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("character_equipment_character_idx").on(table.characterId),
    index("character_equipment_item_entity_idx").on(table.itemEntityId),
    check(
      "character_equipment_item_label_nonempty",
      sql`char_length(${table.itemLabel}) > 0`,
    ),
    check(
      "character_equipment_quantity_positive",
      sql`${table.quantity} > 0`,
    ),
  ],
);

/**
 * Weapon mastery choices: which mastery properties a character has chosen
 * for their mastery-eligible weapons.
 */
export const characterWeaponMasteries = pgTable(
  "character_weapon_masteries",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    weaponEntityId: text("weapon_entity_id").notNull(),
    weaponPackId: text("weapon_pack_id"),
    weaponLabel: text("weapon_label").notNull(),
    masteryProperty: text("mastery_property").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("character_weapon_masteries_character_idx").on(table.characterId),
    uniqueIndex("character_weapon_masteries_character_weapon_uidx").on(
      table.characterId,
      table.weaponEntityId,
    ),
    check(
      "character_weapon_masteries_weapon_label_nonempty",
      sql`char_length(${table.weaponLabel}) > 0`,
    ),
    check(
      "character_weapon_masteries_mastery_property_nonempty",
      sql`char_length(${table.masteryProperty}) > 0`,
    ),
  ],
);

/**
 * Metamagic option choices: which metamagic options a sorcerer has selected.
 */
export const characterMetamagicChoices = pgTable(
  "character_metamagic_choices",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    metamagicOption: text("metamagic_option").notNull(),
    sourceLabel: text("source_label").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("character_metamagic_choices_character_idx").on(table.characterId),
    uniqueIndex("character_metamagic_choices_character_option_uidx").on(
      table.characterId,
      table.metamagicOption,
    ),
    check(
      "character_metamagic_choices_option_nonempty",
      sql`char_length(${table.metamagicOption}) > 0`,
    ),
    check(
      "character_metamagic_choices_source_label_nonempty",
      sql`char_length(${table.sourceLabel}) > 0`,
    ),
  ],
);

/**
 * Pact blade bond state: tracks whether a warlock has bonded a pact weapon,
 * and details about the bonded weapon.
 */
export const characterPactBladeBonds = pgTable(
  "character_pact_blade_bonds",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    weaponEntityId: text("weapon_entity_id"),
    weaponPackId: text("weapon_pack_id"),
    weaponLabel: text("weapon_label").notNull(),
    isMagicWeapon: boolean("is_magic_weapon").notNull().default(false),
    bondedAt: timestamp("bonded_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    unbondedAt: timestamp("unbonded_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("character_pact_blade_bonds_character_idx").on(table.characterId),
    check(
      "character_pact_blade_bonds_weapon_label_nonempty",
      sql`char_length(${table.weaponLabel}) > 0`,
    ),
  ],
);
