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
import { campaigns, characters, sessions } from "./campaigns.ts";

export const restTypes = ["short", "long"] as const;
export type RestType = (typeof restTypes)[number];

export const restTypeEnum = pgEnum("rest_type", restTypes);

export const xpTransactionCategories = [
  "award",
  "spend-aa",
  "spend-level",
  "refund",
  "adjustment",
] as const;
export type XpTransactionCategory = (typeof xpTransactionCategories)[number];

export const characterSourceKinds = [
  "class-level",
  "class-feature",
  "subclass-feature",
  "species",
  "background",
  "feat",
  "aa-purchase",
  "magic-item",
  "equipment",
  "condition",
  "override",
] as const;
export type CharacterSourceKind = (typeof characterSourceKinds)[number];

export const characterSpendPlanStates = [
  "draft",
  "committed",
  "abandoned",
] as const;
export type CharacterSpendPlanState = (typeof characterSpendPlanStates)[number];

export const characterSpendPlanKinds = [
  "level-up",
  "aa-purchase",
  "mixed",
  "respec",
] as const;
export type CharacterSpendPlanKind = (typeof characterSpendPlanKinds)[number];

export const xpTransactionCategoryEnum = pgEnum(
  "xp_transaction_category",
  xpTransactionCategories,
);
export const characterSourceKindEnum = pgEnum(
  "character_source_kind",
  characterSourceKinds,
);
export const characterSpendPlanStateEnum = pgEnum(
  "character_spend_plan_state",
  characterSpendPlanStates,
);
export const characterSpendPlanKindEnum = pgEnum(
  "character_spend_plan_kind",
  characterSpendPlanKinds,
);

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

export const xpTransactions = pgTable(
  "xp_transactions",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    category: xpTransactionCategoryEnum("category").notNull(),
    amount: integer("amount").notNull(),
    note: text("note").notNull(),
    createdByLabel: text("created_by_label").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("xp_transactions_campaign_idx").on(table.campaignId),
    index("xp_transactions_character_idx").on(table.characterId),
    index("xp_transactions_session_idx").on(table.sessionId),
    index("xp_transactions_category_idx").on(table.category),
    check("xp_transactions_note_nonempty", sql`char_length(${table.note}) > 0`),
    check("xp_transactions_amount_nonzero", sql`${table.amount} <> 0`),
  ],
);

