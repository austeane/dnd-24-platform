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

export const progressionModes = ["aa-only", "hybrid", "standard"] as const;
export type ProgressionMode = (typeof progressionModes)[number];

export const levelingMethods = [
  "standard-xp",
  "milestone",
  "fixed-cost",
  "aa-formula",
] as const;
export type LevelingMethod = (typeof levelingMethods)[number];

export const progressionModeEnum = pgEnum("progression_mode", progressionModes);
export const levelingMethodEnum = pgEnum("leveling_method", levelingMethods);

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    progressionMode: progressionModeEnum("progression_mode")
      .notNull()
      .default("hybrid"),
    levelingMethod: levelingMethodEnum("leveling_method")
      .notNull()
      .default("fixed-cost"),
    enabledPackIds: jsonb("enabled_pack_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'["srd-5e-2024"]'::jsonb`),
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
    uniqueIndex("campaigns_slug_uidx").on(table.slug),
    index("campaigns_progression_mode_idx").on(table.progressionMode),
    check("campaigns_slug_nonempty", sql`char_length(${table.slug}) > 0`),
    check("campaigns_name_nonempty", sql`char_length(${table.name}) > 0`),
    check(
      "campaigns_enabled_pack_ids_is_array",
      sql`jsonb_typeof(${table.enabledPackIds}) = 'array'`,
    ),
    check(
      "campaigns_enabled_pack_ids_nonempty",
      sql`jsonb_array_length(${table.enabledPackIds}) > 0`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    sessionNumber: integer("session_number").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", {
      mode: "date",
      withTimezone: true,
    }),
    endedAt: timestamp("ended_at", {
      mode: "date",
      withTimezone: true,
    }),
    recapMd: text("recap_md"),
    dmNotesMd: text("dm_notes_md"),
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
    index("sessions_campaign_idx").on(table.campaignId),
    index("sessions_campaign_starts_at_idx").on(table.campaignId, table.startsAt),
    uniqueIndex("sessions_campaign_number_uidx").on(
      table.campaignId,
      table.sessionNumber,
    ),
    check("sessions_title_nonempty", sql`char_length(${table.title}) > 0`),
    check("sessions_number_positive", sql`${table.sessionNumber} > 0`),
    check(
      "sessions_ended_at_after_starts_at",
      sql`${table.endedAt} is null or ${table.startsAt} is null or ${table.endedAt} >= ${table.startsAt}`,
    ),
  ],
);

export const characters = pgTable(
  "characters",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ownerLabel: text("owner_label"),
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
    index("characters_campaign_idx").on(table.campaignId),
    index("characters_owner_label_idx").on(table.ownerLabel),
    uniqueIndex("characters_campaign_slug_uidx").on(
      table.campaignId,
      table.slug,
    ),
    check("characters_slug_nonempty", sql`char_length(${table.slug}) > 0`),
    check("characters_name_nonempty", sql`char_length(${table.name}) > 0`),
  ],
);
