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

export const communicationKinds = [
  "message",
  "handout",
  "rule-callout",
] as const;
export type CommunicationKind = (typeof communicationKinds)[number];

export const communicationStates = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;
export type CommunicationState = (typeof communicationStates)[number];

export const audienceKinds = [
  "dm-only",
  "party",
  "character",
] as const;
export type AudienceKind = (typeof audienceKinds)[number];

export const communicationRefTypes = [
  "spell",
  "feat",
  "feature",
  "item",
  "rule",
  "condition",
  "character",
  "location",
] as const;
export type CommunicationRefType = (typeof communicationRefTypes)[number];

export const communicationEventTypes = [
  "created",
  "edited",
  "scheduled",
  "published",
  "audience-changed",
  "pinned",
  "unpinned",
  "archived",
] as const;
export type CommunicationEventType = (typeof communicationEventTypes)[number];

export const communicationKindEnum = pgEnum(
  "communication_kind",
  communicationKinds,
);
export const communicationStateEnum = pgEnum(
  "communication_state",
  communicationStates,
);
export const audienceKindEnum = pgEnum("audience_kind", audienceKinds);
export const communicationRefTypeEnum = pgEnum(
  "communication_ref_type",
  communicationRefTypes,
);
export const communicationEventTypeEnum = pgEnum(
  "communication_event_type",
  communicationEventTypes,
);

export const communicationItems = pgTable(
  "communication_items",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    kind: communicationKindEnum("kind").notNull(),
    state: communicationStateEnum("state").notNull().default("draft"),
    audienceKind: audienceKindEnum("audience_kind")
      .notNull()
      .default("dm-only"),
    title: text("title").notNull(),
    summary: text("summary"),
    bodyMd: text("body_md").notNull(),
    scheduledFor: timestamp("scheduled_for", {
      mode: "date",
      withTimezone: true,
    }),
    publishedAt: timestamp("published_at", {
      mode: "date",
      withTimezone: true,
    }),
    archivedAt: timestamp("archived_at", {
      mode: "date",
      withTimezone: true,
    }),
    pinnedAt: timestamp("pinned_at", {
      mode: "date",
      withTimezone: true,
    }),
    pinRank: integer("pin_rank"),
    createdByLabel: text("created_by_label").notNull(),
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
    index("communication_items_campaign_idx").on(table.campaignId),
    index("communication_items_campaign_state_idx").on(
      table.campaignId,
      table.state,
    ),
    index("communication_items_session_idx").on(table.sessionId),
    index("communication_items_pin_rank_idx").on(table.pinRank),
    index("communication_items_published_at_idx").on(table.publishedAt),
    check(
      "communication_items_title_nonempty",
      sql`char_length(${table.title}) > 0`,
    ),
    check(
      "communication_items_body_nonempty",
      sql`char_length(${table.bodyMd}) > 0`,
    ),
    check(
      "communication_items_pin_rank_nonnegative",
      sql`${table.pinRank} is null or ${table.pinRank} >= 0`,
    ),
    check(
      "communication_items_scheduled_requires_timestamp",
      sql`${table.state} <> 'scheduled' or ${table.scheduledFor} is not null`,
    ),
    check(
      "communication_items_published_requires_timestamp",
      sql`${table.state} <> 'published' or ${table.publishedAt} is not null`,
    ),
    check(
      "communication_items_archived_requires_timestamp",
      sql`${table.state} <> 'archived' or ${table.archivedAt} is not null`,
    ),
    check(
      "communication_items_pin_fields_require_published",
      sql`(${table.pinnedAt} is null and ${table.pinRank} is null) or ${table.state} = 'published'`,
    ),
  ],
);

export const communicationTargets = pgTable(
  "communication_targets",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => communicationItems.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("communication_targets_item_idx").on(table.itemId),
    index("communication_targets_character_idx").on(table.characterId),
    uniqueIndex("communication_targets_item_character_uidx").on(
      table.itemId,
      table.characterId,
    ),
  ],
);

export const communicationRefs = pgTable(
  "communication_refs",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => communicationItems.id, { onDelete: "cascade" }),
    refType: communicationRefTypeEnum("ref_type").notNull(),
    refId: text("ref_id").notNull(),
    refPackId: text("ref_pack_id"),
    labelOverride: text("label_override"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("communication_refs_item_idx").on(table.itemId),
    index("communication_refs_pack_ref_idx").on(table.refPackId, table.refId),
    check(
      "communication_refs_sort_order_nonnegative",
      sql`${table.sortOrder} >= 0`,
    ),
  ],
);

export const communicationEvents = pgTable(
  "communication_events",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => communicationItems.id, { onDelete: "cascade" }),
    eventType: communicationEventTypeEnum("event_type").notNull(),
    actorLabel: text("actor_label").notNull(),
    payloadJson: jsonb("payload_json").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("communication_events_item_idx").on(table.itemId),
    index("communication_events_created_at_idx").on(table.createdAt),
  ],
);
