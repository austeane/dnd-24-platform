import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { characters, sessions } from "./campaigns.ts";

export const hitPointEventKinds = [
  "damage",
  "heal",
  "temp-gain",
  "temp-replace",
  "temp-clear",
  "long-rest-reset",
] as const;
export type HitPointEventKind = (typeof hitPointEventKinds)[number];

export const hitPointEventKindEnum = pgEnum(
  "hit_point_event_kind",
  hitPointEventKinds,
);

/**
 * Tracks the mutable hit point state for a character's normal sheet state.
 * Max HP remains derived from runtime state; this table stores the current
 * and temporary HP that should be merged onto that computed max.
 */
export const characterHitPoints = pgTable(
  "character_hit_points",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    currentHp: integer("current_hp").notNull(),
    tempHp: integer("temp_hp").notNull().default(0),
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
    index("character_hit_points_character_idx").on(table.characterId),
    uniqueIndex("character_hit_points_character_uidx").on(table.characterId),
    check(
      "character_hit_points_current_hp_nonnegative",
      sql`${table.currentHp} >= 0`,
    ),
    check(
      "character_hit_points_temp_hp_nonnegative",
      sql`${table.tempHp} >= 0`,
    ),
  ],
);

export const hitPointEvents = pgTable(
  "hit_point_events",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    eventKind: hitPointEventKindEnum("event_kind").notNull(),
    previousCurrentHp: integer("previous_current_hp").notNull(),
    newCurrentHp: integer("new_current_hp").notNull(),
    previousTempHp: integer("previous_temp_hp").notNull(),
    newTempHp: integer("new_temp_hp").notNull(),
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
    index("hit_point_events_character_idx").on(table.characterId),
    index("hit_point_events_session_idx").on(table.sessionId),
    index("hit_point_events_kind_idx").on(table.eventKind),
    check(
      "hit_point_events_previous_current_hp_nonnegative",
      sql`${table.previousCurrentHp} >= 0`,
    ),
    check(
      "hit_point_events_new_current_hp_nonnegative",
      sql`${table.newCurrentHp} >= 0`,
    ),
    check(
      "hit_point_events_previous_temp_hp_nonnegative",
      sql`${table.previousTempHp} >= 0`,
    ),
    check(
      "hit_point_events_new_temp_hp_nonnegative",
      sql`${table.newTempHp} >= 0`,
    ),
    check(
      "hit_point_events_created_by_label_nonempty",
      sql`char_length(${table.createdByLabel}) > 0`,
    ),
  ],
);
