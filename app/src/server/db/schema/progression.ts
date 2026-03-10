import { sql } from "drizzle-orm";
import {
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
