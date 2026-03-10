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
import { characters, sessions } from "./campaigns.ts";

export const restTypes = ["short", "long"] as const;
export type RestType = (typeof restTypes)[number];

export const restTypeEnum = pgEnum("rest_type", restTypes);

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
