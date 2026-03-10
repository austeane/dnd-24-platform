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
import { campaigns, characters } from "./campaigns.ts";

export const accessCredentialRoles = ["dm", "player"] as const;
export type AccessCredentialRole = (typeof accessCredentialRoles)[number];

export const accessCredentialRoleEnum = pgEnum(
  "access_credential_role",
  accessCredentialRoles,
);

export const accessCredentials = pgTable(
  "access_credentials",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    role: accessCredentialRoleEnum("role").notNull(),
    characterId: text("character_id").references(() => characters.id, {
      onDelete: "cascade",
    }),
    scopeKey: text("scope_key").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordHint: text("password_hint"),
    version: integer("version").notNull().default(1),
    setByLabel: text("set_by_label").notNull(),
    revokedAt: timestamp("revoked_at", {
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
    index("access_credentials_campaign_idx").on(table.campaignId),
    index("access_credentials_character_idx").on(table.characterId),
    index("access_credentials_role_idx").on(table.role),
    uniqueIndex("access_credentials_campaign_scope_uidx").on(
      table.campaignId,
      table.scopeKey,
    ),
    check(
      "access_credentials_scope_key_nonempty",
      sql`char_length(${table.scopeKey}) > 0`,
    ),
    check(
      "access_credentials_password_hash_nonempty",
      sql`char_length(${table.passwordHash}) > 0`,
    ),
    check(
      "access_credentials_password_salt_nonempty",
      sql`char_length(${table.passwordSalt}) > 0`,
    ),
    check(
      "access_credentials_set_by_label_nonempty",
      sql`char_length(${table.setByLabel}) > 0`,
    ),
    check("access_credentials_version_positive", sql`${table.version} > 0`),
    check(
      "access_credentials_scope_matches_role",
      sql`(
        ${table.role} = 'dm'
        and ${table.characterId} is null
        and ${table.scopeKey} = 'dm'
      ) or (
        ${table.role} = 'player'
        and ${table.characterId} is not null
        and ${table.scopeKey} = ('character:' || ${table.characterId})
      )`,
    ),
  ],
);

export const accessSessions = pgTable(
  "access_sessions",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    credentialId: text("credential_id")
      .notNull()
      .references(() => accessCredentials.id, { onDelete: "cascade" }),
    role: accessCredentialRoleEnum("role").notNull(),
    characterId: text("character_id").references(() => characters.id, {
      onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull(),
    sessionLabel: text("session_label"),
    createdByLabel: text("created_by_label").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    lastUsedAt: timestamp("last_used_at", {
      mode: "date",
      withTimezone: true,
    }),
    revokedAt: timestamp("revoked_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("access_sessions_campaign_idx").on(table.campaignId),
    index("access_sessions_credential_idx").on(table.credentialId),
    index("access_sessions_character_idx").on(table.characterId),
    index("access_sessions_role_idx").on(table.role),
    uniqueIndex("access_sessions_token_hash_uidx").on(table.tokenHash),
    check(
      "access_sessions_token_hash_nonempty",
      sql`char_length(${table.tokenHash}) > 0`,
    ),
    check(
      "access_sessions_created_by_label_nonempty",
      sql`char_length(${table.createdByLabel}) > 0`,
    ),
    check(
      "access_sessions_role_matches_scope",
      sql`(
        ${table.role} = 'dm'
        and ${table.characterId} is null
      ) or (
        ${table.role} = 'player'
        and ${table.characterId} is not null
      )`,
    ),
  ],
);