export const characterSources = pgTable(
  "character_sources",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sourceKind: characterSourceKindEnum("source_kind").notNull(),
    sourceEntityId: text("source_entity_id").notNull(),
    sourcePackId: text("source_pack_id"),
    label: text("label").notNull(),
    rank: integer("rank").notNull().default(1),
    payloadJson: jsonb("payload_json").$type<Record<string, unknown> | null>(),
    suppressedAt: timestamp("suppressed_at", {
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
    index("character_sources_character_idx").on(table.characterId),
    index("character_sources_pack_entity_idx").on(
      table.sourcePackId,
      table.sourceEntityId,
    ),
    index("character_sources_kind_idx").on(table.sourceKind),
    uniqueIndex("character_sources_character_kind_entity_rank_uidx").on(
      table.characterId,
      table.sourceKind,
      table.sourceEntityId,
      table.rank,
    ),
    check("character_sources_label_nonempty", sql`char_length(${table.label}) > 0`),
    check("character_sources_rank_positive", sql`${table.rank} > 0`),
  ],
);

export const characterSpendPlans = pgTable(
  "character_spend_plans",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    state: characterSpendPlanStateEnum("state").notNull().default("draft"),
    kind: characterSpendPlanKindEnum("kind").notNull(),
    summary: text("summary").notNull(),
    notes: text("notes"),
    totalXpCost: integer("total_xp_cost").notNull().default(0),
    planJson: jsonb("plan_json")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdByLabel: text("created_by_label").notNull(),
    committedAt: timestamp("committed_at", {
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
    index("character_spend_plans_campaign_state_idx").on(
      table.campaignId,
      table.state,
    ),
    index("character_spend_plans_character_state_idx").on(
      table.characterId,
      table.state,
    ),
    index("character_spend_plans_session_idx").on(table.sessionId),
    check(
      "character_spend_plans_summary_nonempty",
      sql`char_length(${table.summary}) > 0`,
    ),
    check(
      "character_spend_plans_total_xp_cost_nonnegative",
      sql`${table.totalXpCost} >= 0`,
    ),
    check(
      "character_spend_plans_committed_requires_timestamp",
      sql`${table.state} <> 'committed' or ${table.committedAt} is not null`,
    ),
  ],
);

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

/**
 * Tracks the current/max state of a character's resource pools.
 * Each row = one named resource (e.g. "Second Wind", "Bardic Inspiration",
 * "Sorcery Points", or a spell slot level).
 */
export const characterResourcePools = pgTable(
  "character_resource_pools",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    resourceName: text("resource_name").notNull(),
    currentUses: integer("current_uses").notNull(),
    maxUses: integer("max_uses").notNull(),
    resetOn: restTypeEnum("reset_on").notNull(),
    sourceName: text("source_name").notNull(),
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
    index("character_resource_pools_character_idx").on(table.characterId),
    uniqueIndex("character_resource_pools_character_resource_uidx").on(
      table.characterId,
      table.resourceName,
    ),
    check(
      "character_resource_pools_resource_name_nonempty",
      sql`char_length(${table.resourceName}) > 0`,
    ),
    check(
      "character_resource_pools_max_uses_positive",
      sql`${table.maxUses} > 0`,
    ),
    check(
      "character_resource_pools_current_uses_nonnegative",
      sql`${table.currentUses} >= 0`,
    ),
    check(
      "character_resource_pools_current_lte_max",
      sql`${table.currentUses} <= ${table.maxUses}`,
    ),
    check(
      "character_resource_pools_source_name_nonempty",
      sql`char_length(${table.sourceName}) > 0`,
    ),
  ],
);

export const resourceEventKinds = [
  "spend",
  "restore",
  "short-rest-reset",
  "long-rest-reset",
] as const;
export type ResourceEventKind = (typeof resourceEventKinds)[number];

export const resourceEventKindEnum = pgEnum(
  "resource_event_kind",
  resourceEventKinds,
);

/**
 * Audit trail for resource pool changes: spends, restores, and rest resets.
 */
export const resourceEvents = pgTable(
  "resource_events",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    eventKind: resourceEventKindEnum("event_kind").notNull(),
    /** JSON array of { resourceName, previousUses, newUses } */
    changesJson: jsonb("changes_json")
      .$type<ResourceEventChange[]>()
      .notNull(),
    note: text("note"),
    createdByLabel: text("created_by_label").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("resource_events_character_idx").on(table.characterId),
    index("resource_events_session_idx").on(table.sessionId),
    index("resource_events_kind_idx").on(table.eventKind),
    check(
      "resource_events_created_by_label_nonempty",
      sql`char_length(${table.createdByLabel}) > 0`,
    ),
  ],
);

export interface ResourceEventChange {
  resourceName: string;
  previousUses: number;
  newUses: number;
}

// --- Condition State ---

export const conditionNames = [
  "charmed",
  "incapacitated",
] as const;
export type ConditionName = (typeof conditionNames)[number];

export const conditionNameEnum = pgEnum("condition_name", conditionNames);

export const conditionEventKinds = [
  "apply",
  "remove",
  "override",
] as const;
export type ConditionEventKind = (typeof conditionEventKinds)[number];

export const conditionEventKindEnum = pgEnum(
  "condition_event_kind",
  conditionEventKinds,
);

/**
 * Tracks which conditions are currently active on a character.
 * Conditions are applied and removed by the DM, with full audit trail.
 */
export const characterConditions = pgTable(
  "character_conditions",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    conditionName: conditionNameEnum("condition_name").notNull(),
    /** For conditions like Charmed that reference a specific creature */
    sourceCreature: text("source_creature"),
    note: text("note"),
    appliedByLabel: text("applied_by_label").notNull(),
    appliedAt: timestamp("applied_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    removedByLabel: text("removed_by_label"),
    removedAt: timestamp("removed_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => [
    index("character_conditions_character_idx").on(table.characterId),
    index("character_conditions_active_idx").on(
      table.characterId,
      table.conditionName,
    ),
    check(
      "character_conditions_applied_by_label_nonempty",
      sql`char_length(${table.appliedByLabel}) > 0`,
    ),
  ],
);

/**
 * Audit trail for condition changes: applications, removals, and DM overrides.
 */
export const conditionEvents = pgTable(
  "condition_events",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    conditionId: text("condition_id")
      .notNull()
      .references(() => characterConditions.id, { onDelete: "cascade" }),
    eventKind: conditionEventKindEnum("event_kind").notNull(),
    conditionName: conditionNameEnum("condition_name").notNull(),
    note: text("note"),
    createdByLabel: text("created_by_label").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("condition_events_character_idx").on(table.characterId),
    index("condition_events_session_idx").on(table.sessionId),
    index("condition_events_condition_idx").on(table.conditionId),
    index("condition_events_kind_idx").on(table.eventKind),
    check(
      "condition_events_created_by_label_nonempty",
      sql`char_length(${table.createdByLabel}) > 0`,
    ),
  ],
);
