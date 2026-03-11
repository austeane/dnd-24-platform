import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { characters, sessions } from "./campaigns.ts";

export const conditionNames = [
  "charmed",
  "concentration",
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
